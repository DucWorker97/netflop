"""
LLM API Endpoints for AI Curator
Provides semantic search, chatbot, and mood analysis
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from .gemma import gemma_service
from ..database import get_postgres_connection

router = APIRouter(prefix="/api/llm", tags=["llm"])


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = None
    user_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    mood: Optional[Dict[str, Any]] = None


class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = 10


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """
    Chat with Netflop AI for movie recommendations.
    """
    try:
        # Get user context if available
        user_context = None
        if request.user_id:
            conn = await get_postgres_connection()
            try:
                # Get user's favorite genres
                genres = await conn.fetch("""
                    SELECT DISTINCT g.name
                    FROM favorites f
                    JOIN movie_genres mg ON f.movie_id = mg.movie_id
                    JOIN genres g ON mg.genre_id = g.id
                    WHERE f.user_id = $1
                    LIMIT 5
                """, request.user_id)
                
                if genres:
                    genre_names = [g["name"] for g in genres]
                    user_context = f"User likes: {', '.join(genre_names)}"
            finally:
                await conn.close()

        # Convert history to dict format
        history = None
        if request.history:
            history = [{"role": m.role, "content": m.content} for m in request.history]

        # Get response
        response = await gemma_service.chatbot_response(
            user_message=request.message,
            conversation_history=history,
            user_context=user_context,
        )

        # Analyze mood for genre suggestions
        mood = await gemma_service.analyze_mood(request.message)

        return ChatResponse(response=response, mood=mood)

    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
async def semantic_search(request: SemanticSearchRequest):
    """
    Semantic movie search using natural language.
    Example: "action movies with strong female lead"
    """
    try:
        # Get all published movies
        conn = await get_postgres_connection()
        try:
            movies = await conn.fetch("""
                SELECT 
                    m.id::text,
                    m.title,
                    m.poster_url,
                    ARRAY_AGG(g.name) FILTER (WHERE g.name IS NOT NULL) as genres
                FROM movies m
                LEFT JOIN movie_genres mg ON m.id = mg.movie_id
                LEFT JOIN genres g ON mg.genre_id = g.id
                WHERE m.movie_status = 'published'
                GROUP BY m.id, m.title, m.poster_url
                LIMIT 50
            """)
        finally:
            await conn.close()

        # Convert to list of dicts
        movie_list = [
            {
                "id": m["id"],
                "title": m["title"],
                "poster_url": m["poster_url"],
                "genres": m["genres"] or [],
            }
            for m in movies
        ]

        # Semantic search with Gemma
        results = await gemma_service.semantic_search(
            query=request.query,
            movies=movie_list,
            limit=request.limit,
        )

        return {
            "query": request.query,
            "results": results,
            "total": len(results),
        }

    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mood")
async def analyze_mood(text: str = Query(..., description="User's mood description")):
    """
    Analyze user mood and suggest genres.
    Example: "I'm feeling adventurous today"
    """
    try:
        result = await gemma_service.analyze_mood(text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def llm_health():
    """Check if Gemma API is configured."""
    return {
        "configured": bool(gemma_service.api_key),
        "model": gemma_service.model,
        "rate_limit": "14,400 requests/day",
    }

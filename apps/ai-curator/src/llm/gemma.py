"""
Gemma LLM Service for AI Curator
Uses Google's Gemma-3-27b for:
- Semantic movie search
- Movie description embeddings
- AI Chatbot for recommendations
"""

import os
import json
from typing import Optional, List, Dict, Any
import httpx

from ..config import settings


class GemmaService:
    """
    Integration with Google Gemma-3-27b via Google AI Studio API.
    Free tier: 14,400 requests/day
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GOOGLE_AI_API_KEY or os.getenv("GOOGLE_AI_API_KEY")
        self.model = "models/gemini-3-flash-preview"
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self.client = httpx.AsyncClient(timeout=30.0)

    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> str:
        """Generate text response from Gemma."""
        if not self.api_key:
            raise ValueError("GOOGLE_AI_API_KEY not configured")

        url = f"{self.base_url}/{self.model}:generateContent"
        
        # Build request
        contents = [{
            "role": "user",
            "parts": [{"text": prompt}]
        }]

        payload = {
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": temperature,
            }
        }
        
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        response = await self.client.post(
            url,
            params={"key": self.api_key},
            json=payload,
        )

        if response.status_code != 200:
            raise Exception(f"Gemma API error {response.status_code}: {response.text}")

        data = response.json()
        
        # Extract text from response
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            return ""

    async def semantic_search(
        self,
        query: str,
        movies: List[Dict[str, Any]],
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Semantic movie search using Gemma's understanding.
        Gemma analyzes the query and ranks movies by relevance.
        """
        # Build movie list for context
        movie_list = "\n".join([
            f"- ID: {m['id']}, Title: {m['title']}, Genres: {', '.join(m.get('genres', []))}"
            for m in movies[:50]  # Limit context size
        ])

        system_instruction = """You are a movie recommendation expert. 
Your task is to analyze a user's search query and find the most relevant movies from a given list.
Return ONLY a JSON array of movie IDs, ordered by relevance.
Example output: ["movie-id-1", "movie-id-2", "movie-id-3"]
Do not include any explanation, just the JSON array."""

        prompt = f"""User search query: "{query}"

Available movies:
{movie_list}

Return the top {limit} most relevant movie IDs as a JSON array:"""

        response = await self.generate(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=0.3,
        )

        # Parse JSON from response
        try:
            response = response.strip()
            if response.startswith("```"):
                response = response.split("```")[1]
                if response.startswith("json"):
                    response = response[4:]
            
            movie_ids = json.loads(response.strip())
            
            id_to_movie = {m["id"]: m for m in movies}
            return [id_to_movie[mid] for mid in movie_ids if mid in id_to_movie]
        except json.JSONDecodeError:
            return []

    async def generate_movie_description(
        self,
        movie: Dict[str, Any],
    ) -> str:
        """
        Generate a rich description of a movie for better recommendations.
        """
        system_instruction = """You are a movie analyst. 
Generate a detailed description of the movie for recommendation purposes.
Include themes, mood, target audience. Keep it under 150 words."""

        prompt = f"""Movie: {movie.get('title', 'Unknown')}
Genres: {', '.join(movie.get('genres', []))}
Year: {movie.get('release_year', 'Unknown')}

Generate a description for recommendation matching:"""

        return await self.generate(
            prompt=prompt,
            system_instruction=system_instruction,
            max_tokens=200,
            temperature=0.7,
        )

    async def chatbot_response(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]] = None,
        user_context: Optional[str] = None,
    ) -> str:
        """
        AI Chatbot for movie recommendations.
        """
        system_instruction = """You are Netflop AI, a friendly movie recommendation assistant.
Help users find movies based on their mood and preferences.
Be concise (under 100 words), friendly, and suggest specific movies or genres.
If asked about movies not in your knowledge, suggest similar ones you know."""

        context = user_context or ""
        
        messages = []
        if conversation_history:
            for msg in conversation_history[-4:]:
                messages.append(f"{msg['role']}: {msg['content']}")

        prompt = f"""{context}

{chr(10).join(messages)}
User: {user_message}

Netflop AI:"""

        return await self.generate(
            prompt=prompt,
            system_instruction=system_instruction,
            max_tokens=200,
            temperature=0.8,
        )

    async def analyze_mood(self, user_input: str) -> Dict[str, Any]:
        """
        Analyze user's mood from their input to suggest movie genres.
        """
        system_instruction = """Analyze the user's mood and suggest movie genres.
Return a JSON object with:
- mood: detected mood (happy, sad, excited, relaxed, etc.)
- genres: list of recommended genres
- reason: brief explanation

Example: {"mood": "adventurous", "genres": ["Action", "Adventure", "Sci-Fi"], "reason": "You seem to want excitement"}"""

        prompt = f"User says: \"{user_input}\"\n\nAnalyze mood and suggest genres:"

        response = await self.generate(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=0.5,
        )

        try:
            # Parse JSON
            response = response.strip()
            if response.startswith("```"):
                response = response.split("```")[1]
                if response.startswith("json"):
                    response = response[4:]
            return json.loads(response.strip())
        except json.JSONDecodeError:
            return {"mood": "unknown", "genres": [], "reason": "Could not analyze"}


# Singleton instance
gemma_service = GemmaService()

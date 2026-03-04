"""
AI Curator - Netflop Recommendation Service
FastAPI application for movie recommendations using Hybrid approach:
- Collaborative Filtering (SVD)
- Content-based Filtering (Genre similarity)
- Popularity-based scoring
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os

# Optional imports - recommender needs scikit-surprise
try:
    from .recommenders.hybrid import HybridRecommender
    RECOMMENDER_AVAILABLE = True
except ImportError:
    HybridRecommender = None
    RECOMMENDER_AVAILABLE = False
    print("[WARN] scikit-surprise not installed, recommendations disabled")

from .llm.endpoints import router as llm_router
from .config import settings
from .cache import cache

# Optional analytics import
try:
    from .analytics.endpoints import router as analytics_router
    ANALYTICS_AVAILABLE = True
except ImportError:
    analytics_router = None
    ANALYTICS_AVAILABLE = False

app = FastAPI(
    title="Netflop AI Curator",
    description="Movie Recommendation API with Big Data Analytics",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Redirect root to API docs."""
    from fastapi.responses import RedirectResponse

    return RedirectResponse(url="/docs")

# Include routers
if ANALYTICS_AVAILABLE and analytics_router:
    app.include_router(analytics_router)
app.include_router(llm_router)

# Global recommender instance
recommender: Optional[HybridRecommender] = None if RECOMMENDER_AVAILABLE else None


class RecommendationRequest(BaseModel):
    user_id: str
    limit: int = 10
    exclude_watched: bool = True


class RecommendationItem(BaseModel):
    movie_id: str
    title: str
    score: float
    reason: str  # e.g., "Because you watched Action movies"


class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: list[RecommendationItem]
    algorithm: str


class SimilarMoviesRequest(BaseModel):
    movie_id: str
    limit: int = 5


@app.on_event("startup")
async def startup_event():
    """Initialize recommender model on startup."""
    global recommender
    # Connect Redis cache
    await cache.connect()

    if RECOMMENDER_AVAILABLE and HybridRecommender:
        try:
            recommender = HybridRecommender()
            await recommender.initialize()
            print("[OK] AI Curator with recommendations initialized")
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"[WARN] Could not initialize recommender: {e}")
            recommender = None
    else:
        print("[WARN] Running without recommendations (scikit-surprise not installed)")
        print("[OK] LLM features available at /api/llm/*")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup connections."""
    await cache.close()


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-curator",
        "model_loaded": recommender is not None,
    }


@app.post("/api/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """
    Get personalized movie recommendations for a user.
    Uses hybrid approach: Collaborative Filtering + Content-based + Popularity
    """
    if recommender is None:
        raise HTTPException(status_code=503, detail="Recommender not initialized")

    try:
        # Check cache first
        cached = await cache.get_recommendations(request.user_id, request.limit)
        if cached is not None:
            return RecommendationResponse(
                user_id=request.user_id,
                recommendations=cached,
                algorithm="hybrid_cf_cb_pop",
            )

        recommendations = await recommender.recommend(
            user_id=request.user_id,
            limit=request.limit,
            exclude_watched=request.exclude_watched,
        )

        await cache.set_recommendations(request.user_id, request.limit, recommendations)

        return RecommendationResponse(
            user_id=request.user_id,
            recommendations=recommendations,
            algorithm="hybrid_cf_cb_pop",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/similar-movies")
async def get_similar_movies(request: SimilarMoviesRequest):
    """
    Get movies similar to a given movie (content-based).
    Used for "More Like This" section.
    """
    if recommender is None:
        raise HTTPException(status_code=503, detail="Recommender not initialized")

    try:
        cached = await cache.get_similar(request.movie_id, request.limit)
        if cached is not None:
            return {"movie_id": request.movie_id, "similar_movies": cached}

        similar = await recommender.get_similar_movies(
            movie_id=request.movie_id,
            limit=request.limit,
        )

        await cache.set_similar(request.movie_id, request.limit, similar)
        return {"movie_id": request.movie_id, "similar_movies": similar}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/trending")
async def get_trending(days: int = 7, limit: int = 10):
    """
    Get trending movies based on recent watch activity.
    """
    if recommender is None:
        raise HTTPException(status_code=503, detail="Recommender not initialized")

    try:
        cached = await cache.get_trending(days, limit)
        if cached is not None:
            return {"trending": cached, "period_days": days}

        trending = await recommender.get_trending(days=days, limit=limit)

        await cache.set_trending(days, limit, trending)
        return {"trending": trending, "period_days": days}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/retrain")
async def retrain_model():
    """
    Trigger model retraining (admin endpoint).
    """
    if recommender is None:
        raise HTTPException(status_code=503, detail="Recommender not initialized")

    try:
        await recommender.retrain()
        await cache.invalidate_all()
        return {"status": "success", "message": "Model retrained successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

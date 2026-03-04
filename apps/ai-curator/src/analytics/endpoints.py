"""
Analytics Endpoints for AI Curator
Provides dashboard data and analytics queries
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta
from .clickhouse import clickhouse_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.on_event("startup")
async def startup():
    """Initialize ClickHouse on startup."""
    await clickhouse_service.connect()
    await clickhouse_service.initialize_schema()


@router.get("/trending")
async def get_trending(
    days: int = Query(7, ge=1, le=30),
    limit: int = Query(10, ge=1, le=50),
):
    """Get trending movies based on recent activity."""
    try:
        trending = await clickhouse_service.get_trending_movies(days=days, limit=limit)
        return {"trending": trending, "period_days": days}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}/engagement")
async def get_user_engagement(
    user_id: str,
    days: int = Query(30, ge=1, le=365),
):
    """Get engagement statistics for a specific user."""
    try:
        stats = await clickhouse_service.get_user_engagement_stats(user_id, days=days)
        return {"user_id": user_id, "stats": stats, "period_days": days}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/genres/popularity")
async def get_genre_popularity(
    days: int = Query(30, ge=1, le=365),
):
    """Get genre popularity based on views."""
    try:
        popularity = await clickhouse_service.get_genre_popularity(days=days)
        return {"genres": popularity, "period_days": days}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync/movies")
async def sync_movies():
    """Sync movies dimension table from PostgreSQL to ClickHouse."""
    try:
        await clickhouse_service.sync_movies_from_postgres()
        return {"status": "success", "message": "Movies synced to ClickHouse"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/aggregate/daily")
async def aggregate_daily_stats(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
):
    """Compute daily aggregates for analytics."""
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date() if date else None
        await clickhouse_service.aggregate_daily_stats(target_date)
        return {"status": "success", "date": date or "today"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/overview")
async def get_dashboard_overview():
    """Get overview statistics for admin dashboard."""
    try:
        # Get recent trending
        trending = await clickhouse_service.get_trending_movies(days=7, limit=5)

        # Get genre popularity
        genres = await clickhouse_service.get_genre_popularity(days=30)

        return {
            "trending_movies": trending,
            "genre_popularity": genres[:5],
            "generated_at": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

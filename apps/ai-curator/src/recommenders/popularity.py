"""
Popularity-Based Recommender
Uses view counts, ratings, and recency
"""

from typing import Dict, List
from datetime import datetime, timedelta
from ..database import get_postgres_connection


class PopularityRecommender:
    """
    Popularity-based scoring using:
    - Total views (watch_history count)
    - Average rating
    - Recency (newer movies get small boost)
    """

    def __init__(self):
        self.scores: Dict[str, float] = {}

    async def compute_scores(self):
        """Compute popularity scores for all movies."""
        print("[INFO] Computing popularity scores...")

        conn = await get_postgres_connection()
        try:
            # Query to get popularity metrics
            query = """
            SELECT 
                m.id,
                m.title,
                m.created_at,
                COALESCE(COUNT(DISTINCT wh.user_id), 0) as view_count,
                COALESCE(AVG(r.rating), 3.0) as avg_rating,
                COALESCE(COUNT(r.id), 0) as rating_count
            FROM movies m
            LEFT JOIN watch_history wh ON m.id = wh.movie_id
            LEFT JOIN ratings r ON m.id = r.movie_id
            WHERE m.movie_status = 'published' AND m.encode_status = 'ready'
            GROUP BY m.id, m.title, m.created_at
            """

            rows = await conn.fetch(query)

            if not rows:
                print("[WARN] No published movies found")
                return

            # Calculate max values for normalization
            max_views = max(row["view_count"] for row in rows) or 1
            now = datetime.now()

            for row in rows:
                movie_id = str(row["id"])

                # Normalize view count (0-1)
                view_score = float(row["view_count"]) / float(max_views)

                # Normalize rating (0-1) - already 1-5, convert to 0-1
                # avg_rating is Decimal, convert to float
                rating_score = (float(row["avg_rating"]) - 1) / 4.0

                # Recency score (newer = higher)
                days_old = (now - row["created_at"].replace(tzinfo=None)).days
                recency_score = max(0.0, 1.0 - (days_old / 365.0))  # Decay over 1 year

                # Weighted combination
                self.scores[movie_id] = (
                    0.4 * view_score +
                    0.4 * rating_score +
                    0.2 * recency_score
                )

            print(f"[OK] Computed popularity for {len(self.scores)} movies")

        finally:
            await conn.close()

    async def get_scores(self) -> Dict[str, float]:
        """Get all popularity scores."""
        return self.scores

    async def get_trending(self, days: int = 7, limit: int = 10) -> List[dict]:
        """Get trending movies based on recent activity."""
        conn = await get_postgres_connection()
        try:
            cutoff = datetime.now() - timedelta(days=days)

            query = """
            SELECT 
                m.id,
                m.title,
                m.poster_url,
                COUNT(DISTINCT wh.user_id) as recent_views,
                COALESCE(AVG(r.rating), 0) as avg_rating
            FROM movies m
            LEFT JOIN watch_history wh ON m.id = wh.movie_id 
                AND wh.updated_at > $1
            LEFT JOIN ratings r ON m.id = r.movie_id
            WHERE m.movie_status = 'published' AND m.encode_status = 'ready'
            GROUP BY m.id, m.title, m.poster_url
            HAVING COUNT(DISTINCT wh.user_id) > 0
            ORDER BY recent_views DESC, avg_rating DESC
            LIMIT $2
            """

            rows = await conn.fetch(query, cutoff, limit)

            return [
                {
                    "movie_id": str(row["id"]),
                    "title": row["title"],
                    "poster_url": row["poster_url"],
                    "recent_views": row["recent_views"],
                    "avg_rating": round(row["avg_rating"], 1),
                }
                for row in rows
            ]

        finally:
            await conn.close()

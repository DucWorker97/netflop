"""
Hybrid Recommender System
Combines: Collaborative Filtering + Content-based + Popularity
"""

from typing import Optional
import numpy as np
import pandas as pd
from .collaborative import CollaborativeFilteringRecommender
from .content_based import ContentRecommender
from .popularity import PopularityRecommender
from ..config import settings
from ..database import get_postgres_connection, get_user_watched_movies


class HybridRecommender:
    """
    Hybrid recommendation system that combines multiple strategies:
    - Collaborative Filtering (50% weight): User-Item interactions via SVD
    - Content-Based (30% weight): Genre/tag similarity
    - Popularity (20% weight): View counts and ratings
    """

    def __init__(self):
        self.cf_recommender: Optional[CollaborativeFilteringRecommender] = None
        self.cb_recommender: Optional[ContentRecommender] = None
        self.pop_recommender: Optional[PopularityRecommender] = None
        self.is_initialized = False

    async def initialize(self):
        """Initialize all sub-recommenders."""
        print("[INFO] Initializing Hybrid Recommender...")

        # Initialize Collaborative Filtering
        self.cf_recommender = CollaborativeFilteringRecommender(
            n_factors=settings.CF_N_FACTORS,
            n_epochs=settings.CF_N_EPOCHS,
        )
        await self.cf_recommender.load_or_train()

        # Initialize Content-based
        self.cb_recommender = ContentRecommender()
        # Need to fetch movies data to train CB recommender
        movies_data = await self._get_movies_data()
        self.cb_recommender.fit(movies_data)

        # Initialize Popularity
        self.pop_recommender = PopularityRecommender()
        await self.pop_recommender.compute_scores()

        self.is_initialized = True
        print("[OK] Hybrid Recommender initialized")

    async def _get_movies_data(self) -> list[dict]:
        """Fetch all movies metadata for content-based training."""
        conn = await get_postgres_connection()
        try:
            # Join with genres
            query = """
                SELECT 
                    m.id, 
                    m.title, 
                    m.description,
                    m.poster_url as "posterUrl",
                    array_agg(g.name) as genres
                FROM movies m
                LEFT JOIN movie_genres mg ON m.id = mg.movie_id
                LEFT JOIN genres g ON mg.genre_id = g.id
                WHERE m.movie_status = 'published'
                GROUP BY m.id
            """
            rows = await conn.fetch(query)
            return [dict(row) for row in rows]
        finally:
            await conn.close()

    async def recommend(
        self,
        user_id: str,
        limit: int = 10,
        exclude_watched: bool = True,
    ) -> list[dict]:
        """
        Generate hybrid recommendations for a user.
        
        Returns list of {"movie_id", "title", "posterUrl", "score", "reason"}
        """
        if not self.is_initialized:
            raise RuntimeError("Recommender not initialized")

        # Get scores from each recommender
        cf_scores = await self.cf_recommender.predict_for_user(user_id)
        
        # Build user profile: average CB similarity scores from user's watched/rated movies
        cb_scores = await self._compute_cb_scores_for_user(user_id)

        pop_scores = await self.pop_recommender.get_scores()

        # Combine all movie IDs
        all_movie_ids = set(cf_scores.keys()) | set(pop_scores.keys())

        # Calculate hybrid scores
        hybrid_scores = {}
        for movie_id in all_movie_ids:
            cf = cf_scores.get(movie_id, 0)
            cb = cb_scores.get(movie_id, 0)
            pop = pop_scores.get(movie_id, 0)

            # Weighted combination
            hybrid_scores[movie_id] = (
                settings.CF_WEIGHT * float(cf) +
                settings.CB_WEIGHT * float(cb) +
                settings.POP_WEIGHT * float(pop)
            )

        # Filter watched movies if requested
        if exclude_watched:
            watched = await get_user_watched_movies(user_id)
            hybrid_scores = {
                mid: score
                for mid, score in hybrid_scores.items()
                if mid not in watched
            }

        # Sort by score and take top N
        sorted_movies = sorted(
            hybrid_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]

        # Build response with reasons
        recommendations = []
        for movie_id, score in sorted_movies:
            reason = await self._generate_reason(user_id, movie_id, cf_scores, cb_scores, pop_scores)
            movie_info = await self._get_movie_info(movie_id)
            
            recommendations.append({
                "movie_id": movie_id,
                "title": movie_info.get("title", "Unknown"),
                "posterUrl": movie_info.get("posterUrl"),
                "score": round(score, 3),
                "reason": reason,
            })

        return recommendations

    async def _generate_reason(
        self,
        user_id: str,
        movie_id: str,
        cf_scores: dict,
        cb_scores: dict,
        pop_scores: dict,
    ) -> str:
        """Generate explanation for why this movie is recommended."""
        cf = cf_scores.get(movie_id, 0)
        cb = cb_scores.get(movie_id, 0)
        pop = pop_scores.get(movie_id, 0)

        max_score = max(cf, cb, pop)

        if max_score == cf and cf > 0:
            return "Viewers like you also enjoyed this"
        elif max_score == cb and cb > 0:
            return "Similar to movies you've watched"
        elif max_score == pop and pop > 0:
            return "Trending now"
        else:
            return "You might enjoy this"

    async def _get_movie_info(self, movie_id: str) -> dict:
        """Get movie details from database."""
        conn = await get_postgres_connection()
        try:
            result = await conn.fetchrow(
                'SELECT id, title, poster_url as "posterUrl" FROM movies WHERE id = $1',
                movie_id
            )
            return dict(result) if result else {}
        finally:
            await conn.close()

    async def _compute_cb_scores_for_user(self, user_id: str) -> dict:
        """
        Compute content-based scores for a user by building a profile
        from their watched/rated movies. Returns {movie_id: score}.
        """
        if self.cb_recommender is None or self.cb_recommender.similarity_matrix is None:
            return {}

        # Get movies the user has rated or watched
        conn = await get_postgres_connection()
        try:
            rows = await conn.fetch("""
                SELECT DISTINCT movie_id::text as movie_id, 
                       COALESCE(r.rating, 3) as weight
                FROM (
                    SELECT movie_id, user_id FROM watch_history WHERE user_id = $1
                    UNION
                    SELECT movie_id, user_id FROM ratings WHERE user_id = $1
                ) sub
                LEFT JOIN ratings r ON r.movie_id = sub.movie_id AND r.user_id = sub.user_id
            """, user_id)
        finally:
            await conn.close()

        if not rows:
            return {}

        # Compute weighted average similarity for each candidate movie
        cb = self.cb_recommender
        scores: dict[str, float] = {}
        total_weight = 0.0

        profile_items = []
        for row in rows:
            mid = row["movie_id"]
            if mid in cb.movie_id_map:
                profile_items.append((cb.movie_id_map[mid], float(row["weight"])))
                total_weight += float(row["weight"])

        if not profile_items or total_weight == 0:
            return {}

        # For each candidate movie, compute weighted avg similarity to profile
        import numpy as np
        sim_matrix = cb.similarity_matrix
        for movie_id, idx in cb.movie_id_map.items():
            weighted_sim = 0.0
            for profile_idx, weight in profile_items:
                weighted_sim += weight * float(sim_matrix[idx][profile_idx])
            scores[movie_id] = weighted_sim / total_weight

        # Normalize to 0-1 range
        if scores:
            max_s = max(scores.values())
            min_s = min(scores.values())
            rng = max_s - min_s if max_s != min_s else 1.0
            scores = {k: (v - min_s) / rng for k, v in scores.items()}

        return scores

    async def get_similar_movies(self, movie_id: str, limit: int = 5) -> list[dict]:
        """Get movies similar to a given movie (content-based)."""
        if not self.is_initialized:
            raise RuntimeError("Recommender not initialized")
        return self.cb_recommender.get_similar_movies(movie_id, limit)

    async def get_trending(self, days: int = 7, limit: int = 10) -> list[dict]:
        """Get trending movies based on recent activity."""
        if not self.is_initialized:
            raise RuntimeError("Recommender not initialized")
        return await self.pop_recommender.get_trending(days, limit)

    async def retrain(self):
        """Retrain all models with latest data."""
        print("[INFO] Retraining all recommenders...")
        await self.cf_recommender.train()
        
        movies_data = await self._get_movies_data()
        self.cb_recommender.fit(movies_data)
        
        await self.pop_recommender.compute_scores()
        print("[OK] Retraining complete")

"""
Collaborative Filtering Recommender
Uses SVD (Singular Value Decomposition) for matrix factorization
"""

from typing import Optional, Dict
import os
import pickle
from surprise import Dataset, Reader, SVD
from surprise.model_selection import train_test_split
import pandas as pd
from ..config import settings
from ..database import get_ratings_dataframe


class CollaborativeFilteringRecommender:
    """
    Collaborative Filtering using SVD matrix factorization.
    Learns latent factors for users and items from rating data.
    """

    def __init__(self, n_factors: int = 100, n_epochs: int = 20):
        self.n_factors = n_factors
        self.n_epochs = n_epochs
        self.model: Optional[SVD] = None
        self.trainset = None
        self.model_path = os.path.join(settings.MODEL_PATH, "cf_svd.pkl")

    async def load_or_train(self):
        """Load existing model or train new one."""
        if os.path.exists(self.model_path):
            print("[STEP] Loading existing CF model...")
            await self._load_model()
        else:
            print("[STEP] Training new CF model...")
            await self.train()

    async def _load_model(self):
        """Load model from disk."""
        with open(self.model_path, "rb") as f:
            data = pickle.load(f)
            self.model = data["model"]
            self.trainset = data["trainset"]

    async def _save_model(self):
        """Save model to disk."""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        with open(self.model_path, "wb") as f:
            pickle.dump({
                "model": self.model,
                "trainset": self.trainset,
            }, f)

    async def train(self):
        """Train the SVD model on rating data."""
        # Load ratings from database
        ratings_df = await get_ratings_dataframe()

        if ratings_df.empty or len(ratings_df) < 10:
            print("[WARN] Not enough ratings for CF, using fallback")
            # Use watch history as implicit ratings
            ratings_df = await self._generate_implicit_ratings()

        if ratings_df.empty:
            print("[WARN] No data for CF training")
            return

        # Prepare for Surprise library
        reader = Reader(rating_scale=(1, 5))
        data = Dataset.load_from_df(
            ratings_df[["user_id", "movie_id", "rating"]],
            reader
        )

        # Train/test split
        trainset, _ = train_test_split(data, test_size=0.2)
        self.trainset = trainset

        # Train SVD model
        self.model = SVD(
            n_factors=self.n_factors,
            n_epochs=self.n_epochs,
            lr_all=0.005,
            reg_all=0.02,
            verbose=True,
        )
        self.model.fit(trainset)

        # Save model
        await self._save_model()
        print(f"[OK] CF model trained on {len(ratings_df)} ratings")

    async def _generate_implicit_ratings(self) -> pd.DataFrame:
        """
        Generate implicit ratings from watch history.
        - Completed movies: 5 stars
        - > 75% watched: 4 stars
        - > 50% watched: 3 stars
        - > 25% watched: 2 stars
        - < 25% watched: 1 star
        """
        from ..database import get_watch_history_dataframe
        
        history_df = await get_watch_history_dataframe()
        
        if history_df.empty:
            return pd.DataFrame()

        # Calculate completion percentage
        history_df["completion"] = history_df["progress_seconds"] / history_df["duration_seconds"].replace(0, 1)

        # Convert to implicit ratings
        def completion_to_rating(row):
            if row["completed"] or row["completion"] >= 0.9:
                return 5
            elif row["completion"] >= 0.75:
                return 4
            elif row["completion"] >= 0.5:
                return 3
            elif row["completion"] >= 0.25:
                return 2
            else:
                return 1

        history_df["rating"] = history_df.apply(completion_to_rating, axis=1)

        return history_df[["user_id", "movie_id", "rating"]]

    async def predict_for_user(self, user_id: str) -> Dict[str, float]:
        """
        Predict ratings for all movies for a given user.
        Returns dict of {movie_id: predicted_score}
        """
        if self.model is None or self.trainset is None:
            return {}

        # Get all movies
        from ..database import get_all_movie_ids
        all_movies = await get_all_movie_ids()

        predictions = {}
        for movie_id in all_movies:
            try:
                pred = self.model.predict(user_id, movie_id)
                # Normalize to 0-1 scale
                predictions[movie_id] = pred.est / 5.0
            except Exception:
                predictions[movie_id] = 0.5  # Default neutral score

        return predictions

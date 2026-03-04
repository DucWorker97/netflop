"""
ML Training Pipeline for AI Curator
Handles training and evaluation of recommendation models
"""

import asyncio
import os
import pickle
from datetime import datetime
from pathlib import Path
import pandas as pd
import numpy as np
from surprise import Dataset, Reader, SVD, accuracy
from surprise.model_selection import train_test_split, cross_validate
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Add parent to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config import settings
from src.database import (
    get_ratings_dataframe,
    get_watch_history_dataframe,
    get_movies_with_genres,
)


class ModelTrainer:
    """
    Training pipeline for recommendation models:
    - Collaborative Filtering (SVD)
    - Content-based (TF-IDF)
    """

    def __init__(self, model_dir: str = None):
        self.model_dir = Path(model_dir or settings.MODEL_PATH)
        self.model_dir.mkdir(parents=True, exist_ok=True)

    async def train_all(self):
        """Train all models."""
        print("=" * 60)
        print("[START] Starting ML Training Pipeline")
        print("=" * 60)

        start_time = datetime.now()

        # Train Collaborative Filtering
        cf_metrics = await self.train_collaborative_filtering()

        # Train Content-based
        cb_metrics = await self.train_content_based()

        # Print summary
        duration = (datetime.now() - start_time).total_seconds()
        print("\n" + "=" * 60)
        print("[OK] Training Complete!")
        print(f"    Total time: {duration:.1f} seconds")
        print("=" * 60)
        print("\n[STATS] Model Metrics:")
        print(f"   Collaborative Filtering (SVD): RMSE = {cf_metrics.get('rmse', 'N/A')}")
        print(f"   Content-based (TF-IDF): {cb_metrics.get('movies', 0)} movies indexed")
        print("=" * 60)

        return {"cf": cf_metrics, "cb": cb_metrics, "duration_seconds": duration}

    async def train_collaborative_filtering(self) -> dict:
        """Train SVD Collaborative Filtering model."""
        print("\n[STEP] Training Collaborative Filtering Model (SVD)...")

        # Load ratings data
        ratings_df = await get_ratings_dataframe()

        # If not enough ratings, generate implicit ratings from watch history
        if ratings_df.empty or len(ratings_df) < 10:
            print("   [WARN] Not enough explicit ratings, using implicit ratings from watch history")
            ratings_df = await self._generate_implicit_ratings()

        if ratings_df.empty:
            print("   [ERROR] No data available for training")
            return {"error": "No data", "rmse": None}

        print(f"   [STATS] Training data: {len(ratings_df)} ratings from {ratings_df['user_id'].nunique()} users")

        # Prepare for Surprise library
        reader = Reader(rating_scale=(1, 5))
        data = Dataset.load_from_df(
            ratings_df[["user_id", "movie_id", "rating"]].astype(str),
            reader
        )

        # Split data
        trainset, testset = train_test_split(data, test_size=0.2, random_state=42)

        # Train SVD model
        print("   [STEP] Training SVD model...")
        model = SVD(
            n_factors=settings.CF_N_FACTORS,
            n_epochs=settings.CF_N_EPOCHS,
            lr_all=0.005,
            reg_all=0.02,
            random_state=42,
        )
        model.fit(trainset)

        # Evaluate
        print("   [STEP] Evaluating model...")
        predictions = model.test(testset)
        rmse = accuracy.rmse(predictions, verbose=False)
        mae = accuracy.mae(predictions, verbose=False)

        print(f"   [OK] RMSE: {rmse:.4f}, MAE: {mae:.4f}")

        # Save model
        model_path = self.model_dir / "cf_svd.pkl"
        with open(model_path, "wb") as f:
            pickle.dump({
                "model": model,
                "trainset": trainset,
                "trained_at": datetime.now().isoformat(),
                "metrics": {"rmse": rmse, "mae": mae},
            }, f)

        print(f"   [SAVE] Model saved to {model_path}")

        return {"rmse": round(rmse, 4), "mae": round(mae, 4), "ratings_count": len(ratings_df)}

    async def _generate_implicit_ratings(self) -> pd.DataFrame:
        """Generate implicit ratings from watch history."""
        print("   [STEP] Generating implicit ratings from watch history...")

        history_df = await get_watch_history_dataframe()

        if history_df.empty:
            return pd.DataFrame()

        # Calculate completion percentage
        history_df["completion"] = history_df["progress_seconds"] / history_df["duration_seconds"].replace(0, 1)

        # Convert to implicit ratings
        def completion_to_rating(row):
            if row.get("completed", False) or row["completion"] >= 0.9:
                return 5.0
            elif row["completion"] >= 0.75:
                return 4.0
            elif row["completion"] >= 0.5:
                return 3.0
            elif row["completion"] >= 0.25:
                return 2.0
            else:
                return 1.0

        history_df["rating"] = history_df.apply(completion_to_rating, axis=1)

        print(f"   [OK] Generated {len(history_df)} implicit ratings")

        return history_df[["user_id", "movie_id", "rating"]]

    async def train_content_based(self) -> dict:
        """Train Content-based model (TF-IDF on genres)."""
        print("\n[STEP] Training Content-Based Model (TF-IDF)...")

        # Load movies with genres
        movies_df = await get_movies_with_genres()

        if movies_df.empty:
            print("   [ERROR] No movies found")
            return {"error": "No movies", "movies": 0}

        print(f"   [STATS] Indexing {len(movies_df)} movies")

        # Prepare genre strings
        movie_ids = movies_df["id"].tolist()
        genre_strings = movies_df["genres"].fillna("").tolist()

        # TF-IDF Vectorization
        print("   [STEP] Building TF-IDF vectors...")
        vectorizer = TfidfVectorizer(
            lowercase=True,
            token_pattern=r"[a-zA-Z-]+",
        )
        movie_vectors = vectorizer.fit_transform(genre_strings)

        # Compute similarity matrix
        print("   [STEP] Computing similarity matrix...")
        similarity_matrix = cosine_similarity(movie_vectors)

        # Save model
        model_path = self.model_dir / "cb_tfidf.pkl"
        with open(model_path, "wb") as f:
            pickle.dump({
                "vectorizer": vectorizer,
                "movie_vectors": movie_vectors,
                "similarity_matrix": similarity_matrix,
                "movie_ids": movie_ids,
                "trained_at": datetime.now().isoformat(),
            }, f)

        print(f"   [SAVE] Model saved to {model_path}")
        print(f"   [OK] Indexed {len(movie_ids)} movies with {movie_vectors.shape[1]} features")

        return {"movies": len(movie_ids), "features": movie_vectors.shape[1]}

    async def evaluate_models(self) -> dict:
        """Evaluate trained models with cross-validation."""
        print("\n[STATS] Evaluating Models with Cross-Validation...")

        ratings_df = await get_ratings_dataframe()
        if ratings_df.empty:
            ratings_df = await self._generate_implicit_ratings()

        if ratings_df.empty:
            return {"error": "No data for evaluation"}

        reader = Reader(rating_scale=(1, 5))
        data = Dataset.load_from_df(
            ratings_df[["user_id", "movie_id", "rating"]].astype(str),
            reader
        )

        # Cross-validation
        model = SVD(n_factors=settings.CF_N_FACTORS, n_epochs=settings.CF_N_EPOCHS)
        results = cross_validate(model, data, measures=["RMSE", "MAE"], cv=5, verbose=True)

        return {
            "rmse_mean": round(results["test_rmse"].mean(), 4),
            "rmse_std": round(results["test_rmse"].std(), 4),
            "mae_mean": round(results["test_mae"].mean(), 4),
            "mae_std": round(results["test_mae"].std(), 4),
        }


async def main():
    """Run training pipeline."""
    trainer = ModelTrainer()
    results = await trainer.train_all()
    return results


if __name__ == "__main__":
    asyncio.run(main())

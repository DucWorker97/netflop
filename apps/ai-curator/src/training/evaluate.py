"""
Model Evaluation and Metrics
Tools for evaluating recommendation quality
"""

import asyncio
from pathlib import Path
import pickle
import numpy as np
from typing import Dict, List, Optional
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database import get_postgres_connection


class ModelEvaluator:
    """
    Evaluate recommendation model quality with various metrics:
    - Precision@K
    - Recall@K
    - NDCG@K
    - Coverage
    - Diversity
    """

    def __init__(self, model_dir: str = None):
        from src.config import settings
        self.model_dir = Path(model_dir or settings.MODEL_PATH)

    async def evaluate_all(self, k: int = 10) -> Dict:
        """Run all evaluations."""
        print("=" * 60)
        print("[STATS] Model Evaluation Report")
        print("=" * 60)

        results = {}

        # Evaluate CF model
        cf_metrics = await self.evaluate_collaborative_filtering(k=k)
        results["collaborative_filtering"] = cf_metrics

        # Evaluate coverage
        coverage = await self.calculate_coverage()
        results["coverage"] = coverage

        # Print summary
        print("\n[STEP] Summary:")
        print(f"   Precision@{k}: {cf_metrics.get('precision', 'N/A')}")
        print(f"   Recall@{k}: {cf_metrics.get('recall', 'N/A')}")
        print(f"   Catalog Coverage: {coverage.get('coverage_pct', 'N/A')}%")

        return results

    async def evaluate_collaborative_filtering(self, k: int = 10) -> Dict:
        """Evaluate CF model with precision/recall."""
        print("\n[INFO] Evaluating Collaborative Filtering...")

        # Load model
        model_path = self.model_dir / "cf_svd.pkl"
        if not model_path.exists():
            print("   [ERROR] Model not found. Run training first.")
            return {"error": "Model not found"}

        with open(model_path, "rb") as f:
            data = pickle.load(f)

        model = data["model"]
        trainset = data["trainset"]

        # Get test users (users with ratings)
        conn = await get_postgres_connection()
        try:
            # Get users with both high and low rated movies
            users = await conn.fetch("""
                SELECT DISTINCT user_id::text as user_id 
                FROM ratings 
                GROUP BY user_id 
                HAVING COUNT(*) >= 3
                LIMIT 20
            """)

            if not users:
                print("   [WARN] Not enough users with ratings for evaluation")
                return {"precision": 0, "recall": 0}

            precisions = []
            recalls = []

            for row in users:
                user_id = row["user_id"]

                # Get user's actual high-rated movies (4 or 5)
                actual_liked = await conn.fetch("""
                    SELECT movie_id::text as movie_id 
                    FROM ratings 
                    WHERE user_id = $1 AND rating >= 4
                """, user_id)
                actual_set = {r["movie_id"] for r in actual_liked}

                if not actual_set:
                    continue

                # Get all movies
                all_movies = await conn.fetch("""
                    SELECT id::text as id FROM movies 
                    WHERE movie_status = 'published'
                """)

                # Predict ratings for all movies
                predictions = []
                for movie_row in all_movies:
                    movie_id = movie_row["id"]
                    try:
                        pred = model.predict(user_id, movie_id)
                        predictions.append((movie_id, pred.est))
                    except:
                        predictions.append((movie_id, 3.0))

                # Get top K predictions
                predictions.sort(key=lambda x: x[1], reverse=True)
                top_k = {p[0] for p in predictions[:k]}

                # Calculate precision and recall
                hits = len(top_k & actual_set)
                precision = hits / k if k > 0 else 0
                recall = hits / len(actual_set) if actual_set else 0

                precisions.append(precision)
                recalls.append(recall)

            avg_precision = np.mean(precisions) if precisions else 0
            avg_recall = np.mean(recalls) if recalls else 0

            print(f"   [OK] Precision@{k}: {avg_precision:.4f}")
            print(f"   [OK] Recall@{k}: {avg_recall:.4f}")

            return {
                "precision": round(avg_precision, 4),
                "recall": round(avg_recall, 4),
                "users_evaluated": len(precisions),
            }

        finally:
            await conn.close()

    async def calculate_coverage(self) -> Dict:
        """Calculate catalog coverage (% of movies recommended)."""
        print("\n[INFO] Calculating Coverage...")

        conn = await get_postgres_connection()
        try:
            # Total movies
            total = await conn.fetchval("""
                SELECT COUNT(*) FROM movies WHERE movie_status = 'published'
            """)

            # Movies with at least one rating or watch
            covered = await conn.fetchval("""
                SELECT COUNT(DISTINCT movie_id) FROM (
                    SELECT movie_id FROM ratings
                    UNION
                    SELECT movie_id FROM watch_history
                ) sub
            """)

            coverage_pct = (covered / total * 100) if total > 0 else 0

            print(f"   [OK] {covered}/{total} movies covered ({coverage_pct:.1f}%)")

            return {
                "total_movies": total,
                "covered_movies": covered,
                "coverage_pct": round(coverage_pct, 1),
            }

        finally:
            await conn.close()


async def main():
    evaluator = ModelEvaluator()
    results = await evaluator.evaluate_all(k=10)
    return results


if __name__ == "__main__":
    asyncio.run(main())

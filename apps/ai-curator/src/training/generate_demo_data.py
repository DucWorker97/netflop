"""
Demo Data Generator for AI Curator
Creates sample data for testing recommendations
"""

import asyncio
import random
from datetime import datetime, timedelta
from uuid import uuid4
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database import get_postgres_connection


async def generate_demo_data(
    num_users: int = 20,
    num_movies: int = 50,
    num_ratings: int = 200,
    num_watch_history: int = 300,
):
    """
    Generate demo data for testing the recommendation system.
    This creates realistic patterns for better recommendations.
    """
    print("=" * 60)
    print("[START] Generating Demo Data for AI Curator")
    print("=" * 60)

    conn = await get_postgres_connection()

    try:
        # Get existing users
        existing_users = await conn.fetch("SELECT id FROM users LIMIT 100")
        user_ids = [str(row["id"]) for row in existing_users]

        if len(user_ids) < 2:
            print("[ERROR] Need at least 2 users. Run db:seed first.")
            return

        print(f"[STATS] Found {len(user_ids)} users")

        # Get existing movies
        existing_movies = await conn.fetch(
            "SELECT id, duration_seconds FROM movies WHERE movie_status = 'published'"
        )
        movies = [(str(row["id"]), row["duration_seconds"] or 7200) for row in existing_movies]

        if len(movies) < 3:
            print("[ERROR] Need at least 3 published movies.")
            return

        print(f"[INFO] Found {len(movies)} published movies")

        # Generate ratings
        print(f"\n⭐ Generating {num_ratings} ratings...")
        ratings_created = 0

        # Create user preference patterns (some users prefer certain genres)
        user_preferences = {}
        for user_id in user_ids:
            # Each user has a preferred subset of movies (simulates genre preference)
            preferred_movies = random.sample(movies, min(len(movies), len(movies) // 2 + 2))
            user_preferences[user_id] = [m[0] for m in preferred_movies]

        for _ in range(num_ratings):
            user_id = random.choice(user_ids)
            
            # 70% chance to rate a preferred movie (higher rating)
            # 30% chance to rate other movies (lower rating)
            if random.random() < 0.7 and user_preferences[user_id]:
                movie_id = random.choice(user_preferences[user_id])
                rating = random.choices([4, 5], weights=[0.4, 0.6])[0]  # Higher ratings
            else:
                movie_id = random.choice(movies)[0]
                rating = random.choices([1, 2, 3, 4], weights=[0.15, 0.25, 0.35, 0.25])[0]

            try:
                await conn.execute(
                    """
                    INSERT INTO ratings (id, user_id, movie_id, rating, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $5)
                    ON CONFLICT (user_id, movie_id) DO UPDATE SET rating = $4, updated_at = $5
                    """,
                    str(uuid4()),
                    user_id,
                    movie_id,
                    rating,
                    datetime.now() - timedelta(days=random.randint(0, 30)),
                )
                ratings_created += 1
            except Exception as e:
                pass  # Skip duplicates

        print(f"   [OK] Created {ratings_created} ratings")

        # Generate watch history
        print(f"\n[INFO] Generating {num_watch_history} watch history entries...")
        history_created = 0

        for _ in range(num_watch_history):
            user_id = random.choice(user_ids)
            movie_id, duration = random.choice(movies)

            # Generate realistic watch patterns
            # Some movies are watched fully, some partially
            watch_patterns = [
                (0.1, 0.1),   # 10% - barely started
                (0.3, 0.15),  # 15% - stopped early
                (0.5, 0.2),   # 20% - watched half
                (0.75, 0.25), # 25% - mostly watched
                (0.95, 0.3),  # 30% - completed
            ]

            completion_pct, _ = random.choices(
                watch_patterns,
                weights=[w[1] for w in watch_patterns]
            )[0]

            progress = int(duration * completion_pct)
            completed = completion_pct >= 0.9

            try:
                await conn.execute(
                    """
                    INSERT INTO watch_history (id, user_id, movie_id, progress_seconds, duration_seconds, completed, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (user_id, movie_id) DO UPDATE 
                    SET progress_seconds = GREATEST(watch_history.progress_seconds, $4),
                        completed = $6,
                        updated_at = $7
                    """,
                    str(uuid4()),
                    user_id,
                    movie_id,
                    progress,
                    duration,
                    completed,
                    datetime.now() - timedelta(days=random.randint(0, 14)),
                )
                history_created += 1
            except Exception as e:
                pass  # Skip duplicates

        print(f"   [OK] Created {history_created} watch history entries")

        # Generate favorites
        print(f"\n[INFO] Generating favorites...")
        favorites_created = 0

        for user_id in user_ids:
            # Each user favorites 2-5 movies
            num_favorites = random.randint(2, 5)
            favorite_movies = random.sample(movies, min(len(movies), num_favorites))

            for movie_id, _ in favorite_movies:
                try:
                    await conn.execute(
                        """
                        INSERT INTO favorites (id, user_id, movie_id, created_at)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT (user_id, movie_id) DO NOTHING
                        """,
                        str(uuid4()),
                        user_id,
                        movie_id,
                        datetime.now() - timedelta(days=random.randint(0, 60)),
                    )
                    favorites_created += 1
                except Exception as e:
                    pass

        print(f"   [OK] Created {favorites_created} favorites")

        # Summary
        print("\n" + "=" * 60)
        print("[OK] Demo Data Generation Complete!")
        print("=" * 60)
        print(f"   [STATS] Ratings: {ratings_created}")
        print(f"   [INFO] Watch History: {history_created}")
        print(f"   [INFO] Favorites: {favorites_created}")
        print("=" * 60)
        print("\n[INFO] Now run: python -m src.training.train_model")

    finally:
        await conn.close()


async def main():
    await generate_demo_data()


if __name__ == "__main__":
    asyncio.run(main())

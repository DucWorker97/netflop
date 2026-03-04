"""
Database utilities for AI Curator
Connections to PostgreSQL and ClickHouse
"""

import asyncpg
import pandas as pd
from typing import List, Set
from .config import settings


async def get_postgres_connection():
    """Get async PostgreSQL connection."""
    return await asyncpg.connect(settings.DATABASE_URL)


async def get_ratings_dataframe() -> pd.DataFrame:
    """Load ratings from PostgreSQL."""
    conn = await get_postgres_connection()
    try:
        rows = await conn.fetch("""
            SELECT 
                user_id::text as user_id, 
                movie_id::text as movie_id, 
                rating
            FROM ratings
        """)
        return pd.DataFrame([dict(r) for r in rows])
    finally:
        await conn.close()


async def get_watch_history_dataframe() -> pd.DataFrame:
    """Load watch history from PostgreSQL."""
    conn = await get_postgres_connection()
    try:
        rows = await conn.fetch("""
            SELECT 
                user_id::text as user_id, 
                movie_id::text as movie_id,
                progress_seconds,
                duration_seconds,
                completed
            FROM watch_history
        """)
        return pd.DataFrame([dict(r) for r in rows])
    finally:
        await conn.close()


async def get_movies_with_genres() -> pd.DataFrame:
    """Load movies with their genres."""
    conn = await get_postgres_connection()
    try:
        rows = await conn.fetch("""
            SELECT 
                m.id::text as id,
                m.title,
                STRING_AGG(g.name, ',') as genres
            FROM movies m
            LEFT JOIN movie_genres mg ON m.id = mg.movie_id
            LEFT JOIN genres g ON mg.genre_id = g.id
            WHERE m.movie_status = 'published' AND m.encode_status = 'ready'
            GROUP BY m.id, m.title
        """)
        return pd.DataFrame([dict(r) for r in rows])
    finally:
        await conn.close()


async def get_all_movie_ids() -> List[str]:
    """Get all published movie IDs."""
    conn = await get_postgres_connection()
    try:
        rows = await conn.fetch("""
            SELECT id::text as id FROM movies 
            WHERE movie_status = 'published' AND encode_status = 'ready'
        """)
        return [row["id"] for row in rows]
    finally:
        await conn.close()


async def get_user_watched_movies(user_id: str) -> Set[str]:
    """Get set of movie IDs that user has watched."""
    conn = await get_postgres_connection()
    try:
        rows = await conn.fetch("""
            SELECT movie_id::text as movie_id 
            FROM watch_history 
            WHERE user_id = $1
        """, user_id)
        return {row["movie_id"] for row in rows}
    finally:
        await conn.close()


async def get_user_watched_genres(user_id: str) -> List[str]:
    """Get genres of movies that user has watched."""
    conn = await get_postgres_connection()
    try:
        rows = await conn.fetch("""
            SELECT DISTINCT g.name
            FROM watch_history wh
            JOIN movie_genres mg ON wh.movie_id = mg.movie_id
            JOIN genres g ON mg.genre_id = g.id
            WHERE wh.user_id = $1
        """, user_id)
        return [row["name"] for row in rows]
    finally:
        await conn.close()

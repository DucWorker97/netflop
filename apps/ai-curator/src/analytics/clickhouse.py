"""
ClickHouse Analytics Service
ETL Pipeline: PostgreSQL → ClickHouse + Event Processing
"""

import asyncio
from typing import Optional
from datetime import datetime, timedelta
import clickhouse_connect
from clickhouse_connect.driver.client import Client
import pandas as pd
from ..config import settings
from ..database import get_postgres_connection


class ClickHouseService:
    """
    ClickHouse service for analytics data storage and querying.
    Handles:
    - Event ingestion from queue
    - ETL from PostgreSQL (movies, users, ratings)
    - Aggregation queries for dashboards
    """

    def __init__(self):
        self.client: Optional[Client] = None

    async def connect(self):
        """Connect to ClickHouse."""
        self.client = clickhouse_connect.get_client(
            host=settings.CLICKHOUSE_HOST,
            port=settings.CLICKHOUSE_PORT,
            username='default',
            password='clickhouse',
            database=settings.CLICKHOUSE_DATABASE,
        )
        print(f"[OK] Connected to ClickHouse at {settings.CLICKHOUSE_HOST}")

    async def initialize_schema(self):
        """Create tables if they don't exist."""
        if not self.client:
            await self.connect()

        # User Events table (main event storage)
        self.client.command("""
            CREATE TABLE IF NOT EXISTS user_events (
                event_id UUID,
                event_type LowCardinality(String),
                user_id UUID,
                movie_id Nullable(UUID),
                timestamp DateTime64(3),
                session_id Nullable(String),
                platform LowCardinality(String),
                
                -- Video specific
                position_seconds Float32 DEFAULT 0,
                duration_seconds Float32 DEFAULT 0,
                quality Nullable(String),
                
                -- Search specific
                query Nullable(String),
                result_count UInt32 DEFAULT 0,
                
                -- Rail/impression specific
                rail_name Nullable(String),
                position_in_rail Nullable(UInt16),
                
                -- Properties JSON
                properties String DEFAULT '{}',
                
                -- Partitioning helper
                event_date Date DEFAULT toDate(timestamp)
            )
            ENGINE = MergeTree()
            PARTITION BY toYYYYMM(event_date)
            ORDER BY (event_type, user_id, timestamp)
            TTL event_date + INTERVAL 1 YEAR
        """)

        # Daily movie stats (materialized aggregates)
        self.client.command("""
            CREATE TABLE IF NOT EXISTS daily_movie_stats (
                date Date,
                movie_id UUID,
                view_count UInt64,
                unique_viewers UInt64,
                total_watch_seconds Float64,
                avg_completion_rate Float32,
                play_count UInt64,
                search_appearances UInt64,
                favorites_added Int64,
                favorites_removed Int64
            )
            ENGINE = SummingMergeTree()
            PARTITION BY toYYYYMM(date)
            ORDER BY (date, movie_id)
        """)

        # Daily user stats
        self.client.command("""
            CREATE TABLE IF NOT EXISTS daily_user_stats (
                date Date,
                user_id UUID,
                session_count UInt32,
                total_watch_seconds Float64,
                movies_viewed UInt32,
                searches_count UInt32,
                favorites_count Int32
            )
            ENGINE = SummingMergeTree()
            PARTITION BY toYYYYMM(date)
            ORDER BY (date, user_id)
        """)

        # Movies dimension table (synced from PostgreSQL)
        self.client.command("""
            CREATE TABLE IF NOT EXISTS movies_dim (
                id UUID,
                title String,
                genres Array(String),
                release_year Nullable(Int16),
                duration_seconds Nullable(Int32),
                created_at DateTime64(3),
                updated_at DateTime64(3)
            )
            ENGINE = ReplacingMergeTree(updated_at)
            ORDER BY id
        """)

        print("[OK] ClickHouse schema initialized")

    async def insert_event(self, event: dict):
        """Insert a single event."""
        if not self.client:
            await self.connect()

        self.client.insert('user_events', [event], column_names=list(event.keys()))

    async def insert_events_batch(self, events: list[dict]):
        """Insert multiple events in batch."""
        if not self.client or not events:
            return

        # Convert to DataFrame for efficient insert
        df = pd.DataFrame(events)
        self.client.insert_df('user_events', df)

    async def sync_movies_from_postgres(self):
        """Sync movies dimension table from PostgreSQL."""
        print("[INFO] Syncing movies to ClickHouse...")

        conn = await get_postgres_connection()
        try:
            rows = await conn.fetch("""
                SELECT 
                    m.id,
                    m.title,
                    m.release_year,
                    m.duration_seconds,
                    m.created_at,
                    m.updated_at,
                    ARRAY_AGG(g.name) FILTER (WHERE g.name IS NOT NULL) as genres
                FROM movies m
                LEFT JOIN movie_genres mg ON m.id = mg.movie_id
                LEFT JOIN genres g ON mg.genre_id = g.id
                WHERE m.movie_status = 'published'
                GROUP BY m.id, m.title, m.release_year, m.duration_seconds, m.created_at, m.updated_at
            """)

            if not rows:
                print("[WARN] No movies to sync")
                return

            # Convert to list of dicts
            movies = []
            for row in rows:
                movies.append({
                    'id': str(row['id']),
                    'title': row['title'],
                    'genres': row['genres'] or [],
                    'release_year': row['release_year'],
                    'duration_seconds': row['duration_seconds'],
                    'created_at': row['created_at'],
                    'updated_at': row['updated_at'],
                })

            # Insert into ClickHouse
            df = pd.DataFrame(movies)
            self.client.insert_df('movies_dim', df)

            print(f"[OK] Synced {len(movies)} movies to ClickHouse")

        finally:
            await conn.close()

    async def aggregate_daily_stats(self, date: Optional[datetime] = None):
        """Compute daily aggregates for movies and users."""
        if not self.client:
            await self.connect()

        target_date = date or datetime.now().date()
        date_str = target_date.strftime('%Y-%m-%d')

        print(f"[INFO] Aggregating stats for {date_str}...")

        # Aggregate movie stats
        self.client.command(f"""
            INSERT INTO daily_movie_stats
            SELECT
                toDate('{date_str}') as date,
                movie_id,
                countIf(event_type = 'movie_view') as view_count,
                uniqIf(user_id, event_type = 'movie_view') as unique_viewers,
                sumIf(position_seconds, event_type IN ('video_pause', 'video_complete')) as total_watch_seconds,
                avgIf(
                    position_seconds / nullIf(duration_seconds, 0),
                    event_type = 'video_complete' OR event_type = 'video_pause'
                ) as avg_completion_rate,
                countIf(event_type = 'video_play') as play_count,
                countIf(event_type = 'search_result_click') as search_appearances,
                countIf(event_type = 'add_favorite') as favorites_added,
                countIf(event_type = 'remove_favorite') as favorites_removed
            FROM user_events
            WHERE event_date = toDate('{date_str}')
              AND movie_id IS NOT NULL
            GROUP BY movie_id
        """)

        # Aggregate user stats
        self.client.command(f"""
            INSERT INTO daily_user_stats
            SELECT
                toDate('{date_str}') as date,
                user_id,
                uniq(session_id) as session_count,
                sumIf(position_seconds, event_type IN ('video_pause', 'video_complete')) as total_watch_seconds,
                uniqIf(movie_id, event_type = 'movie_view') as movies_viewed,
                countIf(event_type = 'search') as searches_count,
                countIf(event_type = 'add_favorite') - countIf(event_type = 'remove_favorite') as favorites_count
            FROM user_events
            WHERE event_date = toDate('{date_str}')
            GROUP BY user_id
        """)

        print(f"[OK] Daily stats aggregated for {date_str}")

    # Analytics Queries

    async def get_trending_movies(self, days: int = 7, limit: int = 10) -> list[dict]:
        """Get trending movies based on recent activity."""
        result = self.client.query(f"""
            SELECT
                m.id,
                m.title,
                m.genres,
                SUM(s.view_count) as total_views,
                SUM(s.play_count) as total_plays,
                AVG(s.avg_completion_rate) as avg_completion
            FROM daily_movie_stats s
            JOIN movies_dim m ON s.movie_id = m.id
            WHERE s.date >= today() - {days}
            GROUP BY m.id, m.title, m.genres
            ORDER BY total_views DESC, total_plays DESC
            LIMIT {limit}
        """)

        return [dict(zip(result.column_names, row)) for row in result.result_rows]

    async def get_user_engagement_stats(self, user_id: str, days: int = 30) -> dict:
        """Get engagement stats for a user."""
        result = self.client.query(f"""
            SELECT
                SUM(session_count) as total_sessions,
                SUM(total_watch_seconds) / 3600 as watch_hours,
                SUM(movies_viewed) as movies_viewed,
                SUM(searches_count) as searches
            FROM daily_user_stats
            WHERE user_id = '{user_id}'
              AND date >= today() - {days}
        """)

        if result.result_rows:
            row = result.result_rows[0]
            return {
                'total_sessions': row[0] or 0,
                'watch_hours': round(row[1] or 0, 1),
                'movies_viewed': row[2] or 0,
                'searches': row[3] or 0,
            }
        return {}

    async def get_genre_popularity(self, days: int = 30) -> list[dict]:
        """Get genre popularity based on views."""
        result = self.client.query(f"""
            SELECT
                genre,
                SUM(view_count) as views,
                SUM(play_count) as plays
            FROM (
                SELECT
                    arrayJoin(m.genres) as genre,
                    s.view_count,
                    s.play_count
                FROM daily_movie_stats s
                JOIN movies_dim m ON s.movie_id = m.id
                WHERE s.date >= today() - {days}
            )
            GROUP BY genre
            ORDER BY views DESC
        """)

        return [{'genre': row[0], 'views': row[1], 'plays': row[2]} for row in result.result_rows]


# Singleton instance
clickhouse_service = ClickHouseService()

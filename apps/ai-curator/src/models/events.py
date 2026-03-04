"""
Event Tracking Models
Defines event schema for user behavior tracking
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class EventType(str, Enum):
    """Types of trackable user events."""
    # Video events
    VIDEO_PLAY = "video_play"
    VIDEO_PAUSE = "video_pause"
    VIDEO_SEEK = "video_seek"
    VIDEO_COMPLETE = "video_complete"
    VIDEO_QUALITY_CHANGE = "video_quality_change"
    VIDEO_BUFFER = "video_buffer"

    # Browse events
    MOVIE_VIEW = "movie_view"           # Opened movie detail
    MOVIE_IMPRESSION = "movie_impression"  # Movie appeared on screen
    SEARCH = "search"
    SEARCH_RESULT_CLICK = "search_result_click"

    # Engagement events
    ADD_FAVORITE = "add_favorite"
    REMOVE_FAVORITE = "remove_favorite"
    RATE_MOVIE = "rate_movie"

    # Session events
    APP_OPEN = "app_open"
    APP_CLOSE = "app_close"


class UserEvent(BaseModel):
    """Base schema for user tracking events."""
    event_id: str
    event_type: EventType
    user_id: str
    timestamp: datetime
    session_id: Optional[str] = None

    # Platform info
    platform: str = "unknown"  # mobile, web
    device_type: Optional[str] = None
    app_version: Optional[str] = None

    # Event-specific data
    properties: Dict[str, Any] = {}


class VideoEvent(UserEvent):
    """Video playback event with additional context."""
    movie_id: str
    position_seconds: float = 0
    duration_seconds: float = 0
    quality: Optional[str] = None  # 360p, 720p


class SearchEvent(UserEvent):
    """Search event."""
    query: str
    result_count: int = 0
    selected_movie_id: Optional[str] = None


class ImpressionEvent(UserEvent):
    """Movie impression event (appeared in viewport)."""
    movie_id: str
    rail_name: Optional[str] = None  # "Trending", "For You", etc.
    position_in_rail: Optional[int] = None


# ClickHouse table schemas (for reference)
CLICKHOUSE_EVENTS_TABLE = """
CREATE TABLE IF NOT EXISTS netflop_analytics.user_events (
    event_id UUID,
    event_type LowCardinality(String),
    user_id UUID,
    movie_id Nullable(UUID),
    timestamp DateTime64(3),
    session_id Nullable(String),
    platform LowCardinality(String),
    device_type Nullable(String),
    
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
    
    -- Partitioning
    event_date Date DEFAULT toDate(timestamp)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_type, user_id, timestamp)
TTL event_date + INTERVAL 1 YEAR;
"""

CLICKHOUSE_AGGREGATES_TABLE = """
-- Daily aggregates for fast analytics
CREATE TABLE IF NOT EXISTS netflop_analytics.daily_movie_stats (
    date Date,
    movie_id UUID,
    view_count UInt64,
    unique_viewers UInt64,
    total_watch_seconds Float64,
    avg_completion_rate Float32,
    search_appearances UInt64,
    favorites_added Int64,
    favorites_removed Int64
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, movie_id);
"""

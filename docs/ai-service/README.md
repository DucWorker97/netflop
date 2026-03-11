# AI Curator - Netflop Recommendation Service

> Hệ thống AI Curator cho Netflop với Hybrid Recommendation + Big Data Analytics

## 🎯 Tính năng

- **Hybrid Recommendation**: Kết hợp 3 phương pháp
  - Collaborative Filtering (SVD) - 50%
  - Content-based (TF-IDF genres) - 30%
  - Popularity scoring - 20%
- **Personal Recommendations**: "For You" rail cho từng user
- **Similar Movies**: "More Like This" section
- **Trending**: Phim hot trong tuần
- **Event Tracking**: Thu thập user behavior

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| API Framework | FastAPI (Python 3.11+) |
| ML Library | scikit-surprise (SVD) |
| Text Processing | scikit-learn (TF-IDF) |
| Analytics DB | ClickHouse |
| Cache | Redis |

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- pip or uv (recommended)

### Installation

```bash
cd apps/ai-curator

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Mac/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Run Development Server

```bash
# Start the service
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/recommendations` | POST | Get personalized recommendations |
| `/api/similar-movies` | POST | Get similar movies |
| `/api/trending` | GET | Get trending movies |
| `/api/retrain` | POST | Trigger model retraining |

### Example Request

```bash
curl -X POST http://localhost:8000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{"user_id": "uuid-here", "limit": 10}'
```

### Example Response

```json
{
  "user_id": "uuid-here",
  "recommendations": [
    {
      "movie_id": "movie-uuid",
      "title": "Sample Movie",
      "score": 0.85,
      "reason": "Because you enjoy Action movies"
    }
  ],
  "algorithm": "hybrid_cf_cb_pop"
}
```

## 📁 Project Structure

```
apps/ai-curator/
├── src/
│   ├── main.py            # FastAPI application
│   ├── config.py          # Settings
│   ├── database.py        # PostgreSQL helpers
│   ├── recommenders/
│   │   ├── hybrid.py      # Main recommender
│   │   ├── collaborative.py  # SVD-based CF
│   │   ├── content_based.py  # TF-IDF genres
│   │   └── popularity.py     # View/rating scoring
│   └── models/
│       └── events.py      # Event tracking schemas
├── models/                # Saved ML models
├── requirements.txt
└── README.md
```

## 🤖 ML Training

### Generate Demo Data (optional)
```bash
# Generate sample ratings and watch history for testing
python -m src.training.generate_demo_data
```

### Train Models
```bash
# Train both SVD and TF-IDF models
python -m src.training.train_model
```

### Evaluate Models
```bash
# Run Precision@K, Recall@K, Coverage metrics
python -m src.training.evaluate
```

### Training Output
Models are saved to `./models/`:
- `cf_svd.pkl` - Collaborative Filtering (SVD)
- `cb_tfidf.pkl` - Content-based (TF-IDF)

## 🔧 Configuration

Environment variables (from `.env`):

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/netflop
REDIS_URL=redis://localhost:6379
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123

# Recommendation weights
CF_WEIGHT=0.5
CB_WEIGHT=0.3
POP_WEIGHT=0.2
```

## 📊 Analytics (ClickHouse)

Start ClickHouse:
```bash
docker compose up -d clickhouse
```

Access: http://localhost:8123

## 🔗 Integration với NestJS

Trong NestJS API, gọi AI Curator service:

```typescript
// apps/api/src/recommendations/recommendations.service.ts
async getRecommendations(userId: string) {
  const response = await fetch('http://localhost:8000/api/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, limit: 10 }),
  });
  return response.json();
}
```

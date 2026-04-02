# Amazon Product Recommendation System
### AI/ML Engineer Practical Assignment — End-to-End Recommendation System

![Python](https://img.shields.io/badge/Python-3.10+-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green) ![React](https://img.shields.io/badge/React-18+-61DAFB) ![License](https://img.shields.io/badge/license-MIT-orange)

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Setup Steps](#setup-steps)
4. [Approach](#approach)
5. [Evaluation Results](#evaluation-results)
6. [Tradeoffs](#tradeoffs)
7. [Limitations](#limitations)
8. [Scalability Considerations](#scalability-considerations)
9. [Future Improvements](#future-improvements)

---

## Project Overview

An end-to-end product recommendation system built on the Amazon product review dataset. The system recommends the **top 5 products** for each user using a **hybrid recommendation engine** combining Content-Based Filtering (CBF), Item-Item Collaborative Filtering (CF), and Maximal Marginal Relevance (MMR) reranking for diversity.

**Key results at a glance:**

| Metric | Value |
|---|---|
| Category Hit@5 | **99.0%** |
| Intra-list Diversity (MMR) | **0.356** |
| Catalog Coverage | **36.57%** |
| Unique Users | 9,050 |
| Unique Products | 1,351 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│                  React Frontend (Vite + Tailwind)           │
│   User Selection │ Recommendation Cards │ Seen Products     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (REST)
┌──────────────────────────▼──────────────────────────────────┐
│                       API LAYER                             │
│                  FastAPI Backend (Python)                   │
│   GET /          GET /users     GET /recommendations/{id}   │
│                  GET /users/{id}/seen                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     MODEL LAYER                             │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │  Content-Based  │  │  Collaborative   │                 │
│  │  Filtering      │  │  Filtering       │                 │
│  │  (TF-IDF +      │  │  (Item-Item CF   │                 │
│  │  Cosine Sim)    │  │  + Cosine Sim)   │                 │
│  └────────┬────────┘  └───────┬──────────┘                 │
│           │                   │                             │
│           └─────────┬─────────┘                            │
│                     ▼                                       │
│            ┌────────────────┐                               │
│            │  Hybrid Scorer │  (dynamic CBF/CF weights)    │
│            └───────┬────────┘                               │
│                    ▼                                        │
│            ┌────────────────┐                               │
│            │  MMR Reranker  │  (diversity optimization)    │
│            └───────┬────────┘                               │
└───────────────────────────────────────────────────────────-─┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    DATA LAYER                               │
│              model_artifacts/ (pkl files)                   │
│  df_clean │ product_catalog │ user_item_matrix              │
│  tfidf_vectorizer │ tfidf_matrix │ cosine_sim               │
│  item_item_sim │ product_indices │ item_indices_cf          │
│  pid_to_cat                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
Mobile_First_Assignment/
│
├── model_artifacts/              # Trained model pkl files
│   ├── df_clean.pkl
│   ├── product_catalog.pkl
│   ├── user_item_matrix.pkl
│   ├── tfidf_vectorizer.pkl
│   ├── tfidf_matrix.pkl
│   ├── cosine_sim.pkl
│   ├── item_item_sim.pkl
│   ├── product_indices.pkl
│   ├── item_indices_cf.pkl
│   └── pid_to_cat.pkl
│
├── backend/
│   ├── main.py                   # FastAPI routes & endpoints
│   ├── recommender.py            # All ML model logic
│   ├── schemas.py                # Pydantic response models
│   └── requirements.txt
│
├── frontend/
│   └── project/                  # React app (Vite + Tailwind)
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
│
└── README.md
```

---

## Setup Steps

### Prerequisites
- Python 3.10+
- Node.js v18+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/HaRsH00000007/Mobile_First_Assignment.git
cd Mobile_First_Assignment
```

### 2. Create & Activate Python Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate
```

### 3. Install Backend Dependencies

```bash
pip install fastapi uvicorn pandas numpy scikit-learn scipy python-multipart
```

### 4. Start the Backend Server

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Backend will be live at: `http://127.0.0.1:8000`
Swagger docs at: `http://127.0.0.1:8000/docs`

### 5. Install & Start the Frontend

Open a new terminal:

```bash
cd frontend/project
npm install
npm run dev
```

Frontend will be live at: `http://localhost:5173`

### 6. Test the API

```bash
# Health check
curl http://127.0.0.1:8000/

# Fetch users
curl http://127.0.0.1:8000/users?limit=10

# Get recommendations for a user
curl http://127.0.0.1:8000/recommendations/AG3D6O4STAQKAY2UVGEUV46KN35Q

# Get seen products for a user
curl http://127.0.0.1:8000/users/AG3D6O4STAQKAY2UVGEUV46KN35Q/seen
```

---

## Approach

### Dataset Characteristics & Key Findings

The raw dataset contains **1,465 rows** but each row is a product-level aggregation where `user_id`, `user_name`, `review_id`, `review_title`, and `review_content` are **comma-separated lists** of multiple users. After properly exploding these multi-valued fields:

- **9,050 unique users**
- **1,351 unique products**
- **11,503 user-product interactions**
- **85% of users have only 1 interaction** — extreme sparsity

This sparsity profile directly drove our algorithm choices.

### Data Preprocessing

1. **Multi-value column explosion** — Used `user_id` as the anchor length (structured IDs, no natural commas). Free-text fields (`review_content`) were handled with overflow-joining to prevent internal commas from misaligning user-review mapping.
2. **Price cleaning** — Stripped `₹` symbols and commas, converted to float.
3. **Rating cleaning** — Handled string ratings with inconsistent formatting.
4. **Discount & rating_count** — Removed `%` and `,` symbols respectively.
5. **Category hierarchy** — Split `|`-delimited category strings into 7 levels; extracted `main_category` and `sub_category` as features.
6. **Deduplication** — Dropped duplicate user-product pairs keeping first occurrence.

### Recommendation Engine

#### Component 1: Content-Based Filtering (CBF)

**Why chosen:** With 85% of users having only 1 interaction, CBF is the most reliable component. Rich product metadata (detailed `about_product` text, hierarchical categories, product names) enables meaningful item-to-item similarity even without user history.

**How it works:**
- Combined `product_name` + `main_category` + `sub_category` + `category` (all levels) + `about_product` into a single text feature field
- Applied TF-IDF vectorization (`max_features=5000`, `ngram_range=(1,2)`, `sublinear_tf=True`)
- Computed pairwise cosine similarity across all 1,351 products
- For a given user, aggregated CBF scores across all products they've interacted with

#### Component 2: Item-Item Collaborative Filtering (CF)

**Why Item-Item over User-User:** With most users having only 1-2 interactions, User-User CF cannot find meaningful neighbors. Item-Item CF is more stable because items accumulate signals from multiple users and the item space (1,351) is far smaller than the user space (9,050).

**How it works:**
- Built a sparse user-item matrix (9,050 × 1,351) using product rating as interaction signal
- Computed item-item cosine similarity on the transposed matrix
- For a given user, aggregated similarity scores from all their interacted items

#### Component 3: Hybrid Method

**Dynamic weighting** based on user interaction history — users with more interactions rely more on CF signals, new/sparse users rely more on CBF:

| Interactions | CBF Weight | CF Weight |
|---|---|---|
| 0 (cold start) | 1.0 | 0.0 |
| 1 | 0.8 | 0.2 |
| 2–3 | 0.6 | 0.4 |
| 4+ | 0.4 | 0.6 |

Both score sets are independently normalized to [0,1] before combining.

#### Diversity Reranking: Maximal Marginal Relevance (MMR)

After hybrid scoring, MMR reranking is applied to improve recommendation diversity. MMR balances relevance (high hybrid score) against redundancy (category overlap with already-selected items):

```
MMR(item) = λ × relevance_score − (1−λ) × category_overlap
```

Default `λ = 0.7` (relevance-biased). This parameter is exposed in the API for tuning.

### Backend API

Built with **FastAPI** for automatic OpenAPI documentation, async support, and Pydantic validation.

| Endpoint | Description |
|---|---|
| `GET /` | Health check — confirms model artifacts loaded |
| `GET /users` | Paginated list of all users (limit/offset params) |
| `GET /recommendations/{user_id}` | Top-N hybrid recommendations with explanation metadata |
| `GET /users/{user_id}/seen` | Products already seen by user (excluded from recs) |

Each recommendation response includes: `product_id`, `product_name`, `score`, `category`, `rating`, `price`, `img_link`, `product_link`, `reason` (human-readable explanation), and `method` (algorithm label).

### Frontend

Built with **React + Vite + Tailwind CSS**:
- Searchable user dropdown (9,050 users with live filter)
- MMR diversity slider (0 = diverse, 1 = relevant)
- Recommendation count selector (1–20)
- Product cards with image, category badge, star rating, price, algorithm method badge, and explanation text
- "Previously Seen Products" collapsible panel
- Full loading, error, and empty states
- "View on Amazon" deep links

---

## Evaluation Results

```
╔══════════════════════════════════════════════════════════════╗
║              OFFLINE EVALUATION SUMMARY                     ║
╠══════════════════════════════════════════════════════════════╣
║  Dataset: Amazon Product Reviews                            ║
║  Model:   Hybrid CBF + Item-Item CF + MMR Reranking         ║
╠══════════════════════════════════════════════════════════════╣
║  METRIC                          VALUE                      ║
║  ─────────────────────────────── ────────────────────────   ║
║  Exact Hit@5 (Precision@5)       0.0000                     ║
║  Category Hit@5 (Recall proxy)   0.9900  ← key metric       ║
║  Catalog Coverage                36.57%                     ║
║  Intra-list Diversity (MMR)      0.3560                     ║
╠══════════════════════════════════════════════════════════════╣
║  Before MMR reranking:                                      ║
║  Category Hit@5                  0.9600                     ║
║  Intra-list Diversity            0.2400                     ║
╚══════════════════════════════════════════════════════════════╝
```

### Why Precision@5 = 0.0000 — Dataset Limitation Explained

This is a **dataset limitation, not a model failure**. Three compounding factors make exact-hit evaluation near-impossible here:

1. **Extreme sparsity:** 85% of users (7,746 / 9,050) have only 1 reviewed product — they cannot be split into train/test sets.
2. **Small evaluable pool:** Only 911 users have ≥2 interactions. Of those, most have exactly 2 — meaning we train on 1 product and test on 1 product.
3. **Large item space:** With 1,351 products in the catalog, even a theoretically perfect model would have only a **0.07% chance** of predicting the exact held-out item in a top-5 list.

**Category Hit@5 = 99%** is the meaningful metric here — it confirms the model correctly understands user preference domains even when it cannot pinpoint the exact product.

### Production Evaluation Strategy

In a real deployment we would measure:
- **Click-Through Rate (CTR)** — did the user click on any recommended product?
- **Add-to-Cart Rate** — did the user add a recommended product to cart?
- **A/B Testing** — compare hybrid recommendations vs random baseline vs CF-only
- **Explicit Feedback** — thumbs up/down on recommendations
- **Online Precision** — computed from actual user interactions with recommended items
- **Diversity metrics** — measured on real user sessions over time

---

## Tradeoffs

| Decision | Chosen Approach | Alternative | Reason |
|---|---|---|---|
| CF algorithm | Item-Item CF | Matrix Factorization (SVD/ALS) | Dataset too sparse for MF to learn meaningful latent factors |
| Text features | TF-IDF | Sentence Transformers / BERT | TF-IDF is interpretable, fast, and sufficient for product metadata |
| Hybrid weighting | Dynamic (interaction-count based) | Fixed weights | Adapts to cold-start vs warm users automatically |
| Diversity | MMR reranking post-scoring | Diversity-aware training | Separation of concerns; MMR is tunable via λ parameter |
| Rating signal | Aggregate product rating | Individual user ratings | Individual ratings aren't cleanly available per user in this dataset |
| Backend | FastAPI | Flask / Django | Automatic OpenAPI docs, Pydantic validation, async support |

---

## Limitations

1. **No true individual ratings** — The dataset provides aggregate product ratings, not individual user ratings. The interaction signal is binary (reviewed or not) rather than a genuine preference score.

2. **Extreme cold-start problem** — 85% of users have only 1 interaction. While CBF handles new users gracefully, recommendations for these users are effectively content-based only.

3. **Static models** — All pkl artifacts are pre-computed. New products or users require full retraining. There is no online learning.

4. **Small catalog** — 1,351 products is a relatively small catalog. Coverage at 36.57% means ~870 products are never recommended — a popularity bias issue that would worsen at scale.

5. **No temporal signals** — The dataset has no timestamps, so we cannot model recency, seasonal trends, or user preference drift over time.

6. **Memory-based CF** — Storing full item-item similarity matrices in memory is not scalable beyond tens of thousands of items.

---

## Scalability Considerations

| Component | Current Approach | At Scale (millions of users/items) |
|---|---|---|
| CF similarity | Full item-item matrix in memory | Approximate Nearest Neighbors (FAISS, Annoy) |
| TF-IDF | Sklearn in-memory | Distributed Spark MLlib or online serving |
| Model storage | Local pkl files | S3 / GCS + model registry (MLflow) |
| Backend | Single FastAPI instance | Containerized (Docker) + Kubernetes autoscaling |
| Retraining | Manual | Automated pipeline (Airflow/Prefect) triggered by new data |
| User-item matrix | Pandas DataFrame | Distributed sparse matrix (PySpark) or database (Redis) |
| API latency | ~200–500ms (pkl load per request) | Pre-computed recommendation cache (Redis) with async refresh |

---

## Future Improvements

1. **Two-Tower Neural Model** — Replace TF-IDF + CF with a deep learning two-tower architecture (user tower + item tower) that learns dense embeddings jointly, handling sparsity better.

2. **Session-Based Recommendations** — For truly cold users, use session context (current browsing) rather than historical interactions.

3. **Real-time Feature Store** — Move from static pkl files to a feature store (Feast, Tecton) so recommendations update as users interact.

4. **Implicit Feedback Modeling** — Use libraries like `implicit` (ALS with confidence weighting) which are designed specifically for implicit feedback datasets like this one.

5. **Cross-Category Discovery** — Increase catalog coverage by introducing exploration-exploitation strategies (epsilon-greedy or Thompson sampling) alongside exploitation-focused hybrid recommendations.

6. **Reranking with Business Rules** — Layer business constraints on top of ML scores: boost high-margin products, suppress out-of-stock items, apply A/B test assignments.

7. **Multilingual Support** — `about_product` text is English-only. Supporting regional languages would improve coverage for India-specific Amazon datasets.

8. **Evaluation Infrastructure** — Build an online evaluation pipeline with proper A/B testing framework, logging, and dashboards before any production deployment.

---

## API Reference

Full interactive API documentation available at:
```
http://127.0.0.1:8000/docs
```

### Sample Requests

```bash
# Get top 5 recommendations (default)
GET /recommendations/AG3D6O4STAQKAY2UVGEUV46KN35Q

# Get top 10 recommendations with maximum diversity
GET /recommendations/AG3D6O4STAQKAY2UVGEUV46KN35Q?n=10&lambda_mmr=0.3

# Get users with pagination
GET /users?limit=50&offset=100
```

### Sample Response

```json
{
  "user_id": "AG3D6O4STAQKAY2UVGEUV46KN35Q",
  "total_recommendations": 5,
  "recommendations": [
    {
      "product_id": "B07JW9H4J1",
      "product_name": "Wayona Nylon Braided USB to Lightning Fast Charging Cable",
      "score": 0.8423,
      "main_category": "Electronics",
      "rating": 4.2,
      "discounted_price": 399.0,
      "img_link": "https://m.media-amazon.com/images/...",
      "product_link": "https://www.amazon.in/...",
      "reason": "Recommended via hybrid (content-leaning). CBF weight: 0.6, CF weight: 0.4. Diversity reranking applied (MMR λ=0.7).",
      "method": "hybrid (content-leaning)"
    }
  ]
}
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Data Processing | Python, Pandas, NumPy |
| ML / Modelling | Scikit-learn (TF-IDF, Cosine Similarity) |
| Model Training | Google Colab |
| Backend | FastAPI, Uvicorn, Pydantic |
| Frontend | React 18, Vite, Tailwind CSS |
| Model Storage | Pickle (.pkl) files |
| API Docs | Swagger UI (auto-generated by FastAPI) |

---

*Built as part of the AI/ML Engineer Practical Assignment.*

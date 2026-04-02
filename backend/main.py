from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from schemas import (
    RecommendationResponse,
    UsersResponse,
    HealthResponse,
    ProductRecommendation,
)
from recommender import (
    get_hybrid_recommendations,
    get_all_users,
    get_seen_products,
    get_total_products,
    df_clean,
    product_catalog,
)

# ── App init ────────────────────────────────────────────────────────────────
app = FastAPI(
    title       = "Amazon Product Recommendation API",
    description = "Hybrid recommendation system using CBF + Item-Item CF + MMR",
    version     = "1.0.0",
)

# ── CORS (allows React frontend to call this API) ───────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],   # tighten this in production
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Check if API and models are loaded correctly."""
    return HealthResponse(
        status           = "ok",
        total_users      = len(get_all_users()),
        total_products   = get_total_products(),
        artifacts_loaded = True,
    )


@app.get("/users", response_model=UsersResponse, tags=["Users"])
def fetch_users(
    limit:  int = Query(default=100, ge=1, le=10000,
                        description="Max users to return"),
    offset: int = Query(default=0,   ge=0,
                        description="Pagination offset"),
):
    """
    Fetch all available users in the system.
    Supports pagination via limit & offset.
    """
    all_users = get_all_users()
    paginated = all_users[offset: offset + limit]
    return UsersResponse(
        total_users = len(all_users),
        users       = paginated,
    )


@app.get("/recommendations/{user_id}",
         response_model=RecommendationResponse,
         tags=["Recommendations"])
def fetch_recommendations(
    user_id:    str,
    n:          int   = Query(default=5,   ge=1, le=20,
                              description="Number of recommendations"),
    lambda_mmr: float = Query(default=0.7, ge=0.0, le=1.0,
                              description="MMR diversity param: 0=diverse, 1=relevant"),
):
    """
    Fetch top-N recommendations for a user.

    - Excludes products the user has already seen
    - Returns explanation metadata for each recommendation
    - Uses hybrid CBF + CF + MMR reranking
    """
    all_users = get_all_users()
    if user_id not in all_users:
        raise HTTPException(
            status_code = 404,
            detail      = f"User '{user_id}' not found. "
                          f"Use /users to get valid user IDs.",
        )

    recs = get_hybrid_recommendations(user_id, n=n, lambda_mmr=lambda_mmr)

    if not recs:
        raise HTTPException(
            status_code = 404,
            detail      = f"Could not generate recommendations for user '{user_id}'.",
        )

    return RecommendationResponse(
        user_id                = user_id,
        total_recommendations  = len(recs),
        recommendations        = [ProductRecommendation(**r) for r in recs],
    )


@app.get("/users/{user_id}/seen", tags=["Users"])
def fetch_seen_products(user_id: str):
    """
    Fetch products already seen/reviewed by a user.
    These are excluded from recommendations automatically.
    """
    all_users = get_all_users()
    if user_id not in all_users:
        raise HTTPException(status_code=404,
                            detail=f"User '{user_id}' not found.")

    seen = list(get_seen_products(user_id))
    seen_details = []
    for pid in seen:
        prow = product_catalog[product_catalog["product_id"] == pid]
        if not prow.empty:
            p = prow.iloc[0]
            seen_details.append({
                "product_id"   : pid,
                "product_name" : str(p["product_name"]),
                "category"     : str(p.get("main_category", "")),
                "rating"       : float(p["rating"]) if str(p["rating"]) != "nan" else None,
            })

    return {
        "user_id"       : user_id,
        "seen_count"    : len(seen_details),
        "seen_products" : seen_details,
    }
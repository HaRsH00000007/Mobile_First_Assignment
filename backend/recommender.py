import pickle
import numpy as np
import pandas as pd
from pathlib import Path

# ── Artifact paths ──────────────────────────────────────────────────────────
BASE_DIR      = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = BASE_DIR / "model_artifacts"

# ── Load all PKLs once at startup ───────────────────────────────────────────
print("🔄 Loading model artifacts...")

df_clean        = pd.read_pickle(ARTIFACTS_DIR / "df_clean.pkl")
product_catalog = pd.read_pickle(ARTIFACTS_DIR / "product_catalog.pkl")
user_item_df    = pd.read_pickle(ARTIFACTS_DIR / "user_item_matrix.pkl")

with open(ARTIFACTS_DIR / "tfidf_vectorizer.pkl", "rb") as f:
    tfidf = pickle.load(f)
with open(ARTIFACTS_DIR / "tfidf_matrix.pkl", "rb") as f:
    tfidf_matrix = pickle.load(f)
with open(ARTIFACTS_DIR / "cosine_sim.pkl", "rb") as f:
    cosine_sim = pickle.load(f)
with open(ARTIFACTS_DIR / "item_item_sim.pkl", "rb") as f:
    item_item_sim = pickle.load(f)
with open(ARTIFACTS_DIR / "product_indices.pkl", "rb") as f:
    product_indices = pickle.load(f)
with open(ARTIFACTS_DIR / "item_indices_cf.pkl", "rb") as f:
    item_indices_cf = pickle.load(f)
with open(ARTIFACTS_DIR / "pid_to_cat.pkl", "rb") as f:
    pid_to_cat = pickle.load(f)

print("✅ All artifacts loaded successfully")

# ── Helper: seen products for a user ────────────────────────────────────────
def get_seen_products(user_id: str) -> set:
    if user_id in user_item_df.index:
        user_ratings = user_item_df.loc[user_id]
        return set(user_ratings[user_ratings > 0].index)
    return set()

# ── CBF: Content-Based Recommendations ──────────────────────────────────────
def get_cbf_recommendations(product_id: str, n: int = 30,
                             exclude_ids: set = None) -> list:
    if product_id not in product_indices:
        return []

    idx        = product_indices[product_id]
    sim_scores = list(enumerate(cosine_sim[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:]

    results = []
    for i, score in sim_scores:
        pid = product_catalog.iloc[i]["product_id"]
        if exclude_ids and pid in exclude_ids:
            continue
        results.append({"product_id": pid, "score": float(score)})
        if len(results) >= n:
            break
    return results

# ── CF: Item-Item Collaborative Filter ──────────────────────────────────────
def get_cf_recommendations(user_id: str, n: int = 30,
                            exclude_ids: set = None) -> list:
    if user_id not in user_item_df.index:
        return []

    seen_products = get_seen_products(user_id)
    if not seen_products:
        return []

    agg_scores = np.zeros(len(user_item_df.columns))
    for pid in seen_products:
        if pid in item_indices_cf:
            idx = item_indices_cf[pid]
            agg_scores += item_item_sim[idx]

    product_score_pairs = sorted(
        zip(user_item_df.columns, agg_scores),
        key=lambda x: x[1], reverse=True
    )

    results = []
    for pid, score in product_score_pairs:
        if pid in seen_products:
            continue
        if exclude_ids and pid in exclude_ids:
            continue
        results.append({"product_id": pid, "score": float(score)})
        if len(results) >= n:
            break
    return results

# ── MMR: Diversity Reranking ─────────────────────────────────────────────────
def maximal_marginal_relevance(candidate_scores: dict,
                                lambda_param: float = 0.7,
                                n: int = 5) -> list:
    if not candidate_scores:
        return []

    selected      = []
    selected_cats = []
    remaining     = dict(candidate_scores)

    while len(selected) < n and remaining:
        mmr_scores = {}
        for pid, relevance in remaining.items():
            cat         = pid_to_cat.get(pid, "unknown")
            cat_overlap = selected_cats.count(cat) / max(len(selected_cats), 1)
            mmr_scores[pid] = (lambda_param * relevance
                               - (1 - lambda_param) * cat_overlap)

        best_pid = max(mmr_scores, key=mmr_scores.get)
        selected.append(best_pid)
        selected_cats.append(pid_to_cat.get(best_pid, "unknown"))
        del remaining[best_pid]

    return selected

# ── HYBRID: Main Recommender ─────────────────────────────────────────────────
def get_hybrid_recommendations(user_id: str, n: int = 5,
                                lambda_mmr: float = 0.7) -> list:

    seen_products = get_seen_products(user_id)
    n_seen        = len(seen_products)

    # Dynamic CF/CBF weights based on interaction history
    if n_seen == 0:
        cf_weight, cbf_weight = 0.0, 1.0
    elif n_seen == 1:
        cf_weight, cbf_weight = 0.2, 0.8
    elif n_seen <= 3:
        cf_weight, cbf_weight = 0.4, 0.6
    else:
        cf_weight, cbf_weight = 0.6, 0.4

    # CBF scores aggregated over all seen products
    cbf_scores = {}
    for pid in seen_products:
        for rec in get_cbf_recommendations(pid, n=30, exclude_ids=seen_products):
            rid = rec["product_id"]
            cbf_scores[rid] = cbf_scores.get(rid, 0) + rec["score"]

    # CF scores
    cf_raw    = get_cf_recommendations(user_id, n=30, exclude_ids=seen_products)
    cf_scores = {r["product_id"]: r["score"] for r in cf_raw}

    # Normalize both to [0, 1]
    def normalize(d):
        if not d:
            return d
        mx = max(d.values())
        return {k: v / mx for k, v in d.items()} if mx > 0 else d

    cbf_norm = normalize(cbf_scores)
    cf_norm  = normalize(cf_scores)

    # Combine
    all_pids      = set(cbf_norm.keys()) | set(cf_norm.keys())
    hybrid_scores = {
        pid: cbf_weight * cbf_norm.get(pid, 0) + cf_weight * cf_norm.get(pid, 0)
        for pid in all_pids
    }

    # MMR reranking for diversity
    reranked_pids = maximal_marginal_relevance(hybrid_scores,
                                               lambda_param=lambda_mmr, n=n)

    # Determine method label
    if cf_weight == 0.0:
        method_tag = "content-based (new user)"
    elif cf_weight <= 0.2:
        method_tag = "mostly content-based"
    elif cf_weight <= 0.4:
        method_tag = "hybrid (content-leaning)"
    else:
        method_tag = "hybrid (collaborative-leaning)"

    # Build final response objects
    results = []
    for pid in reranked_pids:
        prow = product_catalog[product_catalog["product_id"] == pid]
        if prow.empty:
            continue
        p = prow.iloc[0]
        results.append({
            "product_id"       : pid,
            "product_name"     : str(p["product_name"]),
            "score"            : round(hybrid_scores[pid], 4),
            "main_category"    : str(p.get("main_category", "")),
            "rating"           : float(p["rating"]) if pd.notna(p["rating"]) else None,
            "discounted_price" : float(p["discounted_price"]) if pd.notna(p["discounted_price"]) else None,
            "img_link"         : str(p.get("img_link", "")),
            "product_link"     : str(p.get("product_link", "")),
            "reason"           : (
                f"Recommended via {method_tag}. "
                f"CBF weight: {cbf_weight}, CF weight: {cf_weight}. "
                f"Diversity reranking applied (MMR λ={lambda_mmr})."
            ),
            "method"           : method_tag,
        })

    return results

# ── Utility functions for API endpoints ─────────────────────────────────────
def get_all_users() -> list:
    return sorted(df_clean["user_id"].unique().tolist())

def get_total_products() -> int:
    return int(product_catalog["product_id"].nunique())
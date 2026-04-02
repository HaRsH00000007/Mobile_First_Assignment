from pydantic import BaseModel
from typing import List, Optional

class ProductRecommendation(BaseModel):
    product_id: str
    product_name: str
    score: float
    main_category: str
    rating: Optional[float]
    discounted_price: Optional[float]
    img_link: Optional[str]
    product_link: Optional[str]
    reason: str
    method: str

class RecommendationResponse(BaseModel):
    user_id: str
    total_recommendations: int
    recommendations: List[ProductRecommendation]

class UsersResponse(BaseModel):
    total_users: int
    users: List[str]

class HealthResponse(BaseModel):
    status: str
    total_users: int
    total_products: int
    artifacts_loaded: bool
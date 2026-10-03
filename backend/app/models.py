"""Pydantic schemas for KeplerLens API.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class FeatureDisplay(BaseModel):
    value: float
    unit: str
    display_name: str
    short_name: str


class RoundResponse(BaseModel):
    id: str = Field(..., description="Unique Kepler Object of Interest identifier (e.g., K00752.01)")
    display_name: str = Field(..., description="Astronomical candidate name")
    is_candidate: bool = Field(..., description="True if this candidate has no ground truth yet")
    features: Dict[str, FeatureDisplay] = Field(..., description="11 measured transit & stellar properties")


class GuessRequest(BaseModel):
    id: str = Field(..., description="Target object identifier")
    guess: str = Field(..., description="'CONFIRMED' / 'Planet' or 'FALSE POSITIVE' / 'Impostor'")


class ShapContribution(BaseModel):
    feature: str
    display_name: str
    short_name: str
    value: float
    unit: str
    direction: str = Field(..., description="'planet' (pushed toward planet) or 'impostor' (pushed toward impostor)")
    shap_value: float
    magnitude: float
    fragment: str


class GuessResponse(BaseModel):
    id: str
    display_name: str
    user_guess: str
    is_candidate: bool
    true_label: Optional[str] = Field(None, description="'CONFIRMED', 'FALSE POSITIVE', or null for candidates")
    model_prediction: str = Field(..., description="'CONFIRMED' or 'FALSE POSITIVE'")
    model_probability: Dict[str, float]
    user_correct: Optional[bool] = Field(None, description="True if user guessed correctly; null if ground truth unknown")
    model_correct: Optional[bool] = Field(None, description="True if model predicted correctly; null if ground truth unknown")
    top_shap_contributions: List[ShapContribution]
    explanation: str


class FeatureMeta(BaseModel):
    name: str
    short_name: str
    unit: str
    plain_description: str
    detection_significance: str
    typical_range: str
    planet_tendency: str


class ModelStatsResponse(BaseModel):
    model_type: str
    random_seed: int
    train_samples: int
    val_samples: int
    test_samples: int
    metrics: Dict[str, Any]
    confusion_matrix: Dict[str, Any]
    feature_importances: Dict[str, float]
    parameters: Dict[str, Any]

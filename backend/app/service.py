"""Game service handling data loading, round sampling, and guess evaluation.
"""

import json
from pathlib import Path
import random
from typing import Any, Dict, List, Optional
from fastapi import HTTPException
from app.config import settings
from app.models import (
    FeatureDisplay,
    GuessRequest,
    GuessResponse,
    RoundResponse,
    ShapContribution,
)


class GameService:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.pool: List[Dict[str, Any]] = []
        self.pool_by_id: Dict[str, Dict[str, Any]] = {}
        self.data_dictionary: Dict[str, Any] = {}
        self.metrics: Dict[str, Any] = {}
        self.load_data()

    def load_data(self):
        pool_file = self.data_dir / "game_pool.json"
        dict_file = self.data_dir / "data_dictionary.json"
        metrics_file = self.data_dir / "metrics.json"

        if not pool_file.exists():
            raise FileNotFoundError(f"Game pool file not found at {pool_file}")
        if not dict_file.exists():
            raise FileNotFoundError(f"Data dictionary file not found at {dict_file}")
        if not metrics_file.exists():
            raise FileNotFoundError(f"Metrics file not found at {metrics_file}")

        with open(pool_file, "r", encoding="utf-8") as f:
            self.pool = json.load(f)
        self.pool_by_id = {item["id"]: item for item in self.pool}

        with open(dict_file, "r", encoding="utf-8") as f:
            self.data_dictionary = json.load(f)

        with open(metrics_file, "r", encoding="utf-8") as f:
            self.metrics = json.load(f)

        print(f"Loaded {len(self.pool)} game pool candidates.")

    def get_random_round(self) -> RoundResponse:
        """Returns a candidate object for the game. Strictly excludes ground truth and model predictions."""
        if not self.pool:
            raise HTTPException(status_code=500, detail="Game pool is empty.")

        item = random.choice(self.pool)

        # Convert feature objects into FeatureDisplay
        features_clean = {}
        for feat_key, feat_data in item["features"].items():
            features_clean[feat_key] = FeatureDisplay(
                value=feat_data["value"],
                unit=feat_data["unit"],
                display_name=feat_data["display_name"],
                short_name=feat_data.get("short_name", feat_key),
            )

        return RoundResponse(
            id=item["id"],
            display_name=item["display_name"],
            is_candidate=item.get("is_candidate", False),
            features=features_clean,
        )

    def evaluate_guess(self, req: GuessRequest) -> GuessResponse:
        """Evaluates user guess against true label and model predictions."""
        item = self.pool_by_id.get(req.id)
        if not item:
            raise HTTPException(status_code=404, detail=f"Candidate with ID '{req.id}' not found.")

        # Normalize guess
        raw_guess = req.guess.strip().upper()
        if raw_guess in ["PLANET", "CONFIRMED", "TRUE"]:
            normalized_guess = "CONFIRMED"
        elif raw_guess in ["IMPOSTOR", "FALSE POSITIVE", "FALSE_POSITIVE", "FALSE"]:
            normalized_guess = "FALSE POSITIVE"
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid guess '{req.guess}'. Must be 'Planet' / 'CONFIRMED' or 'Impostor' / 'FALSE POSITIVE'.",
            )

        is_candidate = item.get("is_candidate", False)
        true_label = item.get("true_label")
        model_pred = item["model_prediction"]
        model_prob = item["model_probability"]

        if is_candidate or true_label is None:
            user_correct = None
            model_correct = None
        else:
            user_correct = (normalized_guess == true_label)
            model_correct = (model_pred == true_label)

        # Build top SHAP contributions list
        top_shap = [
            ShapContribution(
                feature=c["feature"],
                display_name=c["display_name"],
                short_name=c.get("short_name", c["feature"]),
                value=c["value"],
                unit=c["unit"],
                direction=c["direction"],
                shap_value=c["shap_value"],
                magnitude=c["magnitude"],
                fragment=c.get("fragment", ""),
            )
            for c in item.get("top_shap_contributions", [])
        ]

        return GuessResponse(
            id=item["id"],
            display_name=item["display_name"],
            user_guess=normalized_guess,
            is_candidate=is_candidate,
            true_label=true_label,
            model_prediction=model_pred,
            model_probability=model_prob,
            user_correct=user_correct,
            model_correct=model_correct,
            top_shap_contributions=top_shap,
            explanation=item.get("explanation", ""),
        )

    def get_features_dictionary(self) -> Dict[str, Any]:
        return self.data_dictionary

    def get_model_stats(self) -> Dict[str, Any]:
        return self.metrics


# Global singleton instance
game_service = GameService(data_dir=settings.DATA_DIR)

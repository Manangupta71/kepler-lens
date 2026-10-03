"""Automated tests for KeplerLens FastAPI backend endpoints.
"""

from fastapi.testclient import TestClient
import pytest
from app.main import app
from app.service import game_service

client = TestClient(app)

REQUIRED_FEATURES = [
    "koi_period",
    "koi_duration",
    "koi_depth",
    "koi_prad",
    "koi_teq",
    "koi_insol",
    "koi_model_snr",
    "koi_impact",
    "koi_steff",
    "koi_slogg",
    "koi_srad",
]


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "kepler-lens-backend"
    assert data["pool_size"] > 0


def test_get_round_structure_and_no_leakage():
    """Verify that /api/round returns expected features and NEVER leaks labels or predictions."""
    response = client.get("/api/round")
    assert response.status_code == 200
    data = response.json()

    # Required fields
    assert "id" in data
    assert "display_name" in data
    assert "features" in data
    assert "is_candidate" in data

    # STRICT CHECK: Zero label or prediction leakage!
    leak_keys = [
        "true_label",
        "koi_disposition",
        "model_prediction",
        "model_probability",
        "shap_values",
        "top_shap_contributions",
        "explanation",
        "user_correct",
        "model_correct",
        "prediction",
        "probability",
    ]
    for key in leak_keys:
        assert key not in data, f"LEAK DETECTED: key '{key}' found in /api/round response!"

    # Verify all 11 candidate features are present with display metadata
    features = data["features"]
    for feat in REQUIRED_FEATURES:
        assert feat in features, f"Missing feature '{feat}' in /api/round"
        item = features[feat]
        assert "value" in item
        assert isinstance(item["value"], (int, float))
        assert "unit" in item
        assert "display_name" in item
        assert "short_name" in item


def test_submit_guess_confirmed_and_false_positive():
    """Test guess submission for known items."""
    # Find a confirmed item and a false positive item from the service pool
    conf_item = next(p for p in game_service.pool if p.get("true_label") == "CONFIRMED")
    fp_item = next(p for p in game_service.pool if p.get("true_label") == "FALSE POSITIVE")

    # User guesses "Planet" for Confirmed item -> should be correct
    res_conf = client.post("/api/guess", json={"id": conf_item["id"], "guess": "Planet"})
    assert res_conf.status_code == 200
    d_conf = res_conf.json()
    assert d_conf["id"] == conf_item["id"]
    assert d_conf["true_label"] == "CONFIRMED"
    assert d_conf["user_guess"] == "CONFIRMED"
    assert d_conf["user_correct"] is True
    assert d_conf["model_prediction"] in ["CONFIRMED", "FALSE POSITIVE"]
    assert "CONFIRMED" in d_conf["model_probability"]
    assert len(d_conf["top_shap_contributions"]) >= 3
    assert len(d_conf["explanation"]) > 10

    # User guesses "Planet" for False Positive item -> user_correct should be False
    res_fp = client.post("/api/guess", json={"id": fp_item["id"], "guess": "Planet"})
    assert res_fp.status_code == 200
    d_fp = res_fp.json()
    assert d_fp["id"] == fp_item["id"]
    assert d_fp["true_label"] == "FALSE POSITIVE"
    assert d_fp["user_guess"] == "CONFIRMED"
    assert d_fp["user_correct"] is False
    assert isinstance(d_fp["model_correct"], bool)

    # User guesses "Impostor" for False Positive item -> user_correct should be True
    res_fp2 = client.post("/api/guess", json={"id": fp_item["id"], "guess": "Impostor"})
    assert res_fp2.status_code == 200
    assert res_fp2.json()["user_correct"] is True


def test_submit_guess_candidate_holdout():
    """Test guess submission on unverified candidate where ground truth is null."""
    cand_item = next((p for p in game_service.pool if p.get("is_candidate") is True), None)
    if cand_item:
        res = client.post("/api/guess", json={"id": cand_item["id"], "guess": "Planet"})
        assert res.status_code == 200
        data = res.json()
        assert data["is_candidate"] is True
        assert data["true_label"] is None
        assert data["user_correct"] is None
        assert data["model_correct"] is None
        # Model still predicts and provides SHAP!
        assert data["model_prediction"] in ["CONFIRMED", "FALSE POSITIVE"]
        assert len(data["top_shap_contributions"]) >= 3
        assert len(data["explanation"]) > 0


def test_submit_guess_invalid_id():
    response = client.post("/api/guess", json={"id": "NON_EXISTENT_ID_9999", "guess": "Planet"})
    assert response.status_code == 404


def test_submit_guess_invalid_guess_text():
    first_item = game_service.pool[0]
    response = client.post("/api/guess", json={"id": first_item["id"], "guess": "InvalidString"})
    assert response.status_code == 400


def test_get_features_data_dictionary():
    response = client.get("/api/features")
    assert response.status_code == 200
    data = response.json()
    for feat in REQUIRED_FEATURES:
        assert feat in data
        assert "plain_description" in data[feat]
        assert "detection_significance" in data[feat]
        assert "unit" in data[feat]


def test_get_stats_metrics():
    response = client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["model_type"] == "CatBoostClassifier"
    assert "metrics" in data
    assert "accuracy" in data["metrics"]
    assert "roc_auc" in data["metrics"]
    assert "confusion_matrix" in data
    assert "feature_importances" in data
    assert data["metrics"]["accuracy"] > 0.85
    assert data["metrics"]["roc_auc"] > 0.90

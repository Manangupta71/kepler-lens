"""Model training and evaluation module for KeplerLens.

Trains a CatBoostClassifier on confirmed exoplanets vs false positives.
Saves model artifacts and honest test set metrics.
"""

import json
from pathlib import Path
from catboost import CatBoostClassifier
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

RANDOM_SEED = 42

FEATURE_COLUMNS = [
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


def train_model(data_dir: Path, artifacts_dir: Path):
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    labeled_csv = data_dir / "cleaned_labeled.csv"

    print(f"Loading cleaned labeled data from {labeled_csv}...")
    df = pd.read_csv(labeled_csv)

    # Encode target: CONFIRMED = 1 (Planet), FALSE POSITIVE = 0 (Impostor)
    target_col = "koi_disposition"
    y = (df[target_col] == "CONFIRMED").astype(int)
    X = df[FEATURE_COLUMNS]

    print(f"Class distribution: {y.value_counts().to_dict()} (0: FALSE POSITIVE, 1: CONFIRMED)")

    # Stratified Split: 70% Train, 15% Validation, 15% Test
    X_train_val, X_test, y_train_val, y_test, idx_train_val, idx_test = train_test_split(
        X, y, df.index, test_size=0.15, stratify=y, random_state=RANDOM_SEED
    )
    # 0.15 / 0.85 = ~0.1765 to get 15% of total for validation
    val_ratio = 0.15 / 0.85
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=val_ratio, stratify=y_train_val, random_state=RANDOM_SEED
    )

    print(f"Train size: {len(X_train)}, Val size: {len(X_val)}, Test size: {len(X_test)}")

    # Initialize CatBoostClassifier with light tuning & balanced class weights
    model = CatBoostClassifier(
        iterations=600,
        learning_rate=0.04,
        depth=6,
        loss_function="Logloss",
        eval_metric="AUC",
        auto_class_weights="Balanced",
        random_seed=RANDOM_SEED,
        verbose=100,
    )

    print("Training CatBoostClassifier...")
    model.fit(
        X_train,
        y_train,
        eval_set=(X_val, y_val),
        early_stopping_rounds=50,
        verbose=100,
    )

    # Evaluate on Test Set
    print("\nEvaluating on Test Set...")
    y_test_pred = model.predict(X_test)
    y_test_proba = model.predict_proba(X_test)[:, 1]

    acc = float(accuracy_score(y_test, y_test_pred))
    roc_auc = float(roc_auc_score(y_test, y_test_proba))
    prec_planet = float(precision_score(y_test, y_test_pred, pos_label=1))
    rec_planet = float(recall_score(y_test, y_test_pred, pos_label=1))
    f1_planet = float(f1_score(y_test, y_test_pred, pos_label=1))

    prec_impostor = float(precision_score(y_test, y_test_pred, pos_label=0))
    rec_impostor = float(recall_score(y_test, y_test_pred, pos_label=0))

    cm = confusion_matrix(y_test, y_test_pred).tolist()
    # cm format: [[TN, FP], [FN, TP]]
    # TN: Impostor predicted Impostor
    # FP: Impostor predicted Planet
    # FN: Planet predicted Impostor
    # TP: Planet predicted Planet

    feature_importances = {
        feat: float(imp)
        for feat, imp in zip(FEATURE_COLUMNS, model.get_feature_importance())
    }
    # Sort by importance descending
    feature_importances = dict(sorted(feature_importances.items(), key=lambda item: item[1], reverse=True))

    metrics = {
        "model_type": "CatBoostClassifier",
        "random_seed": RANDOM_SEED,
        "train_samples": int(len(X_train)),
        "val_samples": int(len(X_val)),
        "test_samples": int(len(X_test)),
        "metrics": {
            "accuracy": round(acc, 4),
            "roc_auc": round(roc_auc, 4),
            "f1_score": round(f1_planet, 4),
            "planet": {
                "precision": round(prec_planet, 4),
                "recall": round(rec_planet, 4),
                "f1": round(f1_planet, 4),
            },
            "impostor": {
                "precision": round(prec_impostor, 4),
                "recall": round(rec_impostor, 4),
            },
        },
        "confusion_matrix": {
            "true_negatives_impostor": cm[0][0],
            "false_positives_planet_leak": cm[0][1],
            "false_negatives_missed_planet": cm[1][0],
            "true_positives_planet": cm[1][1],
            "matrix": cm,
        },
        "feature_importances": {k: round(v, 2) for k, v in feature_importances.items()},
        "parameters": {
            "iterations": model.get_params().get("iterations"),
            "learning_rate": model.get_params().get("learning_rate"),
            "depth": model.get_params().get("depth"),
            "auto_class_weights": "Balanced",
        },
    }

    # Save metrics and model
    metrics_path = artifacts_dir / "metrics.json"
    model_path = artifacts_dir / "model.cbm"

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    model.save_model(str(model_path))

    print(f"\n--- Honest Test Evaluation ---")
    print(f"Accuracy:  {acc:.4f} ({acc*100:.1f}%)")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    print(f"Planet Precision: {prec_planet:.4f}, Recall: {rec_planet:.4f}")
    print(f"Impostor Precision: {prec_impostor:.4f}, Recall: {rec_impostor:.4f}")
    print(f"Confusion Matrix: {cm}")
    print(f"Saved metrics to {metrics_path}")
    print(f"Saved model to {model_path}")

    return model, metrics


if __name__ == "__main__":
    base_dir = Path(__file__).parent
    data_dir = base_dir / "data"
    art_dir = base_dir / "artifacts"
    train_model(data_dir, art_dir)

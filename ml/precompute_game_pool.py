"""Precomputes SHAP values and templated plain-English explanations for the game pool.

Generates game_pool.json containing balanced CONFIRMED, FALSE POSITIVE, and CANDIDATE
objects with precomputed predictions, probabilities, SHAP values, and explanations.
"""

import json
from pathlib import Path
from catboost import CatBoostClassifier
import numpy as np
import pandas as pd
import shap

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


def generate_feature_fragment(feature: str, val: float, shap_val: float, data_dict: dict) -> str:
    """Generates a plain-English clause explaining how this feature affected the classification."""
    meta = data_dict.get(feature, {})
    name = meta.get("name", feature)
    unit = meta.get("unit", "")
    unit_str = f" {unit}" if unit and unit != "dimensionless" else ""
    direction = "planet" if shap_val > 0 else "impostor"

    if feature == "koi_prad":
        if val > 20:
            return f"an enormous radius of {val:.1f}{unit_str} (consistent with a companion star, not a planet)"
        elif val <= 4.0:
            return f"a compact, terrestrial-to-Neptunian radius of {val:.2f}{unit_str}"
        else:
            return f"a planetary radius of {val:.2f}{unit_str}"

    if feature == "koi_depth":
        if val > 20000:
            return f"an extremely deep transit dip of {val:.0f}{unit_str} (>2% drop, typical of eclipsing binaries)"
        elif val < 500:
            return f"a delicate, shallow transit depth of {val:.1f}{unit_str}"
        else:
            return f"a transit depth of {val:.1f}{unit_str}"

    if feature == "koi_impact":
        if val >= 1.0:
            return f"a high impact parameter of {val:.2f} indicating a grazing transit clip"
        else:
            return f"a well-centered impact parameter of {val:.2f}"

    if feature == "koi_model_snr":
        if val >= 30:
            return f"a very strong signal-to-noise ratio of {val:.1f}"
        elif val < 10:
            return f"a marginal signal-to-noise ratio of {val:.1f} close to noise limits"
        else:
            return f"a signal-to-noise ratio of {val:.1f}"

    if feature == "koi_duration":
        return f"a transit duration of {val:.2f}{unit_str}"

    if feature == "koi_period":
        return f"an orbital period of {val:.2f}{unit_str}"

    if feature == "koi_slogg":
        if val < 4.0:
            return f"a low stellar surface gravity of {val:.2f}{unit_str} (suggesting an evolved giant star)"
        else:
            return f"a stellar surface gravity of {val:.2f}{unit_str} typical of a stable dwarf star"

    return f"a {name.lower()} of {val:.2f}{unit_str}"


def build_explanation(prediction: str, confidence: float, top_features: list) -> str:
    """Constructs a concise, 1-2 sentence plain-English explanation."""
    pred_label = "Confirmed Planet" if prediction == "CONFIRMED" else "False Positive (Impostor)"
    conf_pct = int(round(confidence * 100))

    if not top_features:
        return f"The model predicts {pred_label} with {conf_pct}% confidence based on overall signal metrics."

    # Top drivers
    f1 = top_features[0]
    f2 = top_features[1] if len(top_features) > 1 else None
    f3 = top_features[2] if len(top_features) > 2 else None

    # Check if the top features align with the prediction
    align_dir = "planet" if prediction == "CONFIRMED" else "impostor"
    same_dir_features = [f for f in [f1, f2, f3] if f and f["direction"] == align_dir]
    opp_dir_features = [f for f in [f1, f2, f3] if f and f["direction"] != align_dir]

    clauses = [f["fragment"] for f in same_dir_features]

    if len(clauses) >= 2:
        drivers_text = f"driven primarily by {clauses[0]} and {clauses[1]}"
    elif len(clauses) == 1:
        drivers_text = f"driven primarily by {clauses[0]}"
    else:
        drivers_text = f"based on combined astrophysical signals"

    first_sentence = f"The model classifies this candidate as a **{pred_label}** with **{conf_pct}% confidence**, {drivers_text}."

    if opp_dir_features:
        opp = opp_dir_features[0]
        second_sentence = f" Notably, {opp['fragment']} pushed slightly toward the opposite classification."
        return first_sentence + second_sentence
    elif len(same_dir_features) >= 3:
        third = same_dir_features[2]
        second_sentence = f" Its {third['fragment']} further reinforces this diagnosis."
        return first_sentence + second_sentence
    else:
        return first_sentence


def precompute_pool(data_dir: Path, artifacts_dir: Path, pool_size_per_class: int = 350):
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    # Load model and data dictionary
    model_path = artifacts_dir / "model.cbm"
    dict_path = artifacts_dir / "data_dictionary.json"

    print(f"Loading model from {model_path}...")
    model = CatBoostClassifier()
    model.load_model(str(model_path))

    with open(dict_path, "r", encoding="utf-8") as f:
        data_dict = json.load(f)

    # Initialize SHAP explainer
    print("Initializing shap.TreeExplainer...")
    explainer = shap.TreeExplainer(model)
    ev = np.atleast_1d(explainer.expected_value)
    base_val = float(ev[0])

    # Load datasets
    df_labeled = pd.read_csv(data_dir / "cleaned_labeled.csv")
    df_candidates = pd.read_csv(data_dir / "cleaned_candidates.csv")

    # Sample balanced pools
    np.random.seed(42)

    df_conf = df_labeled[df_labeled["koi_disposition"] == "CONFIRMED"]
    df_fp = df_labeled[df_labeled["koi_disposition"] == "FALSE POSITIVE"]

    sample_conf = df_conf.sample(n=min(len(df_conf), pool_size_per_class), random_state=42)
    sample_fp = df_fp.sample(n=min(len(df_fp), pool_size_per_class), random_state=42)
    sample_cand = df_candidates.sample(n=min(len(df_candidates), pool_size_per_class // 2), random_state=42)

    combined_df = pd.concat([sample_conf, sample_fp, sample_cand], ignore_index=True)
    # Shuffle pool
    combined_df = combined_df.sample(frac=1.0, random_state=42).reset_index(drop=True)

    print(f"Total pool size: {len(combined_df)} "
          f"({len(sample_conf)} CONFIRMED, {len(sample_fp)} FALSE POSITIVE, {len(sample_cand)} CANDIDATE)")

    X_pool = combined_df[FEATURE_COLUMNS]
    print("Computing SHAP values for entire game pool...")
    shap_matrix = explainer.shap_values(X_pool)
    probs = model.predict_proba(X_pool)
    preds = model.predict(X_pool)

    pool_records = []

    for i, row in combined_df.iterrows():
        disposition = row["koi_disposition"]
        is_candidate = (disposition == "CANDIDATE")
        true_label = None if is_candidate else disposition

        p_planet = float(probs[i, 1])
        p_impostor = float(probs[i, 0])
        pred_label = "CONFIRMED" if p_planet >= 0.5 else "FALSE POSITIVE"
        confidence = p_planet if pred_label == "CONFIRMED" else p_impostor

        # Candidate names
        kepid = int(row["kepid"])
        kepoi_name = str(row["kepoi_name"]).strip()
        kepler_name = str(row["kepler_name"]).strip() if pd.notnull(row["kepler_name"]) else None

        if kepler_name and kepler_name != "nan" and kepler_name != "":
            display_name = f"{kepler_name} ({kepoi_name})"
        else:
            display_name = kepoi_name

        # Per-feature data & SHAP
        row_features = {}
        row_shap = {}
        contributions = []

        for j, feat in enumerate(FEATURE_COLUMNS):
            val = float(row[feat])
            sv = float(shap_matrix[i, j])
            meta = data_dict.get(feat, {})
            direction = "planet" if sv > 0 else "impostor"
            fragment = generate_feature_fragment(feat, val, sv, data_dict)

            row_features[feat] = {
                "value": round(val, 4),
                "unit": meta.get("unit", ""),
                "display_name": meta.get("name", feat),
                "short_name": meta.get("short_name", feat),
            }
            row_shap[feat] = round(sv, 4)

            contributions.append({
                "feature": feat,
                "display_name": meta.get("name", feat),
                "short_name": meta.get("short_name", feat),
                "value": round(val, 4),
                "unit": meta.get("unit", ""),
                "direction": direction,
                "shap_value": round(sv, 4),
                "magnitude": round(abs(sv), 4),
                "fragment": fragment,
            })

        # Sort contributions by absolute magnitude descending
        contributions.sort(key=lambda x: x["magnitude"], reverse=True)
        explanation = build_explanation(pred_label, confidence, contributions[:3])

        record = {
            "id": kepoi_name,
            "kepid": kepid,
            "kepoi_name": kepoi_name,
            "kepler_name": kepler_name,
            "display_name": display_name,
            "is_candidate": is_candidate,
            "true_label": true_label,
            "features": row_features,
            "model_prediction": pred_label,
            "model_probability": {
                "CONFIRMED": round(p_planet, 4),
                "FALSE POSITIVE": round(p_impostor, 4),
            },
            "shap_values": row_shap,
            "base_value": round(base_val, 4),
            "top_shap_contributions": contributions,
            "explanation": explanation,
        }
        pool_records.append(record)

    pool_path = artifacts_dir / "game_pool.json"
    with open(pool_path, "w", encoding="utf-8") as f:
        json.dump(pool_records, f, indent=2)

    print(f"Successfully saved {len(pool_records)} precomputed records to {pool_path}")
    print(f"File size: {pool_path.stat().st_size / (1024 * 1024):.2f} MB")
    return pool_records


if __name__ == "__main__":
    base_dir = Path(__file__).parent
    data_dir = base_dir / "data"
    art_dir = base_dir / "artifacts"
    precompute_pool(data_dir, art_dir, pool_size_per_class=350)

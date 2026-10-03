"""Data cleaning and data dictionary generation for KeplerLens.

Filters NASA cumulative KOI table into labeled training set and candidate holdout.
Strictly excludes koi_fpflag_* and koi_score to prevent label leakage.
"""

import json
from pathlib import Path
import pandas as pd

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

ID_COLUMNS = ["kepid", "kepoi_name", "kepler_name", "koi_disposition"]

DATA_DICTIONARY = {
    "koi_period": {
        "name": "Orbital Period",
        "short_name": "Period",
        "unit": "days",
        "plain_description": "The time it takes the candidate to complete one full orbit around its host star.",
        "detection_significance": "Ultra-short periods (< 1 day) or extreme values can indicate contact binary stars or tidal synchronization. Genuine habitable zone planets typically have longer periods.",
        "typical_range": "0.5 – 500 days",
        "planet_tendency": "Moderate to long periods are typical for multi-planet systems; extreme ultra-short periods often require high scrutiny."
    },
    "koi_duration": {
        "name": "Transit Duration",
        "short_name": "Duration",
        "unit": "hours",
        "plain_description": "How long the star's light is partially blocked during the transit.",
        "detection_significance": "Transit duration is tied directly to orbital velocity and stellar density via Kepler's laws. Grazing eclipsing binaries often produce abnormally brief, V-shaped transit dips.",
        "typical_range": "1.0 – 15.0 hours",
        "planet_tendency": "Consistent, central-transit durations aligned with circular orbits favor planet status."
    },
    "koi_depth": {
        "name": "Transit Depth",
        "short_name": "Depth",
        "unit": "ppm",
        "plain_description": "The fraction of starlight blocked by the object, measured in parts per million (1% = 10,000 ppm).",
        "detection_significance": "Earth blocks ~84 ppm; Jupiter blocks ~10,000 ppm (1%). Dips greater than 20,000-30,000 ppm (2-3%) usually indicate a stellar companion (eclipsing binary), not a planet.",
        "typical_range": "50 – 25,000 ppm",
        "planet_tendency": "Shallow to moderate depths (< 10,000 ppm) strongly favor exoplanets. Extremely deep dips (> 20,000 ppm) signal impostors."
    },
    "koi_prad": {
        "name": "Planetary Radius",
        "short_name": "Radius",
        "unit": "Earth radii (R⊕)",
        "plain_description": "The inferred size of the object relative to Earth (Earth = 1.0 R⊕, Neptune = ~3.9 R⊕, Jupiter = ~11.2 R⊕).",
        "detection_significance": "Objects larger than ~20 to 30 Earth radii are astrophysically too large to be planets—they are almost certainly low-mass stars or brown dwarfs.",
        "typical_range": "0.5 – 30.0 R⊕",
        "planet_tendency": "Sizes between 0.5 and 15 R⊕ strongly favor exoplanets. Values > 25 R⊕ are almost always false positives."
    },
    "koi_teq": {
        "name": "Equilibrium Temperature",
        "short_name": "Eq. Temp",
        "unit": "Kelvin (K)",
        "plain_description": "Estimated atmospheric temperature of the planet assuming uniform heat distribution (Earth is ~255 K without greenhouse effect).",
        "detection_significance": "Helps distinguish hot Jupiters from temperate worlds. Outlier temperatures point to extreme proximity or stellar radiation.",
        "typical_range": "200 – 2,500 K",
        "planet_tendency": "Physical planetary atmospheres generally peak below 3,000 K."
    },
    "koi_insol": {
        "name": "Insolation Flux",
        "short_name": "Insolation",
        "unit": "Earth flux (S⊕)",
        "plain_description": "The amount of stellar radiation hitting the planet compared to Earth (Earth = 1.0 S⊕).",
        "detection_significance": "Measures irradiance. Extremely high insolation (> 10,000 S⊕) indicates an object grazing the stellar surface.",
        "typical_range": "0.1 – 5,000 S⊕",
        "planet_tendency": "Earth-like to Jupiter-like fluxes favor normal exoplanetary environments."
    },
    "koi_model_snr": {
        "name": "Signal-to-Noise Ratio",
        "short_name": "SNR",
        "unit": "dimensionless",
        "plain_description": "The strength of the transit signal compared to background detector and stellar noise.",
        "detection_significance": "Low SNR (< 7.1) candidates are frequently spurious noise spikes or statistical fluctuations. High SNR indicates a clear, reliable transit signal.",
        "typical_range": "7.0 – 500+",
        "planet_tendency": "Solid SNR (> 15-20) indicates real astrophysical signals, though high SNR can also be caused by bright eclipsing binaries."
    },
    "koi_impact": {
        "name": "Impact Parameter (b)",
        "short_name": "Impact (b)",
        "unit": "stellar radii",
        "plain_description": "The projected distance from the center of the stellar disk to the transit chord (0.0 = dead center, 1.0 = edge of star).",
        "detection_significance": "Values > 1.0 indicate a grazing transit where only a fraction of the transiting body clips the stellar disk. Grazing eclipsing binaries mimic planetary dips.",
        "typical_range": "0.0 – 1.5",
        "planet_tendency": "Values between 0.0 and 0.85 are typical for central planetary transits. Values >= 1.0 strongly correlate with false positives."
    },
    "koi_steff": {
        "name": "Stellar Effective Temperature",
        "short_name": "Star Temp",
        "unit": "Kelvin (K)",
        "plain_description": "The surface temperature of the host star (our Sun is ~5,778 K; red dwarfs are ~3,000-4,000 K).",
        "detection_significance": "Characterizes the stellar host type (M, K, G, F, A dwarf). Proper host parameters are critical to derive accurate planetary properties.",
        "typical_range": "3,000 – 7,500 K",
        "planet_tendency": "Normal main-sequence stars (4,000 - 6,500 K) host the majority of confirmed Kepler worlds."
    },
    "koi_slogg": {
        "name": "Stellar Surface Gravity (log g)",
        "short_name": "Star log(g)",
        "unit": "log10(cm/s²)",
        "plain_description": "The gravitational acceleration at the star's surface on a logarithmic scale (Sun = 4.44).",
        "detection_significance": "Main-sequence dwarf stars have log g around 4.0 to 4.6. Lower values (< 3.8) indicate giant or subgiant stars, which rarely show clean planetary transits.",
        "typical_range": "3.5 – 4.8",
        "planet_tendency": "Values >= 4.1 indicate stable dwarf stars with well-understood planetary transit geometry."
    },
    "koi_srad": {
        "name": "Stellar Radius",
        "short_name": "Star Radius",
        "unit": "Solar radii (R⊙)",
        "plain_description": "The radius of the host star compared to our Sun (Sun = 1.0 R⊙).",
        "detection_significance": "Because transit depth measures (R_planet / R_star)², if the star is actually a giant star (e.g. 10 R⊙), what looked like an Earth-sized planet is actually a Jupiter or a star.",
        "typical_range": "0.5 – 3.0 R⊙",
        "planet_tendency": "Compact dwarf stars (0.7 – 1.4 R⊙) yield the cleanest, highest-confidence planet confirmations."
    },
}


def clean_data(raw_csv_path: Path, output_dir: Path, artifacts_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    print(f"Reading raw data from {raw_csv_path}...")
    df = pd.read_csv(raw_csv_path)

    # Filter to only relevant columns
    cols = ID_COLUMNS + FEATURE_COLUMNS
    df = df[cols].copy()

    # Normalize disposition string
    df["koi_disposition"] = df["koi_disposition"].astype(str).str.strip().str.upper()

    # Drop rows missing crucial feature values
    complete_mask = df[FEATURE_COLUMNS].notnull().all(axis=1)
    df_clean = df[complete_mask].copy()

    # Labeled set: CONFIRMED and FALSE POSITIVE
    labeled_mask = df_clean["koi_disposition"].isin(["CONFIRMED", "FALSE POSITIVE"])
    df_labeled = df_clean[labeled_mask].copy()

    # Candidate holdout set
    candidate_mask = df_clean["koi_disposition"] == "CANDIDATE"
    df_candidates = df_clean[candidate_mask].copy()

    print(f"Total raw rows: {len(df)}")
    print(f"Clean labeled rows: {len(df_labeled)} "
          f"({(df_labeled['koi_disposition'] == 'CONFIRMED').sum()} CONFIRMED, "
          f"{(df_labeled['koi_disposition'] == 'FALSE POSITIVE').sum()} FALSE POSITIVE)")
    print(f"Clean candidate holdout rows: {len(df_candidates)}")

    # Save cleaned files
    labeled_path = output_dir / "cleaned_labeled.csv"
    candidates_path = output_dir / "cleaned_candidates.csv"
    dict_path = artifacts_dir / "data_dictionary.json"

    df_labeled.to_csv(labeled_path, index=False)
    df_candidates.to_csv(candidates_path, index=False)

    with open(dict_path, "w", encoding="utf-8") as f:
        json.dump(DATA_DICTIONARY, f, indent=2)

    print(f"Saved cleaned labeled data to {labeled_path}")
    print(f"Saved cleaned candidates data to {candidates_path}")
    print(f"Saved data dictionary to {dict_path}")


if __name__ == "__main__":
    base_dir = Path(__file__).parent
    raw_path = base_dir / "data" / "raw_cumulative.csv"
    out_dir = base_dir / "data"
    art_dir = base_dir / "artifacts"
    clean_data(raw_path, out_dir, art_dir)

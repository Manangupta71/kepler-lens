"""Data fetching module for KeplerLens.

Fetches Kepler Objects of Interest (KOI) cumulative table from NASA Exoplanet
Archive TAP API.
"""

import os
from pathlib import Path
import sys
import urllib.parse
import requests

TAP_BASE_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
COLUMNS = [
    "kepid",
    "kepoi_name",
    "kepler_name",
    "koi_disposition",
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


def fetch_cumulative_data(output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    query = f"select {','.join(COLUMNS)} from cumulative"
    params = {"query": query, "format": "csv"}

    print(f"Connecting to NASA Exoplanet Archive TAP API...")
    print(f"Query: {query}")

    response = requests.get(TAP_BASE_URL, params=params, timeout=60)
    response.raise_for_status()

    output_path.write_text(response.text, encoding="utf-8")
    lines = response.text.strip().splitlines()
    print(f"Successfully downloaded {len(lines) - 1} records to {output_path}")
    return output_path


if __name__ == "__main__":
    data_dir = Path(__file__).parent / "data"
    raw_file = data_dir / "raw_cumulative.csv"
    fetch_cumulative_data(raw_file)

"""Main entry point for KeplerLens FastAPI backend.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.models import (
    GuessRequest,
    GuessResponse,
    ModelStatsResponse,
    RoundResponse,
)
from app.service import game_service

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Educational API for the KeplerLens 'Planet or Impostor?' game with CatBoost & SHAP.",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "service": "kepler-lens-backend",
        "version": settings.VERSION,
        "pool_size": len(game_service.pool),
    }


@app.get("/api/round", response_model=RoundResponse, tags=["Game"])
def get_round():
    """Fetches a random candidate object for the user to evaluate.

    Strictly guarantees that no labels, ground truth dispositions, or model
    predictions are included in this response.
    """
    return game_service.get_random_round()


@app.post("/api/guess", response_model=GuessResponse, tags=["Game"])
def submit_guess(payload: GuessRequest):
    """Submits the user's guess for a candidate.

    Returns the true disposition (if confirmed or false positive), the trained
    CatBoost model's prediction and probability, the top SHAP feature
    contributions, and plain-English templated explanations.
    """
    return game_service.evaluate_guess(payload)


@app.get("/api/features", tags=["Metadata"])
def get_features():
    """Returns the plain-language data dictionary for all measured properties.

    Used by the frontend to render interactive tooltips explaining astrophysics
    concepts and detection significance.
    """
    return game_service.get_features_dictionary()


@app.get("/api/stats", response_model=ModelStatsResponse, tags=["Metadata"])
def get_stats():
    """Returns the honest, held-out test evaluation metrics of the CatBoost model.

    Includes test accuracy, ROC-AUC, precision, recall, confusion matrix, and
    feature importances.
    """
    return game_service.get_model_stats()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)

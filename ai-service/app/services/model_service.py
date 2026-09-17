import logging
from typing import List, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
from app.config import settings

logger = logging.getLogger("ai-service.model")

class ModelService:
    _instance: Optional["ModelService"] = None
    _model: Optional[SentenceTransformer] = None

    @classmethod
    def get_instance(cls) -> "ModelService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def load_model(self) -> None:
        if self._model is None:
            logger.info(f"Loading SentenceTransformer model: {settings.AI_MODEL_NAME}...")
            self._model = SentenceTransformer(settings.AI_MODEL_NAME)
            logger.info("SentenceTransformer model loaded successfully.")

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def encode(self, texts: List[str]) -> np.ndarray:
        if not self._model:
            self.load_model()
        # normalize_embeddings=True ensures dot product equals cosine similarity
        return self._model.encode(texts, normalize_embeddings=True, show_progress_bar=False)

    def encode_single(self, text: str) -> np.ndarray:
        embeddings = self.encode([text])
        return embeddings[0]

model_service = ModelService.get_instance()

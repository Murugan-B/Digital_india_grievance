import logging
import os
from typing import List, Optional
import numpy as np
import torch
from sentence_transformers import SentenceTransformer
from app.config import settings

logger = logging.getLogger("ai-service.model")

# ---------------------------------------------------------------------------
# CPU-only / memory-efficiency enforcement
# ---------------------------------------------------------------------------
# Force PyTorch to use CPU only — prevents accidental GPU allocation even if
# a CUDA-capable torch wheel is mistakenly installed.
torch.set_num_threads(int(os.getenv("OMP_NUM_THREADS", "2")))
torch.set_num_interop_threads(int(os.getenv("OMP_NUM_THREADS", "2")))

# Disable gradient computation globally for this inference-only service.
# This prevents PyTorch from building computation graphs, which saves
# meaningful RAM on every forward pass.
torch.set_grad_enabled(False)


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
            logger.info(f"Loading SentenceTransformer model: {settings.AI_MODEL_NAME} on CPU...")
            # device='cpu' — explicit, never relies on torch default device detection
            self._model = SentenceTransformer(settings.AI_MODEL_NAME, device="cpu")
            # Switch to eval mode — disables dropout, batch norm running stats updates.
            # Required to make torch.no_grad() + inference fully deterministic and lean.
            self._model.eval()
            logger.info("SentenceTransformer model loaded successfully (CPU, eval mode).")

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def encode(self, texts: List[str]) -> np.ndarray:
        if not self._model:
            self.load_model()
        # torch.no_grad() — ensures no gradient tensors are allocated during encoding.
        # This is the primary RAM saving for inference-only workloads.
        # normalize_embeddings=True preserved — required for cosine similarity via dot product.
        with torch.no_grad():
            return self._model.encode(
                texts,
                normalize_embeddings=True,
                show_progress_bar=False,
                convert_to_numpy=True,
            )

    def encode_single(self, text: str) -> np.ndarray:
        embeddings = self.encode([text])
        return embeddings[0]


model_service = ModelService.get_instance()

import logging
import hashlib as _hashlib
import re
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from supabase import create_client, Client
from app.config import settings
from app.services.model_service import model_service
from app.services.department_profiles import DEPARTMENT_PROFILES, build_department_semantic_document
from app.schemas import TopPrediction, RoutingResponse

logger = logging.getLogger("ai-service.department")

class DepartmentService:
    _instance: Optional["DepartmentService"] = None
    
    def __init__(self):
        self._supabase: Optional[Client] = None
        self._departments: List[Dict[str, Any]] = []
        self._department_embeddings: Optional[np.ndarray] = None
        self._department_keywords: Dict[str, List[str]] = {}

    @classmethod
    def get_instance(cls) -> "DepartmentService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _get_supabase_client(self) -> Client:
        if self._supabase is None:
            if not settings.SUPABASE_URL or not settings.SUPABASE_SECRET_KEY:
                raise ValueError("SUPABASE_URL or SUPABASE_SECRET_KEY is not configured in AI Service.")
            self._supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)

            # ----------------------------------------------------------
            # TEMPORARY DIAGNOSTIC-3 — SDK state immediately after create_client()
            # ----------------------------------------------------------
            try:
                import supabase as _sb, postgrest as _pg, supabase_auth as _sa
                logger.info("[DIAGNOSTIC-3] supabase_version=%s", _sb.__version__)
                logger.info("[DIAGNOSTIC-3] postgrest_version=%s", _pg.__version__)
                logger.info("[DIAGNOSTIC-3] supabase_auth_version=%s", _sa.__version__)
            except Exception as _ve:
                logger.warning("[DIAGNOSTIC-3] version_check_failed=%s", _ve)

            _stored_key = self._supabase.supabase_key or ""
            logger.info("[DIAGNOSTIC-3] supabase_key_length=%d", len(_stored_key))
            logger.info("[DIAGNOSTIC-3] supabase_key_sha256=%s",
                        _hashlib.sha256(_stored_key.encode()).hexdigest())

            # PostgREST headers — force-access the postgrest property to
            # trigger lazy initialisation so we can read its headers NOW.
            _pg_headers = dict(self._supabase.postgrest.headers)
            for _hk in ["apikey", "apiKey", "Authorization", "authorization"]:
                _hv = _pg_headers.get(_hk, _pg_headers.get(_hk.lower(), None))
                if _hv is not None:
                    _token = _hv.replace("Bearer ", "") if _hv.startswith("Bearer ") else _hv
                    logger.info("[DIAGNOSTIC-3] postgrest_header_%s_length=%d sha256=%s",
                                _hk, len(_token),
                                _hashlib.sha256(_token.encode()).hexdigest())
            # ----------------------------------------------------------
            # END DIAGNOSTIC-3
            # ----------------------------------------------------------

        return self._supabase

    def load_departments(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """
        Fetches active departments from Supabase and pre-computes their rich semantic embeddings cache.
        """
        if self._departments and not force_refresh:
            return self._departments

        client = self._get_supabase_client()

        # ----------------------------------------------------------
        # TEMPORARY DIAGNOSTIC-4 — PostgREST headers immediately before .execute()
        # Detects whether _listen_to_auth_events mutated headers after create_client()
        # ----------------------------------------------------------
        _pg_hdrs_before = dict(client.postgrest.headers)
        for _hk in ["apikey", "apiKey", "Authorization", "authorization"]:
            _hv = _pg_hdrs_before.get(_hk, _pg_hdrs_before.get(_hk.lower(), None))
            if _hv is not None:
                _token = _hv.replace("Bearer ", "") if _hv.startswith("Bearer ") else _hv
                logger.info("[DIAGNOSTIC-4-BEFORE] header_%s_length=%d sha256=%s",
                            _hk, len(_token),
                            _hashlib.sha256(_token.encode()).hexdigest())
        # ----------------------------------------------------------

        try:
            res = client.from_("departments").select("id, name, code, description").eq("is_active", True).execute()
        except Exception as _exec_exc:
            # Log headers AFTER a failure too — the exception message IS the API error
            _pg_hdrs_after = dict(client.postgrest.headers)
            for _hk in ["apikey", "apiKey", "Authorization", "authorization"]:
                _hv = _pg_hdrs_after.get(_hk, _pg_hdrs_after.get(_hk.lower(), None))
                if _hv is not None:
                    _token = _hv.replace("Bearer ", "") if _hv.startswith("Bearer ") else _hv
                    logger.info("[DIAGNOSTIC-4-AFTER-EXC] header_%s_length=%d sha256=%s",
                                _hk, len(_token),
                                _hashlib.sha256(_token.encode()).hexdigest())
            logger.error("[DIAGNOSTIC-4] execute() raised: %s: %s",
                         type(_exec_exc).__name__, str(_exec_exc))
            raise

        # ----------------------------------------------------------
        # TEMPORARY DIAGNOSTIC-4 — headers after successful .execute()
        _pg_hdrs_after = dict(client.postgrest.headers)
        for _hk in ["apikey", "apiKey", "Authorization", "authorization"]:
            _hv = _pg_hdrs_after.get(_hk, _pg_hdrs_after.get(_hk.lower(), None))
            if _hv is not None:
                _token = _hv.replace("Bearer ", "") if _hv.startswith("Bearer ") else _hv
                logger.info("[DIAGNOSTIC-4-AFTER] header_%s_length=%d sha256=%s",
                            _hk, len(_token),
                            _hashlib.sha256(_token.encode()).hexdigest())
        # ----------------------------------------------------------
        
        if not res.data or len(res.data) == 0:
            logger.error("No active departments found in public.departments table!")
            raise ValueError("No active departments available in database for semantic routing.")

        self._departments = res.data
        logger.info(f"Loaded {len(self._departments)} active departments from Supabase.")

        # Build rich semantic documents for each department from knowledge profiles
        corpus_texts = []
        self._department_keywords = {}

        for dept in self._departments:
            name = dept.get("name", "").strip()
            profile = DEPARTMENT_PROFILES.get(name)

            if profile:
                semantic_doc = build_department_semantic_document(profile)
                self._department_keywords[name] = [kw.lower() for kw in profile.get("keywords", [])]
            else:
                # Fallback if department name has no custom profile
                desc = dept.get("description", "") or ""
                semantic_doc = f"Department: {name}. Responsibilities: {desc}"
                self._department_keywords[name] = [name.lower()]

            corpus_texts.append(semantic_doc)

        self._department_embeddings = model_service.encode(corpus_texts)
        logger.info("Generated rich department semantic embeddings cache.")
        return self._departments

    @property
    def departments_count(self) -> int:
        return len(self._departments)

    def _calculate_contextual_keyword_score(self, dept_name: str, text: str) -> float:
        """
        Calculates a contextual term relevance score [0.0, 1.0] based on domain vocabulary matches.
        """
        keywords = self._department_keywords.get(dept_name, [])
        if not keywords:
            return 0.0

        text_lower = text.lower()
        matched_weight = 0.0

        for kw in keywords:
            # Check for word boundary or phrase match
            pattern = r'\b' + re.escape(kw) + r'\b'
            if re.search(pattern, text_lower):
                # Multi-word phrase matches carry slightly higher significance
                weight = 1.5 if " " in kw else 1.0
                matched_weight += weight

        # Bounded between 0.0 and 1.0 (saturates around 3 solid keywords)
        return min(1.0, matched_weight / 3.0)

    def _calculate_category_signal(self, dept_name: str, category: Optional[str]) -> float:
        """
        Evaluates citizen-selected category relevance signal [0.0, 1.0].
        """
        if not category or not category.strip():
            return 0.0

        cat_clean = category.strip().lower()
        dept_clean = dept_name.strip().lower()

        if cat_clean == dept_clean:
            return 1.0

        # Partial matching (e.g., "Roads" -> "Roads & Transport", "Transport" -> "Roads & Transport")
        if cat_clean in dept_clean or dept_clean in cat_clean:
            return 0.85

        # Code match or aliases
        profile = DEPARTMENT_PROFILES.get(dept_name)
        if profile:
            code = profile.get("code", "").lower()
            if cat_clean == code:
                return 1.0

        return 0.0

    def route_grievance(
        self,
        subject: str,
        description: str,
        category: Optional[str] = None,
        location: Optional[str] = None,
        preferred_language: Optional[str] = None
    ) -> RoutingResponse:
        """
        Semantically classifies a grievance using rich knowledge embeddings,
        contextual domain matching, and calibrated hybrid scoring.
        """
        if not self._departments or self._department_embeddings is None:
            self.load_departments()

        # Construct enriched grievance text representation
        clean_subj = subject.strip()
        clean_desc = description.strip()
        clean_cat = category.strip() if category else ""

        if clean_cat:
            grievance_semantic_text = f"Category: {clean_cat}. Subject: {clean_subj}. Description: {clean_desc}"
        else:
            grievance_semantic_text = f"Subject: {clean_subj}. Description: {clean_desc}"

        raw_combined_text = f"{clean_subj} {clean_desc} {clean_cat}"

        # 1. Semantic Embedding & Cosine Similarity
        grievance_embedding = model_service.encode_single(grievance_semantic_text)
        raw_similarities = np.dot(self._department_embeddings, grievance_embedding)

        # 2. Hybrid Scoring for each department
        scored_candidates: List[Tuple[Dict[str, Any], float, float]] = []

        for idx, dept in enumerate(self._departments):
            dept_name = dept["name"]
            raw_semantic = float(raw_similarities[idx])
            semantic_score = max(0.0, min(1.0, round(raw_semantic, 4)))

            keyword_score = self._calculate_contextual_keyword_score(dept_name, raw_combined_text)
            category_score = self._calculate_category_signal(dept_name, category)

            # Controlled hybrid formulation:
            # Semantic embedding is the primary anchor (85%).
            # Domain keyword context provides 10% refinement.
            # Explicit category provides 5% reinforcement.
            if semantic_score >= 0.40:
                hybrid_score = (
                    0.85 * semantic_score +
                    0.10 * keyword_score +
                    0.05 * category_score
                )
            else:
                # For out-of-domain or very low semantic similarity, suppress keyword boosts
                # to prevent false confidence on random keyword occurrences
                hybrid_score = semantic_score

            routing_score = max(0.0, min(1.0, round(hybrid_score, 4)))
            scored_candidates.append((dept, semantic_score, routing_score))

        # 3. Sort candidates by final routing score descending
        scored_candidates.sort(key=lambda item: item[2], reverse=True)

        top_k = min(settings.TOP_K, len(scored_candidates))
        top_predictions: List[TopPrediction] = []

        for rank in range(top_k):
            dept, sem_score, rout_score = scored_candidates[rank]
            top_predictions.append(
                TopPrediction(
                    department=dept["name"],
                    code=dept.get("code", ""),
                    score=rout_score,
                    semantic_score=sem_score,
                    routing_score=rout_score
                )
            )

        top_1 = top_predictions[0]
        top_2 = top_predictions[1] if len(top_predictions) > 1 else None

        score_margin = round(top_1.routing_score - (top_2.routing_score if top_2 else 0.0), 4)

        # 4. Ambiguity and Confidence Threshold Evaluation
        # A ticket is auto-completed only if it exceeds confidence threshold AND margin threshold
        if (
            top_1.routing_score >= settings.AI_CONFIDENCE_THRESHOLD and
            score_margin >= settings.AI_MARGIN_THRESHOLD
        ):
            routing_status = "completed"
        else:
            routing_status = "flagged_for_review"

        return RoutingResponse(
            predicted_department=top_1.department,
            confidence_score=top_1.routing_score,
            semantic_score=top_1.semantic_score,
            routing_score=top_1.routing_score,
            routing_status=routing_status,
            top_predictions=top_predictions,
            model_name=settings.AI_MODEL_NAME,
            model_version=settings.AI_MODEL_VERSION
        )

department_service = DepartmentService.get_instance()

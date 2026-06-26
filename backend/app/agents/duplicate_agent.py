import json
from datetime import datetime, timedelta

from .base_agent import BaseAgent


class DuplicateAgent(BaseAgent):
    """
    Agent 3 — Find semantically similar existing complaints to detect duplicates.
    Queries DB for same-city, same-category complaints in the last 90 days,
    then asks Gemini to compare descriptions and estimate similarity.
    """

    def run(self, complaint) -> dict:
        from app.models.complaint import Complaint

        ninety_days_ago = datetime.utcnow() - timedelta(days=90)

        candidates = (
            Complaint.query
            .filter(
                Complaint.category == complaint.category,
                Complaint.city == complaint.city,
                Complaint.created_at >= ninety_days_ago,
                Complaint.id != complaint.id,
                Complaint.duplicate_of_id == None,
            )
            .order_by(Complaint.created_at.desc())
            .limit(20)
            .all()
        )

        if not candidates:
            return {
                'is_duplicate': False,
                'duplicate_of_id': None,
                'similarity_score': 0,
                'reason': 'No existing complaints found in the same area and category.',
            }

        existing_json = json.dumps([
            {
                'id': c.id,
                'title': c.title,
                'description': (c.ai_summary or c.description)[:200],
                'lat': c.latitude,
                'lng': c.longitude,
            }
            for c in candidates
        ], indent=2)

        prompt = f"""You are a duplicate detection agent for a civic complaint system.

New complaint:
Title: {complaint.title}
Description: {complaint.description}
Category: {complaint.category}
Location: lat={complaint.latitude}, lng={complaint.longitude}

Existing complaints in the same area (last 90 days):
{existing_json}

Identify if any existing complaint is likely the same issue.
Consider: same location (within 500m), same category, similar description.

Respond ONLY with valid JSON (no markdown):
{{
  "is_duplicate": <true or false>,
  "duplicate_of_id": <complaint id integer or null>,
  "similarity_score": <0-100>,
  "reason": "<brief explanation>"
}}"""

        try:
            raw = self._call_gemini(prompt)
            result = self._parse_json(raw)
        except Exception:
            result = {
                'is_duplicate': False,
                'duplicate_of_id': None,
                'similarity_score': 0,
                'reason': 'Duplicate detection unavailable (API error).',
            }

        result.setdefault('is_duplicate', False)
        result.setdefault('duplicate_of_id', None)
        result.setdefault('similarity_score', 0)
        result.setdefault('reason', '')

        # Safety: ensure duplicate_of_id is an int or None
        dup_id = result.get('duplicate_of_id')
        if dup_id is not None:
            try:
                result['duplicate_of_id'] = int(dup_id)
            except (TypeError, ValueError):
                result['duplicate_of_id'] = None
                result['is_duplicate'] = False

        return result

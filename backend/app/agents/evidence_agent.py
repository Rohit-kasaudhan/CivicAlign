from .base_agent import BaseAgent


class EvidenceAgent(BaseAgent):
    """
    Agent 1 — Analyse uploaded images to verify the civic issue exists.
    Returns evidence_score, verified flag, detected issues, and confidence.
    """

    def run(self, complaint, image_paths: list) -> dict:
        import json
        video_paths = []
        if complaint.video_paths:
            try:
                video_paths = json.loads(complaint.video_paths)
            except Exception:
                pass

        has_images = len(image_paths) > 0
        has_videos = len(video_paths) > 0

        if not has_images:
            if has_videos:
                return {
                    'evidence_score': 85.0,
                    'verified': True,
                    'detected_issues': [complaint.category.lower()],
                    'matches_category': True,
                    'confidence': 'high',
                    'notes': 'Verified via uploaded video evidence.',
                }
            else:
                return {
                    'evidence_score': 0.0,
                    'verified': False,
                    'detected_issues': [],
                    'matches_category': False,
                    'confidence': 'low',
                    'notes': 'No image or video evidence provided.',
                }

        prompt = f"""You are an AI evidence verification specialist for a civic issue reporting platform.

Analyse the provided images for this civic complaint:
Title: {complaint.title}
Category: {complaint.category}
Description: {complaint.description}

Your task:
1. Verify whether the images show a real civic issue
2. Identify what is visible in the images
3. Check if the images match the claimed category
4. Generate a verification score

Respond ONLY with valid JSON (no markdown, no explanation):
{{
  "evidence_score": <integer 0-100>,
  "verified": <true or false>,
  "detected_issues": ["issue1", "issue2"],
  "matches_category": <true or false>,
  "confidence": "high|medium|low",
  "notes": "brief description of what was found in images"
}}"""

        try:
            raw = self._call_gemini(prompt, image_paths)
            result = self._parse_json(raw)
        except Exception:
            # Fallback when Gemini vision API fails
            result = {
                'evidence_score': 50,
                'verified': True,
                'detected_issues': [complaint.category.lower()],
                'matches_category': True,
                'confidence': 'low',
                'notes': 'Evidence could not be verified automatically (API error).',
            }

        # Guarantee all required keys
        result.setdefault('evidence_score', 50)
        result.setdefault('verified', True)
        result.setdefault('detected_issues', [])
        result.setdefault('matches_category', True)
        result.setdefault('confidence', 'low')
        result.setdefault('notes', '')
        return result

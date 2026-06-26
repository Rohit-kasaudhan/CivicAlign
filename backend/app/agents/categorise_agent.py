from .base_agent import BaseAgent


class CategoriseAgent(BaseAgent):
    """
    Agent 2 — Classify the complaint and assign priority.
    Also generates the formal subject, summary, and description used in official records.
    """

    CATEGORIES = [
        'Roads', 'Drainage', 'Water Supply', 'Waste Management',
        'Environment', 'Healthcare', 'Electricity', 'Transportation',
        'Public Safety', 'Education',
    ]

    def run(self, complaint, evidence_result: dict) -> dict:
        detected = ', '.join(evidence_result.get('detected_issues', [])) or 'none detected'

        prompt = f"""You are an AI civic issue categorisation expert.

Complaint Details:
Title: {complaint.title}
Description: {complaint.description}
User-selected category: {complaint.category}
Evidence detected: {detected}

Available categories:
{', '.join(self.CATEGORIES)}

Analyse and respond ONLY with valid JSON (no markdown):
{{
  "category": "<best matching category from the list above>",
  "subcategory": "<specific subcategory e.g. Pothole, Blocked Drain, Broken Streetlight>",
  "priority": "low|medium|high|critical",
  "priority_reason": "<one sentence explaining the priority>",
  "formal_subject": "<official complaint subject line>",
  "summary": "<2-3 sentence professional summary>",
  "formal_description": "<formal paragraph suitable for government submission>",
  "tags": ["tag1", "tag2", "tag3"]
}}

Priority guidelines:
- critical: immediate danger to life or health
- high: significant daily disruption to many people
- medium: regular inconvenience, not dangerous
- low: minor issue, cosmetic"""

        try:
            raw = self._call_gemini(prompt)
            result = self._parse_json(raw)
        except Exception:
            result = {
                'category': complaint.category,
                'subcategory': complaint.category,
                'priority': 'medium',
                'priority_reason': 'Default priority — AI categorisation unavailable.',
                'formal_subject': f'Civic Complaint: {complaint.title}',
                'summary': complaint.description[:200],
                'formal_description': complaint.description,
                'tags': [complaint.category.lower()],
            }

        result.setdefault('category', complaint.category)
        result.setdefault('subcategory', complaint.category)
        result.setdefault('priority', 'medium')
        result.setdefault('priority_reason', '')
        result.setdefault('formal_subject', complaint.title)
        result.setdefault('summary', complaint.description[:200])
        result.setdefault('formal_description', complaint.description)
        result.setdefault('tags', [])

        # Ensure category is one of the valid options
        if result['category'] not in self.CATEGORIES:
            result['category'] = complaint.category

        return result

from .base_agent import BaseAgent


class SolutionAgent(BaseAgent):
    """
    Agent 5 — Generate a complete resolution plan: actions, budget, timeline, department.
    Receives all prior agent outputs fused into the complaint object.
    """

    def run(self, complaint, impact_result: dict) -> dict:
        prompt = f"""You are a civic development planning expert working for a city administration.

Issue Details:
Title: {complaint.title}
Category: {complaint.category}
Subcategory: {complaint.subcategory or complaint.category}
Priority: {complaint.priority}
Severity: {impact_result.get('severity', 'moderate')}
Citizens affected: {impact_result.get('citizens_affected', 'unknown')}
Location: {complaint.city or 'Unknown'}, {complaint.state or ''}
Description: {complaint.description}
Formal description: {complaint.ai_formal_description or complaint.description}

Generate a complete action plan to resolve this civic issue.

Respond ONLY with valid JSON (no markdown):
{{
  "immediate_actions": [
    "<action within 24-48 hours>",
    "<action within 24-48 hours>"
  ],
  "short_term_actions": [
    "<action within 1-4 weeks>",
    "<action within 1-4 weeks>"
  ],
  "long_term_actions": [
    "<action within 1-6 months>",
    "<action within 1-6 months>"
  ],
  "budget_estimate": "<e.g. ₹50,000 – ₹2,00,000>",
  "timeline": "<e.g. 2-3 weeks for full resolution>",
  "responsible_department": "<primary department name>",
  "supporting_departments": ["<dept1>", "<dept2>"],
  "success_metrics": ["<metric1>", "<metric2>"]
}}"""

        try:
            raw = self._call_gemini(prompt)
            result = self._parse_json(raw)
        except Exception:
            category = complaint.category
            result = {
                'immediate_actions': [
                    f'Assess and document the {category} issue on-site.',
                    'Deploy temporary safety measures if required.',
                ],
                'short_term_actions': [
                    f'Schedule {category} repair or maintenance team.',
                    'Notify affected residents of planned work.',
                ],
                'long_term_actions': [
                    f'Implement permanent fix and monitor for recurrence.',
                    'Include issue in next municipal development plan.',
                ],
                'budget_estimate': 'To be determined',
                'timeline': '2-4 weeks',
                'responsible_department': f'{category} Department',
                'supporting_departments': ['Municipal Corporation'],
                'success_metrics': ['Issue resolved', 'No citizen complaints within 30 days'],
            }

        result.setdefault('immediate_actions', [])
        result.setdefault('short_term_actions', [])
        result.setdefault('long_term_actions', [])
        result.setdefault('budget_estimate', 'TBD')
        result.setdefault('timeline', 'TBD')
        result.setdefault('responsible_department', complaint.category + ' Department')
        result.setdefault('supporting_departments', [])
        result.setdefault('success_metrics', [])

        # Ensure action lists are actually lists
        for key in ('immediate_actions', 'short_term_actions', 'long_term_actions',
                    'supporting_departments', 'success_metrics'):
            if not isinstance(result[key], list):
                result[key] = []

        return result

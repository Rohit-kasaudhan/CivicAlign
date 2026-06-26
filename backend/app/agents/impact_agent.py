from .base_agent import BaseAgent


class ImpactAgent(BaseAgent):
    """
    Agent 4 — Estimate the real-world civic impact of the complaint.
    Returns citizens_affected, severity, economic_impact, health_risk, impact_score, etc.
    """

    def run(self, complaint) -> dict:
        prompt = f"""You are a civic impact assessment specialist.

Complaint:
Title: {complaint.title}
Category: {complaint.category}
Priority: {complaint.priority}
Location: {complaint.city or 'Unknown'}, {complaint.state or ''}
Description: {complaint.description}
Evidence verified: {complaint.evidence_score and complaint.evidence_score > 50}
Subcategory: {complaint.subcategory or complaint.category}

Estimate the real-world impact of this civic issue.

Respond ONLY with valid JSON (no markdown):
{{
  "citizens_affected": <estimated integer>,
  "severity": "minor|moderate|severe|critical",
  "economic_impact": "low|medium|high|very_high",
  "environmental_impact": "none|low|medium|high",
  "health_risk": "none|low|medium|high",
  "impact_score": <integer 0-100>,
  "impact_summary": "<2 sentence summary of the impact>",
  "urgency_recommendation": "can_wait|schedule_soon|urgent|emergency"
}}"""

        try:
            raw = self._call_gemini(prompt)
            result = self._parse_json(raw)
        except Exception:
            result = {
                'citizens_affected': 100,
                'severity': 'moderate',
                'economic_impact': 'medium',
                'environmental_impact': 'low',
                'health_risk': 'low',
                'impact_score': 50,
                'impact_summary': 'Impact assessment unavailable. Moderate impact assumed.',
                'urgency_recommendation': 'schedule_soon',
            }

        result.setdefault('citizens_affected', 100)
        result.setdefault('severity', 'moderate')
        result.setdefault('economic_impact', 'medium')
        result.setdefault('environmental_impact', 'low')
        result.setdefault('health_risk', 'low')
        result.setdefault('impact_score', 50)
        result.setdefault('impact_summary', '')
        result.setdefault('urgency_recommendation', 'schedule_soon')

        # Coerce types
        try:
            result['citizens_affected'] = int(result['citizens_affected'])
        except (TypeError, ValueError):
            result['citizens_affected'] = 100
        try:
            result['impact_score'] = float(result['impact_score'])
        except (TypeError, ValueError):
            result['impact_score'] = 50.0

        return result

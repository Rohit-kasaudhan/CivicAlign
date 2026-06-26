import json
import os
import google.generativeai as genai


def analyze_complaint(complaint) -> dict | None:
    """Call Gemini 2.5 Flash with a structured JSON prompt and return parsed dict."""
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return None

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""You are an AI analyst for a civic complaint platform. Analyze the complaint below and respond ONLY with a valid JSON object — no markdown, no explanation.

Complaint:
Title: {complaint.title}
Description: {complaint.description}
Category: {complaint.category}
Location: {complaint.city or 'Unknown'}, {complaint.state or ''}, {complaint.country or ''}

Return exactly this JSON structure:
{{
  "ai_summary": "2-3 sentence plain-language summary of the issue and its impact",
  "ai_subject": "One short formal subject line for official communication",
  "ai_formal_description": "Formal 3-4 sentence description for municipal records",
  "subcategory": "specific subcategory within {complaint.category}",
  "priority": "low or medium or high or critical",
  "evidence_score": 70,
  "trust_score": 50,
  "impact_score": 60,
  "citizens_affected": 150,
  "economic_impact": "low or medium or high",
  "severity": "minor or moderate or severe or critical",
  "immediate_actions": ["action 1", "action 2"],
  "short_term_actions": ["action 1", "action 2"],
  "long_term_actions": ["action 1"],
  "budget_estimate": "₹10,000 - ₹50,000",
  "timeline": "7-14 days",
  "responsible_department": "Department name"
}}"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Strip markdown code fences if present
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0].strip()
        elif '```' in text:
            text = text.split('```')[1].split('```')[0].strip()
        return json.loads(text)
    except Exception:
        return None


def apply_ai_results(complaint, result: dict):
    """Write AI analysis results onto the complaint object (caller must commit)."""
    if not result:
        return

    complaint.ai_summary             = result.get('ai_summary')
    complaint.ai_subject             = result.get('ai_subject')
    complaint.ai_formal_description  = result.get('ai_formal_description')
    complaint.subcategory            = result.get('subcategory')
    complaint.priority               = result.get('priority', complaint.priority)
    complaint.evidence_score         = float(result.get('evidence_score', 0))
    complaint.trust_score            = float(result.get('trust_score', 0))
    complaint.impact_score           = float(result.get('impact_score', 0))
    complaint.citizens_affected      = int(result.get('citizens_affected', 0))
    complaint.economic_impact        = result.get('economic_impact')
    complaint.severity               = result.get('severity')
    complaint.budget_estimate        = result.get('budget_estimate')
    complaint.timeline               = result.get('timeline')
    complaint.responsible_department = result.get('responsible_department')

    immediate = result.get('immediate_actions', [])
    short_t   = result.get('short_term_actions', [])
    long_t    = result.get('long_term_actions', [])
    complaint.immediate_actions   = json.dumps(immediate) if immediate else None
    complaint.short_term_actions  = json.dumps(short_t)   if short_t   else None
    complaint.long_term_actions   = json.dumps(long_t)    if long_t    else None

    complaint.status = 'ai_processed'

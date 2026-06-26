import json
import os
from datetime import datetime, timedelta


def try_cluster_complaint(complaint):
    """
    Check whether this complaint should be added to an existing initiative
    or trigger creation of a new one.

    A new initiative is created when 3+ non-duplicate complaints share:
    - Same category
    - Same city
    - Within the last 60 days
    """
    from app.models.complaint import Complaint
    from app.models.initiative import Initiative
    from app.extensions import db

    if not complaint.city:
        return  # Can't cluster without city

    sixty_days_ago = datetime.utcnow() - timedelta(days=60)

    similar = (
        Complaint.query
        .filter(
            Complaint.category == complaint.category,
            Complaint.city == complaint.city,
            Complaint.created_at >= sixty_days_ago,
            Complaint.id != complaint.id,
            Complaint.duplicate_of_id == None,
            Complaint.initiative_id == None,
        )
        .all()
    )

    if len(similar) < 2:
        return  # Need at least 3 total (current + 2 others) to cluster

    # Attach to an existing proposed initiative if one exists
    existing = (
        Initiative.query
        .filter_by(category=complaint.category, status='proposed')
        .filter(Initiative.created_at >= sixty_days_ago)
        .first()
    )

    if existing:
        complaint.initiative_id = existing.id
        existing.total_complaints = (existing.total_complaints or 0) + 1
        existing.total_citizens_affected = (
            (existing.total_citizens_affected or 0) + (complaint.citizens_affected or 0)
        )
        db.session.commit()
    else:
        initiative = _create_initiative_with_ai(complaint, similar)
        if initiative:
            complaint.initiative_id = initiative.id
            for s in similar:
                s.initiative_id = initiative.id
            initiative.total_complaints = len(similar) + 1
            initiative.total_citizens_affected = sum(
                (c.citizens_affected or 0) for c in [complaint] + similar
            )
            db.session.commit()


def _create_initiative_with_ai(complaint, related_complaints):
    """Use Gemini to generate a unified initiative title and description."""
    import google.generativeai as genai
    from app.models.initiative import Initiative
    from app.extensions import db

    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return _create_initiative_fallback(complaint, related_complaints)

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')

    complaints_summary = '\n'.join(
        f"- {c.title}: {(c.ai_summary or c.description)[:120]}"
        for c in [complaint] + related_complaints
    )

    prompt = f"""You are a civic development planner. Multiple citizen complaints have been received for the same area and category.
Create a unified development initiative that addresses all of them.

Category: {complaint.category}
City: {complaint.city}
Related complaints:
{complaints_summary}

Respond ONLY with valid JSON (no markdown):
{{
  "initiative_title": "<concise project title>",
  "initiative_description": "<2-3 paragraph description of the unified initiative>",
  "estimated_budget": "<budget range>",
  "recommended_timeline": "<timeline>",
  "lead_department": "<department>"
}}"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if '```json' in text:
            text = text.split('```json', 1)[1].split('```', 1)[0]
        elif text.startswith('```'):
            text = text.split('```', 1)[1].split('```', 1)[0]
            if text.startswith('json'):
                text = text[4:]
        data = json.loads(text.strip())
    except Exception:
        return _create_initiative_fallback(complaint, related_complaints)

    initiative = Initiative(
        title=data.get('initiative_title', f'{complaint.category} Improvement – {complaint.city}'),
        description=data.get(
            'initiative_description',
            f'Multiple {complaint.category} issues reported in {complaint.city}.',
        ),
        category=complaint.category,
        estimated_budget=data.get('estimated_budget'),
        timeline=data.get('recommended_timeline'),
        department=data.get('lead_department'),
        status='proposed',
    )
    db.session.add(initiative)
    db.session.flush()
    return initiative


def _create_initiative_fallback(complaint, related_complaints):
    """Create a basic initiative without AI when Gemini is unavailable."""
    from app.models.initiative import Initiative
    from app.extensions import db

    initiative = Initiative(
        title=f'{complaint.category} Improvement Initiative – {complaint.city or "City"}',
        description=(
            f'Multiple {complaint.category} issues have been reported in {complaint.city or "the area"}. '
            f'This initiative addresses {len(related_complaints) + 1} related complaints and aims to provide '
            f'a comprehensive resolution through coordinated municipal action.'
        ),
        category=complaint.category,
        status='proposed',
    )
    db.session.add(initiative)
    db.session.flush()
    return initiative


def cluster_complaints(complaints_list: list) -> list:
    """
    Legacy helper: cluster complaints geographically by bounding-box distance.
    Returns list of cluster groups (used by analytics endpoints).
    """
    clusters = []
    visited = set()
    threshold = 0.001  # ~100 m in lat/lng degrees

    for c in complaints_list:
        if c['id'] in visited:
            continue
        cluster = [c]
        visited.add(c['id'])
        for other in complaints_list:
            if other['id'] in visited:
                continue
            if c.get('latitude') is None or other.get('latitude') is None:
                continue
            dist = (
                (c['latitude'] - other['latitude']) ** 2
                + (c['longitude'] - other['longitude']) ** 2
            ) ** 0.5
            if dist < threshold:
                cluster.append(other)
                visited.add(other['id'])

        clusters.append({
            'center': {
                'latitude':  sum(item['latitude']  for item in cluster) / len(cluster),
                'longitude': sum(item['longitude'] for item in cluster) / len(cluster),
            },
            'count': len(cluster),
            'complaints': cluster,
        })

    return clusters

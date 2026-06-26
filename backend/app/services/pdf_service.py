import io
import json
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak,
)
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# ── Brand colours ─────────────────────────────────────────────────────────────

CIVIC_BLUE  = HexColor('#1e40af')
CIVIC_GREEN = HexColor('#15803d')
CIVIC_AMBER = HexColor('#b45309')
CIVIC_RED   = HexColor('#b91c1c')
CIVIC_LIGHT = HexColor('#eff6ff')
GRAY        = HexColor('#6b7280')
LIGHT_GRAY  = HexColor('#f3f4f6')
DARK_GRAY   = HexColor('#374151')

PAGE_W, PAGE_H = A4
USABLE_W = PAGE_W - 4 * cm   # 2 cm left + 2 cm right margins


# ── Style factory ─────────────────────────────────────────────────────────────

def _styles():
    base = getSampleStyleSheet()
    return {
        'title': ParagraphStyle(
            'CATitle', parent=base['Normal'],
            fontSize=28, leading=34, textColor=CIVIC_BLUE, spaceAfter=20,
            alignment=TA_CENTER, fontName='Helvetica-Bold',
        ),
        'subtitle': ParagraphStyle(
            'CASubtitle', parent=base['Normal'],
            fontSize=12, leading=16, textColor=GRAY, spaceAfter=24, alignment=TA_CENTER,
        ),
        'complaint_title': ParagraphStyle(
            'CTit', parent=base['Normal'],
            fontSize=18, textColor=DARK_GRAY, spaceAfter=16,
            spaceBefore=14, leading=24, fontName='Helvetica-Bold',
        ),
        'section': ParagraphStyle(
            'Section', parent=base['Normal'],
            fontSize=11, leading=15, textColor=CIVIC_BLUE, spaceBefore=18, spaceAfter=8,
            fontName='Helvetica-Bold', backColor=CIVIC_LIGHT,
            borderPad=5, leftIndent=0,
        ),
        'subsection': ParagraphStyle(
            'SubSec', parent=base['Normal'],
            fontSize=10, leading=14, textColor=CIVIC_BLUE, spaceBefore=10,
            spaceAfter=4, fontName='Helvetica-Bold',
        ),
        'body': ParagraphStyle(
            'CABody', parent=base['Normal'],
            fontSize=10, spaceAfter=6, leading=16, textColor=DARK_GRAY,
        ),
        'label': ParagraphStyle(
            'CALabel', parent=base['Normal'],
            fontSize=9, leading=12, textColor=GRAY, spaceAfter=2, fontName='Helvetica-Bold',
        ),
        'bullet': ParagraphStyle(
            'CABullet', parent=base['Normal'],
            fontSize=10, spaceAfter=4, leading=15, leftIndent=10,
            textColor=DARK_GRAY,
        ),
    }


# ── Shared helpers ────────────────────────────────────────────────────────────

def _safe(v, fallback='Not specified'):
    if v is None or str(v).strip() == '':
        return fallback
    val = str(v)
    return val.replace('₹', 'Rs. ')


def _parse_list(field):
    if not field:
        return []
    if isinstance(field, list):
        return field
    try:
        r = json.loads(field)
        return r if isinstance(r, list) else []
    except (ValueError, TypeError):
        return []


def _kv_table(rows, col1=5 * cm):
    """Alternating-row two-column key/value table with auto-wrapping."""
    col2 = USABLE_W - col1
    st = _styles()
    
    # Custom styles specifically for the table key/value cells to support wrap
    lbl_style = ParagraphStyle(
        'TblLabel', parent=st['label'],
        fontSize=9.5, leading=14, textColor=GRAY, fontName='Helvetica-Bold',
        spaceAfter=0,
    )
    val_style = ParagraphStyle(
        'TblValue', parent=st['body'],
        fontSize=9.5, leading=14, textColor=DARK_GRAY,
        spaceAfter=0,
    )
    
    wrapped_rows = []
    for r in rows:
        k = r[0]
        v = r[1]
        k_para = Paragraph(str(k), lbl_style) if not isinstance(k, Paragraph) else k
        v_para = Paragraph(str(v), val_style) if not isinstance(v, Paragraph) else v
        wrapped_rows.append([k_para, v_para])
        
    t = Table(wrapped_rows, colWidths=[col1, col2])
    t.setStyle(TableStyle([
        ('ROWBACKGROUNDS',  (0, 0), (-1, -1), [white, LIGHT_GRAY]),
        ('TOPPADDING',      (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING',   (0, 0), (-1, -1), 6),
        ('LEFTPADDING',     (0, 0), (-1, -1), 8),
        ('RIGHTPADDING',    (0, 0), (-1, -1), 8),
        ('VALIGN',          (0, 0), (-1, -1), 'TOP'),
    ]))
    return t


def _score_bar_flowables(score, label_text, st):
    """Return [Paragraph, progress-bar Table, Spacer] for a 0-100 score."""
    score = float(score or 0)
    pct   = min(score, 100.0) / 100.0
    color = CIVIC_GREEN if score >= 70 else (CIVIC_AMBER if score >= 40 else CIVIC_RED)

    bar_w  = USABLE_W - 2 * cm
    filled = max(pct * bar_w, 0)
    empty  = bar_w - filled

    if filled > 0 and empty > 0:
        bar = Table([['', '']], colWidths=[filled, empty], rowHeights=[0.28 * cm])
        bar.setStyle(TableStyle([
            ('BACKGROUND',    (0, 0), (0, 0),  color),
            ('BACKGROUND',    (1, 0), (1, 0),  LIGHT_GRAY),
            ('TOPPADDING',    (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ('LEFTPADDING',   (0, 0), (-1, -1), 0),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
            ('BOX',           (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
        ]))
    else:
        bar = Table([['']], colWidths=[bar_w], rowHeights=[0.28 * cm])
        bar.setStyle(TableStyle([
            ('BACKGROUND',    (0, 0), (-1, -1), LIGHT_GRAY if pct == 0 else color),
            ('TOPPADDING',    (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ('LEFTPADDING',   (0, 0), (-1, -1), 0),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
        ]))

    return [
        Paragraph(f"<b>{label_text}</b>: {int(score)}/100", st['body']),
        bar,
        Spacer(1, 0.15 * cm),
    ]


def _make_footer(gen_date):
    """Return a page-callback function that draws the footer on every page."""
    def _footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica', 7.5)
        canvas.setFillColor(GRAY)
        text = f"CivicAlign  |  Page {doc.page}  |  Generated {gen_date}  |  Confidential"
        canvas.drawCentredString(PAGE_W / 2, 1.3 * cm, text)
        canvas.setStrokeColor(LIGHT_GRAY)
        canvas.setLineWidth(0.5)
        canvas.line(2 * cm, 1.7 * cm, PAGE_W - 2 * cm, 1.7 * cm)
        canvas.restoreState()
    return _footer


# ── Complaint PDF ─────────────────────────────────────────────────────────────

def generate_complaint_pdf(complaint, user, verifications, status_history):
    """Return an io.BytesIO containing the full complaint PDF."""
    buffer   = io.BytesIO()
    gen_date = datetime.utcnow().strftime('%B %d, %Y')
    ref_id   = f"CA-{complaint.id:05d}-{datetime.utcnow().year}"

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm, leftMargin=2 * cm,
        topMargin=2 * cm,   bottomMargin=2.5 * cm,
        title=f"CivicAlign – {complaint.title}",
        author='CivicAlign',
    )
    st    = _styles()
    story = []

    # ──────────────────────────────────────────────────────────────
    # PAGE 1 · Cover
    # ──────────────────────────────────────────────────────────────
    story.append(Spacer(1, 1.5 * cm))
    story.append(Paragraph("CivicAlign", st['title']))
    story.append(Paragraph("CIVIC ISSUE REPORT", st['subtitle']))
    story.append(HRFlowable(width="100%", thickness=2, color=CIVIC_BLUE, spaceAfter=16))
    story.append(Paragraph(complaint.title, st['complaint_title']))

    loc_parts = [_safe(complaint.city, ''), _safe(complaint.state, '')]
    location  = ', '.join(p for p in loc_parts if p).strip(', ') or 'Not specified'

    cover_rows = [
        ['Reference ID:',  ref_id],
        ['Submitted By:',  _safe(getattr(user, 'full_name', None))],
        ['Location:',      location],
        ['Category:',      _safe(complaint.category)],
        ['Priority:',      _safe(complaint.priority, 'Pending').upper()],
        ['Status:',        _safe(complaint.status, 'submitted').replace('_', ' ').title()],
        ['Filed On:',      complaint.created_at.strftime('%B %d, %Y') if complaint.created_at else 'Unknown'],
        ['Report Date:',   gen_date],
    ]
    story.append(_kv_table(cover_rows, col1=4 * cm))
    story.append(PageBreak())

    # ──────────────────────────────────────────────────────────────
    # PAGE 2 · Executive Summary + Evidence + Location
    # ──────────────────────────────────────────────────────────────
    story.append(Paragraph("EXECUTIVE SUMMARY", st['section']))

    if complaint.ai_subject:
        story.append(Paragraph(f"<b>Subject:</b> {complaint.ai_subject}", st['body']))

    summary = complaint.ai_summary or complaint.description or ''
    if summary:
        story.append(Paragraph(summary, st['body']))

    if complaint.ai_formal_description:
        story.append(Spacer(1, 0.25 * cm))
        story.append(Paragraph("Formal Description", st['subsection']))
        story.append(Paragraph(complaint.ai_formal_description, st['body']))

    # Evidence Analysis
    story.append(Paragraph("EVIDENCE ANALYSIS", st['section']))
    ev_score = float(complaint.evidence_score or 0)
    story += _score_bar_flowables(ev_score, "Evidence Score", st)

    ev_rows = [
        ['Evidence Score:', f"{int(ev_score)}/100"],
        ['Verified:',       'Yes' if ev_score >= 50 else 'No'],
        ['Trust Score:',    f"{int(float(complaint.trust_score or 0))}/100"],
    ]
    story.append(_kv_table(ev_rows))

    # Location
    story.append(Paragraph("LOCATION DETAILS", st['section']))
    loc_rows = [
        ['Country:',     _safe(complaint.country)],
        ['State:',       _safe(complaint.state)],
        ['City:',        _safe(complaint.city)],
        ['Landmark:',    _safe(complaint.landmark)],
        ['Coordinates:', f"{complaint.latitude or 'N/A'}, {complaint.longitude or 'N/A'}"],
    ]
    story.append(_kv_table(loc_rows))
    story.append(PageBreak())

    # ──────────────────────────────────────────────────────────────
    # PAGE 3 · Impact Assessment + Community Verification
    # ──────────────────────────────────────────────────────────────
    story.append(Paragraph("IMPACT ASSESSMENT", st['section']))

    impact = float(complaint.impact_score or 0)
    story += _score_bar_flowables(impact, "Impact Score", st)

    impact_rows = [
        ['Impact Score:',      f"{int(impact)}/100"],
        ['Citizens Affected:', str(complaint.citizens_affected or 0)],
        ['Severity:',          _safe(complaint.severity).title()],
        ['Economic Impact:',   _safe(complaint.economic_impact).replace('_', ' ').title()],
    ]
    story.append(_kv_table(impact_rows))

    # Community Verification
    story.append(Paragraph("COMMUNITY VERIFICATION", st['section']))

    verify_list  = [v for v in (verifications or []) if getattr(v, 'type', '') == 'verify']
    support_list = [v for v in (verifications or []) if getattr(v, 'type', '') == 'support']

    com_rows = [
        ['Total Verifications:', str(len(verify_list))],
        ['Total Supports:',      str(len(support_list))],
        ['Trust Score:',         f"{int(float(complaint.trust_score or 0))}%"],
    ]
    story.append(_kv_table(com_rows))
    story.append(PageBreak())

    # ──────────────────────────────────────────────────────────────
    # PAGE 4 · Action Plan + Resource Planning
    # ──────────────────────────────────────────────────────────────
    story.append(Paragraph("ACTION PLAN", st['section']))

    action_sections = [
        ('Immediate Actions  (24–48 Hours)',  complaint.immediate_actions),
        ('Short-Term Actions (1–4 Weeks)',    complaint.short_term_actions),
        ('Long-Term Actions  (1–6 Months)',   complaint.long_term_actions),
    ]
    has_actions = False
    for section_label, field in action_sections:
        items = _parse_list(field)
        if items:
            has_actions = True
            story.append(Paragraph(section_label, st['subsection']))
            for i, action in enumerate(items, 1):
                story.append(Paragraph(f"{i}.  {action}", st['bullet']))
            story.append(Spacer(1, 0.15 * cm))

    if not has_actions:
        story.append(Paragraph(
            "The AI pipeline is still generating the action plan. Please check back later.",
            st['body'],
        ))

    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("RESOURCE PLANNING", st['section']))
    res_rows = [
        ['Budget Estimate:', _safe(complaint.budget_estimate, 'To be determined')],
        ['Timeline:',        _safe(complaint.timeline,        'To be determined')],
        ['Lead Department:', _safe(complaint.responsible_department, 'To be assigned')],
    ]
    story.append(_kv_table(res_rows))
    story.append(PageBreak())

    # ──────────────────────────────────────────────────────────────
    # PAGE 5 · Status Timeline
    # ──────────────────────────────────────────────────────────────
    story.append(Paragraph("STATUS HISTORY", st['section']))

    if status_history:
        # Define table-specific paragraph styles for clean wrapping and alignment
        th_style = ParagraphStyle(
            'StatusTh', parent=st['body'],
            fontSize=9, leading=13, textColor=white, fontName='Helvetica-Bold',
            alignment=TA_CENTER,
        )
        td_style = ParagraphStyle(
            'StatusTd', parent=st['body'],
            fontSize=8.5, leading=12, textColor=DARK_GRAY,
        )
        td_center_style = ParagraphStyle(
            'StatusTdCenter', parent=td_style,
            alignment=TA_CENTER,
        )

        headers = [[
            Paragraph('Date', th_style),
            Paragraph('Transition', th_style),
            Paragraph('Changed By', th_style),
            Paragraph('Note', th_style)
        ]]
        rows = []
        for h in status_history:
            old      = (h.old_status or 'initial').replace('_', ' ').title()
            new      = h.new_status.replace('_', ' ').title()
            date_str = h.created_at.strftime('%b %d, %Y %H:%M') if h.created_at else '—'
            changer  = h.changer.full_name if getattr(h, 'changer', None) else 'System'
            note     = h.note or '—'
            rows.append([
                Paragraph(date_str, td_center_style),
                Paragraph(f"{old} -> {new}", td_style),
                Paragraph(changer, td_style),
                Paragraph(note, td_style),
            ])

        tbl = Table(headers + rows, colWidths=[3.5 * cm, 4.5 * cm, 3.5 * cm, 5.5 * cm])
        tbl.setStyle(TableStyle([
            ('BACKGROUND',    (0, 0), (-1, 0),  CIVIC_BLUE),
            ('ROWBACKGROUNDS',(0, 1), (-1, -1), [white, LIGHT_GRAY]),
            ('TOPPADDING',    (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING',   (0, 0), (-1, -1), 6),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 6),
            ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
            ('BOX',           (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
            ('INNERGRID',     (0, 0), (-1, -1), 0.25, HexColor('#e5e7eb')),
        ]))
        story.append(tbl)
    else:
        story.append(Paragraph("No status changes have been recorded yet.", st['body']))

    # ── Build ─────────────────────────────────────────────────────
    footer_fn = _make_footer(gen_date)
    doc.build(story, onFirstPage=footer_fn, onLaterPages=footer_fn)
    buffer.seek(0)
    return buffer


# ── Initiative PDF ────────────────────────────────────────────────────────────

def generate_initiative_pdf(initiative, linked_complaints):
    """Return an io.BytesIO containing the initiative summary PDF."""
    buffer   = io.BytesIO()
    gen_date = datetime.utcnow().strftime('%B %d, %Y')

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm, leftMargin=2 * cm,
        topMargin=2 * cm,   bottomMargin=2.5 * cm,
        title=f"CivicAlign Initiative – {initiative.title}",
        author='CivicAlign',
    )
    st    = _styles()
    story = []

    # ── Cover ─────────────────────────────────────────────────────
    story.append(Spacer(1, 1.2 * cm))
    story.append(Paragraph("CivicAlign", st['title']))
    story.append(Paragraph("DEVELOPMENT INITIATIVE REPORT", st['subtitle']))
    story.append(HRFlowable(width="100%", thickness=2, color=CIVIC_BLUE, spaceAfter=16))
    story.append(Paragraph(initiative.title, st['complaint_title']))

    cover_rows = [
        ['Category:',          _safe(initiative.category)],
        ['Status:',            _safe(initiative.status).replace('_', ' ').title()],
        ['Total Complaints:',  str(initiative.total_complaints or len(linked_complaints))],
        ['Citizens Affected:', str(initiative.total_citizens_affected or 0)],
        ['Budget Estimate:',   _safe(initiative.estimated_budget, 'To be determined')],
        ['Timeline:',          _safe(initiative.timeline,         'To be determined')],
        ['Department:',        _safe(initiative.department,       'To be assigned')],
        ['Report Date:',       gen_date],
    ]
    story.append(_kv_table(cover_rows, col1=4.5 * cm))
    story.append(PageBreak())

    # ── Summary + Aggregate ───────────────────────────────────────
    story.append(Paragraph("INITIATIVE SUMMARY", st['section']))
    if initiative.description:
        story.append(Paragraph(initiative.description, st['body']))

    story.append(Paragraph("AGGREGATE IMPACT", st['section']))

    total_citizens = sum(getattr(c, 'citizens_affected', 0) or 0 for c in linked_complaints)
    avg_impact = (
        sum(float(getattr(c, 'impact_score', 0) or 0) for c in linked_complaints)
        / len(linked_complaints)
        if linked_complaints else 0.0
    )
    resolved_count = sum(
        1 for c in linked_complaints if c.status in ('resolved', 'closed')
    )

    agg_rows = [
        ['Total Complaints:',       str(len(linked_complaints))],
        ['Total Citizens Affected:', str(total_citizens)],
        ['Average Impact Score:',   f"{avg_impact:.1f}/100"],
        ['Resolved Complaints:',    f"{resolved_count}/{len(linked_complaints)}"],
        ['Budget Estimate:',        _safe(initiative.estimated_budget, 'To be determined')],
        ['Timeline:',               _safe(initiative.timeline,         'To be determined')],
        ['Lead Department:',        _safe(initiative.department,       'To be assigned')],
    ]
    story.append(_kv_table(agg_rows, col1=5 * cm))
    story.append(PageBreak())

    # ── Complaint Table ───────────────────────────────────────────
    story.append(Paragraph("LINKED COMPLAINTS", st['section']))
    story.append(Paragraph(
        f"{len(linked_complaints)} complaint(s) are grouped under this initiative.",
        st['body'],
    ))
    story.append(Spacer(1, 0.2 * cm))

    if linked_complaints:
        # Define table-specific paragraph styles for clean wrapping and alignment
        th_style = ParagraphStyle(
            'IniTh', parent=st['body'],
            fontSize=9, leading=13, textColor=white, fontName='Helvetica-Bold',
            alignment=TA_CENTER,
        )
        td_style = ParagraphStyle(
            'IniTd', parent=st['body'],
            fontSize=8.5, leading=12, textColor=DARK_GRAY,
        )
        td_center_style = ParagraphStyle(
            'IniTdCenter', parent=td_style,
            alignment=TA_CENTER,
        )

        headers = [[
            Paragraph('ID', th_style),
            Paragraph('Title', th_style),
            Paragraph('City', th_style),
            Paragraph('Status', th_style),
            Paragraph('Priority', th_style),
            Paragraph('Impact', th_style)
        ]]
        rows = []
        for c in linked_complaints:
            rows.append([
                Paragraph(f"#{c.id}", td_center_style),
                Paragraph(c.title or '—', td_style),
                Paragraph(_safe(c.city, '—'), td_style),
                Paragraph(c.status.replace('_', ' ').title(), td_style),
                Paragraph(_safe(c.priority, '—').upper(), td_center_style),
                Paragraph(str(int(float(c.impact_score or 0))), td_center_style),
            ])

        tbl = Table(headers + rows,
                    colWidths=[1.5 * cm, 6.5 * cm, 2.5 * cm, 3 * cm, 2 * cm, 1.5 * cm])
        tbl.setStyle(TableStyle([
            ('BACKGROUND',    (0, 0), (-1, 0),  CIVIC_BLUE),
            ('ROWBACKGROUNDS',(0, 1), (-1, -1), [white, LIGHT_GRAY]),
            ('TOPPADDING',    (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING',   (0, 0), (-1, -1), 5),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 5),
            ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
            ('BOX',           (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
            ('INNERGRID',     (0, 0), (-1, -1), 0.25, HexColor('#e5e7eb')),
        ]))
        story.append(tbl)
    else:
        story.append(Paragraph("No complaints are linked to this initiative yet.", st['body']))

    footer_fn = _make_footer(gen_date)
    doc.build(story, onFirstPage=footer_fn, onLaterPages=footer_fn)
    buffer.seek(0)
    return buffer

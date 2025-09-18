# app/services/pdf_generator.py
import io
from datetime import datetime
from typing import List, Dict, Any
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, blue
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

def generate_conversation_pdf(
    session_data: Dict[str, Any],
    messages: List[Dict[str, Any]],
    document_info: Dict[str, Any]
) -> bytes:
    """
    Generate a PDF containing the conversation history with document information.
    
    Args:
        session_data: Session information (id, created_at, etc.)
        messages: List of chat messages
        document_info: Information about the uploaded document
        
    Returns:
        PDF content as bytes
    """
    buffer = io.BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=HexColor('#6366f1'),
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=20,
        textColor=HexColor('#374151')
    )
    
    user_message_style = ParagraphStyle(
        'UserMessage',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=16,
        spaceBefore=8,
        leftIndent=20,
        rightIndent=20,
        backColor=HexColor('#f3f4f6'),
        borderColor=HexColor('#e5e7eb'),
        borderWidth=1,
        borderPadding=12
    )
    
    assistant_message_style = ParagraphStyle(
        'AssistantMessage',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=16,
        spaceBefore=8,
        leftIndent=20,
        rightIndent=20,
        backColor=HexColor('#eff6ff'),
        borderColor=HexColor('#dbeafe'),
        borderWidth=1,
        borderPadding=12
    )
    
    info_style = ParagraphStyle(
        'InfoStyle',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=4,
        textColor=HexColor('#6b7280')
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=8,
        spaceBefore=4,
        textColor=HexColor('#374151'),
        fontName='Helvetica-Bold'
    )
    
    # Build PDF content
    story = []
    
    # Title
    story.append(Paragraph("📚 DocuMind AI - Conversation Export", title_style))
    story.append(Spacer(1, 20))
    
    # Document Information Section
    story.append(Paragraph("Document Information", subtitle_style))
    
    doc_info_data = [
        ['Document Name:', document_info.get('filename', 'Unknown')],
        ['Upload Date:', datetime.fromisoformat(document_info.get('upload_time', '')).strftime('%B %d, %Y at %I:%M %p') if document_info.get('upload_time') else 'Unknown'],
        ['Session ID:', str(session_data.get('session_id', 'Unknown'))],
        ['Conversation Started:', datetime.fromisoformat(session_data.get('created_at', '')).strftime('%B %d, %Y at %I:%M %p') if session_data.get('created_at') else 'Unknown'],
        ['Total Messages:', str(len(messages))],
    ]
    
    doc_info_table = Table(doc_info_data, colWidths=[2*inch, 4*inch])
    doc_info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), HexColor('#f9fafb')),
        ('TEXTCOLOR', (0, 0), (0, -1), HexColor('#374151')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#e5e7eb')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    story.append(doc_info_table)
    story.append(Spacer(1, 30))
    
    # Document Download Link
    if document_info.get('file_url'):
        story.append(Paragraph("Original Document", subtitle_style))
        story.append(Paragraph(
            f'<link href="{document_info["file_url"]}" color="blue">Click here to download the original document</link>',
            info_style
        ))
        story.append(Spacer(1, 30))
    
    # Conversation History
    story.append(Paragraph("Conversation History", subtitle_style))
    
    if not messages:
        story.append(Paragraph("No messages in this conversation.", info_style))
    else:
        for i, message in enumerate(messages):
            # Message header with timestamp
            timestamp = datetime.fromisoformat(message.get('timestamp', '')).strftime('%I:%M %p') if message.get('timestamp') else 'Unknown time'
            sender = message.get('role', message.get('sender', 'unknown'))
            
            if sender.lower() in ['user', 'human']:
                header = f"👤 <b>You</b> - {timestamp}"
                message_style = user_message_style
            else:
                header = f"🤖 <b>DocuMind AI</b> - {timestamp}"
                message_style = assistant_message_style
            
            # Add message header with proper spacing
            story.append(Paragraph(header, header_style))
            story.append(Spacer(1, 4))
            
            # Message content with improved formatting
            content = message.get('content', '').replace('\n', '<br/>')
            story.append(Paragraph(content, message_style))
            
            # Add spacing between messages
            if i < len(messages) - 1:
                story.append(Spacer(1, 20))
            else:
                story.append(Spacer(1, 10))
    
    # Footer
    story.append(Spacer(1, 30))
    story.append(Paragraph(
        f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')} by DocuMind AI",
        info_style
    ))
    
    # Build PDF
    doc.build(story)
    
    # Get PDF content
    pdf_content = buffer.getvalue()
    buffer.close()
    
    return pdf_content

import os
import sys
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

# Define custom NumberedCanvas to draw page headers/footers with dynamic page counts
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_elements(num_pages)
            super().showPage()
        super().save()

    def draw_page_elements(self, page_count):
        # Page 1: Cover Page - draw aesthetic border accents
        if self._pageNumber == 1:
            self.saveState()
            self.setFillColor(colors.HexColor("#0f172a")) # Dark primary
            self.rect(0, 0, 612, 15, fill=True, stroke=False)
            self.setFillColor(colors.HexColor("#14b8a6")) # Teal secondary
            self.rect(0, 15, 612, 6, fill=True, stroke=False)
            self.restoreState()
            return
            
        self.saveState()
        # Header setup
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))
        self.drawString(54, 752, "GENMED HUB™ — COMPLETE TECHNICAL SPECIFICATION MANUAL")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 744, 558, 744)
        
        # Footer setup
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(54, 38, "Confidential — System Architecture, APIs & Algorithms Guide")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 38, page_text)
        self.line(54, 48, 558, 48)
        self.restoreState()

def html_escape(text):
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def make_code_block(text, style):
    escaped = html_escape(text)
    html_text = escaped.replace('\n', '<br/>').replace(' ', '&nbsp;')
    p = Paragraph(f"<font face='Courier' size='8'>{html_text}</font>", style)
    t = Table([[p]], colWidths=[504])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    return t

def make_callout_box(text, title="ALGORITHM DETAILS", color_hex="#14b8a6", bg_hex="#f0fdfa", body_style=None):
    title_style = ParagraphStyle('CalloutTitle', parent=body_style, fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=colors.HexColor(color_hex))
    p_title = Paragraph(f"<b>{title}</b>", title_style)
    p_body = Paragraph(text, body_style)
    t = Table([[p_title], [p_body]], colWidths=[504])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(bg_hex)),
        ('LINELEFT', (0,0), (0,-1), 3.5, colors.HexColor(color_hex)),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    return t

def build_pdf():
    # Setup document target path
    pdf_filename = "GenMed_Hub_Technical_Documentation.pdf"
    
    # 54pt is 0.75 inch margin, letter size is 612x792 pt
    doc = SimpleDocTemplate(
        pdf_filename, 
        pagesize=letter, 
        leftMargin=54, 
        rightMargin=54, 
        topMargin=54, 
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Base Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=12
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#475569'),
        spaceAfter=25
    )
    
    meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=6
    )
    
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=14,
        spaceAfter=10,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#14b8a6'),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=8
    )

    code_block_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )
    
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#334155')
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )
    
    story = []
    
    # ----------------------------------------------------
    # COVER PAGE
    # ----------------------------------------------------
    story.append(Spacer(1, 40))
    # Aesthetic top color accent
    acc_table = Table([[""]], colWidths=[504], rowHeights=[4])
    acc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#14b8a6')),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(acc_table)
    story.append(Spacer(1, 15))
    
    story.append(Paragraph("GENMED HUB™", title_style))
    story.append(Paragraph("System Architecture, Custom Algorithms &amp; API Specifications Manual", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("A Comprehensive Guide to the Inner Workings of the Indian Generic Medicine Platform", body_style))
    story.append(Spacer(1, 30))
    
    # Document Specifications Table on Cover
    spec_data = [
        [Paragraph("<b>Document Specification</b>", table_header_style), Paragraph("<b>Value / Context</b>", table_header_style)],
        [Paragraph("Project Name", table_cell_style), Paragraph("Generic Medicine Hub (GenMed Hub)", table_cell_style)],
        [Paragraph("Core Architecture", table_cell_style), Paragraph("Decoupled Client-Server (REST API)", table_cell_style)],
        [Paragraph("Frontend Technology", table_cell_style), Paragraph("React 19 + TypeScript + Vite + custom CSS", table_cell_style)],
        [Paragraph("Backend Technology", table_cell_style), Paragraph("Node.js + Express.js + ML Module", table_cell_style)],
        [Paragraph("Local Mock Database", table_cell_style), Paragraph("Flat JSON Database (db.json) with 520+ Medicines", table_cell_style)],
        [Paragraph("Algorithms Implemented", table_cell_style), Paragraph("Haversine Proximity, Simple Linear Regression with Seasonality, Anti-Counterfeit Verification Heuristics, Therapeutic Price Ratio Mapping, NLP Prescription Token Matcher", table_cell_style)],
        [Paragraph("Target Environment", table_cell_style), Paragraph("Windows Local Desktop / Development", table_cell_style)],
        [Paragraph("Author", table_cell_style), Paragraph("Antigravity AI (Pair Programming Assistant)", table_cell_style)],
        [Paragraph("Date of Compilation", table_cell_style), Paragraph(datetime.now().strftime("%B %d, %Y"), table_cell_style)]
    ]
    spec_table = Table(spec_data, colWidths=[150, 354])
    spec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8fafc')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(spec_table)
    
    story.append(Spacer(1, 100))
    story.append(Paragraph("<b>CONFIDENTIALITY NOTICE:</b> The information contained in this technical document is proprietary. It is prepared for systems verification, developer reference, and educational inspection.", meta_style))
    story.append(PageBreak())
    
    # ----------------------------------------------------
    # SECTION 1: INTRODUCTION & SYSTEM ARCHITECTURE
    # ----------------------------------------------------
    story.append(Paragraph("1. Executive Summary &amp; System Architecture", h1_style))
    story.append(Paragraph(
        "GenMed Hub™ is an advanced digital healthcare platform engineered to bridge the awareness and accessibility gap in the Indian medicine market. The application is designed to solve a significant public healthcare issue: the massive price disparity between branded prescription medicines and chemically identical generic equivalents. The platform empowers users to search formulations, extract prescription listings via OCR, evaluate supply chain stock risks, authenticate batch numbers against counterfeit warning signs, locate governmental Jan Aushadhi (PMBJP) kendras, and forecast medicine demand trends.",
        body_style
    ))
    story.append(Paragraph(
        "The system relies on a decoupled, client-server web architecture to separate concerns, maximize scalability, and ensure high responsiveness:",
        body_style
    ))
    
    story.append(Paragraph("<b>A. Frontend Tier (React App Client):</b>", h2_style))
    story.append(Paragraph(
        "A Single Page Application (SPA) compiled using the Vite bundler. It uses React 19 to provide responsive, state-driven interfaces and TypeScript to guarantee type safety across database query records, ML forecast graphs, and coordinates models. The client performs heavy operations locally—such as client-side OCR text extraction (using Tesseract.js), local storage purchase histories management (Health Wallet), and report generation (jsPDF)—to save bandwidth and maximize privacy.",
        body_style
    ))
    
    story.append(Paragraph("<b>B. Backend Tier (Express REST Server):</b>", h2_style))
    story.append(Paragraph(
        "A Node.js server powered by Express.js. The server processes all incoming REST requests, handles route authentication, and implements the math modules for data analytics, demand forecasting, coordinate calculations, and batch risk assessments. It serves data from a highly realistic local JSON database simulating the Indian pharmaceutical landscape.",
        body_style
    ))
    
    story.append(Paragraph("<b>C. Local Mock Database System (db.json):</b>", h2_style))
    story.append(Paragraph(
        "A simulated local database containing 520+ branded and generic medicines, 8 governmental and private pharmacies, and market trends records. The schema includes barcodes, side effects, contraindications, manufacturer shares, and seasonal sales volumes. The database operations are encapsulated in an ORM-like wrapper (db.js) utilizing standard JavaScript array algorithms (filtering, mapping, searching) and the Haversine formula for proximity calculations.",
        body_style
    ))
    
    # Visual architecture callout
    story.append(Spacer(1, 5))
    story.append(make_callout_box(
        "The system operates with a RESTful communication model. The React client makes fetch requests to the Express server. The server runs specific computational models in Node.js (Simple Linear Regression and Heuristic risk rules) and reads/writes to a flat JSON file. This setup allows the entire stack to run locally without external cloud dependencies, enabling rapid offline utility in low-bandwidth Indian environments.",
        title="SYSTEM INTEGRATION ARCHITECTURE",
        color_hex="#0f172a",
        bg_hex="#f1f5f9",
        body_style=body_style
    ))
    story.append(Spacer(1, 10))
    story.append(PageBreak())
    
    # ----------------------------------------------------
    # SECTION 2: TECHNOLOGY & LANGUAGE STACK
    # ----------------------------------------------------
    story.append(Paragraph("2. Technology Stack &amp; Programming Languages", h1_style))
    story.append(Paragraph(
        "The platform utilizes modern web development technologies selected for rendering efficiency, development safety, and zero external deployment costs.",
        body_style
    ))
    
    tech_data = [
        [Paragraph("<b>Subsystem</b>", table_header_style), Paragraph("<b>Technology / Library</b>", table_header_style), Paragraph("<b>Language Used</b>", table_header_style), Paragraph("<b>Functional Responsibility</b>", table_header_style)],
        
        [Paragraph("Frontend Core", table_cell_style), Paragraph("React 19.2.6", table_cell_style), Paragraph("TSX / CSS / HTML", table_cell_style), Paragraph("Modular UI components, state management, tab routing, dynamic user actions.", table_cell_style)],
        
        [Paragraph("Frontend Build", table_cell_style), Paragraph("Vite 8.0.12", table_cell_style), Paragraph("TypeScript / JS", table_cell_style), Paragraph("Fast compilation, hot module replacement, and production asset bundling.", table_cell_style)],
        
        [Paragraph("OCR Processing", table_cell_style), Paragraph("Tesseract.js 5.1.0", table_cell_style), Paragraph("WebAssembly / JS", table_cell_style), Paragraph("Client-side optical character recognition. Scans prescription images locally.", table_cell_style)],
        
        [Paragraph("PDF Compilation", table_cell_style), Paragraph("jsPDF 2.5.1", table_cell_style), Paragraph("JavaScript", table_cell_style), Paragraph("Compiles and downloads saving summary certificates dynamically in the browser.", table_cell_style)],
        
        [Paragraph("Visual Charts", table_cell_style), Paragraph("Recharts 2.12.7", table_cell_style), Paragraph("TypeScript", table_cell_style), Paragraph("Renders interactive graphs: sales forecasts, manufacturer shares, price ratios.", table_cell_style)],
        
        [Paragraph("UI Icons", table_cell_style), Paragraph("Lucide React 0.395.0", table_cell_style), Paragraph("TypeScript", table_cell_style), Paragraph("Sleek vector icons matching the dark/light design system.", table_cell_style)],
        
        [Paragraph("Backend Core", table_cell_style), Paragraph("Node.js v24.16.0", table_cell_style), Paragraph("JavaScript", table_cell_style), Paragraph("Asynchronous execution runtime hosting the API server and ML scripts.", table_cell_style)],
        
        [Paragraph("REST Server", table_cell_style), Paragraph("Express 4.19.2", table_cell_style), Paragraph("JavaScript", table_cell_style), Paragraph("Exposes endpoints, parses JSON bodies, routes requests, and manages CORS headers.", table_cell_style)],
        
        [Paragraph("Data Storage", table_cell_style), Paragraph("Flat JSON file", table_cell_style), Paragraph("JSON Schema", table_cell_style), Paragraph("Provides mock database tables, pre-seeded with 520+ medicines and stores.", table_cell_style)],
        
        [Paragraph("AI Assistant", table_cell_style), Paragraph("Gemini 2.5 Flash", table_cell_style), Paragraph("JSON / HTTPS", table_cell_style), Paragraph("Direct API integration for medicine consultations, fallback to offline rules.", table_cell_style)]
    ]
    
    tech_table = Table(tech_data, colWidths=[80, 110, 84, 230])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 10))
    story.append(PageBreak())
    
    # ----------------------------------------------------
    # SECTION 3: SYSTEM DATABASE SCHEMA
    # ----------------------------------------------------
    story.append(Paragraph("3. System Data Model &amp; Database Schema", h1_style))
    story.append(Paragraph(
        "The mock database (db.json) resides inside the server's data folder. It is dynamically generated if missing via `server/generate_db.js`. The database consists of three main tables: Medicines, Stores, and Market Trends.",
        body_style
    ))
    
    story.append(Paragraph("<b>Table 1: Medicines</b>", h2_style))
    story.append(Paragraph(
        "Contains comprehensive data on branded pharmaceuticals, their generic counterparts, and clinical parameters. Field descriptions are as follows:",
        body_style
    ))
    
    med_schema = [
        [Paragraph("<b>Field Name</b>", table_header_style), Paragraph("<b>Type</b>", table_header_style), Paragraph("<b>Description / Schema Details</b>", table_header_style)],
        [Paragraph("id", table_cell_style), Paragraph("Number", table_cell_style), Paragraph("Unique auto-incremented primary identifier key.", table_cell_style)],
        [Paragraph("brandName", table_cell_style), Paragraph("String", table_cell_style), Paragraph("Commercial trade name (e.g. Crocin 650, Augmentin 625).", table_cell_style)],
        [Paragraph("genericName", table_cell_style), Paragraph("String", table_cell_style), Paragraph("Chemical formulation name (e.g. Paracetamol 650mg, Amoxicillin + Clavulanic Acid).", table_cell_style)],
        [Paragraph("composition", table_cell_style), Paragraph("String", table_cell_style), Paragraph("Detailed listing of active chemical molecules and quantities.", table_cell_style)],
        [Paragraph("brandPrice", table_cell_style), Paragraph("Number", table_cell_style), Paragraph("Indian retail price in INR of the commercial branded version.", table_cell_style)],
        [Paragraph("genericPrice", table_cell_style), Paragraph("Number", table_cell_style), Paragraph("Ceiling price in INR of the generic equivalent.", table_cell_style)],
        [Paragraph("savings", table_cell_style), Paragraph("Number", table_cell_style), Paragraph("Pre-computed savings percentage: ((brandPrice - genericPrice) / brandPrice) * 100", table_cell_style)],
        [Paragraph("manufacturer", table_cell_style), Paragraph("String", table_cell_style), Paragraph("Pharmaceutical manufacturing company (e.g., GSK, Cipla, Alkem).", table_cell_style)],
        [Paragraph("category", table_cell_style), Paragraph("String", table_cell_style), Paragraph("Therapeutic drug class (e.g. Cardiovascular, Antibiotics, Gastrointestinal).", table_cell_style)],
        [Paragraph("dosage", table_cell_style), Paragraph("String", table_cell_style), Paragraph("Dosage form (e.g., Tablet, Capsule, Injection, Inhaler, Syrup).", table_cell_style)],
        [Paragraph("availability", table_cell_style), Paragraph("String", table_cell_style), Paragraph("Current supply status: 'Available', 'Low Stock', or 'Out of Stock'.", table_cell_style)],
        [Paragraph("schedule", table_cell_style), Paragraph("String", table_cell_style), Paragraph("Drug safety classification: 'OTC', 'Schedule H', or 'Schedule H1'.", table_cell_style)],
        [Paragraph("sideEffects", table_cell_style), Paragraph("Array (Str)", table_cell_style), Paragraph("Adverse clinical side effects associated with the formulation.", table_cell_style)],
        [Paragraph("contraindications", table_cell_style), Paragraph("Array (Str)", table_cell_style), Paragraph("Clinical conditions under which the drug must not be taken.", table_cell_style)],
        [Paragraph("barcode", table_cell_style), Paragraph("String", table_cell_style), Paragraph("Simulated Indian barcode EAN-13 format starting with prefix '890'.", table_cell_style)]
    ]
    
    t_med = Table(med_schema, colWidths=[100, 80, 324])
    t_med.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_med)
    
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Table 2: Stores (Pharmacy Locations)</b>", h2_style))
    story.append(Paragraph(
        "Stores are mapped with coordinates to support spatial queries. The structure contains: id (Number), name (String), type (String: 'Government Janaushadhi Store' or 'Private Generic Store'), rating (Number), phone (String), address (String), lat/lng (Numbers for coordinate system), and availableMedicines (Array of Medicine IDs in stock).",
        body_style
    ))
    
    story.append(Paragraph("<b>Table 3: Market Trends</b>", h2_style))
    story.append(Paragraph(
        "Encapsulates datasets used to render financial charts and demand volumes: adoptionRates (year-by-year rate), categoryAnalysis (average prices, generic equivalents savings), regionalPricing (average price premium across North, South, West, East zones), monthlyVolume (historical demands in branded vs generic units), and manufacturersShare (pie chart percentage splits).",
        body_style
    ))
    story.append(PageBreak())
    
    # ----------------------------------------------------
    # SECTION 4: CUSTOM ALGORITHMS EXPLAINED
    # ----------------------------------------------------
    story.append(Paragraph("4. Custom Mathematical &amp; Heuristic Algorithms", h1_style))
    story.append(Paragraph(
        "GenMed Hub incorporates several analytical models to support search, matching, spatial filtering, and forecasting. Below is a detailed breakdown of each algorithm.",
        body_style
    ))
    
    # 4.1 Demand Forecasting
    story.append(Paragraph("4.1 Demand Forecasting via Simple Linear Regression &amp; Seasonality", h2_style))
    story.append(Paragraph(
        "<b>Mathematical Formulation:</b> The system forecasts monthly branded and generic medicine demands over an upcoming horizon (usually 6 months). A Simple Linear Regression algorithm finds the line of best fit $y = mx + c$, where $y$ represents the demand volume, and $x$ represents the sequential month index. The slope $m$ and intercept $c$ are computed as follows:",
        body_style
    ))
    
    # Render regression equations in formatted text
    story.append(Paragraph(
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>Slope (m)</b> = [ N &middot; &Sigma;(xy) - &Sigma;x &middot; &Sigma;y ] / [ N &middot; &Sigma;(x&sup2;) - (&Sigma;x)&sup2; ]<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>Intercept (c)</b> = [ &Sigma;y - m &middot; &Sigma;x ] / N",
        body_style
    ))
    
    story.append(Paragraph(
        "<b>Seasonality Adjustment:</b> Real-world healthcare demand experiences seasonal surges due to weather-induced illness spikes. The forecasting model applies multiplier factors corresponding to standard Indian seasons:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&bull; <b>Monsoon Flu/Malaria Bump (July to September):</b> $+12\%$ factor ($1.12$ multiplier) representing spikes in antibiotic, respiratory, and fever medications.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&bull; <b>Winter Cough/Cold Bump (December to January):</b> $+8\%$ factor ($1.08$ multiplier) representing respiratory and analgesic surges.",
        body_style
    ))
    
    code_lr = """// Linear Regression computation in ml.js
function linearRegression(x, y) {
  const n = x.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}"""
    story.append(make_code_block(code_lr, code_block_style))
    story.append(Spacer(1, 10))
    
    # 4.2 Price Prediction
    story.append(Paragraph("4.2 Price Prediction Regression Model (Therapeutic Markups)", h2_style))
    story.append(Paragraph(
        "<b>Algorithm Logic:</b> The Price Predictor simulates generic equivalents pricing based on commercial branded prices. Branded markup margins vary heavily by therapeutic classes. The system applies a statistical mapping based on average generic price ratios in Indian markets (e.g. generic is ~27% of brand price in Antibiotics, ~23% in Cardiovascular, ~30% in Analgesics, etc.).",
        body_style
    ))
    story.append(Paragraph(
        "<b>Boundary/Volume Discounts:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;1. <b>Low-Cost Floor:</b> If brand price $&lt; 30$ INR, generic price is set to $35\%$ of brand price, subject to a minimum floor price of $3$ INR to represent base packaging costs.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;2. <b>High-Cost Bulk Discount:</b> If brand price $&gt; 300$ INR, the generic markup rate is reduced by an additional $3\%$ ($rate - 0.03$) to account for bulk chemical drug manufacturing scale economies.",
        body_style
    ))
    
    code_pred = """// Dynamic Price Prediction in ml.js
function predictGenericPrice(brandPrice, category = "General") {
  const markupRates = {
    "Antibiotics": 0.27, "Cardiovascular": 0.23, "Antidiabetics": 0.24,
    "Analgesics & Antipyretics": 0.30, "Antihistamines": 0.22, "General": 0.25
  };
  const rate = markupRates[category] || markupRates["General"];
  let predicted = brandPrice * rate;

  if (brandPrice < 30) {
    predicted = Math.max(3, brandPrice * 0.35);
  } else if (brandPrice > 300) {
    predicted = brandPrice * (rate - 0.03); // Bulk drug discount
  }
  return { predictedGenericPrice: parseFloat(predicted.toFixed(2)), savingsPercent: Math.round(((brandPrice - predicted) / brandPrice) * 100) };
}"""
    story.append(make_code_block(code_pred, code_block_style))
    story.append(PageBreak())
    
    # 4.3 Haversine Proximity Search
    story.append(Paragraph("4.3 Coordinate Proximity Calculation (Haversine Formula)", h2_style))
    story.append(Paragraph(
        "<b>Mathematical Formulation:</b> To calculate physical distances between a user's location and available pharmacies, the system cannot use simple Euclidean distance due to the earth's curvature. It implements the Haversine formula, which computes the great-circle distance between two pairs of latitudes and longitudes:",
        body_style
    ))
    
    story.append(Paragraph(
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>a</b> = sin&sup2;(&Delta;&phi; / 2) + cos(&phi;&sup1;) &middot; cos(&phi;&sup2;) &middot; sin&sup2;(&Delta;&lambda; / 2)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>c</b> = 2 &middot; arctan2( &radic;a, &radic;(1-a) )<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>d</b> = R &middot; c",
        body_style
    ))
    story.append(Paragraph(
        "where $R = 6371\\text{ km}$ (Earth's radius), $\\phi$ represents latitude in radians, and $\\lambda$ represents longitude in radians. Stores within the user-specified radius (default 20km) are filtered and sorted in ascending order of proximity.",
        body_style
    ))
    
    code_haversine = """// Distance calculation in db.js using Haversine formula
const toRad = (value) => (value * Math.PI) / 180;
const dLat = toRad(store.lat - lat);
const dLng = toRad(store.lng - lng);
const a = 
  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  Math.cos(toRad(lat)) * Math.cos(toRad(store.lat)) * 
  Math.sin(dLng / 2) * Math.sin(dLng / 2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
const distance = 6371 * c; // returns distance in km"""
    story.append(make_code_block(code_haversine, code_block_style))
    story.append(Spacer(1, 10))
    
    # 4.4 Prescription OCR String Alignment
    story.append(Paragraph("4.4 Prescription OCR Text Alignment &amp; Keyword Matcher", h2_style))
    story.append(Paragraph(
        "<b>NLP/Token Matching Logic:</b> When a prescription is scanned via Tesseract.js, the text is sent to the backend. The matcher splits the raw text into line strings. For each line, it removes all punctuation/non-alphanumeric chars, converts words to lowercase, and splits them into discrete tokens. It then cross-references each token set with database medicines.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Strength Score:</b> The keyword match strength is calculated as:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>Match Strength</b> = [ Count of overlapping tokens ] / [ Total words in medicine brand name ]<br/>"
        "If the match strength is $\\ge 0.5$ (representing at least 50% keyword match) or if the line contains the exact brand name substring, the medicine is flagged as a match. This threshold accounts for minor OCR errors (e.g. 'Crocn' instead of 'Crocin').",
        body_style
    ))
    
    code_ocr = """// Token Matching snippet in server.js
for (const line of lines) {
  const tokens = line.toLowerCase().replace(/[^a-zA-Z0-9\\s]/g, ' ').split(/\\s+/);
  for (const medicine of medicines) {
    const brandWords = medicine.brandName.toLowerCase().split(/\\s+/);
    const matchScore = brandWords.filter(word => tokens.includes(word)).length;
    const matchStrength = matchScore / brandWords.length;
    
    if (matchStrength >= 0.5 || line.toLowerCase().includes(medicine.brandName.toLowerCase())) {
      if (!matched.some(m => m.id === medicine.id)) matched.push(medicine);
    }
  }
}"""
    story.append(make_code_block(code_ocr, code_block_style))
    story.append(PageBreak())
    
    # 4.5 Fake Medicine Detection
    story.append(Paragraph("4.5 Medicine Authentication &amp; Anti-Counterfeit Verification Heuristics", h2_style))
    story.append(Paragraph(
        "<b>Heuristic Scoring System:</b> To protect users from counterfeit drugs, the platform includes a batch verification module. It runs batch numbers and manufacturer names through a scoring system mapping physical packaging criteria:",
        body_style
    ))
    story.append(Paragraph(
        "&nbsp;&nbsp;&nbsp;&nbsp;1. <b>Length Check:</b> Standard pharmaceutical batch numbers range from 5 to 15 characters. If the length is outside this boundary, risk score increases by $+30$.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;2. <b>Character Set Check:</b> Batch numbers must be strictly alphanumeric with optional dashes. The presence of other special characters increases risk by $+25$.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;3. <b>Numeric Purity:</b> Real manufacturer batch numbers incorporate letters to segment batches. A purely numeric string increases risk by $+20$.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;4. <b>Suspect Sequence:</b> Checks for commonly faked or default patterns (e.g. '12345', 'ABCDE', 'FAKE', 'TEST'). If present, risk increases by $+45$.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;5. <b>Manufacturer Verification:</b> Cross-references manufacturer against a verified Indian registry. Non-verification increases risk by $+10$.",
        body_style
    ))
    story.append(Paragraph(
        "The cumulative score is capped at 100. Results are classified as <b>Low Risk</b> (&le; 35), <b>Medium Risk</b> (36 - 65), or <b>High Risk</b> (&gt; 65) with custom safety recommendations.",
        body_style
    ))
    
    code_fake = """// Anti-Counterfeit Batch scoring in server.js
let riskScore = 15; // baseline risk
if (cleanBatch.length < 5 || cleanBatch.length > 15) riskScore += 30;
if (!/^[A-Z0-9-]+$/.test(cleanBatch)) riskScore += 25;
if (/^[0-9]+$/.test(cleanBatch)) riskScore += 20;
if (suspectSequences.some(seq => cleanBatch.includes(seq))) riskScore += 45;
if (manufacturer && !verifiedRegistry.includes(manufacturer.toLowerCase())) riskScore += 10;
riskScore = Math.min(100, riskScore);"""
    story.append(make_code_block(code_fake, code_block_style))
    story.append(Spacer(1, 10))
    
    # 4.6 Stock Depletion & Restock Forecaster
    story.append(Paragraph("4.6 Stock Depletion &amp; Restock Forecaster", h2_style))
    story.append(Paragraph(
        "<b>Logic:</b> To predict when a pharmacy might run out of a generic drug, the system checks the medicine's availability status. If the stock status is 'Available', it checks the therapeutic category and current month. If the category is Respiratory or Antibiotics and the month corresponds to the Monsoon period (June to September), it sets a 'Medium Risk' level with a remaining stock estimate of $12-22$ days due to monsoon demand surges. Standard medicines default to $45$ remaining days. Simulated weekly sales velocity and estimated restock dates are dynamically calculated to model inventory.",
        body_style
    ))
    
    story.append(PageBreak())
    
    # ----------------------------------------------------
    # SECTION 5: API ENDPOINTS REFERENCE
    # ----------------------------------------------------
    story.append(Paragraph("5. Complete REST API Endpoints Specification", h1_style))
    story.append(Paragraph(
        "The backend server exposes the following endpoints to serve analytical widgets, coordinates queries, and predictions models.",
        body_style
    ))
    
    api_headers = [
        Paragraph("<b>Method &amp; Endpoint</b>", table_header_style), 
        Paragraph("<b>Input Params</b>", table_header_style), 
        Paragraph("<b>Output JSON / Logic</b>", table_header_style)
    ]
    
    api_rows = [
        api_headers,
        [
            Paragraph("<b>GET</b> /api/health", table_cell_style),
            Paragraph("None", table_cell_style),
            Paragraph("{ status: 'ok', time: 'ISO Timestamp' }<br/>Used for client latency checks.", table_cell_style)
        ],
        [
            Paragraph("<b>GET</b> /api/medicines", table_cell_style),
            Paragraph("query (String, optional)", table_cell_style),
            Paragraph("Returns matching list of brand/generic drugs. Evaluates against composition and EAN barcode.", table_cell_style)
        ],
        [
            Paragraph("<b>GET</b> /api/medicines/:id", table_cell_style),
            Paragraph("id (Number in path)", table_cell_style),
            Paragraph("Details of specific medicine, including side effects, warnings, dosage form, and safety schedules.", table_cell_style)
        ],
        [
            Paragraph("<b>GET</b> /api/analytics", table_cell_style),
            Paragraph("None", table_cell_style),
            Paragraph("Returns price summaries, list of top overpriced medicines, category average prices, and regional premiums.", table_cell_style)
        ],
        [
            Paragraph("<b>GET</b> /api/stores", table_cell_style),
            Paragraph("lat, lng (Numbers)<br/>radius (Number, optional)", table_cell_style),
            Paragraph("Finds pharmacies within radius using the <b>Haversine formula</b>. Returns sorted list with distance.", table_cell_style)
        ],
        [
            Paragraph("<b>GET</b> /api/trends", table_cell_style),
            Paragraph("horizon (Number, default 6)", table_cell_style),
            Paragraph("Provides historical volumes and forecasts generic demand using <b>Linear Regression with seasonality</b>.", table_cell_style)
        ],
        [
            Paragraph("<b>POST</b> /api/predict-price", table_cell_style),
            Paragraph("Body: { brandPrice: Num, category: Str }", table_cell_style),
            Paragraph("Returns generic price range and savings percent based on therapeutic markups and bulk adjustments.", table_cell_style)
        ],
        [
            Paragraph("<b>POST</b> /api/parse-prescription", table_cell_style),
            Paragraph("Body: { text: String }", table_cell_style),
            Paragraph("Parses raw OCR text. Matches brand drug tokens and returns net cost savings summaries.", table_cell_style)
        ],
        [
            Paragraph("<b>GET</b> /api/stock/predict/:id", table_cell_style),
            Paragraph("id (Number in path)", table_cell_style),
            Paragraph("Returns supply risk levels, remaining days of stock, weekly sales velocity, and simulated restock dates.", table_cell_style)
        ],
        [
            Paragraph("<b>POST</b> /api/fake-detection", table_cell_style),
            Paragraph("Body: { batchNumber: Str, manufacturer: Str }", table_cell_style),
            Paragraph("Runs the batch scoring heuristic system. Returns risk scores (0-100), risk levels, and guidelines.", table_cell_style)
        ],
        [
            Paragraph("<b>POST</b> /api/chat", table_cell_style),
            Paragraph("Body: { message: Str, history: Arr }", table_cell_style),
            Paragraph("Sends message to Gemini API. Falls back to local keyword responses if offline.", table_cell_style)
        ],
        [
            Paragraph("<b>GET</b> /api/disease-search", table_cell_style),
            Paragraph("query (String)", table_cell_style),
            Paragraph("Maps symptoms (e.g. fever, diabetes) to drug classes and returns top generic recommendations.", table_cell_style)
        ]
    ]
    
    t_api = Table(api_rows, colWidths=[130, 114, 260])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_api)
    story.append(PageBreak())
    
    # ----------------------------------------------------
    # SECTION 6: FEATURE WALKTHROUGH
    # ---------------------------------------    story.append(Paragraph("6. Feature-by-Feature Implementation Walkthrough", h1_style))
    story.append(Paragraph(
        "The React frontend implements fourteen service dashboards that communicate with the backend APIs. Below is a detailed, step-by-step description of how each feature functions.",
        body_style
    ))
    
    story.append(Paragraph("<b>1. Console Overview Dashboard:</b>", h2_style))
    story.append(Paragraph(
        "A highly visual, animated landing dashboard (OverviewDashboard.tsx) serving as the main entry point. It displays a dynamic time-based greeting banner using assets ('/refill_tracker_header.png'), live counters for total pocket savings accumulated in the local Health Wallet database, a dynamic SVG radial progress savings dial that animates its stroke layout on mount, upcoming family medicine scheduler notifications, and responsive quick-launcher navigation cards for other key system modules.",
        body_style
    ))

    story.append(Paragraph("<b>2. Alternative Finder:</b>", h2_style))
    story.append(Paragraph(
        "A central search dashboard (RecommendationSystem.tsx) allowing users to search by branded names (e.g. Crocin, Lipitor) or compositions. It triggers `/api/medicines?query=...` on input. It displays the generic chemical equivalents, pre-calculated savings (up to 80%), safety schedules, dosage forms, and side effects. It contains a <b>Voice Search</b> widget that uses the Web Speech API (speechRecognition) to capture audio medicine names, and a <b>Barcode Scanner</b> using device camera to parse EAN-13 barcodes, allowing users to scan packaging directly.",
        body_style
    ))
    
    story.append(Paragraph("<b>3. Prescription Cost Optimizer:</b>", h2_style))
    story.append(Paragraph(
        "Allows users to upload images of physical prescriptions (PrescriptionOptimizer.tsx). The frontend runs Tesseract.js directly inside the browser, rendering a progress bar while extracting raw characters. The extracted text is then POSTed to `/api/parse-prescription` to isolate drug names and calculate potential savings. Users can download a compiled PDF saving report (using jsPDF) or share the savings summary via a generated QR code (QRPrescription component) which can be scanned by other devices.",
        body_style
    ))
    
    story.append(Paragraph("<b>4. Nearby Pharmacy Locator:</b>", h2_style))
    story.append(Paragraph(
        "Locates nearby stores (NearbyShops.tsx). It uses the browser's Geolocation API (`navigator.geolocation.getCurrentPosition`) to fetch the user's GPS coordinates, sending them to `/api/stores?lat=...&lng=...`. The backend filters stores using the Haversine formula and returns them sorted by distance. It lists government Jan Aushadhi Kendras and private generic chemists, shows phone contacts, addresses, opening hours, and cross-references stock availability for the queried medicine, letting users verify stock before traveling.",
        body_style
    ))
    
    story.append(Paragraph("<b>5. Price Analysis Dashboard:</b>", h2_style))
    story.append(Paragraph(
        "Displays financial analytics (PriceAnalysisDashboard.tsx) for market intelligence. It calls `/api/analytics` to render Recharts Bar and Line graphs showing top overpriced branded medicines, potential total savings margins, average pricing comparing branded vs generic across categories, and regional pricing differences in India.",
        body_style
    ))
    
    story.append(Paragraph("<b>6. Market Intelligence:</b>", h2_style))
    story.append(Paragraph(
        "A forecasting dashboard (MarketIntelligence.tsx) for research. It queries `/api/trends?horizon=6`. It draws an interactive Area Chart showing historical sales volumes alongside the Linear Regression forecasted demands. It also uses Recharts Pie charts to show market shares (e.g. Janaushadhi Kendra dominates at 42%, followed by private generic divisions).",
        body_style
    ))
    
    story.append(Paragraph("<b>7. Safety Analyzer:</b>", h2_style))
    story.append(Paragraph(
        "A diagnostic tool (SafetyAnalyzer.tsx) focusing on chemical schedules. It details safety categories (OTC, Schedule H, Schedule H1), listing warnings and side effects. For Schedule H/H1 medicines, it displays a warnings banner urging the user to obtain a doctor's signature before purchasing.",
        body_style
    ))
    
    story.append(Paragraph("<b>8. Fake Medicine Detector:</b>", h2_style))
    story.append(Paragraph(
        "An anti-counterfeiting verification widget (FakeDetector.tsx). The user enters a medicine's batch number and manufacturer. The client calls `/api/fake-detection`, which runs the 5-rule heuristic checker. The screen displays the risk score with a colored gauge (Green for Low Risk, Orange for Medium Risk, Red for High Risk), outlines the specific warning factors found, and provides safety protocols.",
        body_style
    ))
    
    story.append(Paragraph("<b>9. Health Wallet:</b>", h2_style))
    story.append(Paragraph(
        "A personal savings account tracker (HealthWallet.tsx). Users log their prescription purchases (medicine, quantity, price paid). The component saves this data to the browser's localStorage, displaying a cumulative wallet balance representing the total money saved by choosing generic alternatives. It displays progress cards and savings milestones.",
        body_style
    ))
    
    story.append(Paragraph("<b>10. Savings Calculator:</b>", h2_style))
    story.append(Paragraph(
        "An interactive cost estimator (SavingsCalculator.tsx). Users use sliders to input their current monthly branded medicine costs. The tool calculates monthly, yearly, and 5-year savings, providing cost-saving visual metrics (e.g., equivalent to buying a mobile phone, paying school fees, or buying insurance).",
        body_style
    ))
    
    story.append(Paragraph("<b>11. Government Scheme Awareness:</b>", h2_style))
    story.append(Paragraph(
        "An educational portal (SchemeAwareness.tsx) detailing national health schemes. It outlines PMBJP guidelines, eligibility parameters, step-by-step application checklists, and offers an interactive Ayushman Bharat (PM-JAY) checker.",
        body_style
    ))
    
    story.append(Paragraph("<b>12. GenMed AI Chatbot Assistant:</b>", h2_style))
    story.append(Paragraph(
        "A floating chat widget (Chatbot.tsx) available across all pages. The user chats about side effects, alternatives, or schemes. The request POSTs to `/api/chat`. If `GEMINI_API_KEY` is loaded in the backend `.env` file, the server queries the Gemini API for clinical, conversational responses. If offline or if the key is missing, the server runs a local keyword matching system to return pre-configured responses, ensuring the bot remains functional.",
        body_style
    ))
 
    story.append(Paragraph("<b>13. Generic Substitute Scanner:</b>", h2_style))
    story.append(Paragraph(
        "An interactive barcode scanner simulation dashboard (GenericSubstituteScanner.tsx). Users can select from a pre-defined grid of popular Indian branded medicines to simulate scanning a physical package's barcode. The screen flashes on match success, and fetches full data including side-by-side cost comparisons, composition details, and stock statuses. It features an interactive monthly usage range slider that dynamically updates monthly and annual savings calculations based on the user's prescription consumption levels.",
        body_style
    ))
 
    story.append(Paragraph("<b>14. Medicine Reminder &amp; Refill Tracker:</b>", h2_style))
    story.append(Paragraph(
        "A calendar daily timeline and pill stock management dashboard (MedicineReminder.tsx). Users configure dosage reminders specifying medicine names, daily time slots (Morning, Afternoon, Evening, Night), and patient names for family schedules (Self, Father, Mother, Spouse). Dosage consumption can be checked off as 'taken' (which automatically decrements local inventory stock) or 'skipped'. If remaining pill counts fall below a custom threshold, the system displays dynamic low stock alerts and provides a reorder shortcut to find generic alternatives nearby.",
        body_style
    ))
    
    story.append(PageBreak())
    
    # ----------------------------------------------------
    # SECTION 7: SUMMARY & SYSTEM CONCLUSION
    # ----------------------------------------------------
    story.append(Paragraph("7. Architectural Scalability &amp; Recommendations", h1_style))
    story.append(Paragraph(
        "The current implementation of GenMed Hub™ demonstrates a highly functional local prototype. To transition this product to a national production scale, we recommend the following engineering roadmap:",
        body_style
    ))
    story.append(Paragraph(
        "<b>1. Migration from Flat JSON to a Relational/NoSQL Database:</b><br/>"
        "The mock JSON database system (`db.json`) is read and written synchronously via filesystem calls. While sufficient for single-user dev testing, this will fail under concurrent user loads. We recommend migrating to PostgreSQL (for ACID compliance on user transactions and purchase histories) or MongoDB (for flexible document storage of heterogeneous medicine compositions). Spatial queries for pharmacies can be optimized using PostgreSQL's PostGIS extension or MongoDB's 2dsphere indexing, replacing the javascript-level Haversine calculation.",
        body_style
    ))
    story.append(Paragraph(
        "<b>2. Production OCR Pipeline Optimization:</b><br/>"
        "Tesseract.js performs character extraction locally inside the client's browser. While this provides offline privacy, performance depends on user device hardware. A production application should support hybrid OCR: client-side processing for fast previews, with an option to offload complex images to a cloud OCR service (such as Google Cloud Vision API) for superior text extraction.",
        body_style
    ))
    story.append(Paragraph(
        "<b>3. Enterprise AI Chat Integration:</b><br/>"
        "The current chatbot relies on a basic fallback system if the Gemini key is absent. For production, we recommend deploying a Retrieval-Augmented Generation (RAG) pipeline. This would index official government PMBJP drug databases and CDSCO safety guidelines, embedding them in a vector database. The chat agent can then query this index to provide accurate, verified medical advice.",
        body_style
    ))
    
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>End of Technical Documentation.</b>", meta_style))
    
    # Compile the PDF using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {pdf_filename}")

if __name__ == "__main__":
    build_pdf()

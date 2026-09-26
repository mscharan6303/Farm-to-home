import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, KeepTogether
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#4A5568"))
        
        # Header (Pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "Farm to Home — Complete Technical & Operational Blueprint (A to Z)")
            self.setStrokeColor(colors.HexColor("#CBD5E0"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
            
        # Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_str)
        self.drawString(54, 36, "Author: M. S. Charan | Repository: github.com/mscharan6303/Farm-to-home")
        self.setStrokeColor(colors.HexColor("#CBD5E0"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        
        self.restoreState()

def build_pdf(filename="Farm_to_Home_Complete_Documentation.pdf"):
    pdf_path = os.path.join(os.getcwd(), filename)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=64,
        bottomMargin=64
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Palette
    PRIMARY = colors.HexColor("#1B4332")     # Deep Forest Green
    SECONDARY = colors.HexColor("#2D6A4F")   # Medium Green
    ACCENT = colors.HexColor("#52B788")      # Soft Leaf Green
    DARK_TEXT = colors.HexColor("#1A202C")   # Near Black
    LIGHT_BG = colors.HexColor("#F7FAFC")    # Cool Light Off-White
    BORDER_COLOR = colors.HexColor("#E2E8F0")# Border Grey
    HIGHLIGHT_BG = colors.HexColor("#E6F4EA")# Light Green Tint

    # Custom Typography Styles
    styles.add(ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=PRIMARY,
        alignment=0,
        spaceAfter=8
    ))
    
    styles.add(ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=17,
        textColor=SECONDARY,
        spaceAfter=15
    ))

    styles.add(ParagraphStyle(
        'MetaText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#4A5568")
    ))

    styles.add(ParagraphStyle(
        'MetaTextBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=14,
        textColor=PRIMARY
    ))

    styles.add(ParagraphStyle(
        'SecHeading1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=PRIMARY,
        spaceBefore=18,
        spaceAfter=8,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'SecHeading2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14.5,
        textColor=DARK_TEXT,
        spaceAfter=8
    ))

    styles.add(ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14.5,
        textColor=DARK_TEXT,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    ))

    styles.add(ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#1C4532")
    ))

    styles.add(ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=colors.white,
        alignment=0
    ))

    styles.add(ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=DARK_TEXT,
        alignment=0
    ))

    styles.add(ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=PRIMARY,
        alignment=0
    ))

    story = []

    # ---------------------------------------------------------
    # COVER / HEADER BLOCK
    # ---------------------------------------------------------
    story.append(Paragraph("FARM TO HOME", styles['DocTitle']))
    story.append(Paragraph("Complete Technical Architecture, Supply Chain & Operational Blueprint (A to Z)", styles['DocSubtitle']))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceBefore=0, spaceAfter=12))

    meta_data = [
        [Paragraph("<b>Author & Developer:</b> M. S. Charan", styles['MetaText']),
         Paragraph("<b>Architecture:</b> Direct Farm-to-Consumer (F2C)", styles['MetaText'])],
        [Paragraph("<b>GitHub Repository:</b> <font color='#2D6A4F'><u>https://github.com/mscharan6303/Farm-to-home.git</u></font>", styles['MetaText']),
         Paragraph("<b>Tech Stack:</b> React, Node.js, Express, MongoDB, Socket.io", styles['MetaText'])],
        [Paragraph("<b>Document Version:</b> 1.0.0 (Production Release)", styles['MetaText']),
         Paragraph("<b>Core Model:</b> Demand-Driven Daily Harvest & 90% Net Farmer Payout", styles['MetaText'])]
    ]
    meta_table = Table(meta_data, colWidths=[270, 234])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # ---------------------------------------------------------
    # SECTION 1: EXECUTIVE SUMMARY & VISION
    # ---------------------------------------------------------
    story.append(Paragraph("1. Executive Summary & Vision", styles['SecHeading1']))
    story.append(Paragraph(
        "<b>Farm to Home</b> is an end-to-end Direct Farm-to-Consumer (F2C) e-commerce ecosystem designed to revolutionize agricultural distribution in India. "
        "Traditional supply chains involve up to 4 to 6 layers of intermediaries (wholesalers, mandis, commission agents, regional distributors, and neighborhood retailers). "
        "This legacy model results in severe profit exploitation—where farmers earn less than 25-30% of consumer payments—and high post-harvest wastage due to extended transit times and prolonged warehouse cold storage.",
        styles['BodyCustom']
    ))
    story.append(Paragraph(
        "Farm to Home replaces intermediary exploitation with a <b>transparent, technology-driven direct model</b>. "
        "The platform guarantees that <b>90% of gross produce sales are paid directly to farmers</b>, while retaining a modest 10% platform commission fee to sustain technology and logistics operations.",
        styles['BodyCustom']
    ))

    callout_data = [[
        Paragraph(
            "<b>💡 Core Value Proposition:</b> Direct connectivity between farmers and consumers. Zero warehouse stock hoarding, guaranteed 90% net earnings for local farmers, and morning-harvested produce delivered straight to consumer doorsteps.",
            styles['CalloutText']
        )
    ]]
    callout_table = Table(callout_data, colWidths=[504])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HIGHLIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 1, ACCENT),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(callout_table)
    story.append(Spacer(1, 12))

    # ---------------------------------------------------------
    # SECTION 2: FRESHNESS MODEL & LOGISTICS WORKFLOW
    # ---------------------------------------------------------
    story.append(Paragraph("2. Produce Freshness Guarantee & Supply Chain Logistics", styles['SecHeading1']))
    story.append(Paragraph(
        "A primary concern in fresh produce distribution is ensuring absolute freshness without relying on artificial preservatives or long-term cold storage. "
        "Farm to Home operates on a <b>Demand-Driven Harvest Model</b> rather than a inventory-hoarding retail model.",
        styles['BodyCustom']
    ))

    story.append(Paragraph("A. How Freshness is Guaranteed (Harvest-on-Demand)", styles['SecHeading2']))
    story.append(Paragraph("• <b>Zero Warehouse Stocking:</b> Unlike traditional supermarkets that store vegetables in distribution hubs for days, Farm to Home maintains zero inventory in central warehouses.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Morning Harvest Execution:</b> Produce listed on the platform is harvested by farmers early in the morning based on confirmed incoming consumer orders.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Direct Hub Aggregation:</b> Harvested packages are brought to local fulfillment hubs by 7:00 AM, where delivery agents immediately pick them up for doorstep delivery.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Harvest Availability Toggle:</b> Farmers possess live control via their dashboard to toggle operational status (`🟢 Harvesting Active` vs `🔴 Harvesting Paused`). If adverse weather or field replenishment occurs, harvesting is paused instantly, preventing stale orders.", styles['BulletCustom']))

    story.append(Paragraph("B. Managing Multi-Day Produce Shelf Life (e.g., Tomatoes, Brinjals)", styles['SecHeading2']))
    story.append(Paragraph(
        "Certain produce items like Tomatoes, Brinjals, Onions, and Potatoes naturally remain fresh for 4 to 7 days post-harvest. "
        "Questions often arise regarding how large quantities are handled when harvested in bulk:",
        styles['BodyCustom']
    ))
    story.append(Paragraph("1. <b>Batch Harvesting per Customer Order Volume:</b> Farmers do not harvest tons of produce speculatively. They monitor real-time order volumes on their dashboard and pick only the quantity required to fulfill confirmed orders.", styles['BulletCustom']))
    story.append(Paragraph("2. <b>Field Preservation:</b> Crops remain unharvested on the plant until an order is locked, which preserves peak nutrient density and natural freshness superior to post-harvest cold storage.", styles['BulletCustom']))
    story.append(Paragraph("3. <b>Multi-Day Listing & Stock Caps:</b> When farmers list items like Tomatoes, they set precise available stock caps (`kg`). As stock sells out, the status automatically updates, prompting fresh harvest scheduling.", styles['BulletCustom']))

    story.append(Paragraph("C. Step-by-Step Delivery Logistics Workflow", styles['SecHeading2']))
    
    workflow_data = [
        [Paragraph("Stage", styles['TableHeader']), Paragraph("Operational Action", styles['TableHeader']), Paragraph("Stakeholder Involved", styles['TableHeader'])],
        [Paragraph("1. Order Placement", styles['TableCellBold']), Paragraph("Customer selects fresh produce, applies discounts/FarmPass, and places order online.", styles['TableCell']), Paragraph("Consumer", styles['TableCell'])],
        [Paragraph("2. Demand Aggregation", styles['TableCellBold']), Paragraph("Orders are automatically grouped by farmer and displayed on the Farmer Dashboard.", styles['TableCell']), Paragraph("System Engine", styles['TableCell'])],
        [Paragraph("3. Morning Harvest", styles['TableCellBold']), Paragraph("Farmer inspects demand, harvests fresh produce at dawn, and packages items.", styles['TableCell']), Paragraph("Local Farmer", styles['TableCell'])],
        [Paragraph("4. Hub Drop-off", styles['TableCellBold']), Paragraph("Farmer drops off packaged orders at the local delivery hub by morning.", styles['TableCell']), Paragraph("Farmer & Hub Coordinator", styles['TableCell'])],
        [Paragraph("5. Task Lock & Pickup", styles['TableCellBold']), Paragraph("Delivery Agent reviews orders in Agent Panel, checks <b>Accept Task</b> (locks order exclusively), and loads items.", styles['TableCell']), Paragraph("Delivery Agent", styles['TableCell'])],
        [Paragraph("6. Doorstep Delivery", styles['TableCellBold']), Paragraph("Agent delivers fresh items, collects COD cash if applicable, verifies payment (`Paid ✅`), and marks order `Delivered 🎉`.", styles['TableCell']), Paragraph("Delivery Agent & Customer", styles['TableCell'])]
    ]
    wf_table = Table(workflow_data, colWidths=[100, 274, 130])
    wf_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(wf_table)
    story.append(Spacer(1, 14))

    # ---------------------------------------------------------
    # SECTION 3: SYSTEM ARCHITECTURE & TECH STACK
    # ---------------------------------------------------------
    story.append(Paragraph("3. System Architecture & Technology Stack", styles['SecHeading1']))
    story.append(Paragraph(
        "Farm to Home is built using a modern, scalable full-stack JavaScript architecture utilizing the MERN stack (MongoDB, Express, React, Node.js) paired with WebSocket real-time communication.",
        styles['BodyCustom']
    ))

    tech_data = [
        [Paragraph("Layer / Subsystem", styles['TableHeader']), Paragraph("Technology Chosen", styles['TableHeader']), Paragraph("Technical Purpose & Functionality", styles['TableHeader'])],
        [Paragraph("Frontend UI Core", styles['TableCellBold']), Paragraph("React 18 + Vite", styles['TableCell']), Paragraph("High-performance single page application (SPA) with lightning-fast modular component rendering.", styles['TableCell'])],
        [Paragraph("State Management", styles['TableCellBold']), Paragraph("React Context API", styles['TableCell']), Paragraph("Global state management for authentication tokens (`AuthContext`) and dynamic cart items (`CartContext`).", styles['TableCell'])],
        [Paragraph("Styling & Icons", styles['TableCellBold']), Paragraph("Custom CSS3 + React Icons", styles['TableCell']), Paragraph("Fully mobile-responsive, modern CSS design without external heavy CSS frame overhead.", styles['TableCell'])],
        [Paragraph("Backend Server API", styles['TableCellBold']), Paragraph("Node.js + Express.js", styles['TableCell']), Paragraph("RESTful API handling routing, middleware authentication, payment simulation, and database CRUD operations.", styles['TableCell'])],
        [Paragraph("Database Storage", styles['TableCellBold']), Paragraph("MongoDB + Mongoose ODM", styles['TableCell']), Paragraph("Flexible document store mapping Users, Products, Orders, Video Ads, and Subscriptions with strict schemas.", styles['TableCell'])],
        [Paragraph("Real-Time Messaging", styles['TableCellBold']), Paragraph("Socket.io (WebSockets)", styles['TableCell']), Paragraph("Direct live chat channel connecting customers and farmers for instant produce inquiry.", styles['TableCell'])],
        [Paragraph("Multi-Tab State Sync", styles['TableCellBold']), Paragraph("CloudSync Event Listeners", styles['TableCell']), Paragraph("Synchronizes state (cart updates, order status changes) seamlessly across multiple open browser tabs.", styles['TableCell'])],
        [Paragraph("Media Infrastructure", styles['TableCellBold']), Paragraph("Cloudinary CDN + HTML5", styles['TableCell']), Paragraph("Optimized storage and streaming for high-definition produce images and farmer promotional video ads.", styles['TableCell'])]
    ]
    tech_table = Table(tech_data, colWidths=[110, 130, 264])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 14))

    # ---------------------------------------------------------
    # SECTION 4: THE 4 CORE PANELS BREAKDOWN
    # ---------------------------------------------------------
    story.append(Paragraph("4. Complete Module & Dashboard Breakdown (The 4 Core Panels)", styles['SecHeading1']))

    story.append(Paragraph("A. 🛒 Customer Dashboard & Shopping Storefront", styles['SecHeading2']))
    story.append(Paragraph("• <b>Promotional Video Ads Carousel:</b> Displays farmer video ads at the top of the homepage. Features interactive <i>🛒 Add to Cart</i> and <i>⚡ Order Now</i> overlay buttons. If no video ads are active, the container auto-hides for a 100% clean UI.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Category Navigation & Produce Catalog:</b> Allows instant filtering across <i>Vegetables, Fruits, Dairy, Grains, and Organic Specials</i> with search and pricing filters.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Dynamic Checkout & FarmPass Integration:</b> Calculates item subtotal, applies 10% FarmPass discount if subscribed, handles delivery address input, and supports COD or Online Payments.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Real-Time Order Tracking & Live Chat:</b> Customers track order fulfillment progress step-by-step and can initiate live Socket.io chat with the farmer.", styles['BulletCustom']))

    story.append(Paragraph("B. 🌾 Farmer Dashboard & Seller Portal", styles['SecHeading2']))
    story.append(Paragraph("• <b>Harvest Availability Switch:</b> Master switch allowing farmers to set `🟢 Harvesting Active` or `🔴 Harvesting Paused` status.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Net 90% Financial Summary:</b> Live metrics displaying Total Orders, Gross Sales, 10% Platform Fee, and <b>Net 90% Take-Home Earnings</b>.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Produce Catalog Management (CRUD):</b> Add new crops, edit prices/stock, upload images, and set organic tags.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Promotional Video Ad Creator:</b> Farmers can publish video ads for their produce, mapping the video to a specific item and selecting duration (1, 3, 7, 15, or 30 Days).", styles['BulletCustom']))

    story.append(Paragraph("C. 🛵 Delivery Agent Panel & Logistics Hub", styles['SecHeading2']))
    story.append(Paragraph("• <b>Hub Package Overview:</b> View morning produce packages dropped off by local farmers.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Single-Agent Order Lock:</b> Delivery drivers review available orders and click <b>Accept Task</b>. This instantly locks the task to that specific agent, preventing double-assignment.", styles['BulletCustom']))
    story.append(Paragraph("• <b>COD Payment Verification:</b> Drivers collect cash on delivery, mark payment status as `Paid ✅`, and update order delivery state.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Customer Contact Transparency:</b> Clear display of customer name, phone number, and delivery address.", styles['BulletCustom']))

    story.append(Paragraph("D. 👑 Master Platform Admin Control Center (5 Master Tabs)", styles['SecHeading2']))
    story.append(Paragraph("• <b>Tab 1: Financials & Payouts:</b> Master platform revenue metrics (GMV, 10% Platform Fee, 90% Net Farmer Payouts). Features **Clickable Farmer Financial Statement Modals** detailing delivered produce items, total sales, 90% farmer profit, 10% platform profit, and a **Paid ✅ / Unpaid ⏳ Payout Selector**.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Tab 2: Product Catalog Control:</b> Full master CRUD (Add, Edit, Delete) across all listed produce.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Tab 3: Orders Master Control:</b> Complete order governance, status overrides, COD payment overrides, order deletion, and **Assigned Delivery Agent Details**.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Tab 4: User & Accounts Directory:</b> Full control over Customer, Farmer, Delivery Agent, and Admin accounts with activate/suspend options.", styles['BulletCustom']))
    story.append(Paragraph("• <b>Tab 5: Video Ads Control:</b> Admin governance over all farmer promotional video ads, including creation, approval, and deletion.", styles['BulletCustom']))

    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # SECTION 5: FINANCIAL & MONETIZATION MODEL
    # ---------------------------------------------------------
    story.append(Paragraph("5. Platform Financial Architecture & Monetization", styles['SecHeading1']))
    story.append(Paragraph(
        "The financial model is engineered to prioritize farmer prosperity while maintaining self-sustaining platform economics.",
        styles['BodyCustom']
    ))

    fin_data = [
        [Paragraph("Financial Component", styles['TableHeader']), Paragraph("Percentage / Amount", styles['TableHeader']), Paragraph("Operational Allocation & Purpose", styles['TableHeader'])],
        [Paragraph("Net Farmer Payout", styles['TableCellBold']), Paragraph("90.0% of Gross Sales", styles['TableCell']), Paragraph("Transferred directly to the producing farmer as take-home net profit.", styles['TableCell'])],
        [Paragraph("Platform Commission", styles['TableCellBold']), Paragraph("10.0% of Gross Sales", styles['TableCell']), Paragraph("Retained by the platform owner to cover cloud hosting, server API maintenance, and payment processing fees.", styles['TableCell'])],
        [Paragraph("Standard Shipping Fee", styles['TableCellBold']), Paragraph("₹49 per order", styles['TableCell']), Paragraph("Charged on non-premium orders under ₹300; paid to delivery agents for fulfillment.", styles['TableCell'])],
        [Paragraph("FarmPass Pass Revenue", styles['TableCellBold']), Paragraph("₹499 / month", styles['TableCell']), Paragraph("100% platform revenue stream providing consumers with free delivery and 10% extra discounts.", styles['TableCell'])]
    ]
    fin_table = Table(fin_data, colWidths=[130, 120, 254])
    fin_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(fin_table)
    story.append(Spacer(1, 14))

    # ---------------------------------------------------------
    # SECTION 6: FARMPASS SUBSCRIPTION & ACCOUNT PERSISTENCE
    # ---------------------------------------------------------
    story.append(Paragraph("6. FarmPass Subscription Engine & Account Persistence", styles['SecHeading1']))
    story.append(Paragraph(
        "<b>FarmPass Premium</b> is the platform's flagship customer loyalty subscription program priced at ₹499/month. "
        "Subscribers enjoy <b>Unlimited Free Delivery</b> on all orders and a <b>Flat 10% Extra Discount</b> applied automatically during checkout.",
        styles['BodyCustom']
    ))
    story.append(Paragraph("• <b>💳 Online Payment Gateway Modal:</b> Customers can subscribe via a sleek online modal supporting simulated instant UPI transfers (`farmtohome@upi`) or Credit/Debit Card processing.", styles['BulletCustom']))
    story.append(Paragraph("• <b>🔒 Permanent Account-Level Persistence:</b> Premium membership is tied directly to the user's account email (`premium_sub_<email>`). When a user logs out and logs back in, their FarmPass Premium badge and discount benefits are permanently restored without loss of status.", styles['BulletCustom']))

    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # SECTION 7: DEPLOYMENT & LOCAL EXECUTION GUIDE
    # ---------------------------------------------------------
    story.append(Paragraph("7. Local Setup, Execution & Repository Structure", styles['SecHeading1']))
    story.append(Paragraph(
        "The project is structured into standard `backend` and `frontend` directories for seamless local development and production deployment.",
        styles['BodyCustom']
    ))

    cmd_data = [
        [Paragraph("Step", styles['TableHeader']), Paragraph("Command Execution", styles['TableHeader']), Paragraph("Notes / Description", styles['TableHeader'])],
        [Paragraph("1. Clone Repo", styles['TableCellBold']), Paragraph("`git clone https://github.com/mscharan6303/Farm-to-home.git`", styles['TableCell']), Paragraph("Clone official master repository.", styles['TableCell'])],
        [Paragraph("2. Backend Setup", styles['TableCellBold']), Paragraph("`cd backend && npm install && npm run dev`", styles['TableCell']), Paragraph("Starts Express server on port 5000.", styles['TableCell'])],
        [Paragraph("3. Frontend Setup", styles['TableCellBold']), Paragraph("`cd frontend && npm install && npm run dev`", styles['TableCell']), Paragraph("Launches Vite dev server at http://localhost:5173.", styles['TableCell'])],
        [Paragraph("4. Build Verification", styles['TableCellBold']), Paragraph("`cd frontend && npm run build`", styles['TableCell']), Paragraph("Compiles production distribution bundle cleanly.", styles['TableCell'])]
    ]
    cmd_table = Table(cmd_data, colWidths=[90, 234, 180])
    cmd_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(cmd_table)
    story.append(Spacer(1, 16))

    # ---------------------------------------------------------
    # CONCLUSION & SIGN OFF
    # ---------------------------------------------------------
    story.append(Paragraph("8. Conclusion & Project Sign-Off", styles['SecHeading1']))
    story.append(Paragraph(
        "Farm to Home stands as a robust, fully implemented Direct Farm-to-Consumer e-commerce platform. "
        "By uniting demand-driven harvesting, real-time logistics locking, farmer video advertising, 90% net farmer payout transparency, and multi-panel admin governance, "
        "the application bridges the gap between rural farmers and urban households efficiently and ethically.",
        styles['BodyCustom']
    ))
    story.append(Paragraph(
        "<b>Project Creator & Lead Developer:</b> M. S. Charan<br/>"
        "<b>Repository URL:</b> <font color='#2D6A4F'><u>https://github.com/mscharan6303/Farm-to-home.git</u></font>",
        styles['BodyCustom']
    ))

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"SUCCESS: PDF generated cleanly at {pdf_path}")

if __name__ == "__main__":
    filename = "Farm_to_Home_Complete_Documentation.pdf"
    if len(sys.argv) > 1:
        filename = sys.argv[1]
    build_pdf(filename)

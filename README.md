# 🌿 Port Moresby Nature Park — Modern Website Revamp

An ultra-fast, mobile-first, conversion-optimized web platform redesigned for **Port Moresby Nature Park** (Papua New Guinea's premier wildlife sanctuary and botanical gardens).

This project was built to replace their existing outdated, broken WordPress website with a high-performance, accessible, and user-friendly experience designed to dramatically increase ticket reservations, school excursion bookings, and 2026 annual membership sales.

---

## 📊 Before vs. After Comparison Table

| Feature / Metric | Existing Site (`portmoresbynaturepark.com.pg`) | New Upgraded Platform |
| :--- | :--- | :--- |
| **Technology Stack** | Heavy WordPress + Astra + Elementor + Slider Revolution + 6 Plugins | Clean Modern HTML5, Semantic CSS3, Vanilla ES6 JavaScript (Zero bloat) |
| **Mobile Speed** | ⚠️ Slow (loads 2560px uncompressed images, heavy blocking scripts) | ⚡ Sub-second load time, optimized for Digicel & Vodafone PNG mobile networks |
| **Primary Menu** | 🚨 Contains broken demo links (`http://source.wpopal.com/...`) & `#` dead ends | ✅ 100% working navigation with deep link anchors |
| **Admission Pricing** | ❌ Missing or buried deep inside post archives | 🎟️ **Live Interactive Admission Fee Calculator** in Papua New Guinea Kina (PGK) |
| **Park Hours** | ❌ Hard to find on homepage | 🕒 **Live Status Ticker** showing current operating hours (UTC+10 PNG time) |
| **School Excursions** | ❌ Single plain paragraph, no booking form | 🎒 Dedicated Education Hub + One-Click School Excursion Reservation Form |
| **Lead Generation** | ❌ Empty social links (`href=""`) & dummy contact anchors | 📲 **Instant WhatsApp Direct Inquiry** (`+675 7230 1805`) + Native Modal Dialogs |
| **Wildlife Showcase** | ❌ Raw static images without details | 🦘 Interactive Filterable Gallery with Tree Kangaroo, Bird of Paradise, Cassowary |
| **Membership Sales** | ❌ Basic text snippet | 💳 Tiered 2026 Membership Hub (Individual K150, Family K350, Corporate CSR) |

---

## 🎯 Key Features Included

1. **Top Live Visitor Ticker**
   - Real-time park status indicator automatically calculating whether the sanctuary is currently open or opening tomorrow based on Port Moresby local time (UTC+10).
   - Direct click-to-call and quick WhatsApp links.

2. **Live Admission & Pass Calculator**
   - Interactive quantity controls for Adults (K15), Children (K10), Students (K12), and International Tourists (K35).
   - Automatically computes total in Kina and pre-fills into the reservation engine.

3. **Interactive Wildlife & Flora Explorer**
   - Filter tabs: *All Species*, *Iconic Wildlife*, *Birds of Paradise*, *Tropical Flora*, *Reptiles*.
   - Modal drawer revealing scientific names, IUCN conservation status, natural habitat, and educational bios.

4. **School Excursion Booking Engine**
   - Dedicated portal highlighting curriculum-aligned outdoor learning for the 35,000+ students visiting annually.
   - Built-in date picker, student count estimator, and special requests field.

5. **2026 Annual Membership Hub**
   - Clear value propositions for Individual Passes (K150/yr) and Family Passes (K350/yr) with 5% gift shop and 10% venue hire discounts.

6. **Instant WhatsApp Pre-Filled Messaging**
   - When visitors or teachers submit a reservation inquiry, it formats the details directly into a WhatsApp chat message addressed to `+675 7230 1805` for immediate response.

---

## 💼 Agency Resale Pitch & Pricing Guide

When presenting this prototype to the Port Moresby Nature Park management board and commercial marketing team:

### 1. The Opening Hook
> *"Port Moresby Nature Park is Papua New Guinea’s award-winning sanctuary, but your current website has leftover placeholder links from a theme developer, broken menu items, and lacks an upfront ticket and excursion booking system. We built a working, ultra-fast upgrade that fixes every issue and turns mobile visitors directly into paying guests."*

### 2. Recommended Pricing Packages (PNG Market)

* **Tier 1: Core Modern Revamp (K5,000 – K6,500 PGK)**
  * Full homepage overhaul, fixed navigation, Plan Your Visit guide, interactive animal gallery, WhatsApp integration, mobile responsive design.
* **Tier 2: Business & School Booking Engine (K8,500 – K12,000 PGK)**
  * Everything in Tier 1 + School Excursion automated booking system, 2026 Membership registration portal, and Event RSVP forms.
* **Tier 3: Full Digital Experience & Ticketing (K15,000 – K25,000 PGK)**
  * Everything above + online payment gateway integration (BSP / local card processing), digital membership barcode generation, and souvenir shop catalog.

---

## 🚀 How to Run Locally

You don't need any complex build tools. Simply:

1. Double-click `index.html` to open it in your web browser.
2. Or run a local dev server with Node/Python:
   ```bash
   npx serve .
   # or
   python -m http.server 8080
   ```

---

*Designed & Developed with modern web standards (accessible `<dialog>`, `<details>` accordions, CSS Grid, and zero external framework dependencies).*

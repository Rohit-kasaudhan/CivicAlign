# CivicAlign 🏛️🤖
### *A Platform Where Citizens and AI Unite to Turn Community Challenges into Lasting Progress*

CivicAlign is a government-grade, citizen-centric platform that connects community members with local administrations. By leveraging a multi-agent AI reasoning pipeline powered by **Google Gemini**, CivicAlign converts unstructured, fragmented citizen complaints (potholes, garbage piling, water leaks, etc.) into structured, prioritized municipal development plans and long-term master roadmaps.

---

## 📖 Table of Contents
1. [Problem Statement](#-problem-statement)
2. [Solution Overview](#-solution-overview)
3. [System Architecture & AI Pipeline](#-system-architecture--ai-pipeline)
4. [Key Features](#-key-features)
5. [Project Structure](#-project-structure)
6. [Local Development Setup](#-local-development-setup)
7. [Cloud Deployment Guide](#-cloud-deployment-guide)
8. [Gamification & Civic Points](#-gamification--civic-points)

---

## 🚨 Problem Statement
Urban communities frequently face infrastructure issues such as potholes, overflowing garbage, broken streetlights, damaged roads, water leakage, and unsafe public spaces. Although citizens report these issues through various channels, municipalities often struggle with:
* **Fragmented & Unstructured Data**: Grievances are submitted in vague formats without proper categorization or priority tags.
* **Redundant Reports**: Administrators are overwhelmed by duplicate complaints for the same issues.
* **Inefficient Prioritization**: Hard to determine which issues have the highest social, safety, or economic impact.
* **Lack of Transparency & Trust**: Citizens submit complaints into a "black box." The lack of status updates and progress roadmaps leads to severe civic apathy and distrust in local government.

---

## 💡 Solution Overview
CivicAlign bridges the gap between citizens and local governance through a collaborative, gamified, and AI-driven ecosystem:
* **For Citizens**: Provides a mobile-responsive interface to report local issues with photos, videos, and GPS coordinates. Active citizens earn **Civic Points** and **Badges** (e.g., *Change Maker*, *Civic Legend*) for reporting and verifying neighborhood reports, turning civic duty into a rewarding experience.
* **For Governments**: Introduces the **Municipal Development Console**. Individual complaints are processed through a 5-Agent pipeline to generate immediate action roadmaps, budgets, and timelines, automatically clustering reports into **1-Year Roadmaps** and **3-Year Master Development Plans**.

---

## ⚙️ System Architecture & AI Pipeline

When a complaint is submitted, it is processed asynchronously through a **5-Agent AI reasoning pipeline** powered by **Google Gemini**, followed by an automated database **Auto-Cluster Service**:

```
[ Citizen Report ] ──► [ Evidence Agent ] ──► [ Categorisation Agent ] ──► [ Duplicate Agent ]
                                                                                   │
                                                      ┌────────────────────────────┴──────────┐
                                                      ▼ (No Duplicate)                        ▼ (Duplicate)
                                            [ Impact Agent ]                   [ Route to: Under Review ]
                                                      │                                       │
                                                      ▼                                       ▼
                                            [ Solution Agent ] ──────────────────────► [ Database ]
                                                                                              │
                                                                                              ▼
                                                                                   [ Auto-Cluster Service ]
                                                                                              │
                                                                                              ▼
                                                                                  [ 1-Year & 3-Year Plans ]
```

### **Pipeline Components**

| Step | Type | Component | Role & Output |
| :--- | :--- | :--- | :--- |
| **1** | **AI Agent** | **Evidence Verification Agent** | Analyzes uploaded media (images/video) for authenticity, filters spam, and produces an evidence confidence score. |
| **2** | **AI Agent** | **Categorisation Agent** | Automatically classifies the primary category (e.g., Roads, Drainage, Sanitation) and subcategory. |
| **3** | **AI Agent** | **Duplicate Detection Agent** | Compares reports using semantic similarity; routes duplicates to *"Under Review"* and merges them with the parent ticket. |
| **4** | **AI Agent** | **Impact Assessment Agent** | Calculates severity grade, estimated citizens affected, public danger rating, and urgency level. |
| **5** | **AI Agent** | **Solution Planning Agent** | Drafts immediate, short-term, and long-term action plans; assigns responsible municipal departments, budgets, and timelines. |
| **6** | **Service** | **Auto-Cluster Service** | Database helper that groups related complaints into large-scale civic **Initiatives** and links them to Master Development Plans. |

---

## ✨ Key Features
* 🛡️ **Automated Triage**: Zero human triaging is required to categorize, assess severity, and check duplicates.
* 🗺️ **Interactive Leaflet Map**: Public and Admin maps showing real-time geographic clusters, category filters, and live statistical metrics.
* 🏆 **Gamified Leaderboards**: gold, silver, and bronze citizen podiums displaying ranks, badges, and weekly growth sparklines.
* 🏛️ **Municipal Console**: Smart administrative view for planning, department assignments, budget reviews, and progress tracking.
* 🗳️ **Community Verification**: Citizens act as a distributed field-validation network by upvoting and verifying active local issues.

---

## 📁 Project Structure
```text
civicalign/
│
├── backend/                  # Flask REST API
│   ├── app/
│   │   ├── agents/           # Gemini AI Pipeline Agents
│   │   ├── models/           # SQLAlchemy DB Models
│   │   ├── routes/           # Blueprints (Auth, Complaints, Admin, Analytics)
│   │   └── services/         # Gamification, Notification, Clustering services
│   ├── run.py                # Server entry point
│   ├── seed.py               # Demo database seeder
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # React Single Page App (Vite)
│   ├── src/
│   │   ├── api/              # Axios configuration & api routes
│   │   ├── components/       # Common layouts, timelines, and modals
│   │   ├── context/          # Auth, Toast, and Notification contexts
│   │   ├── pages/            # Admin & Citizen routing views (Dashboard, Maps, Leaderboards)
│   │   └── utils/            # Mappings, helpers, and translations
│   ├── vercel.json           # Vercel SPA routing redirects configuration
│   └── package.json          # Node dependencies
│
└── render.yaml               # Render Infrastructure-as-Code Blueprint
```

---

## 💻 Local Development Setup

### **1. Backend (Flask)**
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file inside the `backend/` folder and populate it (refer to the environment variables section).
5. Seed the database with demo accounts and complaints:
   ```bash
   python seed.py
   ```
6. Start the development server:
   ```bash
   python run.py
   ```
   *The server runs locally at `http://localhost:5000`.*

### **2. Frontend (Vite / React)**
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend/` folder:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
   *The client runs locally at `http://localhost:5173`.*

---

## ☁️ Cloud Deployment Guide

### **Backend (Render)**
1. Connect your repository to **[Render.com](https://render.com/)**.
2. Click **New** $\rightarrow$ **Blueprint** and import this repository.
3. Render will read `render.yaml` and configure the Flask web service automatically.
4. Input your environment variables in the Render Dashboard when prompted (database URLs, Gemini API Key, etc.).

### **Frontend (Vercel)**
1. Log into your **[Vercel.com](https://vercel.com/)** dashboard.
2. Click **Add New...** $\rightarrow$ **Project** and import the repository.
3. Set the **Root Directory** to `frontend`.
4. Keep **Vite** as the framework preset.
5. Expand the **Environment Variables** section and add:
   * `VITE_GOOGLE_CLIENT_ID` = your Google client ID
   * `VITE_API_URL` = `https://your-backend-on-render.com/api` (include the `/api` suffix)
6. Click **Deploy**.

---

## 🔑 Required Environment Variables

### **Backend Variables (`backend/.env`)**
* `SECRET_KEY`: Random string for encrypting sessions.
* `JWT_SECRET_KEY`: Random string for JWT verification.
* `DATABASE_URL`: Connection URL of your Neon PostgreSQL database.
* `GEMINI_API_KEY`: API Key obtained from Google AI Studio.
* `GOOGLE_MAPS_API_KEY`: API Key for maps geocoding.
* `GOOGLE_CLIENT_ID`: Google OAuth client ID.
* `GOOGLE_CLIENT_SECRET`: Google OAuth client secret.
* `MAIL_SERVER` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD`: Google SMTP config for OTP emails.

### **Frontend Variables (`frontend/.env`)**
* `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID.
* `VITE_API_URL`: Path to backend API (e.g. `http://localhost:5000/api` locally or `https://backend.onrender.com/api` in production).

---

## 🏆 Gamification & Civic Points

Citizens are awarded points for taking constructive actions, helping unlock badge titles:

### **Points Distribution**
* **Submit a Complaint**: `+10` points
* **Submit Validating Media**: `+15` points
* **Verify a Neighbor's Report**: `+10` points
* **Complaint Approved by Admin**: `+20` points
* **Complaint Resolved by Municipality**: `+50` points

### **Ranks & Milestone Badges**
* 🛡️ **Reporter**: `0` points
* 📢 **Community Voice**: `100` points
* ⚡ **Change Maker**: `300` points
* 🏛️ **Civic Guardian**: `600` points
* 🏆 **Civic Hero**: `1,000` points
* 🌟 **Civic Legend**: `2,000` points

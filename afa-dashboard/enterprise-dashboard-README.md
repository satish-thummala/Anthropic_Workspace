# Enterprise Performance & Decision Cockpit (EPDC)
## Executive Dashboard - Multi-Entity Performance Intelligence Platform

An enterprise-grade dashboard application inspired by AFA Group's Digital Transformation Architecture. This platform consolidates performance metrics, risk indicators, and operational intelligence across multiple business entities in a single, visually striking management cockpit.

---

## 📋 Project Overview

### Vision
Provide board-ready, actionable insights enabling:
- **Faster decisions** through real-time visibility and exception alerts
- **Better governance** with standardized KPIs and ownership accountability
- **Strategic control** by correlating traffic, revenue, costs, asset health, and project delivery

### Key Features
1. **Executive Dashboard (Centerpiece)**
   - Board & EXCO cockpit with group KPIs and risk flags
   - Real-time exception alerts and trend analysis
   - Cross-entity performance correlation
   
2. **Enterprise Performance Views**
   - Multi-dimensional analytics across all business entities
   - Department-specific dashboards for Finance, Operations, Projects, HR, Compliance
   - Asset health tracking and maintenance indicators

3. **Data Integration Layer**
   - Middleware platform integration
   - SAP/Oracle ERP connectors
   - Real-time streaming infrastructure
   - AI-powered predictive analytics
   - Data warehouse aggregation
   - Cybersecurity & compliance monitoring

4. **Advanced Visualizations**
   - KPI cards with trend indicators
   - Executive-grade charts and graphs
   - Heat maps for risk assessment
   - Timeline and correlation views
   - Real-time alerts dashboard

---

## 🏗️ Architecture

### Tech Stack
- **Backend**: Java (Spring Boot)
- **Frontend**: React with TypeScript
- **Data Integration**: REST APIs, WebSocket for real-time updates
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Redux/Context API
- **Charts**: Recharts, Chart.js
- **Real-time**: WebSocket connections for live data

### Project Structure
```
enterprise-dashboard/
├── backend/
│   ├── src/main/java/com/afa/epdc/
│   │   ├── controller/              # REST endpoints
│   │   ├── service/                 # Business logic
│   │   ├── repository/              # Data access
│   │   ├── model/                   # Domain entities
│   │   ├── config/                  # Application config
│   │   ├── util/                    # Utilities
│   │   └── exception/               # Custom exceptions
│   ├── resources/
│   │   ├── application.properties    # Configuration
│   │   └── data.sql                 # Sample data
│   └── pom.xml                      # Maven dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/              # Reusable React components
│   │   │   ├── ExecutiveDashboard/
│   │   │   ├── KPICard/
│   │   │   ├── Charts/
│   │   │   └── Alerts/
│   │   ├── pages/                   # Page components
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── services/                # API services
│   │   ├── store/                   # Redux store
│   │   ├── styles/                  # Global styles
│   │   ├── utils/                   # Helper functions
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
│
├── docker-compose.yml               # Docker setup
└── README.md
```

---

## 🔌 Data Sources (Dummy Integration Points)

### 1. Middleware Platform
- Aggregates data from multiple business systems
- Provides unified API for data access
- Handles data transformation and normalization

### 2. SAP/Oracle Integration
- Financial data (revenue, costs, budgets)
- Procurement and contract management
- Asset register and maintenance schedules

### 3. Real-time Streaming Infrastructure
- Live operational metrics (toll volume, throughput)
- Asset health sensors and IoT data
- Event stream processing

### 4. AI Prediction Engine
- Predictive analytics for trend forecasting
- Anomaly detection for risk flagging
- ML-based KPI forecasting

### 5. Data Warehouse
- Historical data aggregation
- Time-series analysis
- Performance benchmarking

### 6. Cybersecurity Stack
- Compliance monitoring
- Access control and audit trails
- Threat detection and incident alerts

---

## 📊 Dashboard Pages

### 1. Executive Dashboard (Main)
**Most Important - Centerpiece**
- **KPI Summary Grid**: Group KPIs with trend indicators
- **Risk Heat Map**: Entity and department risk levels
- **Alert Center**: Real-time exceptions and action items
- **Performance Correlation**: Traffic ↔ Revenue ↔ Cost ↔ Asset Health ↔ Delivery
- **Trend Analysis**: Weekly/monthly/quarterly trends
- **Entity Comparison**: Performance across all AFA entities

### 2. Enterprise Performance View
- **Revenue Dashboard**: by entity, department, source
- **Cost Management**: budget vs. actual, cost drivers
- **Asset Health**: condition score, maintenance needs
- **Project Delivery**: on-time delivery %, scope changes, budget variance

### 3. Department Dashboards
- Finance & Treasury metrics
- Operations & Toll Monitoring
- Project Delivery progress
- HR & Compliance status
- Maintenance & Asset Management

### 4. Real-time Operations
- Live traffic and toll data
- System health monitoring
- Incident tracking and resolution
- Performance anomalies

---

## 🎨 Design Philosophy

### Visual Hierarchy
- **Enterprise-grade**: Professional, governance-focused design
- **Management-focused**: Key metrics prominent and actionable
- **Operationally intelligent**: Correlation views enable strategic trade-offs

### Color Palette (Midnight Executive)
- Primary: `#1E2761` (Navy)
- Secondary: `#CADCFC` (Ice Blue)
- Accent: `#00B4D8` (Cyan)
- Success: `#06D6A0` (Mint)
- Warning: `#FFB703` (Amber)
- Critical: `#FB5607` (Red)

### Typography
- Headers: Cambria (serif, authority)
- Body: Inter (clean, modern)
- Data: IBM Plex Mono (precision)

---

## 🚀 Getting Started

### Backend Setup
```bash
cd backend
mvn clean install
mvn spring-boot:run
# Server runs on http://localhost:8080
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
# App runs on http://localhost:3000
```

### Docker Compose
```bash
docker-compose up -d
```

---

## 📡 API Endpoints

### Executive Dashboard
- `GET /api/dashboard/executive` - Main dashboard data
- `GET /api/dashboard/kpis` - All KPI values and trends
- `GET /api/dashboard/alerts` - Real-time alerts
- `GET /api/dashboard/correlations` - Cross-dimensional correlations

### Entities & Departments
- `GET /api/entities` - List all business entities
- `GET /api/entities/{id}/performance` - Entity performance
- `GET /api/departments` - Department list
- `GET /api/departments/{id}/metrics` - Department metrics

### Analytics
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/costs` - Cost analysis
- `GET /api/analytics/assets` - Asset health
- `GET /api/analytics/projects` - Project delivery
- `GET /api/analytics/trends` - Historical trends

### Real-time
- `WebSocket /ws/live` - Real-time data feed
- `GET /api/realtime/status` - System health

---

## 📈 Key Performance Indicators (KPIs)

### Financial KPIs
- Total Revenue (Month-to-Date)
- Revenue Variance vs. Target
- Cost Run Rate
- Cost Variance %
- Gross Margin %
- Operating Cash Flow

### Operational KPIs
- Daily Traffic Volume
- Toll Collection Rate %
- System Uptime %
- Incident Count (24h)
- MTTR (Mean Time To Repair)

### Project KPIs
- On-Time Delivery Rate
- Budget Variance %
- Scope Change Count
- Resource Utilization %
- Deliverable Quality Score

### Compliance KPIs
- Audit Readiness %
- Policy Compliance Rate
- Incident Resolution Time
- Risk Exposure Score

---

## 🔐 Security & Governance

- Role-based access control (RBAC)
- Data encryption in transit & at rest
- Audit logging for all actions
- API rate limiting and throttling
- CORS and CSRF protection

---

## 📦 Dependencies

### Backend (Maven)
- Spring Boot 2.7+
- Spring Data JPA
- Spring WebSocket
- H2 Database (dev) / PostgreSQL (prod)
- Lombok
- JUnit 5

### Frontend (npm)
- React 18+
- Redux Toolkit
- React Router
- Tailwind CSS
- Recharts / Chart.js
- Axios
- WebSocket client

---

## 🎯 Next Steps

1. Review the Executive Dashboard component
2. Explore the API endpoints and sample data
3. Customize KPIs and metrics for your organization
4. Integrate with real data sources
5. Configure deployment and security policies

---

## 📚 Resources

- [AFA Group Presentation](https://afa.group/)
- Spring Boot Documentation
- React Documentation
- Tailwind CSS Documentation

---

## 📝 License

Proprietary - Enterprise Dashboard Platform

---

**Built for intelligent decision-making across the enterprise.** 🚀

# 🏗️ Enterprise Dashboard - Architecture & Visualization Guide

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ENTERPRISE ECOSYSTEM                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  SAP/Oracle      │  │  Real-time       │  │  AI Prediction   │      │
│  │  Financial Data  │  │  Streaming       │  │  Engine          │      │
│  │  (Port 9000)     │  │  Infrastructure  │  │  (Port 9003)     │      │
│  │                  │  │  (Port 9002)     │  │                  │      │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘      │
│           │                     │                     │                  │
│           │                     │                     │                  │
│           └─────────────┬───────┴──────────┬──────────┘                 │
│                         │                  │                            │
│            ┌────────────▼──────────────────▼─────────┐                 │
│            │                                         │                 │
│            │   MIDDLEWARE INTEGRATION LAYER          │                 │
│            │   (Data Aggregation & Normalization)    │                 │
│            │                                         │                 │
│            └────────────┬──────────────────┬─────────┘                 │
│                         │                  │                            │
│  ┌──────────────────────┘                  └──────────────────────┐   │
│  │                                                                 │   │
│  ▼                                                                 ▼   │
│ ┌─────────────────────────────┐    ┌──────────────────────────────┐  │
│ │   DATA WAREHOUSE            │    │   CYBERSECURITY STACK        │  │
│ │   (Historical Aggregation)  │    │   (Compliance, Audit Logs)   │  │
│ │   (Port 9004)               │    │   (Port 9005)                │  │
│ └─────────────┬───────────────┘    └──────────────────────────────┘  │
│               │                                                        │
│               └──────────────────────────┬──────────────────────────┐ │
│                                          │                          │ │
└──────────────────────────────────────────┼──────────────────────────┼─┘
                                           │                          │
                    ┌──────────────────────▼──────────────────────┐   │
                    │                                              │   │
                    │   POSTGRESQL DATABASE                        │   │
                    │   (Entities, KPIs, Alerts, Metrics)          │   │
                    │                                              │   │
                    └──────────────────────┬──────────────────────┘   │
                                           │                          │
                         ┌─────────────────┴──────────────────┐       │
                         │                                    │       │
                    ┌────▼────────────────────────────────────▼───┐  │
                    │                                              │  │
                    │   JAVA SPRING BOOT BACKEND                  │  │
                    │   (REST APIs, WebSocket, Business Logic)    │  │
                    │   Port: 8080                                │  │
                    │                                              │  │
                    │   ┌─────────────────────────────────────┐   │  │
                    │   │ Controllers:                        │   │  │
                    │   │ - DashboardController               │   │  │
                    │   │ - EntityController                  │   │  │
                    │   │ - AnalyticsController               │   │  │
                    │   │ - RealtimeController                │   │  │
                    │   └─────────────────────────────────────┘   │  │
                    │                                              │  │
                    │   ┌─────────────────────────────────────┐   │  │
                    │   │ Services:                           │   │  │
                    │   │ - DashboardService                  │   │  │
                    │   │ - EntityService                     │   │  │
                    │   │ - AnalyticsService                  │   │  │
                    │   │ - RealtimeService                   │   │  │
                    │   └─────────────────────────────────────┘   │  │
                    │                                              │  │
                    │   ┌─────────────────────────────────────┐   │  │
                    │   │ WebSocket Endpoint: /ws/live        │   │  │
                    │   └─────────────────────────────────────┘   │  │
                    │                                              │  │
                    └────┬────────────────────────────────────────┘  │
                         │                                            │
         ┌───────────────┼────────────────────────────────────────┐ │
         │               │                                        │ │
         │    REST/JSON  │        WebSocket (Real-time)          │ │
         │               │                                        │ │
         ▼               ▼                                        ▼ │
    ┌────────────────────────────────────────────────────────────────┐
    │                                                                  │
    │   REACT FRONTEND (Nginx)                                        │
    │   Port: 3000                                                    │
    │                                                                  │
    │   ┌──────────────────────────────────────────────────────────┐ │
    │   │ ExecutiveDashboard (THE CENTERPIECE)                    │ │
    │   │                                                          │ │
    │   │ ┌────────────┐  ┌──────────────┐  ┌──────────────────┐ │ │
    │   │ │ KPI Cards  │  │Alert Center  │  │Correlations View│ │ │
    │   │ │(6 metrics) │  │(Real-time)   │  │(Traffic→Revenue)│ │ │
    │   │ └────────────┘  └──────────────┘  └──────────────────┘ │ │
    │   │                                                          │ │
    │   │ ┌────────────┐  ┌──────────────┐  ┌──────────────────┐ │ │
    │   │ │Revenue vs  │  │Risk HeatMap  │  │Entity Comparison│ │ │
    │   │ │Cost Charts │  │(7x6 matrix)  │  │(Bar Chart)      │ │ │
    │   │ └────────────┘  └──────────────┘  └──────────────────┘ │ │
    │   │                                                          │ │
    │   │ ┌────────────────────────────────────────────────────┐ │ │
    │   │ │ 12-Month Trend Analysis (Line Chart)               │ │ │
    │   │ └────────────────────────────────────────────────────┘ │ │
    │   └──────────────────────────────────────────────────────────┘ │
    │                                                                  │
    │   Additional Pages:                                             │
    │   - Entity Detail Dashboard                                     │
    │   - Analytics Dashboard                                         │
    │   - Real-time Operations Monitor                                │
    │                                                                  │
    └──────────────────────────────────────────────────────────────────┘
         │
         │  Browser/Desktop/Mobile
         │
    ┌────▼─────────────────────────────────┐
    │  User (Executive/Manager/Analyst)     │
    │  Board Member, EXCO, Department Heads │
    └──────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA COLLECTION LAYER                        │
│                                                                      │
│  SAP    Oracle    Streaming    AI Engine    Warehouse    Security   │
│  │        │          │           │           │            │        │
│  └────────┴──────────┴───────────┴───────────┴────────────┘        │
│                        │                                            │
└────────────────────────┼────────────────────────────────────────────┘
                         │
                    [Normalize & Aggregate]
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE PLATFORM                              │
│                  Data Reconciliation Layer                          │
└────────────────────────┬────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌────────┐      ┌────────┐      ┌────────┐
    │Financial│     │Operational│    │Project │
    │Data     │     │Data      │    │Data    │
    └────┬───┘     └────┬─────┘     └────┬──┘
         │               │               │
         │      ┌────────┴───────┐      │
         │      │                │      │
         └──────┼────────────────┼──────┘
                │                │
                ▼                ▼
         ┌──────────────────────────┐
         │  PostgreSQL Database     │
         │                          │
         │  Tables:                 │
         │  - entities              │
         │  - kpis                  │
         │  - alerts                │
         │  - metrics               │
         │  - assets                │
         │  - projects              │
         │  - audit_logs            │
         │  - users                 │
         └────────┬─────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
    ┌────────────────────────────┐
    │   JAVA SPRING BOOT         │
    │                            │
    │   Services Layer:          │
    │   ├─ DashboardService      │
    │   ├─ EntityService         │
    │   ├─ AnalyticsService      │
    │   └─ RealtimeService       │
    │                            │
    │   Data Processing:         │
    │   ├─ Aggregation           │
    │   ├─ Correlation           │
    │   ├─ Forecasting           │
    │   └─ Risk Scoring          │
    │                            │
    └────────┬──────────────────┘
             │
    ┌────────┴──────────────┐
    │                       │
    ▼                       ▼
 REST/JSON              WebSocket
 HTTP APIs              Real-time Stream
    │                       │
    │      ┌────────────────┘
    │      │
    ▼      ▼
 ┌──────────────────────────────┐
 │   REACT FRONTEND             │
 │                              │
 │   Redux Store:               │
 │   ├─ dashboardSlice          │
 │   ├─ entitySlice             │
 │   ├─ alertSlice              │
 │   └─ realtimeSlice           │
 │                              │
 │   Components:                │
 │   ├─ ExecutiveDashboard      │
 │   ├─ KPICard                 │
 │   ├─ AlertCenter             │
 │   ├─ RiskHeatMap             │
 │   ├─ CorrelationView         │
 │   ├─ EntityComparison        │
 │   └─ TrendAnalysis           │
 │                              │
 └────────────┬─────────────────┘
              │
              ▼
         ┌─────────┐
         │  User   │
         └─────────┘
```

---

## Dashboard Component Structure

```
ExecutiveDashboard (Main Container)
│
├── Header
│   ├── Logo + Title
│   ├── Timeframe Toggle (MTD, YTD, 12M)
│   ├── Last Updated Time
│   └── Auto-refresh Toggle
│
├── Executive Summary Bar (4 Cards)
│   ├── Total Entities
│   ├── Active Alerts
│   ├── Critical Issues
│   └── Overall Performance Score
│
├── KPI Grid (6 Cards)
│   ├── KPICard (Revenue MTD)
│   ├── KPICard (Traffic 24H)
│   ├── KPICard (Cost Run Rate)
│   ├── KPICard (Asset Health)
│   ├── KPICard (On-Time Delivery)
│   └── KPICard (Compliance Rate)
│
├── Row 1: Alerts & Correlations
│   ├── AlertCenter
│   │   ├── Alert 1 (CRITICAL)
│   │   ├── Alert 2 (WARNING)
│   │   ├── Alert 3 (WARNING)
│   │   └── Alert 4 (INFO)
│   │
│   └── CorrelationView
│       ├── Traffic ↔ Revenue
│       ├── Gross Margin
│       ├── Asset Health
│       └── Delivery Performance
│
├── Row 2: Charts
│   ├── Revenue vs Cost Trend (ComposedChart)
│   │   ├── Area: Revenue
│   │   └── Line: Cost
│   │
│   └── Traffic Volume Trend (AreaChart)
│       └── Area: Traffic
│
├── Row 3: Heat Map & Comparison
│   ├── RiskHeatMap
│   │   └── 7 Entities × 6 Departments Matrix
│   │
│   └── EntityComparison
│       └── Bar Chart (Score vs Margin)
│
├── Row 4: Trends
│   └── TrendAnalysis
│       └── 12-Month Line Chart
│
└── Footer
    └── Copyright & Version Info
```

---

## Database Schema

```
┌────────────────────────┐
│       entities         │
├────────────────────────┤
│ id (PK)                │
│ code                   │
│ name                   │
│ description            │
│ department             │
│ status                 │
│ created_date           │
│ updated_date           │
└────────────────────────┘
         │
         ├─── 1:N ──→ ┌─────────────────┐
         │            │      kpis       │
         │            ├─────────────────┤
         │            │ id (PK)         │
         │            │ entity_id (FK)  │
         │            │ code            │
         │            │ name            │
         │            │ category        │
         │            │ current_value   │
         │            │ target_value    │
         │            │ unit            │
         │            │ status          │
         │            │ trend_percent   │
         │            │ last_updated    │
         │            └─────────────────┘
         │
         ├─── 1:N ──→ ┌─────────────────┐
         │            │     alerts      │
         │            ├─────────────────┤
         │            │ id (PK)         │
         │            │ entity_id (FK)  │
         │            │ severity        │
         │            │ type            │
         │            │ title           │
         │            │ message         │
         │            │ status          │
         │            │ created_date    │
         │            └─────────────────┘
         │
         ├─── 1:N ──→ ┌─────────────────┐
         │            │    metrics      │
         │            ├─────────────────┤
         │            │ id (PK)         │
         │            │ entity_id (FK)  │
         │            │ metric_code     │
         │            │ value           │
         │            │ dimension       │
         │            │ recorded_date   │
         │            │ year, month     │
         │            └─────────────────┘
         │
         ├─── 1:N ──→ ┌─────────────────┐
         │            │     assets      │
         │            ├─────────────────┤
         │            │ id (PK)         │
         │            │ entity_id (FK)  │
         │            │ asset_code      │
         │            │ asset_name      │
         │            │ asset_type      │
         │            │ status          │
         │            │ health_score    │
         │            │ condition       │
         │            │ last_maint_date │
         │            │ criticality     │
         │            └─────────────────┘
         │
         └─── 1:N ──→ ┌─────────────────┐
                      │    projects     │
                      ├─────────────────┤
                      │ id (PK)         │
                      │ entity_id (FK)  │
                      │ project_code    │
                      │ project_name    │
                      │ status          │
                      │ progress_pct    │
                      │ budget_alloc    │
                      │ budget_util     │
                      │ start_date      │
                      │ planned_end     │
                      │ risk_score      │
                      └─────────────────┘

┌─────────────────────────┐
│        users            │  (For authentication & audit)
├─────────────────────────┤
│ id (PK)                 │
│ username                │
│ email                   │
│ password (hashed)       │
│ full_name               │
│ role (ADMIN/EXEC/etc)   │
│ entity_id (FK, nullable)│
│ created_date            │
│ last_login_date         │
└─────────────────────────┘

┌─────────────────────────┐
│     audit_logs          │  (For compliance & governance)
├─────────────────────────┤
│ id (PK)                 │
│ user_id (FK)            │
│ action                  │
│ entity                  │
│ entity_id               │
│ old_value               │
│ new_value               │
│ ip_address              │
│ created_date            │
└─────────────────────────┘
```

---

## Request/Response Flow Example

### Executive Dashboard Request

```
USER ACTION
│
├─ Opens http://localhost:3000
│  │
│  └─ React calls useEffect() hook
│     │
│     └─ Axios GET request
│        │
│        └─ http://localhost:8080/api/dashboard/executive
│
BACKEND PROCESSING
│
├─ DashboardController receives request
│  │
│  ├─ Calls DashboardService.getExecutiveDashboard()
│  │  │
│  │  ├─ getDashboardSummary()
│  │  │  └─ Counts entities, alerts, issues
│  │  │
│  │  ├─ getTopKpis()
│  │  │  └─ Queries KPI table, formats each
│  │  │
│  │  ├─ getCriticalAlerts()
│  │  │  └─ Queries alerts table (CRITICAL status)
│  │  │
│  │  ├─ getCorrelationData()
│  │  │  └─ Calculates traffic-revenue correlation
│  │  │
│  │  ├─ getEntityPerformanceOverview()
│  │  │  └─ Calculates score for each entity
│  │  │
│  │  └─ getDashboardMetrics()
│  │     └─ Builds chart data (revenue, cost, traffic)
│  │
│  └─ Returns ExecutiveDashboardDTO
│
RESPONSE
│
└─ JSON response with all dashboard data
   │
   ├─ Summary (4 metrics)
   ├─ KPIs (6 cards)
   ├─ Alerts (4 most critical)
   ├─ Correlations (4 views)
   ├─ Entity Performance (7 entities)
   └─ Metrics (Charts + HeatMap + Trends)

FRONTEND RENDERING
│
├─ React receives JSON
│
├─ Stores in Redux (dashboardSlice)
│
├─ ExecutiveDashboard component re-renders
│  │
│  ├─ Header (displays last updated time)
│  │
│  ├─ Summary Bar (displays 4 numbers)
│  │
│  ├─ KPI Grid (maps 6 KPIs to 6 KPICards)
│  │
│  ├─ AlertCenter (displays 4 alerts)
│  │
│  ├─ CorrelationView (displays 4 correlations)
│  │
│  ├─ Charts (Recharts components)
│  │
│  ├─ RiskHeatMap (7x6 matrix)
│  │
│  ├─ EntityComparison (bar chart)
│  │
│  └─ TrendAnalysis (line chart)
│
└─ User sees complete dashboard in ~2 seconds
```

---

## Real-time WebSocket Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (React)                                            │
│                                                             │
│ useEffect(() => {                                           │
│   ws = new WebSocket('ws://localhost:8080/ws/live')        │
│   ws.onmessage = (event) => {                              │
│     const update = JSON.parse(event.data)                  │
│     dispatch(updateKPI(update))  // Redux update           │
│   }                                                        │
│ })                                                          │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ WebSocket Connection
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend (Java)                                              │
│                                                             │
│ @RestController                                             │
│ public class WebSocketHandler {                             │
│   @SendMessage                                              │
│   public void sendUpdate(RealtimeUpdateDTO update) {       │
│     // Send to all connected clients                       │
│     messagingTemplate.convertAndSend("/ws/live", update)  │
│   }                                                         │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Every 5 seconds
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Data Source (SAP, Streaming, etc.)                         │
│ → Query latest KPI values                                   │
│ → Detect anomalies                                          │
│ → Generate alerts                                           │
│ → Broadcast to all WebSocket clients                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Color Scheme & Branding

```
┌─────────────────────────────────────────────────────────────┐
│                   MIDNIGHT EXECUTIVE PALETTE                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Primary Navy        #1E2761  ███████  (Headers, Sidebar)   │
│  Secondary Navy      #3B48A8  ███████  (Cards, Borders)     │
│  Ice Blue            #CADCFC  ███████  (Accents)            │
│                                                             │
│  Cyan (Action)       #00B4D8  ███████  (Buttons, Links)     │
│  Mint (Success)      #06D6A0  ███████  (Positive trends)    │
│  Amber (Warning)     #FFB703  ███████  (Caution alerts)     │
│  Red (Critical)      #FB5607  ███████  (Critical alerts)    │
│                                                             │
│  Neutral Gray        #94A3B8  ███████  (Text, borders)      │
│  Light Background    #F0F2F7  ███████  (Cards)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture (Docker Compose)

```
┌─────────────────────────────────────────────────────────────┐
│  Docker Network: epdc-network                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐                                       │
│  │   React App     │                                       │
│  │   :3000         │                                       │
│  │   (Nginx)       │                                       │
│  └────────┬────────┘                                       │
│           │                                                │
│           │  HTTP Requests                                │
│           ▼                                                │
│  ┌─────────────────┐                                       │
│  │ Java Backend    │                                       │
│  │ :8080           │                                       │
│  │ Spring Boot     │                                       │
│  └────────┬────────┘                                       │
│           │                                                │
│           │  JDBC Connection                              │
│           ▼                                                │
│  ┌─────────────────┐                                       │
│  │  PostgreSQL     │                                       │
│  │  :5432          │                                       │
│  │  (epdc_db)      │                                       │
│  └─────────────────┘                                       │
│                                                             │
│  ┌─────────────────┐   ┌─────────────────┐               │
│  │  Redis Cache    │   │  Prometheus     │               │
│  │  :6379          │   │  :9090          │               │
│  └─────────────────┘   └────────┬────────┘               │
│                                  │                        │
│                          ┌──────┴───────┐                │
│                          ▼              ▼                │
│                    ┌─────────────┐                       │
│                    │   Grafana   │                       │
│                    │   :3001     │                       │
│                    └─────────────┘                       │
│                                                         │
│  Mock Services for Development:                         │
│  ├─ SAP Mock    (:9000)                                │
│  ├─ Oracle Mock (:9001)                                │
│  ├─ Streaming   (:9002)                                │
│  ├─ AI Engine   (:9003)                                │
│  └─ Warehouse   (:9004)                                │
│                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Design Principles

### 1. **Data Aggregation** 📊
- Consolidate data from 6 integration points
- Normalize and reconcile data
- Create single source of truth

### 2. **Real-time Intelligence** ⚡
- WebSocket for live updates (125ms latency)
- Correlation analysis showing relationships
- Anomaly detection and alerting

### 3. **Executive Focus** 👔
- Most important info above the fold
- Exception-based alerting
- Clear KPIs with context (target, trend, variance)

### 4. **Operational Control** 🎯
- Show whole system, not isolated reports
- Trade-off visibility (revenue vs cost, for example)
- Risk scoring and heat maps

### 5. **Scalability** 📈
- Horizontal scaling ready
- Database indexing for performance
- Caching layer (Redis)
- CDN-ready frontend

---

**Architecture Diagram v1.0 | Last Updated: January 2024**

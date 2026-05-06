# Enterprise Dashboard API Documentation

## Base URL
```
http://localhost:8080/api
```

---

## 📊 Executive Dashboard Endpoints

### GET /dashboard/executive
**THE CENTERPIECE - Main Executive Dashboard**

Complete dashboard data including KPIs, alerts, correlations, and entity performance.

**Request:**
```bash
curl -X GET http://localhost:8080/api/dashboard/executive
```

**Response:**
```json
{
  "success": true,
  "message": "Executive dashboard loaded successfully",
  "data": {
    "summary": {
      "lastUpdated": "2024-01-15T14:30:45",
      "totalEntities": 7,
      "totalAlerts": 12,
      "criticalIssues": 3,
      "healthStatus": "HEALTHY",
      "overallPerformanceScore": 87.5
    },
    "kpis": [
      {
        "id": 1,
        "code": "KPI_REV_MTD",
        "name": "Revenue (MTD)",
        "category": "FINANCIAL",
        "currentValue": 45750000,
        "targetValue": 48000000,
        "unit": "MYR",
        "status": "ON_TRACK",
        "trendPercent": 2.5,
        "trendDirection": "UP",
        "backgroundColor": "#E8F5E9",
        "textColor": "#1B5E20",
        "lastUpdated": "2024-01-15T14:30:45"
      }
    ],
    "alerts": [
      {
        "id": 1,
        "entityName": "AFA Project & Management Services",
        "severity": "CRITICAL",
        "type": "BUDGET_VARIANCE",
        "title": "Cost Overrun Alert",
        "message": "Project P-2024-001 exceeds budget by 8.5%",
        "status": "NEW",
        "createdDate": "2024-01-15T13:30:45",
        "icon": "AlertTriangle",
        "colorClass": "text-red-600"
      }
    ],
    "correlations": {
      "trafficRevenue": {
        "traffic": 285000.0,
        "revenue": 45750000.0,
        "correlationCoefficient": 0.92,
        "trend": "POSITIVE"
      },
      "revenueCoast": {
        "revenue": 45750000,
        "cost": 28500000,
        "margin": 37.7,
        "forecastTrend": "STABLE"
      },
      "costAssetHealth": {
        "maintenanceCost": 2150000,
        "assetHealthScore": 78.5,
        "recommendation": "INCREASE_MAINTENANCE_BUDGET"
      },
      "deliveryVariance": {
        "onTimePercent": 92,
        "budgetVariancePercent": -3,
        "scopeChangeCount": 7,
        "riskLevel": "LOW"
      }
    },
    "entityPerformance": [
      {
        "entityId": 1,
        "entityCode": "AFA-PM",
        "entityName": "AFA Project & Management Services",
        "department": "Project Delivery",
        "performanceScore": 85.0,
        "status": "ON_TRACK",
        "revenue": 52000000,
        "cost": 31000000,
        "profitMargin": 40.38,
        "assetHealthScore": 76.5,
        "projectOnTimePercent": 89,
        "alertCount": 2
      }
    ],
    "metrics": {
      "revenueChart": {
        "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        "values": [42000000, 43500000, 44200000, 45100000, 45750000, 46200000],
        "unit": "MYR"
      },
      "costChart": {
        "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        "values": [26000000, 27100000, 27500000, 28000000, 28500000, 29000000],
        "unit": "MYR"
      },
      "trafficChart": {
        "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        "values": [250000, 260000, 272000, 280000, 285000, 291000],
        "unit": "Vehicles"
      },
      "riskHeatMap": {
        "entities": ["PM", "PRIME", "SS", "CE", "PROP", "ID", "TT"],
        "departments": ["Finance", "Ops", "Projects", "HR", "Compliance", "Assets"],
        "scoreMatrix": [[12, 25, 45, 8, 5, 35], ...],
        "statusMatrix": [["GREEN", "YELLOW", "RED", ...], ...]
      },
      "performanceTrends": [
        {
          "date": "2024-01",
          "value": 85.2,
          "metric": "Overall_Performance"
        }
      ]
    }
  },
  "timestamp": "2024-01-15T14:30:45"
}
```

---

### GET /dashboard/summary
**Dashboard Summary Statistics**

Quick summary of dashboard metrics without full data load.

**Request:**
```bash
curl -X GET http://localhost:8080/api/dashboard/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lastUpdated": "2024-01-15T14:30:45",
    "totalEntities": 7,
    "totalAlerts": 12,
    "criticalIssues": 3,
    "healthStatus": "HEALTHY",
    "overallPerformanceScore": 87.5
  },
  "timestamp": "2024-01-15T14:30:45"
}
```

---

### GET /dashboard/kpis
**All Key Performance Indicators**

Retrieve all KPIs with current values and trends.

**Request:**
```bash
curl -X GET http://localhost:8080/api/dashboard/kpis
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "KPI_REV_MTD",
      "name": "Revenue (MTD)",
      "category": "FINANCIAL",
      "currentValue": 45750000,
      "targetValue": 48000000,
      "unit": "MYR",
      "status": "ON_TRACK",
      "trendPercent": 2.5,
      "trendDirection": "UP"
    },
    ...
  ],
  "timestamp": "2024-01-15T14:30:45"
}
```

---

### GET /dashboard/alerts
**Critical Alerts and Exceptions**

Query parameters:
- `severity` (CRITICAL, WARNING, INFO)
- `status` (NEW, ACKNOWLEDGED, RESOLVED)

**Request:**
```bash
curl -X GET 'http://localhost:8080/api/dashboard/alerts?severity=CRITICAL&status=NEW'
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "entityName": "AFA Project & Management Services",
      "severity": "CRITICAL",
      "type": "BUDGET_VARIANCE",
      "title": "Cost Overrun Alert",
      "message": "Project P-2024-001 exceeds budget by 8.5%",
      "status": "NEW",
      "createdDate": "2024-01-15T13:30:45"
    }
  ],
  "timestamp": "2024-01-15T14:30:45"
}
```

---

### GET /dashboard/correlations
**Metric Correlations and Relationships**

Shows relationships between traffic, revenue, costs, assets, and delivery metrics.

**Request:**
```bash
curl -X GET http://localhost:8080/api/dashboard/correlations
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trafficRevenue": {
      "traffic": 285000.0,
      "revenue": 45750000.0,
      "correlationCoefficient": 0.92,
      "trend": "POSITIVE"
    },
    "revenueCoast": {
      "revenue": 45750000,
      "cost": 28500000,
      "margin": 37.7,
      "forecastTrend": "STABLE"
    },
    "costAssetHealth": {
      "maintenanceCost": 2150000,
      "assetHealthScore": 78.5,
      "recommendation": "INCREASE_MAINTENANCE_BUDGET"
    },
    "deliveryVariance": {
      "onTimePercent": 92,
      "budgetVariancePercent": -3,
      "scopeChangeCount": 7,
      "riskLevel": "LOW"
    }
  },
  "timestamp": "2024-01-15T14:30:45"
}
```

---

### POST /dashboard/alert/{id}/acknowledge
**Acknowledge an Alert**

**Request:**
```bash
curl -X POST http://localhost:8080/api/dashboard/alert/1/acknowledge
```

**Response:**
```json
{
  "success": true,
  "message": "Alert acknowledged",
  "data": {
    "id": 1,
    "status": "ACKNOWLEDGED",
    "acknowledgedDate": "2024-01-15T14:30:45"
  },
  "timestamp": "2024-01-15T14:30:45"
}
```

---

### POST /dashboard/alert/{id}/resolve
**Resolve an Alert**

**Request:**
```bash
curl -X POST http://localhost:8080/api/dashboard/alert/1/resolve
```

**Response:**
```json
{
  "success": true,
  "message": "Alert resolved",
  "data": {
    "id": 1,
    "status": "RESOLVED",
    "resolvedDate": "2024-01-15T14:30:45"
  },
  "timestamp": "2024-01-15T14:30:45"
}
```

---

## 🏢 Entity Endpoints

### GET /entities
**List All Business Entities**

**Request:**
```bash
curl -X GET http://localhost:8080/api/entities
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "entityId": 1,
      "entityCode": "AFA-PM",
      "entityName": "AFA Project & Management Services",
      "department": "Project Delivery",
      "performanceScore": 85.0,
      "status": "ON_TRACK",
      "revenue": 52000000,
      "cost": 31000000,
      "profitMargin": 40.38,
      "assetHealthScore": 76.5,
      "projectOnTimePercent": 89,
      "alertCount": 2
    },
    ...
  ],
  "timestamp": "2024-01-15T14:30:45"
}
```

---

### GET /entities/{id}
**Get Entity Details**

**Request:**
```bash
curl -X GET http://localhost:8080/api/entities/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entityId": 1,
    "entityCode": "AFA-PM",
    "entityName": "AFA Project & Management Services",
    "description": "Project management and coordination",
    "department": "Project Delivery",
    "status": "ACTIVE",
    "kpis": [...],
    "assets": [...],
    "projects": [...],
    "alerts": [...]
  },
  "timestamp": "2024-01-15T14:30:45"
}
```

---

### GET /entities/{id}/performance
**Entity Performance Metrics**

**Request:**
```bash
curl -X GET http://localhost:8080/api/entities/1/performance
```

---

### GET /entities/{id}/assets
**Entity Assets and Health**

**Request:**
```bash
curl -X GET http://localhost:8080/api/entities/1/assets
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "assetCode": "BRIDGE-001",
      "assetName": "North Toll Bridge",
      "assetType": "Infrastructure",
      "status": "OPERATIONAL",
      "healthScore": 78.5,
      "condition": "GOOD",
      "lastMaintenanceDate": "2024-01-10T08:00:00",
      "nextMaintenanceDate": "2024-02-10T08:00:00",
      "criticality": "HIGH"
    }
  ],
  "timestamp": "2024-01-15T14:30:45"
}
```

---

### GET /entities/{id}/projects
**Entity Projects**

**Request:**
```bash
curl -X GET http://localhost:8080/api/entities/1/projects
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "projectCode": "P-2024-001",
      "projectName": "Highway Expansion Phase 2",
      "status": "ACTIVE",
      "progressPercent": 65,
      "budgetAllocated": 15000000,
      "budgetUtilized": 9750000,
      "budgetVariancePercent": -35,
      "startDate": "2024-01-01T00:00:00",
      "plannedEndDate": "2024-12-31T00:00:00",
      "riskScore": 25
    }
  ],
  "timestamp": "2024-01-15T14:30:45"
}
```

---

### GET /entities/{id}/alerts
**Entity-specific Alerts**

**Request:**
```bash
curl -X GET http://localhost:8080/api/entities/1/alerts
```

---

## 📈 Analytics Endpoints

### GET /analytics/revenue
**Revenue Analysis**

Query parameters:
- `period` (MTD, QTD, YTD, CUSTOM)

**Request:**
```bash
curl -X GET 'http://localhost:8080/api/analytics/revenue?period=MTD'
```

---

### GET /analytics/costs
**Cost Analysis**

**Request:**
```bash
curl -X GET 'http://localhost:8080/api/analytics/costs?period=MTD'
```

---

### GET /analytics/assets
**Asset Health Analytics**

**Request:**
```bash
curl -X GET http://localhost:8080/api/analytics/assets
```

---

### GET /analytics/projects
**Project Delivery Analytics**

**Request:**
```bash
curl -X GET http://localhost:8080/api/analytics/projects
```

---

### GET /analytics/trends
**Historical Trends**

Query parameters:
- `metric` (REVENUE, COST, TRAFFIC, PERFORMANCE, etc.)
- `period` (1M, 3M, 6M, 12M)

**Request:**
```bash
curl -X GET 'http://localhost:8080/api/analytics/trends?metric=REVENUE&period=12M'
```

---

## 🔄 Real-time Endpoints

### WebSocket /ws/live
**Real-time Data Stream**

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8080/ws/live');

ws.onopen = () => {
  console.log('Connected to live data stream');
};

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Real-time update:', update);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

**Message Format:**
```json
{
  "type": "KPI_UPDATE",
  "timestamp": "2024-01-15T14:30:45",
  "entityCode": "AFA-PM",
  "data": {
    "kpiCode": "KPI_REV_MTD",
    "currentValue": 45750000,
    "previousValue": 45600000,
    "trendPercent": 0.33
  }
}
```

---

### GET /realtime/status
**System Health Status**

**Request:**
```bash
curl -X GET http://localhost:8080/api/realtime/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "UP",
    "timestamp": "2024-01-15T14:30:45",
    "connectedUsers": 24,
    "dataLatency": "125ms"
  },
  "timestamp": "2024-01-15T14:30:45"
}
```

---

### GET /realtime/update/{type}/{entityCode}
**Get Realtime Update**

Parameters:
- `type` (KPI_UPDATE, ALERT, METRIC_UPDATE)
- `entityCode` (AFA-PM, AFA-PRIME, etc.)

**Request:**
```bash
curl -X GET 'http://localhost:8080/api/realtime/update/KPI_UPDATE/AFA-PM'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "KPI_UPDATE",
    "timestamp": "2024-01-15T14:30:45",
    "entityCode": "AFA-PM",
    "data": {...}
  },
  "timestamp": "2024-01-15T14:30:45"
}
```

---

## 🔐 Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2024-01-15T14:30:45"
}
```

### Common HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 📝 Rate Limiting

- Authenticated users: 1000 requests/hour
- Public endpoints: 100 requests/hour
- WebSocket connections: 5 connections per IP

---

## 🔐 Authentication

Include JWT token in Authorization header:

```bash
curl -X GET http://localhost:8080/api/dashboard/executive \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

**API Documentation v1.0 | Last Updated: January 2024**

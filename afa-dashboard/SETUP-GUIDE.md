# Enterprise Performance & Decision Cockpit
## Complete Setup & Deployment Guide

---

## 🚀 Quick Start (5 minutes)

### Option 1: Docker Compose (Recommended)

```bash
# Clone/setup project
git clone <repo-url>
cd enterprise-dashboard

# Start entire stack
docker-compose up -d

# Access applications
- Frontend:  http://localhost:3000
- Backend:   http://localhost:8080
- Swagger:   http://localhost:8080/swagger-ui.html
- Grafana:   http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090
```

### Option 2: Local Development Setup

#### Prerequisites
- Java 11+
- Node.js 16+
- npm or yarn
- Maven 3.6+
- PostgreSQL 12+ (optional, uses H2 by default)

#### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies and build
mvn clean install

# Run application
mvn spring-boot:run

# Backend runs on http://localhost:8080
```

#### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Frontend runs on http://localhost:3000
```

---

## 📋 Project Structure

```
enterprise-dashboard/
├── backend/
│   ├── src/main/java/com/afa/epdc/
│   │   ├── controller/
│   │   │   ├── DashboardController.java    # Main dashboard endpoints
│   │   │   ├── EntityController.java       # Entity/department endpoints
│   │   │   ├── AnalyticsController.java    # Analytics endpoints
│   │   │   └── RealtimeController.java     # Real-time data endpoints
│   │   ├── service/
│   │   │   ├── DashboardService.java       # Dashboard business logic
│   │   │   ├── EntityService.java          # Entity operations
│   │   │   ├── AnalyticsService.java       # Analytics calculations
│   │   │   └── RealtimeService.java        # Real-time data handling
│   │   ├── model/
│   │   │   ├── BusinessEntity.java
│   │   │   ├── KPI.java
│   │   │   ├── Alert.java
│   │   │   ├── PerformanceMetric.java
│   │   │   ├── Asset.java
│   │   │   ├── Project.java
│   │   │   ├── User.java
│   │   │   └── AuditLog.java
│   │   ├── dto/
│   │   │   ├── ExecutiveDashboardDTO.java
│   │   │   ├── KpiCardDTO.java
│   │   │   ├── AlertDTO.java
│   │   │   ├── CorrelationDataDTO.java
│   │   │   ├── EntityPerformanceDTO.java
│   │   │   └── ApiResponseDTO.java
│   │   ├── repository/
│   │   ├── config/
│   │   ├── exception/
│   │   └── EpdcApplication.java            # Main application
│   ├── resources/
│   │   ├── application.properties           # Configuration
│   │   └── data.sql                        # Sample data
│   ├── pom.xml
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ExecutiveDashboard.tsx      # Main dashboard
│   │   │   ├── KPICard.tsx                 # KPI display
│   │   │   ├── DashboardComponents.tsx     # Alert, Correlation, HeatMap, etc.
│   │   │   ├── EntityDashboard.tsx
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   └── ...more components
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── EntityDetail.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── useDashboard.ts
│   │   │   ├── useRealtime.ts
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── realtime.ts
│   │   │   └── ...
│   │   ├── store/
│   │   │   ├── store.ts
│   │   │   ├── dashboardSlice.ts
│   │   │   └── ...
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── dashboard.css
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── .env.example
│
├── monitoring/
│   ├── prometheus.yml
│   └── grafana-dashboards/
│
├── mock-data/
│   ├── sap-mock.json
│   ├── oracle-mock.json
│   ├── streaming-mock.json
│   └── ai-mock.json
│
├── docs/
│   ├── API.md                              # API documentation
│   ├── ARCHITECTURE.md                     # System architecture
│   ├── DEPLOYMENT.md                       # Deployment guide
│   └── KPI_DEFINITIONS.md                  # KPI definitions
│
├── docker-compose.yml
├── .gitignore
├── README.md
└── CONTRIBUTING.md
```

---

## 🔌 Integration Points

### 1. SAP Integration
Endpoint: `http://localhost:9000/sap` (mock)
- Financial data (GL, AP, AR)
- Asset management
- Procurement & contracts

**Production Implementation:**
```java
@Component
public class SAPConnector {
    public List<FinancialData> getFiscalData(String company, String period) {
        // Call SAP C/4HANA OData API
        // Transform and aggregate data
    }
}
```

### 2. Oracle Integration
Endpoint: `http://localhost:9001/oracle` (mock)
- Project management data
- Resource allocation
- Budget tracking

### 3. Real-time Streaming
Endpoint: `http://localhost:9002/stream` (mock)
- Kafka topics for live metrics
- Redis streams for event processing
- WebSocket broadcasts to frontend

**WebSocket Connection:**
```typescript
const ws = new WebSocket('ws://localhost:8080/ws/live');
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // Update dashboard in real-time
};
```

### 4. AI Prediction Engine
Endpoint: `http://localhost:9003/ai` (mock)
- Trend forecasting
- Anomaly detection
- Risk prediction

### 5. Data Warehouse
Endpoint: `http://localhost:9004/warehouse` (mock)
- Historical data aggregation
- Time-series analysis
- Performance benchmarking

### 6. Cybersecurity Stack
Endpoint: `http://localhost:9005/security` (mock)
- Compliance monitoring
- Access control logs
- Incident tracking

---

## 📊 API Endpoints Reference

### Executive Dashboard
```
GET  /api/dashboard/executive              Main dashboard data (THE CENTERPIECE)
GET  /api/dashboard/summary                Summary statistics
GET  /api/dashboard/kpis                   All KPIs
GET  /api/dashboard/alerts                 Critical alerts
GET  /api/dashboard/correlations           Metric correlations
POST /api/dashboard/alert/{id}/acknowledge Acknowledge alert
POST /api/dashboard/alert/{id}/resolve     Resolve alert
```

### Entities & Performance
```
GET  /api/entities                         List all entities
GET  /api/entities/{id}                    Entity details
GET  /api/entities/{id}/performance        Entity performance
GET  /api/entities/{id}/assets             Entity assets
GET  /api/entities/{id}/projects           Entity projects
GET  /api/entities/{id}/alerts             Entity alerts
```

### Analytics
```
GET  /api/analytics/revenue                Revenue analytics
GET  /api/analytics/costs                  Cost analysis
GET  /api/analytics/assets                 Asset health
GET  /api/analytics/projects               Project delivery
GET  /api/analytics/trends                 Historical trends
```

### Real-time
```
WebSocket /ws/live                         Real-time data stream
GET  /api/realtime/status                  System health status
GET  /api/realtime/update/{type}/{entity}  Get realtime update
```

---

## 🎨 Customization Guide

### Changing Color Palette

Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      'navy': {
        800: '#1e2761',  // Change primary color
        // ...
      },
    }
  }
}
```

### Adding New KPIs

In `backend/src/main/java/com/afa/epdc/service/DashboardService.java`:
```java
private List<KpiCardDTO> getTopKpis() {
    return Arrays.asList(
        // ... existing KPIs
        KpiCardDTO.builder()
            .code("KPI_NEW_METRIC")
            .name("Your New KPI")
            .category("CATEGORY")
            // ... build your KPI
            .build()
    );
}
```

### Connecting Real Data Sources

1. **Create a new service:**
```java
@Service
public class RealDataService {
    @Autowired
    private SAPConnector sapConnector;
    
    public BigDecimal getRealRevenue() {
        return sapConnector.getTotalRevenue();
    }
}
```

2. **Inject into controller:**
```java
@RestController
public class DashboardController {
    @Autowired
    private RealDataService realDataService;
    
    @GetMapping("/api/dashboard/executive")
    public ResponseEntity<ExecutiveDashboardDTO> getExecutiveDashboard() {
        // Use realDataService.getRealRevenue() instead of dummy data
    }
}
```

---

## 🔐 Security Configuration

### Enable Authentication

In `SecurityConfig.java`:
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .authorizeRequests()
            .antMatchers("/api/public/**").permitAll()
            .antMatchers("/api/dashboard/**").hasRole("EXECUTIVE")
            .antMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated()
            .and()
            .httpBasic();
    }
}
```

### Enable HTTPS

In `application.properties`:
```properties
server.ssl.key-store=classpath:keystore.p12
server.ssl.key-store-password=your-password
server.ssl.key-store-type=PKCS12
server.ssl.key-alias=tomcat
```

---

## 📈 Performance Optimization

### Enable Caching
```java
@Cacheable("executive-dashboard")
public ExecutiveDashboardDTO getExecutiveDashboard() {
    // Cached for 5 minutes
}
```

### Database Indexing
```sql
CREATE INDEX idx_kpi_entity ON kpis(entity_id);
CREATE INDEX idx_alert_entity ON alerts(entity_id);
CREATE INDEX idx_metric_date ON metrics(recorded_date);
```

### Frontend Optimization
```bash
# Create optimized production build
npm run build

# Analyze bundle size
npm install -g source-map-explorer
source-map-explorer 'build/static/js/*.js'
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Java version
java -version  # Should be 11+

# Clear Maven cache
mvn clean

# Check port 8080
lsof -i :8080
```

### Frontend connection issues
```bash
# Check backend is running
curl http://localhost:8080/api/dashboard/executive

# Check CORS configuration
# Update CORS allowed origins in application.properties
```

### Docker issues
```bash
# Clean up Docker
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Restart services
docker-compose up -d
```

---

## 📚 Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)
- [Docker Documentation](https://docs.docker.com)

---

## 🤝 Contributing

See CONTRIBUTING.md for guidelines.

---

## 📝 License

Proprietary - Enterprise Dashboard Platform

---

**Built for intelligent decision-making across the enterprise.** 🚀

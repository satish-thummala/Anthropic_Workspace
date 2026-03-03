# Compliance Platform — Spring Boot Backend

## Tech Stack

- **Java 17** + **Spring Boot 3.2**
- **Spring Security** + **JWT** (JJWT 0.12)
- **Spring Data JPA** + **Hibernate**
- **MySQL 8+**
- **Lombok**

---

## Prerequisites

- Java 17+
- Maven 3.8+
- MySQL 8.0+

---

## 1. MySQL Setup

```sql
-- In MySQL CLI or Workbench:
CREATE DATABASE compliance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'compliance_user'@'localhost' IDENTIFIED BY 'compliance1234';
GRANT ALL PRIVILEGES ON compliance_db.* TO 'compliance_user'@'localhost';
FLUSH PRIVILEGES;
```

Or just run the full schema:

```bash
mysql -u root -p < src/main/resources/schema.sql
```

---

## 2. Configure application.properties

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/compliance_db?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

---

## 3. Run the Backend

```bash
mvn clean install
mvn spring-boot:run
```

Server starts at: **http://localhost:8080**

On first run, `DataInitializer` auto-seeds two demo users:
| Email | Password | Role |
|-------|----------|------|
| admin@techcorp.com | Admin@123 | Compliance Analyst |
| manager@techcorp.com | Manager@123 | Risk Manager |

---

## 4. API Endpoints

### POST /api/v1/auth/login

```json
// Request
{ "email": "admin@techcorp.com", "password": "Admin@123" }

// Response 200
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "uuid-string",
  "tokenType": "Bearer",
  "expiresIn": 900000,
  "user": {
    "id": 1,
    "name": "Sarah Chen",
    "email": "admin@techcorp.com",
    "role": "Compliance Analyst",
    "organization": "Nirvahak Inc.",
    "avatar": "SC"
  }
}

// Response 401
{ "status": 401, "error": "Unauthorized", "message": "Invalid email or password" }
```

### POST /api/v1/auth/refresh

```json
// Request
{ "refreshToken": "uuid-string" }

// Response 200
{ "accessToken": "eyJhbGci...", "refreshToken": "new-uuid", "tokenType": "Bearer", "expiresIn": 900000 }
```

### POST /api/v1/auth/logout _(requires Bearer token)_

```json
// Response 200
{ "success": true, "message": "Logged out successfully" }
```

### GET /api/v1/auth/me _(requires Bearer token)_

```json
{ "success": true, "message": "Authenticated as: admin@techcorp.com" }
```

---

## 5. Connect React Frontend

Replace the login handler in `CompliancePlatform.jsx` with a real API call:

```js
import { authAPI } from "./api-client.js";

async function handleLogin(ev) {
  ev.preventDefault();
  setLoading(true);
  try {
    const data = await authAPI.login(email, password);
    onLogin(data.user); // pass user object to app state
  } catch (err) {
    setErrors({ general: err.message });
  } finally {
    setLoading(false);
  }
}
```

---

## 6. Security Notes

- Passwords are hashed with **BCrypt** (strength 12)
- Access token expires in **15 minutes**
- Refresh token expires in **7 days** with **rotation** (old token revoked on each use)
- CORS configured for `http://localhost:5173` (Vite dev server)
- All endpoints except `/auth/login` and `/auth/refresh` require Bearer token

---

## Project Structure

```
src/main/java/com/techcorp/compliance/
├── ComplianceApplication.java       # Entry point
├── config/
│   ├── SecurityConfig.java          # Spring Security + CORS
│   ├── GlobalExceptionHandler.java  # Error responses
│   └── DataInitializer.java         # Demo user seeder
├── controller/
│   └── AuthController.java          # Login / Logout / Refresh / Me
├── dto/
│   └── AuthDTOs.java                # Request + Response objects
├── entity/
│   ├── User.java                    # users table
│   └── RefreshToken.java            # refresh_tokens table
├── repository/
│   ├── UserRepository.java
│   └── RefreshTokenRepository.java
├── security/
│   ├── JwtUtil.java                 # Token generation + validation
│   └── JwtAuthFilter.java           # Per-request JWT filter
└── service/
    ├── AuthService.java             # Business logic
    └── UserDetailsServiceImpl.java  # Spring Security user loader
```

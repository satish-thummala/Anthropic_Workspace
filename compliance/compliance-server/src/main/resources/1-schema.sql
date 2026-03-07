-- ─────────────────────────────────────────────────────────────────────────────
-- Compliance Platform - MySQL Schema
-- Run this ONCE to create the database and tables manually
-- (Hibernate will also auto-create/update via spring.jpa.hibernate.ddl-auto=update)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS compliance_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE compliance_db;

-- ─── Users Table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    email        VARCHAR(150) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    name         VARCHAR(100) NOT NULL,
    role         VARCHAR(100),
    organization VARCHAR(100),
    avatar       VARCHAR(10),
    enabled      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   DATETIME,
    updated_at   DATETIME,
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Refresh Tokens Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    token      VARCHAR(512) NOT NULL UNIQUE,
    user_id    BIGINT       NOT NULL,
    expires_at DATETIME(6)  NOT NULL,
    revoked    BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_refresh_token (token),
    INDEX idx_refresh_token_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Demo Data (passwords are BCrypt-hashed, raw: Admin@123 / Manager@123) ───
-- Note: DataInitializer.java seeds these automatically on startup.
-- Only run manually if you bypass the Spring app.

INSERT IGNORE INTO users (email, password, name, role, organization, avatar, enabled, created_at, updated_at)
VALUES
(
    'admin@techcorp.com',
    '$2a$12$KIX/Mh.9J5VzRkQp0bVy6OQ2gBPHmNYJhSJyq4ZMzS3.kF2BpXLta',
    'Sarah Chen',
    'Compliance Analyst',
    'Nirvahak Inc.',
    'SC',
    TRUE,
    NOW(),
    NOW()
),
(
    'manager@techcorp.com',
    '$2a$12$9r.5J4Mh/VK7ItGqOp4nJuNy7cFGHq9vJmGZbcXpQnLkF5AtWySze',
    'James Patel',
    'Risk Manager',
    'Nirvahak Inc.',
    'JP',
    TRUE,
    NOW(),
    NOW()
);

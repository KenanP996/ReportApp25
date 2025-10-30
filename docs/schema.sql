-- ReportApp25 MySQL schema (Milestone 2)
-- Run these statements to provision the database.

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role ENUM('manager', 'team_lead') NOT NULL DEFAULT 'team_lead',
    team_id INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE teams (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    region VARCHAR(80) NOT NULL,
    manager_id INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_teams_manager FOREIGN KEY (manager_id) REFERENCES users (id) ON DELETE CASCADE
);

ALTER TABLE users
    ADD CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL;

CREATE TABLE companies (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    province CHAR(2) NOT NULL,
    city VARCHAR(120) NOT NULL,
    contact_name VARCHAR(120) NOT NULL,
    contact_email VARCHAR(190) NOT NULL,
    contact_phone VARCHAR(40) NULL,
    onboarding_date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE reports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id INT UNSIGNED NOT NULL,
    submitted_by INT UNSIGNED NOT NULL,
    status ENUM('draft', 'submitted', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
    total_items INT UNSIGNED NOT NULL DEFAULT 0,
    item_breakdown JSON NOT NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_user FOREIGN KEY (submitted_by) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE pickups (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    report_id INT UNSIGNED NOT NULL,
    scheduled_by INT UNSIGNED NOT NULL,
    pickup_window_start DATETIME NOT NULL,
    pickup_window_end DATETIME NOT NULL,
    location VARCHAR(200) NOT NULL,
    status ENUM('pending', 'scheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pickups_report FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE,
    CONSTRAINT fk_pickups_user FOREIGN KEY (scheduled_by) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE team_applications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id INT UNSIGNED NOT NULL,
    applicant_email VARCHAR(190) NOT NULL,
    applicant_name VARCHAR(120) NOT NULL,
    status ENUM('pending', 'interview', 'approved', 'denied') NOT NULL DEFAULT 'pending',
    notes TEXT NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,
    reviewer_id INT UNSIGNED NULL,
    CONSTRAINT fk_applications_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
    CONSTRAINT fk_applications_reviewer FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE SET NULL
);

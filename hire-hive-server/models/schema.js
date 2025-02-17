// Schema.js
const db = require("../config/db");

// Create Database
const createDatabase = `CREATE DATABASE IF NOT EXISTS HireHive;`;

// Users Table
const createUsersTable = `
CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','job_seeker','vendor') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role)
)`;

// Admin Profile Table
const createAdminProfileTable = `
CREATE TABLE IF NOT EXISTS AdminProfile (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    admin_level VARCHAR(50),
    contact_number VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
)`;

// Job Seeker Profile Table
const createJobSeekerProfileTable = `
CREATE TABLE IF NOT EXISTS JobSeekerProfile (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    resume VARCHAR(255),
    education TEXT,
    experience TEXT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
)`;

// Vendor Profile Table
const createVendorProfileTable = `
CREATE TABLE IF NOT EXISTS VendorProfile (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    website VARCHAR(255),
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
)`;

// Roles Table
const createRolesTable = `
CREATE TABLE IF NOT EXISTS Roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
)`;

// Permissions Table
const createPermissionsTable = `
CREATE TABLE IF NOT EXISTS Permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
)`;

// Role Permissions Table
const createRolePermissionsTable = `
CREATE TABLE IF NOT EXISTS RolePermissions (
    role_permission_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    FOREIGN KEY (role_id) REFERENCES Roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES Permissions(permission_id) ON DELETE CASCADE,
    UNIQUE KEY uniq_role_permission (role_id, permission_id)
)`;

// User Roles Table (advanced multi-role support)
const createUserRolesTable = `
CREATE TABLE IF NOT EXISTS UserRoles (
    user_role_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES Roles(role_id) ON DELETE CASCADE,
    UNIQUE KEY uniq_user_role (user_id, role_id)
)`;

// System Settings Table
const createSystemSettingsTable = `
CREATE TABLE IF NOT EXISTS SystemSettings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_name VARCHAR(100) NOT NULL UNIQUE,
    setting_value VARCHAR(255),
    description TEXT
)`;

// Job Categories Table
const createJobCategoriesTable = `
CREATE TABLE IF NOT EXISTS JobCategories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
)`;

// Job Postings Table
const createJobPostingsTable = `
CREATE TABLE IF NOT EXISTS JobPostings (
    job_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    category_id INT,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT,
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),
    location VARCHAR(150),
    posted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATETIME,
    status ENUM('active','expired','closed') DEFAULT 'active',
    FOREIGN KEY (vendor_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES JobCategories(category_id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_posted_date (posted_date)
)`;

// Job Applications Table
const createJobApplicationsTable = `
CREATE TABLE IF NOT EXISTS JobApplications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    job_seeker_id INT NOT NULL,
    application_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending','accepted','rejected') DEFAULT 'pending',
    FOREIGN KEY (job_id) REFERENCES JobPostings(job_id) ON DELETE CASCADE,
    FOREIGN KEY (job_seeker_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_status (status)
)`;

// Job Recommendations Table
const createJobRecommendationsTable = `
CREATE TABLE IF NOT EXISTS JobRecommendations (
    recommendation_id INT AUTO_INCREMENT PRIMARY KEY,
    job_seeker_id INT NOT NULL,
    job_id INT NOT NULL,
    recommended_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    relevance_score DECIMAL(5,2),
    FOREIGN KEY (job_seeker_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES JobPostings(job_id) ON DELETE CASCADE
)`;

// Saved Jobs Table
const createSavedJobsTable = `
CREATE TABLE IF NOT EXISTS SavedJobs (
    saved_job_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_id INT NOT NULL,
    saved_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES JobPostings(job_id) ON DELETE CASCADE,
    UNIQUE KEY uniq_saved (user_id, job_id)
)`;

// User Preferences Table
const createUserPreferencesTable = `
CREATE TABLE IF NOT EXISTS UserPreferences (
    preference_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    preferred_industries VARCHAR(255),
    preferred_locations VARCHAR(255),
    job_types VARCHAR(255),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
)`;

// Skills Table
const createSkillsTable = `
CREATE TABLE IF NOT EXISTS Skills (
    skill_id INT AUTO_INCREMENT PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL UNIQUE
)`;

// User Skills Table
const createUserSkillsTable = `
CREATE TABLE IF NOT EXISTS UserSkills (
    user_skill_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level ENUM('Beginner','Intermediate','Advanced'),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES Skills(skill_id) ON DELETE CASCADE,
    UNIQUE KEY uniq_user_skill (user_id, skill_id)
)`;

// Job Skills Table
const createJobSkillsTable = `
CREATE TABLE IF NOT EXISTS JobSkills (
    job_skill_id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    skill_id INT NOT NULL,
    FOREIGN KEY (job_id) REFERENCES JobPostings(job_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES Skills(skill_id) ON DELETE CASCADE,
    UNIQUE KEY uniq_job_skill (job_id, skill_id)
)`;

// Job Market Predictions Table
const createJobMarketPredictionsTable = `
CREATE TABLE IF NOT EXISTS JobMarketPredictions (
    prediction_id INT AUTO_INCREMENT PRIMARY KEY,
    job_category VARCHAR(100) NOT NULL,
    predicted_trend VARCHAR(100),
    prediction_date DATE NOT NULL,
    prediction_details JSON,
    INDEX idx_prediction_date (prediction_date)
)`;

// Data Sources Table
const createDataSourcesTable = `
CREATE TABLE IF NOT EXISTS DataSources (
    source_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    url VARCHAR(255),
    last_fetched DATETIME,
    description TEXT
)`;

// Chatbot Interactions Table
const createChatbotInteractionsTable = `
CREATE TABLE IF NOT EXISTS ChatbotInteractions (
    interaction_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    query TEXT NOT NULL,
    response TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL
)`;

// Notifications Table
const createNotificationsTable = `
CREATE TABLE IF NOT EXISTS Notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50),
    read_status ENUM('read','unread') DEFAULT 'unread',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
)`;

// Activity Log Table
const createActivityLogTable = `
CREATE TABLE IF NOT EXISTS ActivityLog (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100),
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL
)`;

// Audit Trail Table
const createAuditTrailTable = `
CREATE TABLE IF NOT EXISTS AuditTrail (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    change_type ENUM('insert','update','delete') NOT NULL,
    changed_by INT,
    change_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    change_details TEXT,
    FOREIGN KEY (changed_by) REFERENCES Users(user_id) ON DELETE SET NULL
)`;

// SubscriptionPlan Table
const createSubscriptionPlanTable = `
CREATE TABLE IF NOT EXISTS SubscriptionPlan (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    features TEXT,
    price DECIMAL(10,2),
    duration INT
)`;

// VendorSubscriptions Table
const createVendorSubscriptionsTable = `
CREATE TABLE IF NOT EXISTS VendorSubscriptions (
    subscription_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    plan_id INT NOT NULL,
    start_date DATE,
    end_date DATE,
    status ENUM('active','inactive') DEFAULT 'active',
    FOREIGN KEY (vendor_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES SubscriptionPlan(plan_id) ON DELETE CASCADE
)`;

// UserSessions Table
const createUserSessionsTable = `
CREATE TABLE IF NOT EXISTS UserSessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
)`;

// Function to initialize (create) all tables in order
const initializeTables = async () => {
  try {
    // Create database and switch to it
    await db.query(createDatabase);
    await db.query("USE HireHive");

    // Execute queries in order (based on dependencies)
    await db.query(createUsersTable);
    await db.query(createAdminProfileTable);
    await db.query(createJobSeekerProfileTable);
    await db.query(createVendorProfileTable);
    await db.query(createRolesTable);
    await db.query(createPermissionsTable);
    await db.query(createRolePermissionsTable);
    await db.query(createUserRolesTable);
    await db.query(createSystemSettingsTable);
    await db.query(createJobCategoriesTable);
    await db.query(createJobPostingsTable);
    await db.query(createJobApplicationsTable);
    await db.query(createJobRecommendationsTable);
    await db.query(createSavedJobsTable);
    await db.query(createUserPreferencesTable);
    await db.query(createSkillsTable);
    await db.query(createUserSkillsTable);
    await db.query(createJobSkillsTable);
    await db.query(createJobMarketPredictionsTable);
    await db.query(createDataSourcesTable);
    await db.query(createChatbotInteractionsTable);
    await db.query(createNotificationsTable);
    await db.query(createActivityLogTable);
    await db.query(createAuditTrailTable);
    await db.query(createSubscriptionPlanTable);
    await db.query(createVendorSubscriptionsTable);
    await db.query(createUserSessionsTable);

    console.log("All tables created successfully!");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
};

// Export the initialization function
module.exports = {
  initializeTables,
};

// If this file is run directly, initialize the tables
if (require.main === module) {
  initializeTables().then(() => {
    process.exit(0); // Only exit if run directly
  });
}

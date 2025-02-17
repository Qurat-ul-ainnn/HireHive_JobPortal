const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Basic test route
router.get("/", (req, res) => {
  res.json({ message: "Welcome to HireHive" });
});

// Database test route
router.get("/test-db", async (req, res) => {
  try {
    const [result] = await db.query("SELECT 1");
    res.json({
      message: "Database connection successful",
      result: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// ============ User Routes ============

// Create a new user
router.post("/users", async (req, res) => {
  try {
    const { name, email, password_hash, role } = req.body;
    if (!name || !email || !password_hash || !role) {
      return res.status(400).json({
        message:
          "Please provide all required fields: name, email, password_hash, role",
      });
    }
    const [result] = await db.query(
      "INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name, email, password_hash, role]
    );
    res.status(201).json({
      message: "User created successfully",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT user_id, name, email, role, created_at FROM Users"
    );
    res.json({
      message: "Users retrieved successfully",
      users: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
});

// Get user by ID with profile
router.get("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const [users] = await db.query(
      `SELECT u.*, 
        CASE 
          WHEN u.role = 'job_seeker' THEN js.resume
          WHEN u.role = 'vendor' THEN vp.company_name
          WHEN u.role = 'admin' THEN ap.admin_level
        END as additional_info
      FROM Users u
      LEFT JOIN JobSeekerProfile js ON u.user_id = js.user_id
      LEFT JOIN VendorProfile vp ON u.user_id = vp.user_id
      LEFT JOIN AdminProfile ap ON u.user_id = ap.user_id
      WHERE u.user_id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User retrieved successfully",
      user: users[0],
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
});

// ============ Job Routes ============

// Create a new job posting
router.post("/jobs", async (req, res) => {
  try {
    const {
      vendor_id,
      category_id,
      title,
      description,
      required_skills,
      salary_min,
      salary_max,
      location,
      expiry_date,
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO JobPostings 
       (vendor_id, category_id, title, description, required_skills, 
        salary_min, salary_max, location, expiry_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vendor_id,
        category_id,
        title,
        description,
        required_skills,
        salary_min,
        salary_max,
        location,
        expiry_date,
      ]
    );

    res.status(201).json({
      message: "Job posting created successfully",
      jobId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating job posting:", error);
    res
      .status(500)
      .json({ message: "Error creating job posting", error: error.message });
  }
});

// Get all job postings
router.get("/jobs", async (req, res) => {
  try {
    const [jobs] = await db.query(
      `SELECT j.*, c.name as category_name, u.name as vendor_name 
       FROM JobPostings j 
       LEFT JOIN JobCategories c ON j.category_id = c.category_id
       LEFT JOIN Users u ON j.vendor_id = u.user_id`
    );
    res.json({ jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res
      .status(500)
      .json({ message: "Error fetching jobs", error: error.message });
  }
});

// ============ Job Application Routes ============

// Submit a job application
router.post("/applications", async (req, res) => {
  try {
    const { job_id, job_seeker_id } = req.body;
    const [result] = await db.query(
      "INSERT INTO JobApplications (job_id, job_seeker_id) VALUES (?, ?)",
      [job_id, job_seeker_id]
    );
    res.status(201).json({
      message: "Application submitted successfully",
      applicationId: result.insertId,
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    res
      .status(500)
      .json({ message: "Error submitting application", error: error.message });
  }
});

// Get applications by job seeker ID
router.get("/applications/jobseeker/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const [applications] = await db.query(
      `SELECT ja.*, j.title as job_title, j.description as job_description,
        c.company_name, j.location, j.salary_min, j.salary_max
       FROM JobApplications ja
       JOIN JobPostings j ON ja.job_id = j.job_id
       JOIN Users u ON j.vendor_id = u.user_id
       JOIN VendorProfile c ON u.user_id = c.user_id
       WHERE ja.job_seeker_id = ?`,
      [userId]
    );
    res.json({
      message: "Applications retrieved successfully",
      applications: applications,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res
      .status(500)
      .json({ message: "Error fetching applications", error: error.message });
  }
});

// Get applications by job ID
router.get("/applications/job/:jobId", async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const [applications] = await db.query(
      `SELECT ja.*, u.name as applicant_name, u.email as applicant_email,
        jsp.resume, jsp.experience
       FROM JobApplications ja
       JOIN Users u ON ja.job_seeker_id = u.user_id
       LEFT JOIN JobSeekerProfile jsp ON u.user_id = jsp.user_id
       WHERE ja.job_id = ?`,
      [jobId]
    );
    res.json({
      message: "Applications retrieved successfully",
      applications: applications,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res
      .status(500)
      .json({ message: "Error fetching applications", error: error.message });
  }
});

// ============ Job Categories Routes ============

// Create a job category
router.post("/categories", async (req, res) => {
  try {
    const { name, description } = req.body;
    const [result] = await db.query(
      "INSERT INTO JobCategories (name, description) VALUES (?, ?)",
      [name, description]
    );
    res.status(201).json({
      message: "Category created successfully",
      categoryId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res
      .status(500)
      .json({ message: "Error creating category", error: error.message });
  }
});

// Get all job categories
router.get("/categories", async (req, res) => {
  try {
    const [categories] = await db.query(
      "SELECT category_id, name, description FROM JobCategories"
    );
    res.json({
      message: "Categories retrieved successfully",
      categories: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res
      .status(500)
      .json({ message: "Error fetching categories", error: error.message });
  }
});

// ============ Skills Routes ============

// Add a new skill
router.post("/skills", async (req, res) => {
  try {
    const { skill_name } = req.body;
    const [result] = await db.query(
      "INSERT INTO Skills (skill_name) VALUES (?)",
      [skill_name]
    );
    res.status(201).json({
      message: "Skill added successfully",
      skillId: result.insertId,
    });
  } catch (error) {
    console.error("Error adding skill:", error);
    res
      .status(500)
      .json({ message: "Error adding skill", error: error.message });
  }
});

// Get all skills
router.get("/skills", async (req, res) => {
  try {
    const [skills] = await db.query("SELECT * FROM Skills");
    res.json({
      message: "Skills retrieved successfully",
      skills: skills,
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    res
      .status(500)
      .json({ message: "Error fetching skills", error: error.message });
  }
});

// Add user skills
router.post("/user-skills", async (req, res) => {
  try {
    const { user_id, skill_id, proficiency_level } = req.body;
    const [result] = await db.query(
      "INSERT INTO UserSkills (user_id, skill_id, proficiency_level) VALUES (?, ?, ?)",
      [user_id, skill_id, proficiency_level]
    );
    res.status(201).json({
      message: "User skill added successfully",
      userSkillId: result.insertId,
    });
  } catch (error) {
    console.error("Error adding user skill:", error);
    res
      .status(500)
      .json({ message: "Error adding user skill", error: error.message });
  }
});

// Get user skills by user ID
router.get("/user-skills/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const [userSkills] = await db.query(
      `SELECT us.*, s.skill_name 
       FROM UserSkills us
       JOIN Skills s ON us.skill_id = s.skill_id
       WHERE us.user_id = ?`,
      [userId]
    );
    res.json({
      message: "User skills retrieved successfully",
      userSkills: userSkills,
    });
  } catch (error) {
    console.error("Error fetching user skills:", error);
    res
      .status(500)
      .json({ message: "Error fetching user skills", error: error.message });
  }
});

// ============ Role Routes ============

// Create a new role
router.post("/roles", async (req, res) => {
  try {
    const { role_name, description } = req.body;
    const [result] = await db.query(
      "INSERT INTO Roles (role_name, description) VALUES (?, ?)",
      [role_name, description]
    );
    res.status(201).json({
      message: "Role created successfully",
      roleId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ message: "Error creating role", error: error.message });
  }
});

// Get all roles
router.get("/roles", async (req, res) => {
  try {
    const [roles] = await db.query("SELECT * FROM Roles");
    res.json({
      message: "Roles retrieved successfully",
      roles: roles,
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Error fetching roles", error: error.message });
  }
});

// ============ Permission Routes ============

// Create a new permission
router.post("/permissions", async (req, res) => {
  try {
    const { permission_name, description } = req.body;
    const [result] = await db.query(
      "INSERT INTO Permissions (permission_name, description) VALUES (?, ?)",
      [permission_name, description]
    );
    res.status(201).json({
      message: "Permission created successfully",
      permissionId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating permission:", error);
    res.status(500).json({ message: "Error creating permission", error: error.message });
  }
});

// Get all permissions
router.get("/permissions", async (req, res) => {
  try {
    const [permissions] = await db.query("SELECT * FROM Permissions");
    res.json({
      message: "Permissions retrieved successfully",
      permissions: permissions,
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ message: "Error fetching permissions", error: error.message });
  }
});

// ============ Notification Routes ============

// Create a new notification
router.post("/notifications", async (req, res) => {
  try {
    const { user_id, content, type } = req.body;
    const [result] = await db.query(
      "INSERT INTO Notifications (user_id, content, type) VALUES (?, ?, ?)",
      [user_id, content, type]
    );
    res.status(201).json({
      message: "Notification created successfully",
      notificationId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Error creating notification", error: error.message });
  }
});

// Get notifications by user ID
router.get("/notifications/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const [notifications] = await db.query(
      "SELECT * FROM Notifications WHERE user_id = ?",
      [userId]
    );
    res.json({
      message: "Notifications retrieved successfully",
      notifications: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
});

// ============ User Roles Routes ============

// Assign a role to a user
router.post("/user-roles", async (req, res) => {
  try {
    const { user_id, role_id } = req.body;
    const [result] = await db.query(
      "INSERT INTO UserRoles (user_id, role_id) VALUES (?, ?)",
      [user_id, role_id]
    );
    res.status(201).json({
      message: "Role assigned to user successfully",
      userRoleId: result.insertId,
    });
  } catch (error) {
    console.error("Error assigning role to user:", error);
    res.status(500).json({ message: "Error assigning role", error: error.message });
  }
});

// Get roles for a user
router.get("/user-roles/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const [roles] = await db.query(
      `SELECT ur.*, r.role_name 
       FROM UserRoles ur
       JOIN Roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = ?`,
      [userId]
    );
    res.json({
      message: "User roles retrieved successfully",
      roles: roles,
    });
  } catch (error) {
    console.error("Error fetching user roles:", error);
    res.status(500).json({ message: "Error fetching user roles", error: error.message });
  }
});

// ============ Job Recommendations Routes ============

// Add a job recommendation
router.post("/job-recommendations", async (req, res) => {
  try {
    const { job_seeker_id, job_id, relevance_score } = req.body;
    const [result] = await db.query(
      "INSERT INTO JobRecommendations (job_seeker_id, job_id, relevance_score) VALUES (?, ?, ?)",
      [job_seeker_id, job_id, relevance_score]
    );
    res.status(201).json({
      message: "Job recommendation added successfully",
      recommendationId: result.insertId,
    });
  } catch (error) {
    console.error("Error adding job recommendation:", error);
    res.status(500).json({ message: "Error adding job recommendation", error: error.message });
  }
});

// Get job recommendations for a job seeker
router.get("/job-recommendations/:jobSeekerId", async (req, res) => {
  try {
    const jobSeekerId = req.params.jobSeekerId;
    const [recommendations] = await db.query(
      `SELECT jr.*, jp.title as job_title 
       FROM JobRecommendations jr
       JOIN JobPostings jp ON jr.job_id = jp.job_id
       WHERE jr.job_seeker_id = ?`,
      [jobSeekerId]
    );
    res.json({
      message: "Job recommendations retrieved successfully",
      recommendations: recommendations,
    });
  } catch (error) {
    console.error("Error fetching job recommendations:", error);
    res.status(500).json({ message: "Error fetching job recommendations", error: error.message });
  }
});

// ============ Saved Jobs Routes ============

// Save a job for a user
router.post("/saved-jobs", async (req, res) => {
  try {
    const { user_id, job_id } = req.body;
    const [result] = await db.query(
      "INSERT INTO SavedJobs (user_id, job_id) VALUES (?, ?)",
      [user_id, job_id]
    );
    res.status(201).json({
      message: "Job saved successfully",
      savedJobId: result.insertId,
    });
  } catch (error) {
    console.error("Error saving job:", error);
    res.status(500).json({ message: "Error saving job", error: error.message });
  }
});

// Get saved jobs for a user
router.get("/saved-jobs/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const [savedJobs] = await db.query(
      `SELECT sj.*, jp.title as job_title 
       FROM SavedJobs sj
       JOIN JobPostings jp ON sj.job_id = jp.job_id
       WHERE sj.user_id = ?`,
      [userId]
    );
    res.json({
      message: "Saved jobs retrieved successfully",
      savedJobs: savedJobs,
    });
  } catch (error) {
    console.error("Error fetching saved jobs:", error);
    res.status(500).json({ message: "Error fetching saved jobs", error: error.message });
  }
});

module.exports = router;

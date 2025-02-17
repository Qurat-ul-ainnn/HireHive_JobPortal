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
    // Simple query to test connection
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

module.exports = router;

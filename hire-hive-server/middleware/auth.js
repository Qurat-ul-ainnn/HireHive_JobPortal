const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const auth = {
    // Verify JWT token
    verifyToken: (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        try {
            const verified = jwt.verify(token, JWT_SECRET);
            req.user = verified;
            next();
        } catch (error) {
            res.status(403).json({ message: "Invalid token" });
        }
    },

    // Check if user is admin
    isAdmin: (req, res, next) => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: "Access denied. Admin rights required." });
        }
    },

    // Check if user is vendor
    isVendor: (req, res, next) => {
        if (req.user && req.user.role === 'vendor') {
            next();
        } else {
            res.status(403).json({ message: "Access denied. Vendor rights required." });
        }
    },

    // Check if user is job seeker
    isJobSeeker: (req, res, next) => {
        if (req.user && req.user.role === 'job_seeker') {
            next();
        } else {
            res.status(403).json({ message: "Access denied. Job seeker rights required." });
        }
    },

    // Check if user is authorized (either the resource owner or admin)
    isAuthorized: (req, res, next) => {
        if (req.user && (req.user.role === 'admin' || req.user.userId === parseInt(req.params.id))) {
            next();
        } else {
            res.status(403).json({ message: "Access denied. Not authorized." });
        }
    }
};

module.exports = auth; 
const express = require('express');
const router = express.Router();
// Import both functions from the controller
const { registerAdmin, login, forgotPassword, resetPassword} = require('../controllers/Authcontroller');

// POST /api/auth/register (Your existing route)
router.post('/register', registerAdmin);

// POST /api/auth/login (The NEW login route)
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
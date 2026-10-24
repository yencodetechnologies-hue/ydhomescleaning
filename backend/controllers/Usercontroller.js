const User = require('../models/User');
const { sendEmail } = require('../config/Sendemail');
const { welcomeEmail } = require('../config/Emailtemplates');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// --- Helpers for the passwordless access link ---
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateAccessToken = () => {
  const token = crypto.randomBytes(32).toString('hex'); // 64 chars, unguessable
  return { token, hash: hashToken(token) };
};

const buildAccessUrl = (token) => `${FRONTEND_URL}/access/${token}`;

// Same payload, secret and expiry as the /auth/login controller
const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

// GET /api/users - Fetch ONLY standard users
const getUsers = async (req, res) => {
  try {
    // Filter applied: ONLY fetch documents where role is 'user'
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// POST /api/users - Create user & Send Email
const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, status } = req.body;
    const role = 'user'; // Hardcode role to ensure only 'user' types are created here

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already exists' });

    // Generate the unique dashboard access link for this user
    const { token, hash } = generateAccessToken();
    const accessUrl = buildAccessUrl(token);

    // Create user (password is hashed automatically by User.js pre-save hook)
    const newUser = await User.create({ 
      name, 
      email, 
      phone, 
      password, 
      role, 
      status: status || 'Active',
      accessTokenHash: hash
    });

    // --- SEND EMAIL FUNCTIONALITY ---
    try {
      const mail = welcomeEmail({ name, email, password, accessUrl });
      await sendEmail({
        to: email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text
      });
    } catch (emailError) {
      console.error('User created, but email failed to send:', emailError.message);
      // We log the error but don't crash the request, because the user WAS created successfully
    }
    
    // Return created user to frontend (accessUrl is shown only once, here)
    res.status(201).json({ 
      _id: newUser._id, 
      name: newUser.name, 
      email: newUser.email, 
      phone: newUser.phone,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.createdAt,
      accessUrl
    });
  } catch (error) {
    console.error("ACTUAL CREATE ERROR:", error);
    res.status(500).json({ message: error.message || 'Error creating user' });
  }
};

// PUT /api/users/:id - Update user details
const updateUser = async (req, res) => {
  try {
    const { name, email, phone, status, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    if (status) user.status = status;

    if (password) {
      // Manually hash the password since the pre-save hook was removed
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt); 
    }

    const updatedUser = await user.save({ validateBeforeSave: false });
    
    res.status(200).json({ 
      _id: updatedUser._id, 
      name: updatedUser.name, 
      email: updatedUser.email, 
      phone: updatedUser.phone,
      role: updatedUser.role,
      status: updatedUser.status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

// DELETE /api/users/:id - Delete a user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.deleteOne();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
};

// POST /api/users/:id/access-link - ADMIN: generate a fresh link (old link stops working)
const regenerateAccessLink = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { token, hash } = generateAccessToken();
    user.accessTokenHash = hash;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ accessUrl: buildAccessUrl(token) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating access link' });
  }
};

// GET /api/users/access/:token - PUBLIC: open dashboard from the personal link
// Returns the SAME shape as /auth/login: { user, token }
const accessByToken = async (req, res) => {
  try {
    const hash = hashToken(req.params.token);
    const user = await User.findOne({ accessTokenHash: hash, role: 'user' }).select('-password');

    if (!user) return res.status(404).json({ message: 'Invalid or expired link' });
    if (user.status && user.status !== 'Active') {
      return res.status(403).json({ message: 'Your account is not active' });
    }

    res.status(200).json({
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      },
      token: signToken(user)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error validating access link' });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, regenerateAccessLink, accessByToken };
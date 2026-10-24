const User = require('../models/User');
const { sendEmail } = require('../config/Sendemail');
const { welcomeEmail } = require('../config/Emailtemplates');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const LINK_SECRET = process.env.ACCESS_LINK_SECRET || process.env.JWT_SECRET;

// --- Static, deterministic access link ---
// token = <userId>.<HMAC(userId)>  -> same value every time, nothing stored in the DB
const sign = (id) =>
  crypto.createHmac('sha256', LINK_SECRET).update(String(id)).digest('hex');

const makeAccessToken = (id) => `${id}.${sign(id)}`;

const buildAccessUrl = (id) => `${FRONTEND_URL}/access/${makeAccessToken(id)}`;

// Returns the user id if the token is valid, otherwise null
const verifyAccessToken = (token = '') => {
  const [id, sig] = String(token).split('.');
  if (!id || !sig) return null;

  const expected = sign(id);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  return id;
};

// Same payload, secret and expiry as the /auth/login controller
const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

// GET /api/users - Fetch ONLY standard users, each with their permanent accessUrl
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });

    const result = users.map((u) => {
      const obj = u.toObject();
      delete obj.accessToken;
      delete obj.accessTokenHash;
      obj.accessUrl = buildAccessUrl(u._id);
      return obj;
    });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// POST /api/users - Create user & send email
const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, status } = req.body;
    const role = 'user';

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      status: status || 'Active'
    });

    const accessUrl = buildAccessUrl(newUser._id);

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
    }

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
    console.error('ACTUAL CREATE ERROR:', error);
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
      status: updatedUser.status,
      accessUrl: buildAccessUrl(updatedUser._id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

// DELETE /api/users/:id
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

// POST /api/users/:id/access-link - returns the same permanent link
const regenerateAccessLink = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ accessUrl: buildAccessUrl(user._id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching access link' });
  }
};

// GET /api/users/access/:token - PUBLIC: open dashboard from the personal link
// Returns the SAME shape as /auth/login: { user, token }
const accessByToken = async (req, res) => {
  try {
    const userId = verifyAccessToken(req.params.token);
    if (!userId) return res.status(404).json({ message: 'Invalid or expired link' });

    const user = await User.findOne({ _id: userId, role: 'user' }).select('-password');
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
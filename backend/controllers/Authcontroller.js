const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../config/Sendemail'); 
const { resetPasswordEmail } = require('../config/Emailtemplates');

// Function to STORE a new admin in MongoDB
const registerAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user already exists in MongoDB
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // 2. Encrypt (hash) the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Store the data in MongoDB
    const newAdmin = await User.create({
      email,
      password: hashedPassword,
      role: 'admin'
    });

    res.status(201).json({
      message: 'Admin successfully stored in MongoDB',
      adminId: newAdmin._id
    });

  } catch (error) {
    console.error('Error storing admin:', error);
    res.status(500).json({ message: 'Server error while saving to database' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { 
        id: user._id, 
        name: user.name,
        email: user.email, 
        role: user.role,
        phone: user.phone
      } 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// --- UPDATED: FORGOT PASSWORD ---
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No user found with that email address.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash it and save it to the database
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    // Force save in case other schema validations fail
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      const mail = resetPasswordEmail({ resetUrl });
      await sendEmail({
        to: user.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });

      res.status(200).json({ message: 'Password reset instructions have been sent to your email.' });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Email could not be sent. Please try again.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};


// --- UPDATED: RESET PASSWORD ---
const resetPassword = async (req, res) => {
  try {
    // Trim the token just in case the URL added a blank space
    const token = req.params.token.trim();
    const { password } = req.body;

    // 1. Hash the token from the URL to compare with database
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    // DEBUGGING: Log to terminal so you can see what is happening
    console.log("Searching for hashed token:", resetPasswordToken);

    // 2. Find the user
    const user = await User.findOne({
      resetPasswordToken: resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      console.log("User not found or token expired in DB.");
      return res.status(400).json({ message: 'Invalid or expired password reset token.' });
    }

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 4. Clear the reset tokens
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    // Force save
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};
// Export the new functions
module.exports = { registerAdmin, login, forgotPassword, resetPassword };
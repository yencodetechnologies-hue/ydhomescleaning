const mongoose = require('mongoose');
// bcryptjs is no longer needed here since you hash it in the controller

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'staff', 'cleaner'], 
    default: 'user', 
  },
  status: {
    type: String,
    default: 'Active',
    enum: ['Active', 'Inactive'] 
  },
  
  // --- NEW FIELDS REQUIRED FOR PASSWORD RESET ---
  resetPasswordToken: {
    type: String,
    required: false
  },
  resetPasswordExpire: {
    type: Date,
    required: false
  },
  accessTokenHash: { type: String, unique: true, sparse: true, select: false },
  
}, { timestamps: true });

/* 
  REMOVED the pre('save') hook here to prevent DOUBLE-HASHING bugs.
  You are already hashing the password correctly in your authController.js 
  (in registerAdmin and resetPassword).
*/

module.exports = mongoose.model('User', userSchema);
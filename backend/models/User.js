const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['user', 'admin', 'staff', 'cleaner'], 
    default: 'user' 
  },
  status: { 
    type: String, 
    default: 'Active', 
    enum: ['Active', 'Inactive'] 
  },

accessToken:     { type: String, select: false },
accessTokenHash: { type: String, index: true, select: false },

  // (Keep your existing resetPassword fields if you still have them)
  resetPasswordToken: String,
  resetPasswordExpire: Date

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
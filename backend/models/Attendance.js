
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  dateString: { type: String, required: true }, // Format: YYYY-MM-DD for easy filtering
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  checkInPhoto: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
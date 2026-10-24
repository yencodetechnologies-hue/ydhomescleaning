const mongoose = require('mongoose');

// Schema for individual areas inside a room
const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., 'Main Room', 'Bathroom', 'Hall'
  status: {
    type: String,
    default: 'Dirty',
     enum: ['Dirty', 'In Progress', 'Clean', 'Approved', 'Rejected', 'Maintenance'],
  },
  assignedTo: {
    type: String,
    default: 'Unassigned'
  },

  photoUrl: { type: String, default: '' }
});

const roomSchema = new mongoose.Schema({
  number: {
    type: String,
    required: [true, 'Room number is required'],
    unique: true
  },
  type: {
    type: String,
    required: true
  },
  sections: [sectionSchema] // Array containing the sub-sections
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
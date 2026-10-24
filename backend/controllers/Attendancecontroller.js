// backend/controllers/attendanceController.js
const Attendance = require('../models/Attendance');

// 1. Record Check-In / Check-Out from QR Scan
// backend/controllers/attendanceController.js

const recordScan = async (req, res) => {
  try {
    const { userId, userName, scanType, qrData } = req.body;
    // Extract the Cloudinary photo URL if a file was uploaded
    const photoUrl = req.file ? req.file.path : null; 
    
    if (!qrData || !qrData.includes('ADMIN')) {
      return res.status(400).json({ message: 'Invalid Admin QR Code.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    let latestRecord = await Attendance.findOne({ userId, dateString: today }).sort({ createdAt: -1 });

    if (scanType === 'checkin') {
      if (latestRecord && !latestRecord.checkOutTime) {
        return res.status(400).json({ message: 'Neenga already check-in aagiteenga.' });
      }
      
      const newRecord = new Attendance({ 
        userId, 
        userName, 
        dateString: today, 
        checkInTime: now,
        checkInPhoto: photoUrl // Save the selfie URL
      });
      await newRecord.save();
      return res.status(200).json({ message: 'Successfully checked in!', record: newRecord });

    } else if (scanType === 'checkout') {
      if (!latestRecord || latestRecord.checkOutTime) {
        return res.status(400).json({ message: 'Neenga first check-in pannanum.' });
      }
      
      latestRecord.checkOutTime = now;
      latestRecord.checkOutPhoto = photoUrl; // Save checkout selfie
      await latestRecord.save();
      return res.status(200).json({ message: 'Successfully checked out!', record: latestRecord });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during scan.' });
  }
};
// 2. Get User's Attendance Records
const getMyRecords = async (req, res) => {
  try {
    const { userId } = req.params;
    const records = await Attendance.find({ userId }).sort({ dateString: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching records.' });
  }
};

const getAllRecords = async (req, res) => {
  try {
    // Fetch all records and sort by newest date first
    const records = await Attendance.find().sort({ dateString: -1, checkInTime: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all records.' });
  }
};
module.exports = { recordScan, getMyRecords, getAllRecords };
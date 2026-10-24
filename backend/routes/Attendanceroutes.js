const express = require('express');
const router = express.Router();
const { recordScan, getMyRecords, getAllRecords } = require('../controllers/Attendancecontroller');
const upload = require('../middleware/upload'); // Adjust this path to wherever your multer/cloudinary middleware is!

// Add 'upload.single("photo")' to handle the incoming selfie
router.post('/scan', upload.single('photo'), recordScan);
router.get('/my-records/:userId', getMyRecords);
router.get('/all', getAllRecords);

module.exports = router;
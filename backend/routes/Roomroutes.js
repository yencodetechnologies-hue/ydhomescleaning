// routes/roomRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { getRooms, createRoom, updateRoomSection, deleteRoom, updateRoom } = require('../controllers/Roomcontroller');
const { completeSectionWithPhoto } = require('../controllers/Roomcontroller');

router.route('/').get(getRooms).post(createRoom);
router.route('/:id').put(updateRoom).delete(deleteRoom); // Added put(updateRoom) here
router.route('/:roomId/section/:sectionId').put(updateRoomSection);
router.put('/:roomId/section/:sectionId/complete', upload.single('photo'), completeSectionWithPhoto);

module.exports = router;
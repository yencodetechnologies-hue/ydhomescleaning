const Room = require('../models/Room');

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({}).sort({ createdAt: -1 });
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching rooms' });
  }
};

const createRoom = async (req, res) => {
  try {
    const { number, type, sections } = req.body;
    
    const roomExists = await Room.findOne({ number });
    if (roomExists) return res.status(400).json({ message: 'Room number already exists' });

    const room = await Room.create({ number, type, sections });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server Error creating room' });
  }
};

// Update a specific section inside a room
const updateRoomSection = async (req, res) => {
  try {
    const { roomId, sectionId } = req.params;
    const { status, assignedTo } = req.body;
    
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Find the specific section inside the room's sections array
    const section = room.sections.id(sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    // Update section fields
    if (status) section.status = status;
    if (assignedTo !== undefined) section.assignedTo = assignedTo;

    await room.save();
    res.status(200).json(room); // Return the updated room
  } catch (error) {
    res.status(500).json({ message: 'Server Error updating section' });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    await room.deleteOne();
    res.status(200).json({ message: 'Room removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error deleting room' });
  }
};

const updateRoom = async (req, res) => {
  try {
    const { number, type, sections } = req.body;
    
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Update fields
    room.number = number || room.number;
    room.type = type || room.type;
    
    // If sections are provided, update them (this handles adding/removing sections in edit mode)
    if (sections) {
      room.sections = sections;
    }

    const updatedRoom = await room.save();
    res.status(200).json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: 'Server Error editing room' });
  }
};

const completeSectionWithPhoto = async (req, res) => {
  try {
    const { roomId, sectionId } = req.params;
    const { status, assignedTo } = req.body;
    
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const section = room.sections.id(sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    // Update details
    section.status = status || 'Clean';
    section.assignedTo = assignedTo;
    
    // Cloudinary automatically puts the secure image URL in req.file.path
    if (req.file && req.file.path) {
      section.photoUrl = req.file.path; 
    }

    await room.save();
    res.status(200).json(room);
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ message: 'Error uploading photo and completing task' });
  }
};

// Don't forget to export it at the bottom:
module.exports = { getRooms, createRoom, updateRoomSection, deleteRoom, updateRoom, completeSectionWithPhoto};
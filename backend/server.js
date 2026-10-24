require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors'); 
const Room = require('./models/Room');
const cron = require('node-cron');

// 1. Import your new user routes
const authRoutes = require('./routes/Authroutes');
const userRoutes = require('./routes/Userroutes'); 
const roomRoutes = require('./routes/Roomroutes');
const attendanceRoutes = require('./routes/Attendanceroutes');
const app = express();
connectDB(); 

app.use(cors({
 origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://192.168.100.233:5173', 
    'http://192.168.100.233:5174',
    'https://ydhomescleaning.vercel.app'
  ],
  credentials: true
}));
app.use(express.json()); 

// 2. Register the routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/rooms', roomRoutes);
app.use('/api/attendance', attendanceRoutes);


const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://192.168.100.233:${PORT}`);
})

cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Running daily room reset cron job...');
    
    // Find all rooms and update all their sections' status to 'Dirty'
    // It leaves the 'assignedTo' field untouched!
    await Room.updateMany(
      {}, // Match all rooms
      { 
        $set: { "sections.$[].status": "Dirty", "sections.$[].photoUrl": null } 
      }
    );
    
    console.log('All rooms successfully reset to Dirty for the new day.');
  } catch (error) {
    console.error('Error in daily room reset cron job:', error);
  }
});


// cron.schedule('* * * * *', async () => {
//   try {
//     console.log('TEST: Running room reset cron job...');
    
//     await Room.updateMany(
//       {}, 
//       { $set: { "sections.$[].status": "Dirty", "sections.$[].photoUrl": null } }
//     );
    
//     console.log('TEST: All rooms successfully reset to Dirty.');
//   } catch (error) {
//     console.error('Error in cron job:', error);
//   }
// });
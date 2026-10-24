import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login'
import './App.css'
import Dashboard from './pages/Dashboard';
import Users from './pages/Usermanagement';
import QRCode from './pages/Qrcode';
import RoomsManagement from './pages/Roomsmanagement';
import AssignedRooms from './pages/Assignedrooms';
import CheckInOut from './pages/Checkinout';
import UserActivity from './pages/Useractivity';
import CleanedHistory from './pages/Cleanedhistory';
import ResetPassword from './pages/Resetpassword';
import AccessLogin from './pages/Accesslogin';

function App() {
  return (
    <Router>
      <Routes>
       
        <Route path="/" element={<Navigate replace to="/login" />} />
  
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
   
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/qr-code" element={<QRCode />} />
         <Route path="/rooms-mgmt" element={<RoomsManagement />} />
        <Route path="/users" element={<Users />} />
        <Route path="/assigned-rooms" element={<AssignedRooms />} />
        <Route path="/attendance" element={<CheckInOut />} />
        <Route path="/user-activity" element={<UserActivity />} />
        <Route path="/cleaned-history" element={<CleanedHistory />} />
        <Route path="/access/:token" element={<AccessLogin />} />
        
      </Routes>
    </Router>
  );
}

export default App;
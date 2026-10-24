import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiSettings, FiX, FiLogOut, FiGrid, FiMaximize, FiCheckSquare, FiClock, FiActivity,FiCheckCircle} from 'react-icons/fi';

export default function Sidebar({ isOpen, closeSidebar }) {
  const navigate = useNavigate();
  
  // Get user role from local storage
  const userType = localStorage.getItem('userType') || 'user';
  const isAdmin = userType === 'admin';

  const handleLogout = () => {
    // Clear all auth data on logout
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    localStorage.removeItem('userDetails');
    navigate('/login');
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <span>{isAdmin ? 'Admin Portal' : 'User Dashboard'}</span>
        <button className="close-btn" onClick={closeSidebar}>
          <FiX size={24} />
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
          <FiHome size={18} />
          <span>Dashboard</span>
        </NavLink>

        

        {/* ADMIN ONLY LINKS */}
        {isAdmin && (
          <>
            <NavLink to="/qr-code" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
              <FiMaximize size={18} />
              <span>QR code</span>
            </NavLink>
            
            <NavLink to="/users" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
              <FiUsers size={18} />
              <span>Users</span>
            </NavLink>

             <NavLink to="/rooms-mgmt" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
          <FiGrid size={18} />
          <span>Rooms Management</span>
        </NavLink>

        <NavLink to="/user-activity" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
    <FiActivity size={18} />
    <span>User Activity</span>
  </NavLink>

  <NavLink 
  to="/cleaned-history" 
  className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} 
  onClick={closeSidebar}
>
  <FiCheckCircle size={18} />
  <span>Cleaned History</span>
</NavLink>

            
          </>
        )}

     {!isAdmin && (
  <>
    <NavLink to="/attendance" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
      <FiClock size={18} />
      <span>Check In / Out</span>
    </NavLink>

    <NavLink to="/assigned-rooms" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
      <FiCheckSquare size={18} />
      <span>My Assigned Rooms</span>
    </NavLink>
  </>
)}
        {/* EVERYONE CAN SEE ROOMS AND SETTINGS */}
       

        

        {/* <NavLink to="/settings" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
          <FiSettings size={18} />
          <span>Settings</span>
        </NavLink> */}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-logout-btn">
          <FiLogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}


// import { NavLink, useNavigate } from 'react-router-dom';
// import { FiHome, FiUsers, FiSettings, FiX, FiLogOut, FiGrid, FiMaximize, FiCheckSquare, FiClock, FiActivity } from 'react-icons/fi';

// export default function Sidebar({ isOpen, closeSidebar }) {
//   const navigate = useNavigate();
  
//   // Get user role from local storage
//   const userType = localStorage.getItem('userType') || 'user';
//   const isAdmin = userType === 'admin';

//   // Profile info for the sidebar header
//   let userDetails = null;
//   try {
//     userDetails = JSON.parse(localStorage.getItem('userDetails'));
//   } catch (e) {
//     userDetails = null;
//   }
//   const displayName = userDetails?.name || 'Guest User';
//   const displayRole = userDetails?.role
//     ? userDetails.role.charAt(0).toUpperCase() + userDetails.role.slice(1)
//     : (isAdmin ? 'Admin' : 'Staff');
//   const initials = displayName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || 'U';

//   const handleLogout = () => {
//     // Clear all auth data on logout
//     localStorage.removeItem('adminToken');
//     localStorage.removeItem('userToken');
//     localStorage.removeItem('userType');
//     localStorage.removeItem('userId');
//     localStorage.removeItem('userDetails');
//     navigate('/login');
//   };

//   return (
//     <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
//       <div className="sidebar-logo">
//         <span>
//           <FiUsers size={26} className="logo-icon" />
//           <span>{isAdmin ? 'Admin' : 'Staff'} <span className="logo-accent">Portal</span></span>
//         </span>
//         <button className="close-btn" onClick={closeSidebar}>
//           <FiX size={24} />
//         </button>
//       </div>

//       {/* Profile block */}
//       <div className="sidebar-profile">
//         <div className="sidebar-avatar">{initials}</div>
//         <h4 className="sidebar-profile-name">{displayName}</h4>
//         <p className="sidebar-profile-role">{displayRole}</p>
//       </div>
      
//       <nav className="sidebar-nav">
//         <NavLink to="/dashboard" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
//           <FiHome size={20} />
//           <span>Dashboard</span>
//         </NavLink>

//         {/* ADMIN ONLY LINKS */}
//         {isAdmin && (
//           <>
//             <NavLink to="/qr-code" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
//               <FiMaximize size={20} />
//               <span>QR code</span>
//             </NavLink>
            
//             <NavLink to="/users" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
//               <FiUsers size={20} />
//               <span>Users</span>
//             </NavLink>

//             <NavLink to="/user-activity" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
//               <FiActivity size={20} />
//               <span>User Activity</span>
//             </NavLink>
//           </>
//         )}

//         {!isAdmin && (
//   <NavLink to="/attendance" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
//     <FiClock size={20} />
//     <span>Check In / Out</span>
//   </NavLink>
// )}

//         {/* EVERYONE CAN SEE ROOMS AND SETTINGS */}
//         <NavLink to="/rooms-mgmt" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
//           <FiGrid size={20} />
//           <span>Rooms Management</span>
//         </NavLink>

//         <NavLink to="/assigned-rooms" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
//           <FiCheckSquare size={20} />
//           <span>My Assigned Rooms</span>
//         </NavLink>

//         <NavLink to="/settings" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
//           <FiSettings size={20} />
//           <span>Settings</span>
//         </NavLink>
//       </nav>

//       <div className="sidebar-footer">
//         <button onClick={handleLogout} className="sidebar-logout-btn">
//           <FiLogOut size={20} />
//           <span>Log out</span>
//         </button>
//       </div>
//     </aside>
//   );
// }
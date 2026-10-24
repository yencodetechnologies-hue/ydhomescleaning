import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiMenu, FiUser, FiLogOut, FiX, FiLock, FiChevronDown, FiEye, FiEyeOff, FiEdit2 
} from 'react-icons/fi';
// Ensure you have this config file for the API url, or replace it with your direct URL
import { API_BASE_URL } from '../config'; 


export default function Header({ toggleSidebar, title = "Dashboard", subtitle }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const isAdmin = localStorage.getItem('userType') === 'admin';

  // States
  const [userData, setUserData] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form State for Editing
  const [editForm, setEditForm] = useState({
    name: '', email: '', phone: '', newPassword: '', confirmPassword: ''
  });

  // Load user data on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('userDetails');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserData(parsedUser);
      setEditForm({
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        phone: parsedUser.phone || '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Put the form back to the latest saved details and hide the password fields
  const resetForm = (source) => {
    setEditForm({
      name: source?.name || '',
      email: source?.email || '',
      phone: source?.phone || '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordSection(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const openProfileModal = () => {
    setIsDropdownOpen(false);
    resetForm(userData);
    setIsEditMode(false); // always opens in VIEW mode
    setIsModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
  };

  const startEdit = () => setIsEditMode(true);

  const cancelEdit = () => {
    resetForm(userData); // discard unsaved changes
    setIsEditMode(false);
  };

  const handleFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const togglePasswordSection = () => {
    // Hiding the section clears anything typed so it is never sent by accident
    if (showPasswordSection) {
      setEditForm(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    }
    setShowPasswordSection(!showPasswordSection);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    // Safety: never save while in view mode (e.g. Enter key)
    if (!isEditMode) return;
    
    if (editForm.newPassword && editForm.newPassword !== editForm.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    const userId = userData.id || userData._id; // Accommodate both ID formats
    
    // Prepare payload (only send password if they typed a new one)
    const payload = {
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
    };
    if (editForm.newPassword) {
      payload.password = editForm.newPassword;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        // Update state and local storage with new info
        const newUserData = { ...userData, ...updatedUser };
        setUserData(newUserData);
        localStorage.setItem('userDetails', JSON.stringify(newUserData));
        
        resetForm(newUserData);
        setIsEditMode(false); // back to VIEW mode, popup stays open
        alert("Profile updated successfully!");
      } else {
        const err = await response.json();
        alert(err.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Server error. Please try again.");
    }
  };

  const fallbackName = userData?.name || 'Admin';
  const fallbackRole = userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'User';
  const avatarLetter = fallbackName.charAt(0).toUpperCase();

  return (
    <>
      <header className="admin-header">
        <div className="header-left">
          <button className="menu-btn" onClick={toggleSidebar}>
            <FiMenu size={24} />
          </button>
          <div className="header-text">
            <h2 className="header-title">{title}</h2>
            {subtitle && <p className="header-subtitle">{subtitle}</p>}
          </div>
        </div>
        
        <div className="header-right" ref={dropdownRef} style={{ position: 'relative' }}>

        
          
          {/* Clickable Profile Trigger */}
          <div className="admin-profile" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <div className="avatar">{avatarLetter}</div>
            <FiChevronDown className="profile-caret" />
          </div>

          {/* Small Header Dropdown */}
          {isDropdownOpen && (
            <div className="header-dropdown">
              <div className="dropdown-user-info">
                <strong>{fallbackName}</strong>
                <span>{userData?.email}</span>
              </div>
              <div className="dropdown-divider"></div>

              {/* My Profile is shown ONLY for normal users, not admins */}
              {!isAdmin && (
                <button className="dropdown-item" onClick={openProfileModal}>
                  <FiUser className="dropdown-icon" /> My Profile
                </button>
              )}

              <button className="dropdown-item text-red" onClick={handleLogout}>
                <FiLogOut className="dropdown-icon" /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* PROFILE POPUP (users only) */}
      {!isAdmin && isModalOpen && (
        <div className="modal-overlay" onClick={closeProfileModal}>
          <form className="pm-card" onClick={(e) => e.stopPropagation()} onSubmit={handleProfileUpdate}>
            
            {/* Title row */}
            <div className="pm-head">
              <h3 className="pm-title">{isEditMode ? 'Edit profile' : 'My profile'}</h3>
              <button type="button" className="pm-close-x" onClick={closeProfileModal} aria-label="Close">
                <FiX size={20} />
              </button>
            </div>

            <div className="pm-main">
              {/* LEFT: avatar (+ Edit button in view mode) */}
              <div className="pm-left">
                <div className="pm-avatar"><FiUser size={48} /></div>
                <h4 className="pm-left-name">{fallbackName}</h4>
                <span className="pm-role-badge">{fallbackRole}</span>

                {!isEditMode && (
                  <button type="button" className="pm-edit-btn" onClick={startEdit}>
                    <FiEdit2 size={14} /> Edit
                  </button>
                )}
              </div>

              {/* RIGHT: fields */}
              <div className="pm-right">
                <div className="pm-field">
                  <label className="pm-label" htmlFor="pm-name">Name</label>
                  <input
                    id="pm-name"
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleFormChange}
                    className={`pm-input ${!isEditMode ? 'pm-input-view' : ''}`}
                    placeholder="Enter full name"
                    readOnly={!isEditMode}
                    required
                  />
                </div>

                <div className="pm-field">
                  <label className="pm-label" htmlFor="pm-email">Email</label>
                  <input
                    id="pm-email"
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleFormChange}
                    className={`pm-input ${!isEditMode ? 'pm-input-view' : ''}`}
                    placeholder="Enter email address"
                    readOnly={!isEditMode}
                    required
                  />
                </div>

                <div className="pm-field">
                  <label className="pm-label" htmlFor="pm-phone">Phone number</label>
                  <input
                    id="pm-phone"
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleFormChange}
                    className={`pm-input ${!isEditMode ? 'pm-input-view' : ''}`}
                    placeholder="Enter phone number"
                    readOnly={!isEditMode}
                    required
                  />
                </div>

                {/* Password change is available only in edit mode */}
                {isEditMode && (
                  <>
                    <button type="button" className="pm-pass-toggle" onClick={togglePasswordSection}>
                      <FiLock size={15} /> {showPasswordSection ? 'Cancel password change' : 'Change password'}
                    </button>

                    {showPasswordSection && (
                      <div className="pm-pass-section">
                        <div className="pm-field">
                          <label className="pm-label" htmlFor="pm-new">New password</label>
                          <div className="pm-password-wrap">
                            <input
                              id="pm-new"
                              type={showNewPassword ? 'text' : 'password'}
                              name="newPassword"
                              value={editForm.newPassword}
                              onChange={handleFormChange}
                              className="pm-input"
                              placeholder="••••••••"
                              autoComplete="new-password"
                            />
                            <button type="button" className="pm-eye-btn" onClick={() => setShowNewPassword(!showNewPassword)} aria-label="Toggle password visibility">
                              {showNewPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                            </button>
                          </div>
                        </div>

                        <div className="pm-field">
                          <label className="pm-label" htmlFor="pm-confirm">Confirm password</label>
                          <div className="pm-password-wrap">
                            <input
                              id="pm-confirm"
                              type={showConfirmPassword ? 'text' : 'password'}
                              name="confirmPassword"
                              value={editForm.confirmPassword}
                              onChange={handleFormChange}
                              className="pm-input"
                              placeholder="••••••••"
                              autoComplete="new-password"
                              required={!!editForm.newPassword}
                            />
                            <button type="button" className="pm-eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label="Toggle password visibility">
                              {showConfirmPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="pm-foot">
              {!isEditMode ? (
                <button type="button" className="pm-btn pm-btn-close" onClick={closeProfileModal}>Close</button>
              ) : (
                <>
                  <button type="button" className="pm-btn pm-btn-close" onClick={cancelEdit}>Cancel</button>
                  <button type="submit" className="pm-btn pm-btn-save">Save</button>
                </>
              )}
            </div>
          </form>
        </div>
      )}
    </>
  );
}
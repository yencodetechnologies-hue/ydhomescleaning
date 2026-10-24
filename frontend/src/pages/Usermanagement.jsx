import { useState, useEffect, useMemo } from 'react';
import { 
  FiEye, FiEyeOff, FiEdit2, FiTrash2, FiPlus, FiSearch, 
  FiX, FiUsers, FiChevronLeft, FiChevronRight, FiCopy, FiCheck
} from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import { API_BASE_URL } from '../config';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Which row just had its link copied (for the tick icon)
  const [copiedId, setCopiedId] = useState(null);

  // Modal State
  const [modalType, setModalType] = useState('none');
  
  const initialForm = { _id: null, name: '', email: '', phone: '', password: '', confirmPassword: '', status: 'Active' };
  const [formData, setFormData] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, { cache: 'no-store' });
    const data = await response.json();
    const list = Array.isArray(data) ? data : [];

    // Show the table immediately
    setUsers(list);

    // Fallback: for any user that came back without a link, fetch it
    const missing = list.filter((u) => !u.accessUrl);
    if (missing.length > 0) {
      const links = await Promise.all(
        missing.map(async (u) => {
          try {
            const r = await fetch(`${API_BASE_URL}/users/${u._id}/access-link`, { method: 'POST' });
            if (!r.ok) return null;
            const d = await r.json();
            return { id: u._id, accessUrl: d.accessUrl };
          } catch {
            return null;
          }
        })
      );

      setUsers((prev) =>
        prev.map((u) => {
          const found = links.find((l) => l && l.id === u._id);
          return found ? { ...u, accessUrl: found.accessUrl } : u;
        })
      );
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

  // --- Copy access link ---
  const copyText = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-HTTPS / older browsers
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      return true;
    } catch (err) {
      console.error('Copy failed:', err);
      return false;
    }
  };

  const handleCopyLink = async (userId, url) => {
    const ok = await copyText(url);
    if (ok) {
      setCopiedId(userId);
      setTimeout(() => setCopiedId((curr) => (curr === userId ? null : curr)), 2000);
    } else {
      alert('Could not copy. Please select and copy the link manually.');
    }
  };

  const filteredUsers = useMemo(() => {
    const query = (searchQuery || '').toLowerCase();
    return users.filter(u => {
      const nameMatch = (u.name || '').toLowerCase().includes(query);
      const emailMatch = (u.email || '').toLowerCase().includes(query);
      return nameMatch || emailMatch;
    });
  }, [users, searchQuery]);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const openModal = (type, user = null) => {
    setModalType(type);
    if (user) {
      // Only copy the editable fields (leave accessUrl out of the form)
      setFormData({
        _id: user._id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        status: user.status || 'Active',
        password: '',
        confirmPassword: ''
      });
    } else {
      setFormData(initialForm);
    }
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const closeModal = () => setModalType('none');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((modalType === 'add' || formData.password) && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      if (modalType === 'add') {
        const response = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const newUser = await response.json();
          // newUser contains accessUrl (same link that was emailed)
          setUsers([newUser, ...users]);
          closeModal();
          setCurrentPage(1);
          alert(`User created successfully. Login details sent to ${newUser.email}`);
        } else {
          const err = await response.json();
          alert(err.message || 'Error creating user');
        }
      } else if (modalType === 'edit') {
        const response = await fetch(`${API_BASE_URL}/users/${formData._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const updatedUser = await response.json();
          // Merge, and never let a missing accessUrl wipe the existing one
          setUsers(users.map(u =>
            u._id === updatedUser._id
              ? { ...u, ...updatedUser, accessUrl: updatedUser.accessUrl || u.accessUrl }
              : u
          ));
          closeModal();
        } else {
          const err = await response.json();
          alert(err.message || 'Error updating user');
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setUsers(users.filter(u => u._id !== id));
          if (currentUsers.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const showConfirmField = modalType === 'add' || formData.password.length > 0;

  return (
    <AdminLayout pageTitle="User Management">
      
      <div className="page-banner">
        <div className="banner-left">
          <div className="banner-icon"><FiUsers size={28} /></div>
          <div>
            <h1 className="banner-title">Client Directory</h1>
            <p className="banner-subtitle">Manage standard users and app clients.</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        
        <div className="table-top-header">
          <div>
            <h2 className="table-title">Registered Users</h2>
            <p className="table-subtitle">View and manage client accounts</p>
          </div>
          <button className="btn-primary" onClick={() => openModal('add')}>
            <FiPlus size={18} /> Add New User
          </button>
        </div>

        <div className="table-controls">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              className="ctrl-input search-input" 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>USER INFO</th>
                <th>PHONE</th>
                <th>STATUS</th>
                <th>ACCESS LINK</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No users found.</td></tr>
              ) : (
                currentUsers.map((user, index) => {
                  const link = user.accessUrl;
                  const isCopied = copiedId === user._id;

                  return (
                    <tr key={user._id}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                        {(currentPage - 1) * usersPerPage + index + 1}
                      </td>
                      <td>
                        <div className="type-cell" style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="type-name" style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{user.name}</span>
                          <span className="type-sub" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</span>
                        </div>
                      </td>
                      <td>{user.phone}</td>
                      <td>
                        <span className={`status-badge badge-${user.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active'}`}>
                          <span className={`pill-dot dot-${user.status?.toLowerCase() === 'inactive' ? 'red' : 'green'}`}></span>
                          {user.status || 'Active'}
                        </span>
                      </td>
                      <td>
                        {link ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '260px' }}>
                            <span
                              title={link}
                              style={{
                                fontSize: '12px',
                                color: 'var(--text-muted)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                                minWidth: 0
                              }}
                            >
                              {link}
                            </span>
                            <button
                              className="act-btn btn-view"
                              onClick={() => handleCopyLink(user._id, link)}
                              title={isCopied ? 'Copied!' : 'Copy link'}
                              style={{ flexShrink: 0 }}
                            >
                              {isCopied ? <FiCheck size={16} /> : <FiCopy size={16} />}
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="act-btn btn-view" onClick={() => openModal('view', user)} title="View"><FiEye size={16} /></button>
                          <button className="act-btn btn-edit" onClick={() => openModal('edit', user)} title="Edit"><FiEdit2 size={16} /></button>
                          <button className="act-btn btn-delete" onClick={() => handleDelete(user._id)} title="Delete"><FiTrash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredUsers.length > 0 && (
          <div className="table-footer">
            <span className="showing-text">
              Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
            </span>
            <div className="pagination">
              <button className="page-btn" onClick={handlePrevPage} disabled={currentPage === 1} style={{ opacity: currentPage === 1 ? 0.5 : 1 }}>
                <FiChevronLeft size={16} />
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button key={index + 1} onClick={() => paginate(index + 1)} className={`page-btn ${currentPage === index + 1 ? 'active' : ''}`}>
                  {index + 1}
                </button>
              ))}
              <button className="page-btn" onClick={handleNextPage} disabled={currentPage === totalPages} style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}>
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {modalType !== 'none' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" style={{ width: '100%', maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="modal-title" style={{ margin: 0, fontSize: '18px', color: 'var(--text-dark)' }}>
                {modalType === 'add' ? 'Add New User' : modalType === 'edit' ? 'Edit User' : 'User Details'}
              </h2>
              <button className="close-modal-btn" onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX size={20} /></button>
            </div>

            {modalType === 'view' ? (
              <div className="view-room-details" style={{ lineHeight: '1.8', color: 'var(--text-dark)' }}>
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Phone:</strong> {formData.phone}</p>
                <p><strong>Status:</strong> {formData.status || 'Active'}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)' }}>Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="ctrl-input" required />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)' }}>Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="ctrl-input" required />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)' }}>Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="ctrl-input" required />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)' }}>Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="ctrl-input filter-select" style={{ width: '100%' }}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', gridColumn: showConfirmField ? 'auto' : '1 / -1' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)' }}>
                      {modalType === 'edit' ? 'New Password (Leave blank to keep current)' : 'Password'}
                    </label>
                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="ctrl-input" required={modalType === 'add'} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', bottom: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>

                  {showConfirmField && (
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)' }}>Confirm Password</label>
                      <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="ctrl-input" required={modalType === 'add' || formData.password.length > 0} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '10px', bottom: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  )}

                </div>
                
                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button type="button" onClick={closeModal} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" className="btn-primary">
                    {modalType === 'add' ? 'Save User' : 'Update User'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
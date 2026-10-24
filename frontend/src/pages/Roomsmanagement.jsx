import { useState, useEffect } from 'react';
import { 
  FiPlus, FiUserPlus, FiTrash2, FiX, FiEdit, FiEye, 
  FiChevronLeft, FiChevronRight, FiGrid, FiSearch 
} from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import { API_BASE_URL } from '../config';
import './Roomsmanagement.css';

export default function RoomsManagement() {
  const [rooms, setRooms] = useState([]);
  const [staffList, setStaffList] = useState([]); 
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  // Data States
  const [newRoom, setNewRoom] = useState({ number: '', type: '', sections: [] });
  const [editRoom, setEditRoom] = useState(null); 
  const [viewRoom, setViewRoom] = useState(null); 
  
  // Input states for adding a new section
  const [customSectionInput, setCustomSectionInput] = useState(''); 
  const [customAssigneeInput, setCustomAssigneeInput] = useState(''); // NEW: Track assignee during creation
  
  // Assign Section States (for updating later)
  const [activeData, setActiveData] = useState({ roomId: null, sectionId: null, sectionName: '' });
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [roomsPerPage] = useState(10); 

  useEffect(() => { 
    fetchRooms(); 
    fetchStaff();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms`);
      const data = await response.json();
      setRooms(data);
    } catch (error) { console.error('Error fetching rooms:', error); }
  };

  const fetchStaff = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (response.ok) {
        const data = await response.json();
        const activeCleaners = data.filter(user => user.status !== 'Inactive');
        setStaffList(activeCleaners);
      }
    } catch (error) {
      console.error('Error fetching staff list:', error);
    }
  };

  /* --- PAGINATION LOGIC --- */
  const indexOfLastRoom = currentPage * roomsPerPage;
  const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
  const currentRooms = rooms.slice(indexOfFirstRoom, indexOfLastRoom);
  const totalPages = Math.ceil(rooms.length / roomsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  /* --- ADD & EDIT SECTION LOGIC --- */
  const handleAddSection = (target, setTarget) => {
    const trimmed = customSectionInput.trim();
    if (!trimmed) return;
    if (target.sections.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      return alert("Section already exists");
    }
    setTarget(prev => ({
      ...prev,
      sections: [...prev.sections, { 
        name: trimmed, 
        status: 'Dirty', 
        assignedTo: customAssigneeInput || 'Unassigned' // Automatically assign on creation
      }]
    }));
    setCustomSectionInput('');
    setCustomAssigneeInput(''); // Reset dropdown
  };

  const handleRemoveSection = (target, setTarget, sectionName) => {
    setTarget(prev => ({ ...prev, sections: prev.sections.filter(s => s.name !== sectionName) }));
  };

  /* --- SUBMIT ADD ROOM --- */
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (newRoom.sections.length === 0) return alert("Please add at least one section");

    try {
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom),
      });
      if (response.ok) {
        const data = await response.json();
        setRooms([data, ...rooms]);
        setIsAddModalOpen(false);
        setNewRoom({ number: '', type: '', sections: [] });
        setCurrentPage(1); 
      }
    } catch (error) { console.error('Error adding room:', error); }
  };

  /* --- SUBMIT EDIT ROOM --- */
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editRoom.sections.length === 0) return alert("Please add at least one section");

    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${editRoom._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: editRoom.number, type: editRoom.type, sections: editRoom.sections }),
      });
      if (response.ok) {
        const updatedRoom = await response.json();
        setRooms(rooms.map(r => r._id === updatedRoom._id ? updatedRoom : r));
        setIsEditModalOpen(false);
      }
    } catch (error) { console.error('Error editing room:', error); }
  };

  /* --- SUBMIT SECTION ASSIGNMENT --- */
  const openAssignModal = (roomId, section) => {
    setActiveData({ roomId, sectionId: section._id, sectionName: section.name });
    setAssignee(section.assignedTo === 'Unassigned' ? '' : section.assignedTo);
    setStatus(section.status);
    setIsAssignModalOpen(true);
  };

  const handleUpdateSave = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${activeData.roomId}/section/${activeData.sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: assignee || 'Unassigned', status }),
      });

      if (response.ok) {
        const updatedRoom = await response.json();
        setRooms(rooms.map(r => r._id === updatedRoom._id ? updatedRoom : r));
        setViewRoom(updatedRoom); 
        setIsAssignModalOpen(false);
      }
    } catch (error) { console.error('Error updating section:', error); }
  };

  /* --- DELETE ROOM --- */
  const handleDelete = async (id) => {
    if (window.confirm('Delete this entire room?')) {
      try {
        await fetch(`${API_BASE_URL}/rooms/${id}`, { method: 'DELETE' });
        const updatedRooms = rooms.filter(r => r._id !== id);
        setRooms(updatedRooms);
        if (viewRoom && viewRoom._id === id) setIsViewModalOpen(false);
        
        if (currentRooms.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (error) { console.error('Error deleting room:', error); }
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Clean': return 'badge-clean';
      case 'Dirty': return 'badge-dirty';
      case 'In Progress': return 'badge-progress';
      case 'Maintenance': return 'badge-maintenance';
      default: return '';
    }
  };

  return (
    <AdminLayout pageTitle="Room Management">

      <div className="page-banner">
        <div className="banner-left">
          <div className="banner-icon"><FiGrid size={24} /></div>
          <div>
            <h1 className="banner-title">Rooms</h1>
            <p className="banner-subtitle">Manage rooms, sections and cleaning assignments.</p>
          </div>
        </div>
      </div>

      <div className="rooms-container">
        <div className="rooms-header-actions">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Search rooms..." className="ctrl-input search-input" />
          </div>
          <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <FiPlus size={18} /> Add New Room
          </button>
        </div>

        <div className="table-wrapper">
          <table className="rooms-table">
            <thead>
              <tr>
                <th>Room No.</th>
                <th>Type / Name</th>
                <th>Sections</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRooms.map((room) => (
                <tr key={room._id}>
                  <td className="fw-600">{room.number}</td>
                  <td>{room.type}</td>
                  <td>
                    <div className="simple-sections">
                      {room.sections.map(s => (
                        <span key={s._id || s.name} className="simple-section-badge" title={`Assigned to: ${s.assignedTo}`}>
                          <span className={`status-dot ${getStatusClass(s.status)}`}></span> {s.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn" title="View & Manage" onClick={() => { setViewRoom(room); setIsViewModalOpen(true); }}>
                        <FiEye size={16} />
                      </button>
                      <button className="action-btn edit-btn" title="Edit Room" onClick={() => { setEditRoom(room); setIsEditModalOpen(true); }}>
                        <FiEdit size={16} />
                      </button>
                      <button className="action-btn delete-btn" title="Delete Room" onClick={() => handleDelete(room._id)}>
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    No rooms found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {rooms.length > 0 && (
          <div className="table-footer">
            <span className="showing-text">
              Showing {indexOfFirstRoom + 1} to {Math.min(indexOfLastRoom, rooms.length)} of {rooms.length} rooms
            </span>
            <div className="pagination">
              <button className="page-btn" onClick={handlePrevPage} disabled={currentPage === 1} style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
                <FiChevronLeft size={16} />
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button key={index + 1} onClick={() => paginate(index + 1)} className={`page-btn ${currentPage === index + 1 ? 'active' : ''}`}>
                  {index + 1}
                </button>
              ))}
              <button className="page-btn" onClick={handleNextPage} disabled={currentPage === totalPages} style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- 1. VIEW & MANAGE ROOM MODAL --- */}
      {isViewModalOpen && viewRoom && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3>Manage Sections: {viewRoom.number}</h3>
              <button className="close-modal" onClick={() => setIsViewModalOpen(false)}><FiX size={20} /></button>
            </div>
            
            <div className="view-room-details">
              <p><strong>Type:</strong> {viewRoom.type}</p>
            </div>

            <div className="sections-grid">
              {viewRoom.sections.map(section => (
                <div key={section._id} className="section-card">
                  <div className="section-card-header">
                    <h4>{section.name}</h4>
                    <span className={`status-badge ${getStatusClass(section.status)}`}>{section.status}</span>
                  </div>
                  
                  <div className="section-card-body">
                    <p><strong>Assigned:</strong> {section.assignedTo}</p>
                    
                    {section.photoUrl && (
                      <div style={{ marginTop: '12px' }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                          <strong>Completion Photo:</strong>
                        </p>
                        <img 
                          src={section.photoUrl} 
                          alt="Completed Section" 
                          title="Click to view full size"
                          onClick={() => window.open(section.photoUrl, '_blank')}
                          style={{ 
                            width: '100%', 
                            height: '140px', 
                            objectFit: 'cover', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            border: '1px solid var(--border-light)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }} 
                        />
                      </div>
                    )}

                    <button className="btn-secondary btn-sm" style={{ marginTop: '12px', width: '100%' }} onClick={() => openAssignModal(viewRoom._id, section)}>
                      <FiUserPlus size={14} /> Reassign Cleaner
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- 2. ADD ROOM MODAL --- */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Room</h3>
              <button className="close-modal" onClick={() => setIsAddModalOpen(false)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="modal-form">
              <div className="form-group">
                <label>Room Number</label>
                <input type="text" value={newRoom.number} onChange={(e) => setNewRoom({...newRoom, number: e.target.value})} className="ctrl-input search-input" required />
              </div>
              <div className="form-group">
                <label>Room Category / Type</label>
                <input type="text" value={newRoom.type} onChange={(e) => setNewRoom({...newRoom, type: e.target.value})} className="ctrl-input search-input" required />
              </div>
              <div className="form-group">
                <label>Add Sections & Assign Cleaner</label>
                
                {/* NEW COMPOSITE INPUT WRAPPER */}
                <div className="add-section-wrapper" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="text" value={customSectionInput} onChange={(e) => setCustomSectionInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSection(newRoom, setNewRoom); } }} className="ctrl-input search-input" placeholder="Area Name (e.g. Bathroom)" style={{ flex: '1.5' }}/>
                  
                  <select value={customAssigneeInput} onChange={(e) => setCustomAssigneeInput(e.target.value)} className="ctrl-input search-input" style={{ flex: '1' }}>
                    <option value="">Unassigned</option>
                    {staffList.map((staff) => (
                      <option key={staff._id} value={staff.name}>{staff.name}</option>
                    ))}
                  </select>

                  <button type="button" onClick={() => handleAddSection(newRoom, setNewRoom)} className="btn-secondary add-sec-btn">Add</button>
                </div>

                <div className="section-chips">
                  {newRoom.sections.map(sec => (
                    <div key={sec.name} className="section-chip">
                      <span>{sec.name} <strong style={{color: 'var(--primary-teal)', marginLeft: '4px'}}>({sec.assignedTo})</strong></span>
                      <button type="button" onClick={() => handleRemoveSection(newRoom, setNewRoom, sec.name)} className="chip-remove"><FiX size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- 3. EDIT ROOM MODAL --- */}
      {isEditModalOpen && editRoom && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Room</h3>
              <button className="close-modal" onClick={() => setIsEditModalOpen(false)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label>Room Number</label>
                <input type="text" value={editRoom.number} onChange={(e) => setEditRoom({...editRoom, number: e.target.value})} className="ctrl-input search-input" required />
              </div>
              <div className="form-group">
                <label>Room Category / Type</label>
                <input type="text" value={editRoom.type} onChange={(e) => setEditRoom({...editRoom, type: e.target.value})} className="ctrl-input search-input" required />
              </div>
              <div className="form-group">
                <label>Manage Sections</label>
                
                <div className="add-section-wrapper" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="text" value={customSectionInput} onChange={(e) => setCustomSectionInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSection(editRoom, setEditRoom); } }} className="ctrl-input search-input" placeholder="Add area..." style={{ flex: '1.5' }}/>
                  
                  <select value={customAssigneeInput} onChange={(e) => setCustomAssigneeInput(e.target.value)} className="ctrl-input search-input" style={{ flex: '1' }}>
                    <option value="">Unassigned</option>
                    {staffList.map((staff) => (
                      <option key={staff._id} value={staff.name}>{staff.name}</option>
                    ))}
                  </select>

                  <button type="button" onClick={() => handleAddSection(editRoom, setEditRoom)} className="btn-secondary add-sec-btn">Add</button>
                </div>

                <div className="section-chips">
                  {editRoom.sections.map(sec => (
                    <div key={sec.name} className="section-chip">
                      <span>{sec.name} <strong style={{color: 'var(--primary-teal)', marginLeft: '4px'}}>({sec.assignedTo})</strong></span>
                      <button type="button" onClick={() => handleRemoveSection(editRoom, setEditRoom, sec.name)} className="chip-remove"><FiX size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Update Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- 4. ASSIGN CLEANER MODAL --- */}
      {isAssignModalOpen && (
        <div className="modal-overlay" style={{zIndex: 110}}>
          <div className="modal-content" style={{maxWidth: '350px'}}>
            <div className="modal-header">
              <h3>Assign Cleaner: {activeData.sectionName}</h3>
              <button className="close-modal" onClick={() => setIsAssignModalOpen(false)}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleUpdateSave} className="modal-form">
              <div className="form-group">
                <label>Assign Cleaner</label>
                <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="modal-select">
                  <option value="">-- Unassigned --</option>
                  {staffList.map((staff) => (
                    <option key={staff._id} value={staff.name}>
                      {staff.name} {staff.role && `(${staff.role})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsAssignModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
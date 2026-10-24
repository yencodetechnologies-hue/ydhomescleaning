import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiCamera, FiUploadCloud, FiX, FiChevronLeft, FiChevronRight, FiEye, FiAlertCircle, FiLock, FiClock } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import { API_BASE_URL } from '../config';
import './Assignedrooms.css'; 

export default function AssignedRooms() {
  const navigate = useNavigate();
  const [myTasks, setMyTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Access Control State (null = checking, true = access granted, false = access denied)
  const [hasCheckedIn, setHasCheckedIn] = useState(null);

  // Tabs & Pagination States
  const [activeTab, setActiveTab] = useState('Pending');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Camera & Upload States
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // View Image State
  const [previewImage, setPreviewImage] = useState(null);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('userDetails');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);
      
      const userId = parsedUser.id || parsedUser._id;
      // 1. Verify Attendance Status First
      verifyAttendance(userId).then((isCheckedIn) => {
        if (isCheckedIn) {
          // 2. Only fetch rooms if they are checked in
          fetchRooms(parsedUser.name);
        }
      });
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // --- ATTENDANCE VERIFICATION LOGIC ---
  const verifyAttendance = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/my-records/${userId}`);
      if (response.ok) {
        const records = await response.json();
        if (records && records.length > 0) {
          // Find the most recent record
          const sortedRecords = [...records].sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
          const latestRecord = sortedRecords[0];
          
          // If a record exists with a checkInTime but NO checkOutTime, they are actively checked in
          if (latestRecord && latestRecord.checkInTime && !latestRecord.checkOutTime) {
            setHasCheckedIn(true);
            return true;
          }
        }
      }
      setHasCheckedIn(false);
      return false;
    } catch (error) {
      console.error('Error verifying attendance:', error);
      setHasCheckedIn(false);
      return false;
    }
  };

  const fetchRooms = async (userName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms`);
      if (response.ok) {
        const allRooms = await response.json();
        const tasks = [];
        allRooms.forEach(room => {
          if (room.sections) {
            room.sections.forEach(section => {
              if (section.assignedTo === userName) {
                tasks.push({
                  roomId: room._id,
                  roomNumber: room.number,
                  roomType: room.type,
                  sectionId: section._id,
                  sectionName: section.name,
                  status: section.status,
                  photo: section.photo || section.imageUrl || section.photoUrl || null
                });
              }
            });
          }
        });
        setMyTasks(tasks);
      }
    } catch (error) {
      console.error('Error fetching assigned rooms:', error);
    }
  };

  const triggerPhotoUpload = (task) => {
    setActiveTask(task);
    setSelectedFile(null);
    setPreviewUrl('');
    setIsPhotoModalOpen(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmitCompletion = async () => {
    if (!selectedFile) return alert("Please capture a photo first.");
    
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('photo', selectedFile);
    formData.append('status', 'Clean');
    formData.append('assignedTo', currentUser.name);

    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${activeTask.roomId}/section/${activeTask.sectionId}/complete`, {
        method: 'PUT',
        body: formData, 
      });

      if (response.ok) {
        fetchRooms(currentUser.name);
        setIsPhotoModalOpen(false);
      } else {
        alert("Failed to upload photo. Please try again.");
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Clean': 
      case 'Approved': return 'badge-clean'; 
      case 'Dirty': 
      case 'Rejected': return 'badge-dirty'; 
      case 'In Progress': return 'badge-progress';
      case 'Maintenance': return 'badge-maintenance';
      default: return '';
    }
  };

  const getStatusStyle = (status) => {
    if (status === 'Rejected') {
      return { backgroundColor: '#FEE2E2', color: '#991B1B' };
    }
    return {};
  };

  const filteredTasks = myTasks.filter(task => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return task.status === 'Dirty' || task.status === 'Rejected' || task.status === 'In Progress';
    if (activeTab === 'Completed') return task.status === 'Clean' || task.status === 'Approved';
    return task.status === activeTab;
  });

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);

  const tabs = ['Pending', 'Completed', 'All'];
  const isRejectedTask = activeTask && activeTask.status === 'Rejected';

  // --- RENDER LOADING STATE ---
  if (hasCheckedIn === null) {
    return (
      <AdminLayout pageTitle="My Assigned Rooms">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <p style={{ color: '#64748B', fontWeight: '500' }}>Verifying attendance status...</p>
        </div>
      </AdminLayout>
    );
  }

  // --- RENDER BLOCKED STATE (IF NOT CHECKED IN) ---
  if (hasCheckedIn === false) {
    return (
      <AdminLayout pageTitle="My Assigned Rooms">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', padding: '20px' }}>
          <div style={{ background: '#FEE2E2', padding: '20px', borderRadius: '50%', marginBottom: '20px', color: '#EF4444' }}>
            <FiLock size={48} />
          </div>
          <h2 style={{ fontSize: '24px', color: '#0F172A', marginBottom: '10px' }}>Access Restricted</h2>
          <p style={{ color: '#64748B', maxWidth: '400px', marginBottom: '30px', lineHeight: '1.6' }}>
            You must be checked in to view and manage your assigned rooms. Please scan the QR code on the Check In / Out page to begin your shift.
          </p>
          <button 
            onClick={() => navigate('/attendance')} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#2563EB', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
          >
            <FiClock size={18} /> Go to Check In
          </button>
        </div>
      </AdminLayout>
    );
  }

  // --- RENDER NORMAL AUTHORIZED VIEW ---
  return (
    <AdminLayout pageTitle="My Assigned Rooms">
      <div className="page-banner">
        <div className="banner-left">
          <div className="banner-icon" style={{ background: '#EBF4FF', color: '#3182CE' }}>
            <FiCheckCircle size={28} />
          </div>
          <div>
            <h1 className="banner-title">My Tasks</h1>
            <p className="banner-subtitle">Update your progress and capture photos to mark areas clean.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', borderRadius: '50px', border: '1px solid var(--border-light, #E5E7EB)',
              background: activeTab === tab ? 'var(--primary-teal, #0B6A61)' : 'white',
              color: activeTab === tab ? 'white' : 'var(--text-muted, #6B7280)',
              cursor: 'pointer', fontWeight: '500', fontSize: '14px', whiteSpace: 'nowrap', transition: 'all 0.2s ease'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="tasks-container">
        {currentTasks.length === 0 ? (
          <div className="empty-state" style={{ background: 'white', padding: '40px 20px', borderRadius: '12px', border: '1px solid var(--border-light)', textAlign: 'center' }}>
            <FiCheckCircle size={48} color="#10B981" style={{ marginBottom: '15px' }} />
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              {activeTab === 'All' ? "You have no assigned rooms at the moment!" : `No tasks found for status: ${activeTab}.`}
            </p>
          </div>
        ) : (
          <div className="mobile-cards-grid">
            {currentTasks.map((task) => (
              <div key={task.sectionId} className="task-card">
                <div className="task-card-header">
                  <div>
                    <h3 className="task-room-no">Room {task.roomNumber}</h3>
                    <p className="task-room-type">{task.roomType}</p>
                  </div>
                  <span className={`status-badge ${getStatusClass(task.status)}`} style={getStatusStyle(task.status)}>
                    {task.status === 'Clean' || task.status === 'Approved' ? 'Completed' : task.status}
                  </span>
                </div>
                
                <div className="task-card-body">
                  <p className="task-section-name"><strong>Area:</strong> {task.sectionName}</p>
                  
                  <div className="task-actions">
                    {(task.status === 'In Progress' || task.status === 'Dirty') && (
                      <button className="btn-primary w-100 mt-2" onClick={() => triggerPhotoUpload(task)}>
                        <FiCamera /> Take Photo to Complete
                      </button>
                    )}

                    {task.status === 'Rejected' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: '#FEE2E2', color: '#991B1B', fontSize: '13px', fontWeight: '600' }}>
                          <FiAlertCircle /> Photo rejected by admin. Please upload a new photo.
                        </div>
                        {task.photo && (
                          <button 
                            className="btn-secondary w-100" 
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer', color: '#475569', fontWeight: '500' }}
                            onClick={() => setPreviewImage(task.photo)}
                          >
                            <FiEye /> View Old Photo
                          </button>
                        )}
                        <button className="btn-primary w-100" onClick={() => triggerPhotoUpload(task)}>
                          <FiCamera /> Upload New Photo
                        </button>
                      </div>
                    )}

                    {(task.status === 'Clean' || task.status === 'Approved') && (
                      <div className="completed-notice-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div className="completed-notice">
                          {task.status === 'Approved' ? <><FiCheckCircle /> Verified & Approved</> : <><FiClock /> Pending Admin Review</>}
                        </div>
                        {task.photo && (
                          <button 
                            className="btn-secondary w-100" 
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer', color: '#475569', fontWeight: '500' }}
                            onClick={() => setPreviewImage(task.photo)}
                          >
                            <FiEye /> View Uploaded Photo
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: 'white', borderRadius: '12px', border: '1px solid var(--border-light)', marginTop: '20px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTasks.length)} of {filteredTasks.length}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="pagination-btn">
              <FiChevronLeft /> Prev
            </button>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="pagination-btn">
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* --- PHOTO CAPTURE MODAL --- */}
      {isPhotoModalOpen && activeTask && (
        <div className="modal-overlay">
          <div className="modal-content photo-modal">
            <div className="modal-header">
              <h3>{isRejectedTask ? 'Re-upload' : 'Complete'}: {activeTask.sectionName}</h3>
              <button className="close-modal-btn" onClick={() => setIsPhotoModalOpen(false)}><FiX size={22} /></button>
            </div>
            
            <div className="photo-upload-area">
              {!previewUrl ? (
                <div className="upload-placeholder" onClick={() => fileInputRef.current.click()}>
                  <FiCamera size={48} color="#8B98A9" />
                  <p>Tap to open camera</p>
                </div>
              ) : (
                <div className="image-preview-container">
                  <img src={previewUrl} alt="Preview" className="image-preview" />
                  <button className="btn-secondary retake-btn" onClick={() => fileInputRef.current.click()}>
                    Retake Photo
                  </button>
                </div>
              )}
              <input type="file" accept="image/*" capture="environment" onChange={handleFileSelect} ref={fileInputRef} style={{ display: 'none' }} />
            </div>

            <div className="modal-actions mt-3">
              <button className="btn-primary w-100" disabled={!selectedFile || isUploading} onClick={handleSubmitCompletion}>
                {isUploading ? 'Uploading...' : <><FiUploadCloud /> {isRejectedTask ? 'Submit New Photo' : 'Mark as Clean'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- IMAGE VIEW MODAL --- */}
      {previewImage && createPortal(
        <div 
          onClick={() => setPreviewImage(null)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2147483647, margin: 0, padding: 0 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button onClick={() => setPreviewImage(null)} style={{ position: 'absolute', top: '-45px', right: '0', background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2147483647, padding: 0 }}>
              <FiX size={20} />
            </button>
            <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 50px rgba(0, 0, 0, 0.8)', display: 'block' }} />
          </div>
        </div>,
        document.body
      )}
    </AdminLayout>
  );
}
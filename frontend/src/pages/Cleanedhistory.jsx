import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiCheckCircle, FiSearch, FiX, FiChevronLeft, FiChevronRight, FiImage, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import { API_BASE_URL } from '../config';
import './Cleanedhistory.css'; 

export default function CleanedHistory() {
  const [cleanedRecords, setCleanedRecords] = useState([]);
  
  // Search, Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 
  
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchCleanedRooms();
  }, []);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, fromDate, toDate]);

  const fetchCleanedRooms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms`);
      if (response.ok) {
        const allRooms = await response.json();
        const tasks = [];
        
        allRooms.forEach(room => {
          if (room.sections) {
            room.sections.forEach(section => {
              // Fetch Clean, Approved, AND Rejected so Admin can still see what they rejected
              if (section.status === 'Clean' || section.status === 'Approved' || section.status === 'Rejected') {
                tasks.push({
                  roomId: room._id,
                  roomNumber: room.number,
                  roomType: room.type,
                  sectionId: section._id,
                  sectionName: section.name,
                  assignedTo: section.assignedTo || 'Unknown',
                  photo: section.photo || section.imageUrl || section.photoUrl || null,
                  updatedAt: section.updatedAt || room.updatedAt || null,
                  status: section.status
                });
              }
            });
          }
        });
        
        tasks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setCleanedRecords(tasks);
      }
    } catch (error) {
      console.error('Error fetching cleaned history:', error);
    }
  };

  // --- Handle Admin Approve/Reject ---
  const handleAdminAction = async (roomId, sectionId, actionStatus) => {
    const confirmMessage = actionStatus === 'Rejected' 
      ? 'Are you sure you want to REJECT this photo? The user will be asked to re-upload it.'
      : 'Approve this cleaning?';

    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/section/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: actionStatus }),
      });

      if (response.ok) {
        // Keep it in the Admin table, just update the status locally to 'Approved' or 'Rejected'
        setCleanedRecords(prev => prev.map(r => 
          r.sectionId === sectionId ? { ...r, status: actionStatus } : r
        ));
      } else {
        alert("Failed to update status.");
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert("Server error.");
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFromDate('');
    setToDate('');
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '--/--/---- --:--';
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredRecords = cleanedRecords.filter(r => {
    const term = searchTerm.toLowerCase();
    const nameMatch = r.assignedTo.toLowerCase().includes(term);
    const roomMatch = String(r.roomNumber).toLowerCase().includes(term);
    const areaMatch = r.sectionName.toLowerCase().includes(term);
    const textMatch = nameMatch || roomMatch || areaMatch;

    let dateMatch = true;
    if (r.updatedAt) {
      const recordDate = new Date(r.updatedAt).toISOString().split('T')[0];
      if (fromDate && toDate) dateMatch = recordDate >= fromDate && recordDate <= toDate;
      else if (fromDate) dateMatch = recordDate >= fromDate;
      else if (toDate) dateMatch = recordDate <= toDate;
    } else if (fromDate || toDate) {
      dateMatch = false; 
    }

    return textMatch && dateMatch;
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <AdminLayout pageTitle="Cleaned History">
      <div className="attendance-banner">
        <div className="banner-icon-wrapper cleaned-banner-icon">
          <FiCheckCircle size={24} />
        </div>
        <div>
          <h2 className="banner-title-text">Cleaned Rooms History</h2>
          <p className="banner-subtitle-text">Master log of all completed cleaning tasks. Review and approve proof photos.</p>
        </div>
      </div>

      <div className="history-section-wrapper">
        <div className="history-header">
          <div className="filter-container">
            <div className="filter-item search-wrapper">
              <div className="search-input-container">
                <FiSearch className="search-icon-absolute" />
                <input 
                  type="text" 
                  placeholder="Search by Room No, Area, or Cleaner..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="filter-input search-input-padded"
                />
              </div>
            </div>
            <div className="filter-item">
              <span className="filter-label">From</span>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="filter-input" />
            </div>
            <div className="filter-item">
              <span className="filter-label">To</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="filter-input" />
            </div>
            {(searchTerm || fromDate || toDate) && (
              <button onClick={handleClearSearch} className="filter-clear-btn">
                <FiX size={16} /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="modern-table modern-table-checkin">
            <thead className="table-header-light">
              <tr>
                <th className="table-th-light">PROOF</th>
                <th className="table-th-light">DATE & TIME</th> 
                <th className="table-th-light">ROOM NO</th>
                <th className="table-th-light">AREA</th>
                <th className="table-th-light">CLEANED BY</th>
                <th className="table-th-light">STATUS</th>
                <th className="table-th-light" style={{ textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state-cell">
                    <div className="empty-state-icon empty-history-icon">
                      <FiCheckCircle size={30} />
                    </div>
                    <p className="empty-state-text">No cleaned history records found.</p>
                  </td>
                </tr>
              ) : (
                currentRecords.map((record) => (
                  <tr key={record.sectionId}>
                    <td>
                      {record.photo ? (
                        <div 
                          onClick={() => setPreviewImage(record.photo)}
                          className="thumbnail-wrapper"
                          title="Click to view image"
                          style={{ position: 'relative', width: '40px', height: '40px', cursor: 'pointer' }}
                        >
                          <img 
                            src={record.photo} 
                            alt="Cleaned Area" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} 
                          />
                        </div>
                      ) : (
                        <div className="thumbnail-placeholder" style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                          <FiImage size={18} />
                        </div>
                      )}
                    </td>
                    <td className="td-bold">{formatDateTime(record.updatedAt)}</td>
                    <td className="td-bold">
                      {record.roomNumber} 
                      <span className="room-type-subtext">{record.roomType}</span>
                    </td>
                    <td className="td-bold text-area">{record.sectionName}</td>
                    <td className="td-bold text-cleaner">{record.assignedTo}</td>
                    
                    {/* --- DYNAMIC STATUS BADGE --- */}
                    <td>
                      <span 
                        className={`status-badge`} 
                        style={{ 
                          backgroundColor: record.status === 'Approved' ? '#D1FAE5' : record.status === 'Rejected' ? '#FEE2E2' : '#FEF3C7', 
                          color: record.status === 'Approved' ? '#065F46' : record.status === 'Rejected' ? '#991B1B' : '#92400E' 
                        }}
                      >
                        {record.status === 'Approved' ? 'Approved' : record.status === 'Rejected' ? 'Rejected' : 'Pending Review'}
                      </span>
                    </td>

                    {/* --- DYNAMIC ACTION BUTTONS --- */}
                    <td style={{ textAlign: 'center' }}>
                      {record.status === 'Clean' ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => handleAdminAction(record.roomId, record.sectionId, 'Approved')}
                            style={{ padding: '6px', borderRadius: '6px', border: 'none', background: '#10B981', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="Approve"
                          >
                            <FiThumbsUp size={14} />
                          </button>
                          <button 
                            onClick={() => handleAdminAction(record.roomId, record.sectionId, 'Rejected')}
                            style={{ padding: '6px', borderRadius: '6px', border: 'none', background: '#EF4444', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="Reject & Request Re-upload"
                          >
                            <FiThumbsDown size={14} />
                          </button>
                        </div>
                      ) : record.status === 'Approved' ? (
                        <span style={{ fontSize: '13px', color: '#10B981', fontWeight: '600' }}>✓ Verified</span>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#EF4444', fontWeight: '600' }}>✗ Rejected</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination-wrapper">
            <span className="pagination-text">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRecords.length)} of {filteredRecords.length}
            </span>
            <div className="pagination-buttons">
              <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="pagination-btn">
                <FiChevronLeft /> Prev
              </button>
              <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="pagination-btn">
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
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
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // Added for the modal
import { FiActivity, FiSearch, FiCalendar, FiX, FiChevronLeft, FiChevronRight, FiCamera, FiClock } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import { API_BASE_URL } from '../config';
import './checkinout.css'; 
import './Useractivity.css';

export default function UserActivity() {
  const [allRecords, setAllRecords] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Image Preview State
  const [previewImage, setPreviewImage] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  useEffect(() => {
    fetchAllRecords();
  }, []);

  // Auto-reset to page 1 whenever any filter input changes
  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm, fromDate, toDate]);

  const fetchAllRecords = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/all`);
      if (response.ok) {
        const data = await response.json();
        
        // Sort all records chronologically (newest first)
        const sortedData = data.sort((a, b) => {
          return new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime();
        });
        
        setAllRecords(sortedData);
      }
    } catch (error) {
      console.error('Error fetching user activity:', error);
    }
  };

  const handleClearFilter = () => {
    setSearchTerm('');
    setFromDate('');
    setToDate('');
  };

  // Auto Search / Filter Logic applied directly to the records
  const filteredRecords = allRecords.filter(r => {
    const d = r.dateString;
    const term = searchTerm.toLowerCase();
    
    // Text matching
    const nameMatch = r.userName?.toLowerCase().includes(term) || false;
    
    // Date matching
    let dateMatch = true;
    if (fromDate && toDate) dateMatch = d >= fromDate && d <= toDate;
    else if (fromDate) dateMatch = d >= fromDate;
    else if (toDate) dateMatch = d <= toDate;

    return nameMatch && dateMatch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('en-GB', { day: '2-digit' }); 
    const month = date.toLocaleDateString('en-GB', { month: 'short' }); 
    const year = date.toLocaleDateString('en-GB', { year: 'numeric' }); 
    return `${day} ${month}, ${year}`;
  };

  return (
    <AdminLayout pageTitle="User Activity">
      
      <div className="attendance-banner">
        <div className="banner-icon-wrapper" style={{ background: '#F3E8FF', color: '#9333EA' }}>
          <FiActivity size={24} />
        </div>
        <div>
          <h2 className="banner-title-text">User Activity Log</h2>
          <p className="banner-subtitle-text">Monitor individual check-in and check-out records across all users.</p>
        </div>
      </div>

      <div className="history-section-wrapper">
        <div className="history-header">
          <div className="history-title-wrapper">
            <div className="history-title-icon" style={{ background: '#F3E8FF', color: '#9333EA' }}>
              <FiCalendar size={20} />
            </div>
            <h3 className="history-title-text">Master Attendance History</h3>
          </div>
          
          <div className="filter-container">
            <div className="filter-item">
              <input 
                type="text" 
                placeholder="Search user name..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="filter-input"
                style={{ minWidth: '200px' }}
              />
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
              <button onClick={handleClearFilter} className="filter-clear-btn">
                <FiX size={16} /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="modern-table modern-table-checkin">
            <thead className="table-header-light">
              <tr>
                <th className="table-th-light">S.NO</th>
                <th className="table-th-light">PHOTO</th>
                <th className="table-th-light">USER NAME</th>
                <th className="table-th-light">DATE</th>
                <th className="table-th-light">CHECK IN</th>
                <th className="table-th-light">CHECK OUT</th>
                <th className="table-th-light">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state-cell">
                    <div className="empty-state-icon">
                      <FiActivity size={30} />
                    </div>
                    <p className="empty-state-text">No user activity found.</p>
                  </td>
                </tr>
              ) : (
                currentRecords.map((record, index) => (
                  <tr key={record._id}>
                    <td className="td-muted">{indexOfFirstItem + index + 1}</td>
                    <td>
                      {record.checkInPhoto ? (
                        <img 
                          src={record.checkInPhoto} 
                          alt="Selfie" 
                          onClick={() => setPreviewImage(record.checkInPhoto)}
                          title="Click to view photo"
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            objectFit: 'cover', 
                            border: '2px solid #E2E8F0',
                            cursor: 'pointer' // Added cursor pointer
                          }} 
                        />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                          <FiCamera size={16} />
                        </div>
                      )}
                    </td>
                    <td className="td-bold" style={{ color: '#9333EA' }}>{record.userName}</td>
                    <td className="td-bold">{formatDateDisplay(record.dateString)}</td>
                    <td className="td-green">{formatTime(record.checkInTime)}</td>
                    <td className="td-red">{formatTime(record.checkOutTime)}</td>
                    <td>
                      {record.checkInTime && record.checkOutTime ? (
                        <span className="status-badge badge-clean">Exited</span>
                      ) : record.checkInTime ? (
                        <span className="status-badge badge-progress" style={{ background: '#D1FAE5', color: '#065F46' }}>Check In</span>
                      ) : (
                        <span className="status-badge badge-dirty">Missed</span>
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

      {/* --- IMAGE PREVIEW LIGHTBOX MODAL --- */}
      {previewImage && createPortal(
        <div 
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2147483647,
            margin: 0,
            padding: 0
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              maxWidth: '90vw',
              maxHeight: '90vh'
            }}
          >
            <button 
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-45px',
                right: '0',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 2147483647,
                padding: 0
              }}
            >
              <FiX size={20} />
            </button>
            
            <img 
              src={previewImage} 
              alt="Preview" 
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 10px 50px rgba(0, 0, 0, 0.8)',
                display: 'block'
              }} 
            />
          </div>
        </div>,
        document.body
      )}
    </AdminLayout>
  );
}
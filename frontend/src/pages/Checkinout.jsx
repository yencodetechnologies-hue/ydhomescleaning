import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FiClock, FiCalendar, FiCheckCircle, FiChevronLeft, FiChevronRight, FiX, FiMaximize, FiCamera, FiUploadCloud } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import { API_BASE_URL } from '../config';
import './Roomsmanagement.css'; 
import './checkinout.css'; 

export default function CheckInOut() {
  const [currentUser, setCurrentUser] = useState(null);
  const [records, setRecords] = useState([]);
  
  // Filters (No activeFilter needed for auto-search)
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Scanner & Selfie States
  const [isScanning, setIsScanning] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState(null);
  
  const [pendingScan, setPendingScan] = useState(null); 
  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const selfieInputRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userDetails'));
    if (user) {
      setCurrentUser(user);
      fetchRecords(user.id || user._id);
    }
    return () => {
      if (html5QrCode) html5QrCode.stop().catch(() => {});
    };
  }, []);

  // Auto-reset to page 1 whenever any date filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate]);

  const fetchRecords = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/my-records/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  // STEP 1: Scan QR Code
  const startScanner = (action) => {
    setIsScanning(true);
    setTimeout(() => {
      const qrCodeInstance = new Html5Qrcode("reader");
      setHtml5QrCode(qrCodeInstance);
      
      qrCodeInstance.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await qrCodeInstance.stop();
          setIsScanning(false);
          
          if (action === 'checkin') {
            setPendingScan({ qrData: decodedText, action });
            setIsSelfieModalOpen(true);
          } else if (action === 'checkout') {
            submitCheckout(decodedText);
          }
        },
        (error) => {}
      ).catch((err) => {
        console.error("Scanner Error:", err);
        alert('Camera permission denied or no rear camera found.');
        setIsScanning(false);
      });
    }, 100);
  };

  const cancelScanner = async () => {
    if (html5QrCode) {
      try { await html5QrCode.stop(); } catch (err) {}
    }
    setIsScanning(false);
  };

  const handleSelfieSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  // SUBMIT CHECK-IN (With Photo)
  const submitCheckInWithPhoto = async () => {
    if (!selfieFile) return alert("Please take a selfie first to check in.");
    setIsSubmitting(true);

    try {
      const userId = currentUser?.id || currentUser?._id;
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('userName', currentUser?.name);
      formData.append('scanType', pendingScan.action);
      formData.append('qrData', pendingScan.qrData);
      formData.append('photo', selfieFile);

      const response = await fetch(`${API_BASE_URL}/attendance/scan`, {
        method: 'POST',
        body: formData 
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        fetchRecords(userId); 
        setIsSelfieModalOpen(false);
        setSelfieFile(null);
        setSelfiePreview('');
        setPendingScan(null);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert('Error recording Check-In.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUBMIT CHECK-OUT (Directly, No Photo)
  const submitCheckout = async (qrData) => {
    try {
      const userId = currentUser?.id || currentUser?._id;
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('userName', currentUser?.name);
      formData.append('scanType', 'checkout');
      formData.append('qrData', qrData);

      const response = await fetch(`${API_BASE_URL}/attendance/scan`, {
        method: 'POST',
        body: formData 
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        fetchRecords(userId); 
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert('Error recording Check-Out.');
    }
  };

  let canCheckIn = true;
  let canCheckOut = false;
  
  if (records && records.length > 0) {
    const sortedRecords = [...records].sort((a, b) => {
      return new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime();
    });
    const latestRecord = sortedRecords[0]; 
    
    if (latestRecord && latestRecord.checkInTime && !latestRecord.checkOutTime) {
      canCheckIn = false;
      canCheckOut = true;
    }
  }

  const handleClearFilter = () => { setFromDate(''); setToDate(''); };

  // Auto Filter Logic applied directly to the records
  const filteredRecords = records.filter(r => {
    const d = r.dateString;
    let dateMatch = true;
    
    if (fromDate && toDate) dateMatch = d >= fromDate && d <= toDate;
    else if (fromDate) dateMatch = d >= fromDate;
    else if (toDate) dateMatch = d <= toDate;
    
    return dateMatch;
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Date Formatter matching UserActivity
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('en-GB', { day: '2-digit' }); 
    const month = date.toLocaleDateString('en-GB', { month: 'short' }); 
    const year = date.toLocaleDateString('en-GB', { year: 'numeric' }); 
    return `${day} ${month}, ${year}`;
  };

  return (
    <AdminLayout pageTitle="Check In / Out">
      
      <div className="attendance-banner">
        <div className="banner-icon-wrapper">
          <FiClock size={24} />
        </div>
        <div>
          <h2 className="banner-title-text">Attendance</h2>
          <p className="banner-subtitle-text">Scan the Admin QR code to record your attendance.</p>
        </div>
      </div>

      {!isScanning && !isSelfieModalOpen && (
        <div className="action-buttons-container">
          <button 
            className={`checkin-btn ${canCheckIn ? 'btn-active' : 'btn-disabled'}`}
            onClick={() => startScanner('checkin')} 
            disabled={!canCheckIn}
          >
            <FiMaximize size={18} /> Check In
          </button>
          
          <button 
            className={`checkin-btn ${canCheckOut ? 'btn-active' : 'btn-disabled'}`}
            onClick={() => startScanner('checkout')} 
            disabled={!canCheckOut}
          >
            <FiMaximize size={18} /> Check Out
          </button>
        </div>
      )}

      {isScanning && (
        <div className="scanner-container">
          <h3 className="scanner-title">
            Scanning QR Code...
          </h3>
          <div id="reader" className="scanner-reader"></div>
          <button onClick={cancelScanner} className="scanner-cancel-btn">
            Cancel Scan
          </button>
        </div>
      )}

      {/* --- SELFIE CAPTURE MODAL (Check-In Only) --- */}
      {isSelfieModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content photo-modal">
            <div className="modal-header">
              <h3 className="modal-title" style={{ margin: 0, fontSize: '18px' }}>
                Step 2: Take a Selfie
              </h3>
              <button 
                className="modal-close-btn" 
                onClick={() => {
                  setIsSelfieModalOpen(false);
                  setSelfieFile(null);
                  setSelfiePreview('');
                }}
              >
                <FiX size={22} />
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                Please capture a live photo to verify your Check In.
              </p>

              {!selfiePreview ? (
                <div 
                  onClick={() => selfieInputRef.current.click()}
                  style={{ background: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '40px 20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
                >
                  <FiCamera size={48} color="#94A3B8" />
                  <span style={{ color: '#64748B', fontWeight: '500' }}>Tap to open front camera</span>
                </div>
              ) : (
                <div>
                  <img 
                    src={selfiePreview} 
                    alt="Selfie Preview" 
                    style={{ width: '100%', maxWidth: '300px', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '15px' }} 
                  />
                  <button 
                    onClick={() => selfieInputRef.current.click()}
                    style={{ display: 'block', margin: '0 auto', background: '#F1F5F9', border: 'none', padding: '8px 16px', borderRadius: '6px', color: '#475569', cursor: 'pointer', fontWeight: '500' }}
                  >
                    Retake Photo
                  </button>
                </div>
              )}
              
              <input 
                type="file" 
                accept="image/*" 
                capture="user" 
                onChange={handleSelfieSelect} 
                ref={selfieInputRef}
                style={{ display: 'none' }}
              />

              <button 
                onClick={submitCheckInWithPhoto}
                disabled={!selfieFile || isSubmitting}
                style={{ 
                  width: '100%', padding: '14px', marginTop: '20px', borderRadius: '8px', border: 'none',
                  background: !selfieFile || isSubmitting ? '#E2E8F0' : '#2563EB',
                  color: !selfieFile || isSubmitting ? '#94A3B8' : 'white',
                  fontWeight: '600', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: !selfieFile || isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Recording...' : <><FiUploadCloud size={20}/> Complete Check In</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HISTORY TABLE --- */}
      <div className="history-section-wrapper">
        <div className="history-header">
          <div className="history-title-wrapper">
            <div className="history-title-icon"><FiCalendar size={20} /></div>
            <h3 className="history-title-text">My Attendance History</h3>
          </div>
          
          <div className="filter-container">
            <div className="filter-item">
              <span className="filter-label">From</span>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="filter-input" />
            </div>
            <div className="filter-item">
              <span className="filter-label">To</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="filter-input" />
            </div>
            
            {(fromDate || toDate) && (
              <button onClick={handleClearFilter} className="filter-clear-btn"><FiX size={16} /> Clear</button>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="modern-table modern-table-checkin">
            <thead className="table-header-light">
              <tr>
                <th className="table-th-light">PHOTO</th>
                <th className="table-th-light">DATE</th>
                <th className="table-th-light">CHECK IN</th>
                <th className="table-th-light">CHECK OUT</th>
                <th className="table-th-light">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state-cell">
                    <div className="empty-state-icon"><FiClock size={30} /></div>
                    <p className="empty-state-text">No attendance records found.</p>
                  </td>
                </tr>
              ) : (
                currentRecords.map((record) => (
                  <tr key={record._id}>
                    <td>
                      {/* Displays the uploaded Cloudinary image */}
                      {record.checkInPhoto ? (
                        <img 
                          src={record.checkInPhoto} 
                          alt="Selfie" 
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #E2E8F0' }} 
                        />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                          <FiCamera size={16} />
                        </div>
                      )}
                    </td>
                    <td className="td-bold">{formatDateDisplay(record.dateString)}</td>
                    <td className="td-green">{formatTime(record.checkInTime)}</td>
                    <td className="td-red">{formatTime(record.checkOutTime)}</td>
                    <td>
                      {record.checkInTime && record.checkOutTime ? (
                        <span className="status-badge badge-clean"><FiCheckCircle /> Completed</span>
                      ) : record.checkInTime ? (
                        <span className="status-badge badge-progress">Active</span>
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
    </AdminLayout>
  );
}
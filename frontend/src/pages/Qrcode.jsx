import { QRCodeCanvas } from 'qrcode.react';
import { FiPrinter, FiDownload, FiHexagon } from 'react-icons/fi'; // Using Hexagon as a placeholder logo
import html2canvas from 'html2canvas'; // Import the new library
import AdminLayout from '../components/AdminLayout'; 
import './Qrcode.css';

export default function QRCode() {
  const qrValue = 'ADMIN_SECURE_QR_CODE';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const captureElement = document.getElementById('downloadable-qr-card');
    if (!captureElement) return;

    try {
      // html2canvas takes a picture of the styled HTML div
      const canvas = await html2canvas(captureElement, {
        scale: 3, // High resolution for the downloaded image
        useCORS: true,
        backgroundColor: null 
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.href = imgData;
      downloadLink.download = 'Attendance-Poster.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR Code.');
    }
  };

  return (
    <AdminLayout pageTitle="QR Code Scanner">
      <div className="qr-page-wrapper">
        
        {/* --- THIS ENTIRE DIV GETS DOWNLOADED --- */}
        <div className="qr-poster" id="downloadable-qr-card">
          <div className="qr-poster-content">
            
            <div className="qr-poster-header">
              ATTENDANCE MANAGEMENT SYSTEM
            </div>

            {/* <div className="qr-poster-logo">
           
              <FiHexagon size={48} />
              <h1>M Access</h1>
            </div> */}

            <div className="qr-code-white-box">
              <QRCodeCanvas 
                value={qrValue} 
                size={240} 
                level="H"
                includeMargin={false} // Margin is handled by the CSS padding
              />
            </div>

            <h2 className="qr-action-text">Scan to Check In</h2>
          </div>

           <div className="qr-poster-footer">
            {/* <span className="powered-by-text">Powered By</span>
            
            <div className="yencode-badge">
              <FiHexagon size={24} color="#06B6D4" /> 
              <div className="yencode-badge-text">
                <span className="yencode-title">YENCODE</span>
                <span className="yencode-subtitle">TECHNOLOGIES</span>
              </div>
            </div> */}
          </div> 
        </div>
        {/* --- END DOWNLOADABLE POSTER --- */}

        <div className="qr-actions-container no-print">
          <button onClick={handleDownload} className="print-btn btn-blue">
            <FiDownload size={18} />
            <span>Download</span>
          </button>
          
          <button onClick={handlePrint} className="print-btn">
            <FiPrinter size={18} />
            <span>Print</span>
          </button>
        </div>
        
      </div>
    </AdminLayout>
  );
}
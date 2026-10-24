import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './AdminLayout.css';

export default function AdminLayout({ children, pageTitle, pageSubtitle }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="admin-layout">
      {/* Dark overlay when sidebar is open on mobile */}
      {isSidebarOpen && (
        <div className="mobile-overlay" onClick={closeSidebar}></div>
      )}

      <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
      
      <div className="main-content">
        <Header toggleSidebar={toggleSidebar} title={pageTitle} subtitle={pageSubtitle} />
        
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
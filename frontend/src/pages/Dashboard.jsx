import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUser, FiUsers, FiHome, FiCheckCircle, FiLogOut, FiArrowRight, FiMaximize,
  FiActivity, FiCheckSquare, FiSettings, FiClock, FiCalendar, FiLink,
  FiTrendingUp, FiClipboard, FiUserCheck
} from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import { API_BASE_URL } from '../config';
import './Dashboard.css';

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [metrics, setMetrics] = useState({ users: 0, rooms: 0, checkInsToday: 0, checkOutsToday: 0 });
  const [todaysAttendance, setTodaysAttendance] = useState([]);
  
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userDetails'));
    if (user) {
      setCurrentUser(user);
      const adminCheck = user.role === 'admin' || user.userType === 'admin';
      setIsAdmin(adminCheck);
      fetchDashboardData(user, adminCheck);
    }
  }, []);

  const fetchDashboardData = async (user, isAdminCheck) => {
    try {
      let usersCount = 0;
      let roomsCount = 0;
      let attendanceData = [];

      if (isAdminCheck) {
        const [usersRes, roomsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/users`),
          fetch(`${API_BASE_URL}/rooms`)
        ]);
        if (usersRes.ok) {
          const users = await usersRes.json();
          usersCount = users.length;
        }
        if (roomsRes.ok) {
          const rooms = await roomsRes.json();
          roomsCount = rooms.length;
        }
      }

      const attendanceUrl = isAdminCheck 
        ? `${API_BASE_URL}/attendance/all` 
        : `${API_BASE_URL}/attendance/my-records/${user.id || user._id}`;
        
      const attRes = await fetch(attendanceUrl);
      if (attRes.ok) {
        attendanceData = await attRes.json();
      }

      const todayRecords = attendanceData.filter(record => record.dateString === todayStr);
      
      const activeCheckIns = todayRecords.filter(r => r.checkInTime).length;
      const activeCheckOuts = todayRecords.filter(r => r.checkOutTime).length;

      setTodaysAttendance(todayRecords);
      setMetrics({
        users: usersCount,
        rooms: roomsCount,
        checkInsToday: activeCheckIns,
        checkOutsToday: activeCheckOuts
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || 'U';

  const getStatusLabel = (record) => {
    if (record.checkInTime && record.checkOutTime) return 'Completed';
    if (record.checkInTime) return 'Active';
    return 'Missed';
  };

  const renderStatusBadge = (record) => {
    if (record.checkInTime && record.checkOutTime) {
      return <span className="status-badge badge-clean">Completed</span>;
    }
    if (record.checkInTime) {
      return <span className="status-badge badge-progress">Active</span>;
    }
    return <span className="status-badge badge-dirty">Missed</span>;
  };

  const myTodayRecord = todaysAttendance.find(r => 
    (r.userId === currentUser?.id || r.userId === currentUser?._id) && r.dateString === todayStr
  ) || null;

  // Latest check-ins (admin list)
  const latestCheckIns = [...todaysAttendance]
    .filter(r => r.checkInTime)
    .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
    .slice(0, 4);

  // Quick links band (3 tiles + 1 highlighted tile)
  const quickTiles = isAdmin
    ? [
        { label: 'Users', sub: 'Manage user accounts', icon: FiUser, color: 'qt-teal', path: '/users' },
        { label: 'Rooms', sub: 'Allocate & manage rooms', icon: FiHome, color: 'qt-orange', path: '/rooms-mgmt' },
        { label: 'QR Code', sub: 'Attendance & check-in', icon: FiMaximize, color: 'qt-green', path: '/qr-code' },
      ]
    : [
        // { label: 'Rooms', sub: 'Rooms & sections', icon: FiHome, color: 'qt-orange', path: '/rooms-mgmt' },
        { label: 'My Rooms', sub: 'Assigned to you', icon: FiCheckSquare, color: 'qt-teal', path: '/assigned-rooms' },
        // { label: 'Settings', sub: 'Your preferences', icon: FiSettings, color: 'qt-green', path: '/settings' },
      ];

  const quickCta = isAdmin
    ? { label: 'User Activity', sub: 'Track real-time activity', icon: FiActivity, path: '/user-activity' }
    : { label: 'Check In / Out', sub: 'Log your attendance', icon: FiClock, path: '/attendance' };
  const CtaIcon = quickCta.icon;

  // Reusable welcome card (house illustration)
  const welcomeCard = (
    <div className="welcome-card">
      <div className="welcome-text">
        <h3 className="welcome-title">Welcome back, {currentUser?.name}!</h3>
        <p className="welcome-sub">
          {isAdmin
            ? "Here's what is happening with your team today."
            : 'Track your daily tasks and log your attendance.'}
        </p>
        {isAdmin ? (
          <span className="welcome-bar"></span>
        ) : (
          <button className="welcome-scan-btn" onClick={() => navigate('/attendance')}>
          Check-In / Out<FiArrowRight />
          </button>
        )}
      </div>

      <svg className="welcome-illus" viewBox="0 0 160 130" aria-hidden="true">
        <circle cx="134" cy="22" r="11" fill="#F7B955" />
        <ellipse cx="80" cy="122" rx="64" ry="6" fill="#B8DCD5" />
        <rect x="42" y="62" width="76" height="56" rx="4" fill="#FFFFFF" />
        <path d="M34 66 L80 24 L126 66 Z" fill="#195754" />
        <rect x="52" y="74" width="12" height="12" rx="2" fill="#3FB8A5" />
        <rect x="74" y="74" width="12" height="12" rx="2" fill="#3FB8A5" />
        <rect x="96" y="74" width="12" height="12" rx="2" fill="#3FB8A5" />
        <rect x="52" y="96" width="12" height="12" rx="2" fill="#3FB8A5" />
        <rect x="96" y="96" width="12" height="12" rx="2" fill="#3FB8A5" />
        <rect x="73" y="94" width="14" height="24" rx="2" fill="#F7B955" />
        <circle cx="134" cy="96" r="14" fill="#3DAE6B" />
        <rect x="132" y="104" width="4" height="14" fill="#195754" />
      </svg>
    </div>
  );

  return (
    <AdminLayout pageTitle="Dashboard Overview" pageSubtitle="Welcome to the management portal">

      {/* ---------------- ROW 1: STAT CARDS + WELCOME CARD ---------------- */}
      {isAdmin ? (
        <div className="dash-top">
          <div className="metric-card">
            <div className="metric-icon ic-teal"><FiUser size={22} /></div>
            <div className="metric-body">
              <span className="metric-label">Total Users</span>
              <span className="metric-number">{metrics.users}</span>
              <span className="metric-hint hint-teal"><FiTrendingUp size={12} /> Active users</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon ic-orange"><FiHome size={22} /></div>
            <div className="metric-body">
              <span className="metric-label">Total Rooms</span>
              <span className="metric-number">{metrics.rooms}</span>
              <span className="metric-hint hint-teal"><FiTrendingUp size={12} /> Rooms available</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon ic-green"><FiCheckCircle size={22} /></div>
            <div className="metric-body">
              <span className="metric-label">Today's Check-ins</span>
              <span className="metric-number">{metrics.checkInsToday}</span>
              <span className={`metric-hint ${metrics.checkInsToday > 0 ? 'hint-teal' : 'hint-muted'}`}>
                {metrics.checkInsToday > 0 ? `${metrics.checkInsToday} checked in today` : 'No check-ins today'}
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon ic-red"><FiLogOut size={22} /></div>
            <div className="metric-body">
              <span className="metric-label">Today's Check-outs</span>
              <span className="metric-number">{metrics.checkOutsToday}</span>
              <span className={`metric-hint ${metrics.checkOutsToday > 0 ? 'hint-teal' : 'hint-muted'}`}>
                {metrics.checkOutsToday > 0 ? `${metrics.checkOutsToday} checked out today` : 'No check-outs today'}
              </span>
            </div>
          </div>

          {welcomeCard}
        </div>
      ) : (
        <div className="dash-top staff">
          <div className="metric-card">
            <div className="metric-icon ic-green"><FiCheckCircle size={22} /></div>
            <div className="metric-body">
              <span className="metric-label">Check In</span>
              <span className="metric-number metric-time">{formatTime(myTodayRecord?.checkInTime)}</span>
              <span className={`metric-hint ${myTodayRecord?.checkInTime ? 'hint-teal' : 'hint-muted'}`}>
                {myTodayRecord?.checkInTime ? 'Recorded today' : 'Not recorded yet'}
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon ic-red"><FiLogOut size={22} /></div>
            <div className="metric-body">
              <span className="metric-label">Check Out</span>
              <span className="metric-number metric-time">{formatTime(myTodayRecord?.checkOutTime)}</span>
              <span className={`metric-hint ${myTodayRecord?.checkOutTime ? 'hint-teal' : 'hint-muted'}`}>
                {myTodayRecord?.checkOutTime ? 'Recorded today' : 'Not recorded yet'}
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon ic-teal"><FiActivity size={22} /></div>
            <div className="metric-body">
              <span className="metric-label">Status</span>
              <span className="metric-number metric-time">{myTodayRecord ? getStatusLabel(myTodayRecord) : 'Not yet'}</span>
              <span className="metric-hint hint-muted">Today's attendance</span>
            </div>
          </div>

          {welcomeCard}
        </div>
      )}

      {/* ---------------- ROW 2: ATTENDANCE TABLE + LATEST CHECK-INS ---------------- */}
      <div className={isAdmin ? 'dash-mid' : 'dash-mid single'}>

        <div className="dash-card">
          <div className="panel-head">
            <div className="panel-title-wrap">
              <span className="panel-icon"><FiUsers size={22} /></span>
              <h2 className="panel-title">{isAdmin ? "Today's Attendance Activity" : "Today's Attendance"}</h2>
            </div>
            <span className="panel-date"><FiCalendar size={14} /> Today, {todayLabel}</span>
          </div>

          <div className="table-responsive">
            <table className="modern-table dashboard-table">
              <thead>
                <tr>
                  <th>{isAdmin ? 'USER NAME' : 'DATE'}</th>
                  <th>CHECK IN</th>
                  <th>CHECK OUT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {isAdmin ? (
                  todaysAttendance.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-state-cell">
                        <div className="empty-illus"><FiClipboard size={28} /></div>
                        <p>No attendance activity today.</p>
                      </td>
                    </tr>
                  ) : (
                    todaysAttendance.map(record => (
                      <tr key={record._id}>
                        <td className="td-bold">{record.userName}</td>
                        <td className="td-green">{formatTime(record.checkInTime)}</td>
                        <td className="td-red">{formatTime(record.checkOutTime)}</td>
                        <td>{renderStatusBadge(record)}</td>
                      </tr>
                    ))
                  )
                ) : (
                  !myTodayRecord ? (
                    <tr>
                      <td colSpan="4" className="empty-state-cell">
                        <div className="empty-illus"><FiClipboard size={28} /></div>
                        <p>You haven't checked in today yet.</p>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td className="td-bold">{myTodayRecord.dateString}</td>
                      <td className="td-green">{formatTime(myTodayRecord.checkInTime)}</td>
                      <td className="td-red">{formatTime(myTodayRecord.checkOutTime)}</td>
                      <td>{renderStatusBadge(myTodayRecord)}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest check-ins (admin only) */}
        {isAdmin && (
          <div className="dash-card">
            <div className="panel-head">
              <div className="panel-title-wrap">
                <span className="panel-icon"><FiUsers size={22} /></span>
                <h2 className="panel-title">Latest Check-ins</h2>
              </div>
              <span className="panel-date"><FiCalendar size={14} /> Today, {todayLabel}</span>
            </div>

            {latestCheckIns.length === 0 ? (
              <div className="list-empty">
                <div className="empty-illus"><FiUserCheck size={28} /></div>
                <p>No check-ins yet today.</p>
              </div>
            ) : (
              <div className="perf-list">
                {latestCheckIns.map(record => (
                  <div key={record._id} className="perf-item">
                    <div className="perf-avatar">{getInitials(record.userName)}</div>
                    <div className="perf-info">
                      <span className="perf-name">{record.userName}</span>
                      <span className="perf-sub">Checked in at {formatTime(record.checkInTime)}</span>
                    </div>
                    {renderStatusBadge(record)}
                  </div>
                ))}
              </div>
            )}

            <button className="view-more" onClick={() => navigate('/user-activity')}>
              View More <FiArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ---------------- ROW 3: QUICK LINKS BAND ---------------- */}
      <div className="quick-band">
        <div className="quick-intro">
          <div className="quick-title-row">
            <FiLink size={20} className="quick-link-icon" />
            <h3 className="quick-title">Quick Links</h3>
          </div>
          <p className="quick-text">Jump straight to the pages you use most.</p>
        </div>

        {quickTiles.map(tile => {
          const Icon = tile.icon;
          return (
            <button key={tile.label} className="quick-tile" onClick={() => navigate(tile.path)}>
              <span className={`qt-icon ${tile.color}`}><Icon size={20} /></span>
              <span className="qt-text">
                <span className="qt-label">{tile.label}</span>
                <span className="qt-sub">{tile.sub}</span>
              </span>
              <span className="qt-arrow"><FiArrowRight size={14} /></span>
            </button>
          );
        })}

        <button className="quick-tile cta" onClick={() => navigate(quickCta.path)}>
          <span className="qt-icon"><CtaIcon size={20} /></span>
          <span className="qt-text">
            <span className="qt-label">{quickCta.label}</span>
            <span className="qt-sub">{quickCta.sub}</span>
          </span>
          <span className="qt-arrow"><FiArrowRight size={14} /></span>
        </button>
      </div>

    </AdminLayout>
  );
}
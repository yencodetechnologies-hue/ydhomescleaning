import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUsers, FiAlertCircle, FiGrid, FiClock, FiActivity, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { API_BASE_URL } from '../config';
import './login.css';

export default function Login() {
  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Forgot Password States
  const [isForgotPasswordView, setIsForgotPasswordView] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const navigate = useNavigate();

  // --- LOGIN HANDLER ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`,  {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userType', data.user.role); 
        localStorage.setItem('userId', data.user.id || data.user._id);
        localStorage.setItem('userDetails', JSON.stringify(data.user));

        if (data.user.role === 'admin') {
          localStorage.setItem('adminToken', data.token);
          navigate('/dashboard'); 
        } else {
          localStorage.setItem('userToken', data.token);
          navigate('/dashboard'); 
        }
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- FORGOT PASSWORD HANDLER ---
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setIsLoading(true);

    try {
      // Calls your backend endpoint to trigger password reset email
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setForgotMessage(data.message || 'Password reset instructions have been sent to your email.');
        setForgotEmail(''); // clear the input
      } else {
        setForgotError(data.message || 'Failed to process request. Please try again.');
      }
    } catch (err) {
      setForgotError('Server connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchView = () => {
    setIsForgotPasswordView(!isForgotPasswordView);
    setError('');
    setForgotError('');
    setForgotMessage('');
  };

  return (
    <div className="login-page">

      {/* LEFT: BRAND PANEL */}
      <div className="login-brand">
        <div className="brand-logo">
          {/* Logo placeholder */}
        </div>

        <div className="brand-body">
          <h1 className="brand-heading">Manage your team and rooms in one place.</h1>
          <p className="brand-text">Sign in to assign cleaners, track attendance and keep an eye on every activity.</p>

          <ul className="brand-features">
            <li><span className="feature-icon"><FiGrid size={16} /></span> Room and section management</li>
            <li><span className="feature-icon"><FiClock size={16} /></span> QR code check in / out</li>
            <li><span className="feature-icon"><FiActivity size={16} /></span> Live user activity log</li>
          </ul>
        </div>

        <p className="brand-footer">&copy; {new Date().getFullYear()} Yencode Technologies. All rights reserved.</p>
      </div>

      {/* RIGHT: DYNAMIC FORM CARD */}
      <div className="login-container">
        <div className="login-card">
          
          {!isForgotPasswordView ? (
            /* ==================================
               STANDARD LOGIN VIEW
               ================================== */
            <>
              <div className="login-card-icon">
                <FiUsers size={26} />
              </div>
              <h2 className="login-title">Welcome Back</h2>
              <p className="login-subtitle">Sign in to manage the platform</p>
              
              {error && (
                <div className="login-error">
                  <FiAlertCircle size={16} /> <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="login-form">
                <div className="input-group">
                  <label className="input-label" htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <FiMail className="input-icon" size={18} />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="login-input"
                      placeholder="admin@example.com"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="input-label" htmlFor="password" style={{ margin: 0 }}>Password</label>
                    <button 
                      type="button" 
                      onClick={switchView}
                      style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', fontSize: '13px', fontWeight: '500', padding: 0 }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="input-wrapper" style={{ marginTop: '8px' }}>
                    <FiLock className="input-icon" size={18} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="login-input has-toggle"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="login-button" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </>
          ) : (
            /* ==================================
               FORGOT PASSWORD VIEW
               ================================== */
            <>
              <div className="login-card-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                <FiLock size={26} />
              </div>
              <h2 className="login-title">Reset Password</h2>
              <p className="login-subtitle">Enter your email and we'll send a reset link.</p>
              
              {forgotError && (
                <div className="login-error">
                  <FiAlertCircle size={16} /> <span>{forgotError}</span>
                </div>
              )}
              {forgotMessage && (
                <div className="login-error" style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}>
                  <FiCheckCircle size={16} /> <span>{forgotMessage}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="login-form">
                <div className="input-group">
                  <label className="input-label" htmlFor="forgot-email">Email Address</label>
                  <div className="input-wrapper">
                    <FiMail className="input-icon" size={18} />
                    <input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="login-input"
                      placeholder="Enter your registered email"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="login-button" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button 
                  type="button" 
                  onClick={switchView}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '14px', fontWeight: '500', marginTop: '15px' }}
                >
                  <FiArrowLeft size={16} /> Back to Login
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { API_BASE_URL } from '../config';
import './login.css'; // Reuses your existing login styles

export default function ResetPassword() {
  const { token } = useParams(); // Grabs the token from the URL
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Invalid or expired token.');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container" style={{ margin: '0 auto' }}>
        <div className="login-card">
          <div className="login-card-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <FiLock size={26} />
          </div>
          <h2 className="login-title">Create New Password</h2>
          <p className="login-subtitle">Please enter your new password below.</p>
          
          {error && (
            <div className="login-error">
              <FiAlertCircle size={16} /> <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="login-error" style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}>
              <FiCheckCircle size={16} /> <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleReset} className="login-form">
            <div className="input-group">
              <label className="input-label" htmlFor="password">New Password</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" size={18} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input has-toggle"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="confirm-password">Confirm Password</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" size={18} />
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="login-input"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
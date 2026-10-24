import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function AccessLogin() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const openDashboard = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/access/${token}`);
        const data = await res.json();

        if (res.ok) {
          // Clear any previous session (e.g. an admin on the same browser)
          localStorage.removeItem('adminToken');

          // Same keys that Login.jsx stores
          localStorage.setItem('userType', data.user.role);
          localStorage.setItem('userId', data.user.id || data.user._id);
          localStorage.setItem('userDetails', JSON.stringify(data.user));
          localStorage.setItem('userToken', data.token);

          navigate('/dashboard', { replace: true });
        } else {
          setError(data.message || 'Invalid link');
        }
      } catch {
        setError('Server error. Please try again.');
      }
    };
    openDashboard();
  }, [token, navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      {error ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#991B1B' }}>{error}</p>
          <a href="/" style={{ color: '#2563EB' }}>Go to login</a>
        </div>
      ) : (
        <p>Opening your dashboard...</p>
      )}
    </div>
  );
}
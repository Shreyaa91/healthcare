import React, { useState } from 'react';
import axios from 'axios';
import './forgot_password.css'; // Link your CSS
const API_BASE_URL = import.meta.env.VITE_API_URL;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setError('');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/password-reset-mail`,
      { email },
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Show alert on success
    alert("Reset link has been sent to your email.");

    // Also update status to display on the UI (optional)
    setStatus(response.data.detail || response.data.message || "Reset link sent.");
  } catch (err) {
    setError(err.response?.data?.detail);
  }
};

    return (
        <div className="forgot-container">
          <div className="forgot-box">
            <h2>Forgot Password</h2>
            <p>Enter your registered email to receive a reset link.</p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit">Send Reset Link</button>
            </form>
            {status && <div className="success">{typeof status === 'string' ? status : 'Something went wrong'}</div>}
            {error && <div className="error">{typeof error === 'string' ? error : 'An error occurred'}</div>}
          </div>
        </div>
      );
      
};

export default ForgotPassword;

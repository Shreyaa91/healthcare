import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './resetpassword.css'

function ResetPassword() {
  const query = new URLSearchParams(useLocation().search);
  const email = query.get('email');

  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_BASE_URL}/reset-password`, {
        email:email,
        password: newPassword,
      });
      setStatus(response.data.message);
    } catch (err) {
      setStatus('Error resetting password');
    }
  };

  return (
    <form id="reset-form" onSubmit={handleReset}>
      <h2 id="reset-password">Reset Password</h2>
      <input
      id="inputreset"
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      <button id="reset-submit" type="submit">Set New Password</button>
      <p id="status">{status}</p>
    </form>
  );
}

export default ResetPassword;

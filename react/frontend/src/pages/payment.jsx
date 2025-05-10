import React, { useState } from 'react';
import './Payment.css';
import { useNavigate } from 'react-router-dom';

const Payment = () => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: ''
  });

  const navigate = useNavigate();

  const handlePayment = (e) => {
    e.preventDefault();
    alert('Payment successful!');
    navigate('/appointment');
  };

  return (
    <div className="payment-page-container">
    <div className="payment-wrapper">
      <h2>Payment Page</h2>

      <form className="payment-form" onSubmit={handlePayment}>
        <label>Select Payment Method:</label>
        <select id="methods"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          required
        >
          <option value="">-- Choose --</option>
          <option value="card">Credit / Debit Card</option>
          <option value="upi">UPI</option>
          <option value="cod">Cash on Delivery</option>
        </select>

        {paymentMethod === 'upi' && (
          <input
            type="text"
            placeholder="Enter UPI ID"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            required
          />
        )}

        {paymentMethod === 'card' && (
          <div className="card-details">
            <input
              type="text"
              placeholder="Card Number"
              value={cardDetails.number}
              onChange={(e) =>
                setCardDetails({ ...cardDetails, number: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Expiry (MM/YY)"
              value={cardDetails.expiry}
              onChange={(e) =>
                setCardDetails({ ...cardDetails, expiry: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="CVV"
              value={cardDetails.cvv}
              onChange={(e) =>
                setCardDetails({ ...cardDetails, cvv: e.target.value })
              }
              required
            />
          </div>
        )}

        <button type="submit" className="pay-btn">Confirm Payment</button>
      </form>
    </div>
    </div>
  );
};

export default Payment;
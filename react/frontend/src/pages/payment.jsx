
import React, { useState } from "react";
import axios from "axios";
import "./payment.css";
const API_BASE_URL = import.meta.env.VITE_API_URL;

const PaymentPage = ({user}) => {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressId, setAddressId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    pincode: "",
    address: "",
    city: "",
    state: "",
  });

  const userId = "b8e2c690-d153-4a3f-89fa-d9d7053b6d74"; // Get this dynamically from Supabase Auth in real app

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("http://localhost:8000/add-address/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...form, user_id: userId }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Address saved successfully!");
      setAddressId(data.address_id);
      setShowAddressForm(false);
    } else {
      const errorMsg = data.detail || data.message || JSON.stringify(data);
      alert("Failed to save address: " + errorMsg);
    }
  } catch (error) {
    alert("Failed to save address: " + error.message);
  }
};


  const handlePay = async () => {
    const allFieldsFilled = Object.values(form).every(val => val.trim() !== "");
    if (!allFieldsFilled) {
      alert("Please fill in all address fields before paying.");
      return;
    }

    if (!addressId) {
      alert("Please save the address before proceeding.");
      return;
    }

    try {
      await axios.post("http://localhost:8000/create-payment/", {
        user_id: userId,
        address_id: addressId,
        total_amount: 91.50,
      });
      alert("Payment Successful!");
    } catch (error) {
      alert("Payment Failed.");
    }
  };

  return (
    <div className="checkout-page">
      <div className="left-section">
        <h2>Order Review</h2>
        <p><strong>Deliver To:</strong> {form.pincode || user?.username}</p>

        {!showAddressForm ? (
          <button className="add-address-btn" onClick={() => setShowAddressForm(true)}>
            + Add New Address
          </button>
        ) : (
          <>
            <h3>Add Address</h3>
            <form className="address-form" onSubmit={handleSave}>
              <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
              <input type="text" name="mobile" placeholder="Mobile Number" value={form.mobile} onChange={handleChange} required />
              <input type="text" name="pincode" placeholder="Pincode" value={form.pincode} onChange={handleChange} required />
              <textarea name="address" placeholder="Full Address" value={form.address} onChange={handleChange} required />
              <input type="text" name="city" placeholder="City" value={form.city} onChange={handleChange} required />
              <input type="text" name="state" placeholder="State" value={form.state} onChange={handleChange} required />
              <button className="save-btn" type="submit">SAVE ADDRESS</button>
            </form>
          </>
        )}
      </div>

      <div className="right-section">
        <div className="alert-box">
          <strong>TAKE ACTION</strong>
          <p id="alert">Please select a valid address before proceeding.</p>
        </div>

        <div className="payment-summary">
          <h4>PAYMENT DETAILS</h4>
          <div className="summary-row"><span>MRP Total</span><span>₹ 42.00</span></div>
          <div className="summary-row"><span>Additional Discount</span><span>- ₹ 2.50</span></div>
          <div className="summary-row"><span>Total Amount</span><span>₹ 40.50</span></div>
          <div className="summary-row"><span>Shipping Charges</span><span>₹ 69.00</span></div>
          <div className="summary-row total-payable"><span>Total Payable</span><span>₹ 109.00</span></div>
          <div className="summary-row-savings"><span>Total Savings</span><span>₹ 2.50</span></div>
          <button className="pay-btn" onClick={handlePay}>PAY</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
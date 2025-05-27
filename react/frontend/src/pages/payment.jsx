import React, { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import "./payment.css";
import { useNavigate } from "react-router-dom";


const PaymentPage = ({ user }) => {
  const navigate=useNavigate();
  const location = useLocation();
  const { totalPrice = 0, discount = 0, shippingCharge = 0 } = location.state || {};

  const totalAmount = totalPrice - discount;
  const totalPayable = totalAmount + shippingCharge;

  const username = user?.username || "guest"; // fallback if user not set
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    pincode: "",
    address: "",
    city: "",
    state: "",
  });

  const [savedAddress, setSavedAddress] = useState(null);


  useEffect(() => {
    const allAddresses = JSON.parse(localStorage.getItem("user_addresses")) || {};
    const userAddress = allAddresses[username];

    if (userAddress) {
      setSavedAddress(userAddress);
      setForm(userAddress);  // for editing
    }
  }, [username]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();

    // 🔁 Get all saved addresses
    const allAddresses = JSON.parse(localStorage.getItem("user_addresses")) || {};

    // 🔒 Update current user's address
    allAddresses[username] = form;

    // 💾 Save updated addresses
    localStorage.setItem("user_addresses", JSON.stringify(allAddresses));

    setSavedAddress(form);
    setShowAddressForm(false);
    alert("Address saved successfully!");
  };

  const handlePay = () => {
    if (!savedAddress) {
      alert("Please save the address before proceeding.");
      return;
    }

    alert("Payment Successful!");
    navigate('/medicineordering');
  };

  return (
    <div className="checkout-page">
      <div className="left-section">
        <h2>Order Review</h2>
        <p><strong>Deliver To:</strong> {username}</p>

        {!showAddressForm ? (
          <>
            {savedAddress ? (
              <div className="saved-address-box">
                <p><strong>{savedAddress.name}</strong> - {savedAddress.mobile}</p>
                <p>{savedAddress.address}, {savedAddress.city}, {savedAddress.state} - {savedAddress.pincode}</p>
              </div>
            ) : (
              <p>No address saved for this user.</p>
            )}
            <button className="add-address-btn" onClick={() => setShowAddressForm(true)}>
              {savedAddress ? "Edit Address" : "+ Add New Address"}
            </button>
          </>
        ) : (
          <>
            <h3>{savedAddress ? "Edit Address" : "Add Address"}</h3>
            <form className="address-form" onSubmit={handleSave}>
              <input id="add-input" type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
              <input id="add-input" type="text" name="mobile" placeholder="Mobile Number" value={form.mobile} onChange={handleChange} required />
              <input id="add-input" type="text" name="pincode" placeholder="Pincode" value={form.pincode} onChange={handleChange} required />
              <textarea id="add-input" name="address" placeholder="Full Address" value={form.address} onChange={handleChange} required />
              <input id="add-input" type="text" name="city" placeholder="City" value={form.city} onChange={handleChange} required />
              <input id="add-input" type="text" name="state" placeholder="State" value={form.state} onChange={handleChange} required />
              <button className="save-btn" type="submit">SAVE ADDRESS</button>
            </form>
          </>
        )}
      </div>

      <div className="right-section">
        <div className="alert-box">
          <strong>TAKE ACTION</strong>
          <p id="alert">Please save a valid address before proceeding.</p>
        </div>

        <div className="payment-summary">
          <h4>PAYMENT DETAILS</h4>
          <div className="summary-row"><span>MRP Total</span><span>₹ {totalPrice.toFixed(2)}</span></div>
          <div className="summary-row"><span>Additional Discount</span><span>- ₹ {discount.toFixed(2)}</span></div>
          <div className="summary-row"><span>Total Amount</span><span>₹ {totalAmount.toFixed(2)}</span></div>
          <div className="summary-row"><span>Shipping Charges</span><span>₹ {shippingCharge.toFixed(2)}</span></div>
          <div className="summary-row total-payable"><span>Total Payable</span><span>₹ {totalPayable.toFixed(2)}</span></div>
          <div className="summary-row-savings"><span>Total Savings</span><span>₹ {discount.toFixed(2)}</span></div>
          <button className="pay-btn" onClick={handlePay}>PAY</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

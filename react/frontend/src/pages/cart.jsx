import React, { useState } from 'react';
import './cart.css';
// import emptyCart from '../assets/empty-cart.webp';
// import healthcareLogo from '../assets/healthcareLogo.jpg';
import logo from './logo.jpg';
import emptycart from './emptycart.webp';
import { FaShoppingCart, FaUser } from 'react-icons/fa';
import { useCart } from './cartcontext';
import { FiUpload } from 'react-icons/fi';
import { FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
const API_BASE_URL = import.meta.env.VITE_API_URL;



const CartPage = () => {
  
  const shippingCharge = 69;
  const discount = 2.5;
  const [prescription, setPrescription] = useState(null);
  const { cart, updateQuantity,removeFromCart } = useCart();
  const totalPrice = cart.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);
  const navigate = useNavigate();


const handleQuantityChange = (e, index) => {
  const newQty = parseInt(e.target.value);
  updateQuantity(index, newQty);
};

  const uploadPrescription = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPrescription(file);
      alert('Prescription uploaded successfully!');
    }
  };

  return (
    <div className="cart-page">
      {/* Header */}
      <div className="Header">
        <img src={logo} alt="App Logo" className="logo" />
        <div className="mediCart">MediCart</div>
        <input type="text" placeholder="Search for medicines..." className="Search-bar" />

        {/* Upload Icon + Label */}
                    <div className="Upload-icon-container">
                      <label htmlFor="prescription-upload" className="upload-label-icon">
                        <FiUpload size={22} color="black" style={{ cursor: 'pointer' }} />
                        <span className="upload-text">Upload</span>
                      </label>
                      <input
                        type="file"
                        id="prescription-upload"
                        onClick={(e) => { e.target.value = null; }}  // <- this line ensures re-selection triggers onChange
                        onChange={uploadPrescription}
                        style={{ display: 'none' }}
                      />
                    </div>
        <div className="header-actions">
        <div className="cart-icon-container">
          <FaShoppingCart size={22} color="black" style={{ cursor: 'pointer' }} />
          {cart.length > 0 && (
            <span className="cart-badge">{cart.length}</span>
          )}
        </div>
        <span className="cart">Cart</span>
          <FaUser size={20} color="black" />
          <span>Profile</span>
        </div>
      </div>

      <h1 className="cart-heading">My Cart</h1>

      {cart.length === 0 ? (
        <>
          <img src={emptycart} alt="Empty Cart" />
          <p className="cart-empty-text">Your Cart is empty!</p>
          <p className="cart-subtext">You have no items added in the cart. Explore and add products you like!</p>
          <button className="cart-add-btn" onClick={() => navigate('/medicineordering')}>
            ADD PRODUCTS
          </button>
        </>
      ) : (
        <div className="cart-container">
          {/* LEFT: Products */}
          <div className="cart-products">
            <h3 className="section-title">PRODUCTS</h3>
            {cart.map((item, index) => (
              <div key={index} className="product-card">
                <div>
                  <h4>{item.name}</h4>
                  <p>Price: ₹{item.price}</p>
                  <p className="delivery-text">Delivery between MAY 4 - MAY 5</p>
                </div>
                <div>
                  <label >QTY:</label>
                  <select id="quantity" value={item.quantity || 1} onChange={(e) => handleQuantityChange(e, index)}>
                    {[1, 2, 3, 4, 5,6,7,8,9,10].map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                  {/* Delete Icon */}
                  <FaTrash
                    style={{ marginLeft: '10px', cursor: 'pointer', color: 'black' }}
                    onClick={() => removeFromCart(item.id)}
                  />
                </div>
              </div>
            ))}
            <button className="add-more-btn" onClick={() => navigate('/medicineordering')}>
              ADD MORE ITEMS
            </button>

          </div>

          {/* RIGHT: Payment Details */}
          <div className="payment-summary">
            <h3 className="section-title">PAYMENT DETAILS</h3>
            <div className="summary-line">
              <span>MRP Total</span>
              <span>₹{(totalPrice).toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>Additional Discount</span>
              <span className="green-text">- ₹{discount.toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>Total Amount</span>
              <span>₹{totalPrice.toFixed(2)-discount}</span>
            </div>
            <div className="summary-line">
              <span>Shipping Charges</span>
              <span>₹{shippingCharge}</span>
            </div>
            <hr />
            <div className="summary-line total">
              <span>Total Payable</span>
              <span>₹{(totalPrice-discount + shippingCharge).toFixed(2)}</span>
            </div>
            <div className="savings-box">
              Total Savings ₹{discount.toFixed(2)}
            </div>
            <button className="proceed-btn" onClick={() => navigate('/Payment', {
  state: {
    totalPrice,
    discount,
    shippingCharge,
  },
})}>
              PROCEED
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
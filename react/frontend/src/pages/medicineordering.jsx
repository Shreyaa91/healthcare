import React, { useState } from 'react';
import './medicineOrder.css';

import { FaShoppingCart } from 'react-icons/fa'; // FontAwesome
import { useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import { PiFolderSimpleMinusBold } from 'react-icons/pi';
import { useCart } from '../pages/cartcontext';
import { FiUpload } from 'react-icons/fi';
import logo from './logo.jpg';
const API_BASE_URL = import.meta.env.VITE_API_URL;



  const dummyMedicines = [
  { id: '1', name: 'Paracetamol', price: 10 },
  { id: '2', name: 'Ibuprofen', price: 20 },
  { id: '3', name: 'Amoxicillin', price: 30 },
  { id: '4', name: 'Cetirizine', price: 15 },
  { id: '5', name: 'Azithromycin', price: 50 },
  { id: '6', name: 'Pantoprazole', price: 25 },
  { id: '7', name: 'Dolo 650', price: 12 },
  { id: '8', name: 'Disprin', price: 8 },
  { id: '9', name: 'Calpol', price: 11 },
];


const products = [
  'Calpol',
  'Pantoprazole',
  'Disprin',
  'Dolo 650',
  "vicks",
  "vicks vaporub",
  "vicks baby",
  "vicks candy",
  "vicks cough drops",
  "vicks baby rub 10 ml",
  'Paracetamol',
  'Ibuprofen',
  'Amoxicillin',
];


const MedicineOrderingScreen = () => {
  // const [cart, setCart] = useState([]);
  const [prescription, setPrescription] = useState(null);
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();
  const [animateCart, setAnimateCart] = useState(false);
  const [query, setQuery] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  
  const uploadPrescription = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPrescription(file);
      alert('Prescription uploaded successfully!');
    }
  };

  const handleCartClick = () => {
    navigate('/cart');
  };
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 0) {
      const suggestions = products.filter((product) =>
        product.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(suggestions);
    } else {
      setFilteredSuggestions([]);
    }
  };

return (
  <div className="medicine-container">
    <div className="header">
      <img src={logo} alt="App Logo" className="logo" />
      <div className="MediCart">MediCart</div>

      {/* Search Bar */}
      <div className="search-container">
        <input id="search-bar"
          type="text"
          placeholder="Search for medicines..."
          className="search-bar"
          value={query}
          onChange={handleSearchChange}
        />
        {filteredSuggestions.length > 0 && (
          <div className="suggestion-dropdown">
            {filteredSuggestions.map((suggestion, index) => (
              <div key={index} className="suggestion-item">🔍 {suggestion}</div>
            ))}
            <div className="view-all">VIEW ALL</div>
          </div>
        )}
      </div>

      <div className="header-actions">
        {/* Upload Icon + Label */}
        <div className="upload-icon-container">
          <label htmlFor="prescription-upload" className="upload-label-icon">
            <FiUpload size={22} color="black" style={{ cursor: 'pointer' }} />
            <span className="upload-text">Upload</span>
          </label>
          <input
            type="file"
            id="prescription-upload"
            onClick={(e) => { e.target.value = null; }}
            onChange={uploadPrescription}
            style={{ display: 'none' }}
          />
        </div>

        {/* Cart Icon */}
        <div className="cart-icon-container" onClick={handleCartClick}>
          <FaShoppingCart size={22} color="black" style={{ cursor: 'pointer' }} />
          {cart.length > 0 && (
            <span className={`cart-badge ${animateCart ? 'animate' : ''}`}>{cart.length}</span>
          )}
        </div>
        <span className="cart" onClick={handleCartClick} style={{ cursor: 'pointer' }}>
          Cart
        </span>

        {/* Profile Menu */}
        <div
          className="profile-menu-container"
          onMouseEnter={() => setShowProfileMenu(true)}
          onMouseLeave={() => setShowProfileMenu(false)}
        >
          <div className="profile-icon">
            <FaUser size={20} color="black" />
            <span style={{ marginLeft: '4px' }}>Profile</span>
          </div>

          {showProfileMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => navigate('/profile')}>👤 Profile</div>
              <div className="dropdown-item" onClick={() => {
                alert("Logged out!");
                navigate('/');
              }}>🚪 Logout</div>
            </div>
          )}
        </div>
      </div>
    </div>

    <h1 id="heading">Medicine Ordering</h1>

    <div className="medicine-list">
      {dummyMedicines.map((med) => (
        <div key={med.id} className="medicine-card">
          <h3>{med.name}</h3>
          <p>Price: ₹{med.price}</p>
          <button onClick={() => {
            addToCart(med);
            setAnimateCart(true);
            setTimeout(() => setAnimateCart(false), 400);
          }}>
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  </div>
);

};

export default MedicineOrderingScreen;
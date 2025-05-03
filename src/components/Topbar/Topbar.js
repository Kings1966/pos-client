// client/src/components/Topbar/Topbar.js
import React from 'react';
import { useProductSearch } from '../../context/ProductSearchContext';
import kingsLogo from '../../assets/kings-logo.png';
import './Topbar.css';
import { useAuth } from '../../context/AuthContext';

const Topbar = ({ showProductSearch = true }) => {
  const { searchTerm, handleSearch, handleScan } = useProductSearch();
  const { user, logout } = useAuth();

  return (
    <div className="royal-topbar">
      <div className="logo">
        <img src={kingsLogo} alt="Logo" className="logo-img" />
      </div>
      {showProductSearch && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by Name, SKU Code, Barcode, or Bottom-Tier Category (e.g., Icing Sugar - 200g)"
            value={searchTerm}
            onChange={handleSearch}
            onKeyPress={handleScan}
            className="search-input"
          />
        </div>
      )}
      <div className="user-profile">
        <span className="user-name">{user?.name || 'User'}</span>
        <button className="logout-button" onClick={logout}>Logout</button>
      </div>
    </div>
  );
};

export default Topbar;
// TopSearchBar.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TopSearchBar.css';

const TopSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  return (
    <div className="top-search-bar">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for cards..."
        />
        <button type="submit">Search</button>
      </form>
    </div>
  );
};

export default TopSearchBar;
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './AdvancedSearch.css';

const AdvancedSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Initialize form state from URL parameters
  const [formData, setFormData] = useState({
    q: searchParams.get('q') || '',
    keyword: searchParams.get('keyword') || '',
    minCost: searchParams.get('minCost') || '',
    maxCost: searchParams.get('maxCost') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
  });
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Build query string from non-empty form fields
    const params = new URLSearchParams();
    
    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    
    // Navigate to search results with the query parameters
    navigate(`/search?${params.toString()}`);
  };
  
  // Clear all form fields
  const handleClear = () => {
    setFormData({
      q: '',
      keyword: '',
      minCost: '',
      maxCost: '',
      minPrice: '',
      maxPrice: '',
    });
  };
  
  return (
    <div className="advanced-search">
      <h2>Advanced Search</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="q">Card Name</label>
            <input
              type="text"
              id="q"
              name="q"
              value={formData.q}
              onChange={handleChange}
              placeholder="Enter card name"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="keyword">Keyword</label>
            <input
              type="text"
              id="keyword"
              name="keyword"
              value={formData.keyword}
              onChange={handleChange}
              placeholder="Enter keyword (e.g., Ward, Transcend)"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="minCost">Min Cost</label>
            <input
              type="number"
              id="minCost"
              name="minCost"
              value={formData.minCost}
              onChange={handleChange}
              min="0"
              placeholder="Minimum cost"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="maxCost">Max Cost</label>
            <input
              type="number"
              id="maxCost"
              name="maxCost"
              value={formData.maxCost}
              onChange={handleChange}
              min="0"
              placeholder="Maximum cost"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="minPrice">Min Price ($)</label>
            <input
              type="number"
              id="minPrice"
              name="minPrice"
              value={formData.minPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="Minimum price"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="maxPrice">Max Price ($)</label>
            <input
              type="number"
              id="maxPrice"
              name="maxPrice"
              value={formData.maxPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="Maximum price"
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="search-button">Search</button>
          <button type="button" onClick={handleClear} className="clear-button">Clear</button>
        </div>
      </form>
    </div>
  );
};

export default AdvancedSearch;
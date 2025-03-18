import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const FilterSidebar = ({ onFilterChange }) => {
  const [searchParams] = useSearchParams();
  const [cardTypes, setCardTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [filters, setFilters] = useState({
    cardClass: searchParams.get('cardClass') || '',
    cardType: searchParams.get('cardType') || '',
    rarity: searchParams.get('rarity') || '',
    minCost: searchParams.get('minCost') || '',
    maxCost: searchParams.get('maxCost') || '',
    pitch: searchParams.get('pitch') || ''
  });
  
  // Fetch card types for dropdown
  useEffect(() => {
    // We'll simulate fetching card types, but in a real app 
    // you would fetch this from your API
    setCardTypes([
      'Illusionist', 'Mystic', 'Wizard', 'Brute', 'Guardian', 
      'Ninja', 'Warrior', 'Ranger', 'Mechanologist', 'Runeblade'
    ]);
    setLoading(false);
  }, []);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    // Only include non-empty filters
    const activeFilters = Object.entries(filters)
      .filter(([_, value]) => value !== '')
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
      
    onFilterChange(activeFilters);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      cardClass: '',
      cardType: '',
      rarity: '',
      minCost: '',
      maxCost: '',
      pitch: ''
    });
    
    onFilterChange({});
  };
  
  if (loading) {
    return <div className="search-sidebar">Loading filters...</div>;
  }
  
  return (
    <div className="search-sidebar">
      <div className="sidebar-section">
        <h3>Card Filters</h3>
        
        <div className="filter-group">
          <label htmlFor="cardClass">Card Class</label>
          <select 
            id="cardClass" 
            name="cardClass" 
            value={filters.cardClass}
            onChange={handleFilterChange}
          >
            <option value="">All Classes</option>
            {cardTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="cardType">Card Type</label>
          <select 
            id="cardType" 
            name="cardType" 
            value={filters.cardType}
            onChange={handleFilterChange}
          >
            <option value="">All Types</option>
            <option value="Action">Action</option>
            <option value="Attack">Attack</option>
            <option value="Defense">Defense</option>
            <option value="Instant">Instant</option>
            <option value="Aura">Aura</option>
            <option value="Weapon">Weapon</option>
            <option value="Equipment">Equipment</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="rarity">Rarity</label>
          <select 
            id="rarity" 
            name="rarity" 
            value={filters.rarity}
            onChange={handleFilterChange}
          >
            <option value="">All Rarities</option>
            <option value="C">Common</option>
            <option value="R">Rare</option>
            <option value="M">Majestic</option>
            <option value="L">Legendary</option>
          </select>
        </div>
      </div>
      
      <div className="sidebar-section">
        <h3>Card Stats</h3>
        
        <div className="filter-group">
          <label htmlFor="pitch">Pitch Value</label>
          <select 
            id="pitch" 
            name="pitch" 
            value={filters.pitch}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            <option value="1">1 (Red)</option>
            <option value="2">2 (Yellow)</option>
            <option value="3">3 (Blue)</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="minCost">Min Cost</label>
          <select 
            id="minCost" 
            name="minCost" 
            value={filters.minCost}
            onChange={handleFilterChange}
          >
            <option value="">Any</option>
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4+</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="maxCost">Max Cost</label>
          <select 
            id="maxCost" 
            name="maxCost" 
            value={filters.maxCost}
            onChange={handleFilterChange}
          >
            <option value="">Any</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6+</option>
          </select>
        </div>
      </div>
      
      <div className="sidebar-section">
        <h3>Format Legality</h3>
        
        <div className="checkbox-group">
          <div className="checkbox-item">
            <input 
              type="checkbox" 
              id="blitz_legal" 
              name="blitz_legal"
            />
            <label htmlFor="blitz_legal">Blitz Legal</label>
          </div>
          
          <div className="checkbox-item">
            <input 
              type="checkbox" 
              id="cc_legal" 
              name="cc_legal"
            />
            <label htmlFor="cc_legal">CC Legal</label>
          </div>
          
          <div className="checkbox-item">
            <input 
              type="checkbox" 
              id="commoner_legal" 
              name="commoner_legal"
            />
            <label htmlFor="commoner_legal">Commoner Legal</label>
          </div>
        </div>
      </div>
      
      <button className="filter-button" onClick={applyFilters}>
        Apply Filters
      </button>
      
      <button className="reset-filters" onClick={resetFilters}>
        Reset All Filters
      </button>
    </div>
  );
};

export default FilterSidebar;
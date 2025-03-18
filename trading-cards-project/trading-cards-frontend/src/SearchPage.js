import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Pagination from './Pagination';
import FilterSidebar from './FilterSidebar';
import './SearchPage.css'; // Make sure to create this file with the CSS provided

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [sortOption, setSortOption] = useState('name_asc');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  // Get all applied filters for display
  const getAppliedFilters = () => {
    const filters = [];
    
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'page' && key !== 'q' && value) {
        let label = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        label = label.charAt(0).toUpperCase() + label.slice(1); // Capitalize first letter
        
        filters.push({ key, label: `${label}: ${value}` });
      }
    }
    
    return filters;
  };
  
  const appliedFilters = getAppliedFilters();
  
  useEffect(() => {
    // Get page from URL if present
    const urlPage = parseInt(searchParams.get('page'));
    if (urlPage && urlPage !== page) {
      setPage(urlPage);
    }
    
    // Get search term from URL
    const urlSearchTerm = searchParams.get('q') || '';
    if (urlSearchTerm !== searchTerm) {
      setSearchTerm(urlSearchTerm);
    }
    
    // Fetch search results if we have params or page > 1
    const hasParams = Array.from(searchParams.entries()).some(([key]) => key !== 'page');
    
    if (hasParams || page > 1) {
      fetchSearchResults();
    }
  }, [searchParams]);
  
  const fetchSearchResults = () => {
    setIsLoading(true);
    setError(null);
    
    // Build API URL with all search parameters
    const params = new URLSearchParams(searchParams);
    if (!params.has('page')) params.set('page', page.toString());
    params.set('limit', '24'); // Increase limit for more cards per page
    
    // Add sort parameter based on selected option
    const [sortField, sortDir] = sortOption.split('_');
    params.set('sortField', sortField);
    params.set('sortDir', sortDir);
    
    fetch(`${API_URL}/cards/search?${params.toString()}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setSearchResults(data.cards);
        setTotalPages(data.totalPages);
        setTotalCards(data.total);
        setIsLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setIsLoading(false);
      });
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    
    // Update URL with search term and reset to page 1
    const newParams = new URLSearchParams(searchParams);
    if (searchTerm) {
      newParams.set('q', searchTerm);
    } else {
      newParams.delete('q');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      // Update URL with new page
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', newPage.toString());
      setSearchParams(newParams);
      
      // Scroll to top when changing pages
      window.scrollTo(0, 0);
    }
  };
  
  const handleFilterChange = (filters) => {
    // Update URL with new filters and reset to page 1
    const newParams = new URLSearchParams();
    
    // Preserve search term if exists
    if (searchTerm) newParams.set('q', searchTerm);
    
    // Add all filters
    for (const [key, value] of Object.entries(filters)) {
      newParams.set(key, value);
    }
    
    // Reset to page 1
    newParams.set('page', '1');
    
    setSearchParams(newParams);
  };
  
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    
    // Update URL with sort option
    const newParams = new URLSearchParams(searchParams);
    const [sortField, sortDir] = e.target.value.split('_');
    newParams.set('sortField', sortField);
    newParams.set('sortDir', sortDir);
    setSearchParams(newParams);
  };
  
  const handleRemoveFilter = (key) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(key);
    setSearchParams(newParams);
  };
  
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  
  return (
    <div className="search-page">
      <div className="search-header">
        <h2>Shop Trading Cards</h2>
        
        <form onSubmit={handleSearch} className="top-search-form">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for cards by name..."
          />
          <button type="submit">Search</button>
        </form>
      </div>
      
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {sidebarVisible ? 'Hide Filters' : 'Show Filters'}
      </button>
      
      <div className="search-layout">
        <FilterSidebar 
          onFilterChange={handleFilterChange} 
          className={sidebarVisible ? 'active' : ''}
        />
        
        <div className="search-main">
          {appliedFilters.length > 0 && (
            <div className="applied-filters">
              {appliedFilters.map(filter => (
                <div key={filter.key} className="filter-tag">
                  {filter.label}
                  <span 
                    className="filter-tag-remove"
                    onClick={() => handleRemoveFilter(filter.key)}
                  >
                    ×
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {isLoading && <div className="loading">Loading...</div>}
          {error && <div className="error">Error: {error}</div>}
          
          {!isLoading && searchResults.length > 0 ? (
            <>
              <div className="search-stats">
                <div className="search-stats-count">
                  Found {totalCards} cards
                </div>
                <div className="search-sort">
                  <select value={sortOption} onChange={handleSortChange}>
                    <option value="name_asc">Name (A-Z)</option>
                    <option value="name_desc">Name (Z-A)</option>
                    <option value="cost_asc">Cost (Low to High)</option>
                    <option value="cost_desc">Cost (High to Low)</option>
                    <option value="pitch_asc">Pitch (Low to High)</option>
                    <option value="pitch_desc">Pitch (High to Low)</option>
                  </select>
                </div>
              </div>
              
              <div className="card-grid">
                {searchResults.map(card => (
                  <CardPreview key={card.card_id} card={card} />
                ))}
              </div>
              
              <Pagination 
                currentPage={page} 
                totalPages={totalPages} 
                onPageChange={handlePageChange}
              />
            </>
          ) : !isLoading && (
            <div className="no-results">
              <p>No cards found matching your search criteria.</p>
              <p>Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
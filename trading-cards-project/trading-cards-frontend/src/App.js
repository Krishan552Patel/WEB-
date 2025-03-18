import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import AdvancedSearch from './AdvancedSearch';
import './App.css';
import FilterSidebar from './FilterSidebar';
import Pagination from './Pagination';
import './SearchPage.css';

// API URL - update this if your backend server is on a different port
const API_URL = 'http://localhost:3001/api';

function App() {
  return (
    <Router>
      <div className="App">
      <header className="App-header">
        <h1>Trading Card Store</h1>
          <nav>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/search">Shop</Link></li>
              <li><Link to="/inventory/1">My Collection</Link></li>
            <li>
              <Link to="/cart" className="cart-indicator">
              <span className="cart-icon">🛒</span>
              <span className="cart-count">0</span>
              </Link>
            </li>
            </ul>
          </nav>
        </header>
        
        <main className="App-main">
        <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/card/:cardId" element={<CardDetailPage />} />
              <Route path="/inventory/:userId" element={<InventoryPage />} />
            </Routes>
        </main>
        
        <footer className="App-footer">
          <p>Trading Card Database &copy; 2025</p>
        </footer>
      </div>
    </Router>
  );
}

// Home Page Component


function HomePage() {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  const API_URL = 'http://localhost:3001/api';
  
  useEffect(() => {
    fetchCards(page);
  }, [page]);
  
  const fetchCards = (pageNum) => {
    setIsLoading(true);
    
    // Increased limit to show more cards per page
    fetch(`${API_URL}/cards?page=${pageNum}&limit=12`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setCards(data.cards);
        setTotalPages(data.totalPages);
        setIsLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setIsLoading(false);
      });
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      // Scroll to top when changing pages
      window.scrollTo(0, 0);
    }
  };
  
  if (isLoading && page === 1) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  
  return (
    <div className="home-page">
      <section className="welcome-section">
        <h2>Welcome to the Trading Card Store</h2>
        <p>Discover rare cards, build your collection, and dominate the game</p>
        
      </section>
      
      <section className="featured-categories">
        <h2>Shop by Category</h2>
        <div className="category-grid">
          <Link to="/search?type=Warrior" className="category-card">
            <div className="category-icon">⚔️</div>
            <h3>Warrior</h3>
          </Link>
          <Link to="/search?type=Wizard" className="category-card">
            <div className="category-icon">🧙</div>
            <h3>Wizard</h3>
          </Link>
          <Link to="/search?type=Guardian" className="category-card">
            <div className="category-icon">🛡️</div>
            <h3>Guardian</h3>
          </Link>
          <Link to="/search?type=Ninja" className="category-card">
            <div className="category-icon">🥷</div>
            <h3>Ninja</h3>
          </Link>
        </div>
      </section>
      
      <section className="all-cards">
        <div className="section-header">
          <h2>Browse Our Collection</h2>
          <p>Page {page} of {totalPages}</p>
        </div>
        
        {isLoading ? (
          <div className="loading">Loading page {page}...</div>
        ) : (
          <>
            <div className="card-grid">
              {cards.map(card => (
                <CardPreview key={card.card_id} card={card} />
              ))}
            </div>
            
            <Pagination 
              currentPage={page} 
              totalPages={totalPages} 
              onPageChange={handlePageChange}
            />
          </>
        )}
      </section>
    </div>
  );
}


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
        label = label.charAt(0).toUpperCase() + label.slice(1);
        filters.push({ key, label: `${label}: ${value}` });
      }
    }
    return filters;
  };
  
  const appliedFilters = getAppliedFilters();
  
  useEffect(() => {
    const urlPage = parseInt(searchParams.get('page'));
    if (urlPage && urlPage !== page) {
      setPage(urlPage);
    }
    
    const urlSearchTerm = searchParams.get('q') || '';
    if (urlSearchTerm !== searchTerm) {
      setSearchTerm(urlSearchTerm);
    }
    
    const hasParams = Array.from(searchParams.entries()).some(([key]) => key !== 'page');
    
    if (hasParams || page > 1) {
      fetchSearchResults();
    }
  }, [searchParams]);
  
  const fetchSearchResults = () => {
    setIsLoading(true);
    
    const params = new URLSearchParams(searchParams);
    if (!params.has('page')) params.set('page', page.toString());
    params.set('limit', '24');
    
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
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', newPage.toString());
      setSearchParams(newParams);
      window.scrollTo(0, 0);
    }
  };
  
  const handleFilterChange = (filters) => {
    const newParams = new URLSearchParams();
    
    if (searchTerm) newParams.set('q', searchTerm);
    
    for (const [key, value] of Object.entries(filters)) {
      newParams.set(key, value);
    }
    
    newParams.set('page', '1');
    setSearchParams(newParams);
  };
  
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    
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



// Card Preview Component
function CardPreview({ card }) {
  const [inCart, setInCart] = useState(false);
  
  // Determine background color based on pitch value
  const getCardColor = (pitch) => {
    switch(pitch) {
      case '1': return 'red-card';
      case '2': return 'yellow-card';
      case '3': return 'blue-card';
      default: return 'grey-card';
    }
  };
  
  // Generate a price based on card cost or rarity
  const getPrice = () => {
    const baseCost = parseFloat(card.cost || '0');
    // Add 5-25 dollars based on cost value
    return (baseCost + 5 + Math.random() * 20).toFixed(2);
  };
  
  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevent navigation to card detail
    setInCart(true);
    
    // Show feedback
    setTimeout(() => setInCart(false), 1500);
  };
  
  const price = getPrice();
  
  return (
    <div className={`card-preview ${getCardColor(card.pitch)}`}>
      <Link to={`/card/${card.card_id}`}>
        {card.image_url && <img src={card.image_url} alt={card.name} className="card-image" />}
        <div className="card-info">
          <h3 className="card-name">{card.name}</h3>
          <p className="card-types">{card.types ? card.types.join(', ') : ''}</p>
          <div className="card-stats">
            <span className="pitch">Pitch: {card.pitch}</span>
            <span className="cost">Cost: {card.cost}</span>
          </div>
          <div className="card-price">${price}</div>
        </div>
      </Link>
      <button 
        className="add-to-cart-btn" 
        onClick={handleAddToCart}
        disabled={inCart}
      >
        {inCart ? 'Added to Cart!' : 'Add to Cart'}
      </button>
    </div>
  );
}
// Card Detail Page Component
// Card Detail with Store Features
function CardDetailPage() {
  const { cardId } = useParams();
  const [card, setCard] = useState(null);
  const [selectedPrinting, setSelectedPrinting] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [inCart, setInCart] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetch(`${API_URL}/cards/${cardId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setCard(data);
        if (data.printings && data.printings.length > 0) {
          setSelectedPrinting(data.printings[0]);
        }
        setIsLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setIsLoading(false);
      });
  }, [cardId]);
  
  const handlePrintingSelect = (printing) => {
    setSelectedPrinting(printing);
  };
  
  // Generate price based on card properties
  const getPrice = () => {
    if (!card) return "0.00";
    
    const baseCost = parseFloat(card.cost || '0');
    let price = baseCost + 5;
    
    // Rarity factors
    if (selectedPrinting) {
      if (selectedPrinting.rarity === 'M') price *= 2; // Mythic
      if (selectedPrinting.rarity === 'R') price *= 1.5; // Rare
      if (selectedPrinting.foiling === 'R' || selectedPrinting.foiling === 'C') {
        price *= 1.8; // Foil versions cost more
      }
    }
    
    // Add randomness for variation but keep it stable for this session
    const randomFactor = ((parseInt(cardId) % 20) + 100) / 100;
    price *= randomFactor;
    
    return price.toFixed(2);
  };
  
  const handleAddToCart = () => {
    setInCart(true);
    setTimeout(() => setInCart(false), 1500);
  };
  
  // Determine background color based on pitch value
  const getCardColor = (pitch) => {
    switch(pitch) {
      case '1': return 'red-card';
      case '2': return 'yellow-card';
      case '3': return 'blue-card';
      default: return 'grey-card';
    }
  };
  
  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!card) return <div className="not-found">Card not found</div>;
  
  const price = getPrice();
  
  return (
    <div className={`card-detail ${getCardColor(card.pitch)}`}>
      <div className="card-detail-grid">
        <div className="card-image-container">
          {selectedPrinting && selectedPrinting.image_url ? (
            <img 
              src={selectedPrinting.image_url} 
              alt={card.name} 
              className="card-detail-image" 
            />
          ) : (
            <div className="no-image">No image available</div>
          )}
          
          <div className="printings-selector">
            <h3>Versions & Printings</h3>
            <div className="printing-options">
              {card.printings.map(printing => (
                <button 
                  key={printing.printing_id}
                  className={`printing-option ${selectedPrinting && selectedPrinting.printing_id === printing.printing_id ? 'selected' : ''}`}
                  onClick={() => handlePrintingSelect(printing)}
                >
                  {printing.set_id} - {printing.edition} ({printing.foiling})
                </button>
              ))}
            </div>
          </div>
          
          <div className="card-purchase">
            <div className="price-container">
              <h3>Price: ${price}</h3>
              {parseFloat(price) >= 10 && <p className="free-shipping">Free shipping eligible!</p>}
            </div>
            
            <div className="quantity-selector">
              <label>Quantity:</label>
              <div className="quantity-control">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>
            
            <button 
              className="add-to-cart-btn" 
              onClick={handleAddToCart}
              disabled={inCart}
            >
              {inCart ? 'Added to Cart!' : 'Add to Cart'}
            </button>
          </div>
        </div>
        
        <div className="card-details">
          <h2 className="card-name">{card.name}</h2>
          
          <div className="card-meta">
            <p className="card-types"><strong>Type:</strong> {card.type_text}</p>
            {card.pitch && <p className="card-pitch"><strong>Pitch:</strong> {card.pitch}</p>}
            {card.cost && <p className="card-cost"><strong>Cost:</strong> {card.cost}</p>}
            {card.power && <p className="card-power"><strong>Power:</strong> {card.power}</p>}
            {card.defense && <p className="card-defense"><strong>Defense:</strong> {card.defense}</p>}
          </div>
          
          {card.keywords && card.keywords.length > 0 && (
            <div className="card-keywords">
              <h3>Keywords</h3>
              <p>{card.keywords.join(', ')}</p>
            </div>
          )}
          
          {card.functional_text && (
            <div className="card-text">
              <h3>Card Text</h3>
              <p>{card.functional_text}</p>
            </div>
          )}
          
          {selectedPrinting && (
            <div className="selected-printing-details">
              <h3>Printing Details</h3>
              <p><strong>Set:</strong> {selectedPrinting.set_id}</p>
              <p><strong>Edition:</strong> {selectedPrinting.edition}</p>
              <p><strong>Rarity:</strong> {selectedPrinting.rarity}</p>
              <p><strong>Foiling:</strong> {selectedPrinting.foiling}</p>
              {selectedPrinting.artists && selectedPrinting.artists.length > 0 && (
                <p><strong>Artist(s):</strong> {selectedPrinting.artists.join(', ')}</p>
              )}
            </div>
          )}
          
          <div className="card-legality">
            <h3>Format Legality</h3>
            <ul>
              <li className={card.blitz_legal ? 'legal' : 'not-legal'}>
                Blitz: {card.blitz_legal ? 'Legal' : 'Not Legal'}
                {card.blitz_banned && ' (Banned)'}
              </li>
              <li className={card.cc_legal ? 'legal' : 'not-legal'}>
                CC: {card.cc_legal ? 'Legal' : 'Not Legal'}
                {card.cc_banned && ' (Banned)'}
              </li>
              <li className={card.commoner_legal ? 'legal' : 'not-legal'}>
                Commoner: {card.commoner_legal ? 'Legal' : 'Not Legal'}
                {card.commoner_banned && ' (Banned)'}
              </li>
              <li className={card.ll_legal ? 'legal' : 'not-legal'}>
                Living Legend: {card.ll_legal ? 'Legal' : 'Not Legal'}
                {card.ll_banned && ' (Banned)'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inventory Page Component
function InventoryPage() {
  const { userId } = useParams();
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetch(`${API_URL}/inventory/${userId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setInventory(data);
        setIsLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setIsLoading(false);
      });
  }, [userId]);
  
  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  
  // Calculate total cards and value
  const totalCards = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = inventory.reduce((sum, item) => sum + (item.purchase_price * item.quantity), 0);
  
  return (
    <div className="inventory-page">
      <h2>My Card Inventory</h2>
      
      <div className="inventory-stats">
        <div className="stat-box">
          <h3>{inventory.length}</h3>
          <p>Unique Cards</p>
        </div>
        <div className="stat-box">
          <h3>{totalCards}</h3>
          <p>Total Cards</p>
        </div>
        <div className="stat-box">
          <h3>${totalValue.toFixed(2)}</h3>
          <p>Collection Value</p>
        </div>
      </div>
      
      {inventory.length > 0 ? (
        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th>Card</th>
                <th>Set</th>
                <th>Foiling</th>
                <th>Quantity</th>
                <th>Condition</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.inventory_id}>
                  <td>
                    <Link to={`/card/${item.card_id}`} className="inventory-card-name">
                      {item.card_name}
                    </Link>
                  </td>
                  <td>{item.set_id}</td>
                  <td>{item.foiling}</td>
                  <td>{item.quantity}</td>
                  <td>{item.condition}</td>
                  <td>${parseFloat(item.purchase_price).toFixed(2)}</td>
                  <td>${(item.purchase_price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-inventory">
          <p>Your inventory is empty. Add some cards!</p>
        </div>
      )}
    </div>
  );
}

export default App;
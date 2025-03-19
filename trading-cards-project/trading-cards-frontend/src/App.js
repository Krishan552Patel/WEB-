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
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchCards(page);
  }, [page, searchParams]);
  
  const fetchCards = (pageNum) => {
    setIsLoading(true);
    
    // Get all search parameters
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNum);
    params.set('limit', '24'); // Show more cards per page
    
    fetch(`${API_URL}/cards/search?${params.toString()}`)
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
      window.scrollTo(0, 0);
    }
  };
  
  const handleFilterChange = (filters) => {
    const newParams = new URLSearchParams();
    
    // Add all filters
    for (const [key, value] of Object.entries(filters)) {
      newParams.set(key, value);
    }
    
    // Reset to page 1
    newParams.set('page', '1');
    
    setSearchParams(newParams);
  };
  
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  
  if (isLoading && page === 1) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  
  return (
    <div className="home-page">
      <section className="welcome-section">
        <h2>Welcome to the Trading Card Store</h2>
        <p>Discover rare cards, build your collection, and dominate the game</p>
      </section>
      
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {sidebarVisible ? 'Hide Filters' : 'Show Filters'}
      </button>
      
      <div className="search-layout">
        {sidebarVisible && (
          <FilterSidebar onFilterChange={handleFilterChange} />
        )}
        
        <div className="search-main">
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
      </div>
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
  const [addedToCollection, setAddedToCollection] = useState(false);
  const [inventory, setInventory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stockError, setStockError] = useState(null);
  const [collectionError, setCollectionError] = useState(null);
  
  useEffect(() => {
    // Find the first printing ID for this card
    if (card.image_url) {
      const printingId = card.image_url.split('/').pop().split('.')[0];
      if (printingId) {
        // Fetch inventory for this printing
        fetch(`${API_URL}/inventory/check/${printingId}`)
          .then(response => {
            if (!response.ok) {
              if (response.status === 404) {
                setInventory({ in_stock: false, available: 0 });
                return null;
              }
              throw new Error('Error checking inventory');
            }
            return response.json();
          })
          .then(data => {
            if (data) setInventory(data);
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Inventory check error:', error);
            setInventory({ in_stock: false, available: 0 });
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [card]);
  
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
    
    if (!inventory || !inventory.in_stock) {
      setStockError('Out of stock');
      return;
    }
    
    // In a real app, we would call the API to update inventory
    // Here we're just simulating success
    setInCart(true);
    
    // Show feedback
    setTimeout(() => {
      setInCart(false);
      setStockError(null);
    }, 1500);
  };
  
  const handleAddToCollection = (e) => {
    e.preventDefault(); // Prevent navigation to card detail
    
    // Get printing ID from image URL
    if (!card.image_url) {
      setCollectionError('Cannot add to collection');
      return;
    }
    
    const printingId = card.image_url.split('/').pop().split('.')[0];
    if (!printingId) {
      setCollectionError('Cannot add to collection');
      return;
    }
    
    const price = parseFloat(getPrice());
    
    // Call the collection add API
    fetch(`${API_URL}/collection/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: 1, // Using a default user ID, in a real app you'd get this from auth
        card_id: card.card_id,
        printing_id: printingId,
        quantity: 1, // Add 1 by default in the preview
        condition: 'Near Mint',
        purchase_price: price
      })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.error || 'Error adding to collection');
        });
      }
      return response.json();
    })
    .then(data => {
      // Update was successful
      setAddedToCollection(true);
      setTimeout(() => setAddedToCollection(false), 1500);
      setCollectionError(null);
    })
    .catch(error => {
      console.error('Collection error:', error);
      setCollectionError('Error adding to collection');
      setTimeout(() => setCollectionError(null), 3000);
    });
  };
  
  const price = getPrice();
  const isInStock = inventory && inventory.in_stock;
  
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
          
          <div className="stock-status-small">
            {isLoading ? (
              <span className="stock-loading">Checking...</span>
            ) : isInStock ? (
              <span className="in-stock-small">In Stock</span>
            ) : (
              <span className="out-of-stock-small">Out of Stock</span>
            )}
          </div>
        </div>
      </Link>
      
      {stockError && (
        <div className="stock-error-small">{stockError}</div>
      )}
      
      {collectionError && (
        <div className="stock-error-small">{collectionError}</div>
      )}
      
      <div className="preview-buttons">
        <button 
          className="add-to-cart-btn" 
          onClick={handleAddToCart}
          disabled={inCart || isLoading || !isInStock}
        >
          {inCart ? 'Added!' : isLoading ? 'Loading...' : isInStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
        
        <button 
          className="add-to-collection-btn-small" 
          onClick={handleAddToCollection}
          disabled={addedToCollection}
        >
          {addedToCollection ? 'In Collection' : '+Collection'}
        </button>
      </div>
    </div>
  );
}

// Add this inside your CardDetailPage component
const getCardColor = (pitch) => {
  switch(pitch) {
    case '1': return 'red-card';
    case '2': return 'yellow-card';
    case '3': return 'blue-card';
    default: return 'grey-card';
  }
};
// Card Detail with Store Features
function CardDetailPage() {
  const { cardId } = useParams();
  const [card, setCard] = useState(null);
  const [selectedPrinting, setSelectedPrinting] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [inCart, setInCart] = useState(false);
  const [addedToCollection, setAddedToCollection] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockError, setStockError] = useState(null);
  
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
          // Fetch inventory for the first printing
          fetchInventory(data.printings[0].printing_id);
        }
        setIsLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setIsLoading(false);
      });
  }, [cardId]);
  
  const fetchInventory = (printingId) => {
    fetch(`${API_URL}/inventory/printing/${printingId}`)
      .then(response => {
        if (!response.ok) {
          if (response.status === 404) {
            // Not found is expected for some printings
            setInventory({ stock_quantity: 0 });
            return;
          }
          throw new Error('Error fetching inventory');
        }
        return response.json();
      })
      .then(data => {
        if (data) setInventory(data);
      })
      .catch(error => {
        console.error('Inventory fetch error:', error);
        // Default to zero if we can't get inventory
        setInventory({ stock_quantity: 0 });
      });
  };
  
  const handlePrintingSelect = (printing) => {
    setSelectedPrinting(printing);
    fetchInventory(printing.printing_id);
    setStockError(null); // Clear any previous errors
    setAddedToCollection(false); // Reset collection status
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
    if (!selectedPrinting) return;
    
    // Check if we have enough stock
    if (!inventory || inventory.stock_quantity < quantity) {
      setStockError(`Sorry, only ${inventory ? inventory.stock_quantity : 0} in stock`);
      return;
    }
    
    // Call the inventory update API
    fetch(`${API_URL}/inventory/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        printing_id: selectedPrinting.printing_id,
        quantity: quantity
      })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.error || 'Error updating inventory');
        });
      }
      return response.json();
    })
    .then(data => {
      // Update was successful
      setInCart(true);
      
      // Update local inventory state
      setInventory({
        ...inventory,
        stock_quantity: data.new_stock
      });
      
      setTimeout(() => setInCart(false), 1500);
      setStockError(null);
    })
    .catch(error => {
      console.error('Update error:', error);
      setStockError(error.message);
    });
  };
  
  const handleAddToCollection = () => {
    if (!selectedPrinting || !card) return;
    
    const price = parseFloat(getPrice());
    
    // Call the collection add API
    fetch(`${API_URL}/collection/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: 1, // Using a default user ID, in a real app you'd get this from auth
        card_id: card.card_id,
        printing_id: selectedPrinting.printing_id,
        quantity: quantity,
        condition: 'Near Mint',
        purchase_price: price
      })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.error || 'Error adding to collection');
        });
      }
      return response.json();
    })
    .then(data => {
      // Update was successful
      setAddedToCollection(true);
      setTimeout(() => setAddedToCollection(false), 1500);
    })
    .catch(error => {
      console.error('Collection error:', error);
      alert('Error adding to collection: ' + error.message);
    });
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
  
  // Check if item is in stock
  const isInStock = inventory && inventory.stock_quantity > 0;
  const hasEnoughStock = inventory && inventory.stock_quantity >= quantity;
  
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
            
            <div className="stock-status">
              {isInStock ? (
                <p className="in-stock">
                  <span className="stock-icon">✓</span> In Stock
                  {inventory && <span className="stock-count"> ({inventory.stock_quantity} available)</span>}
                </p>
              ) : (
                <p className="out-of-stock">
                  <span className="stock-icon">✗</span> Out of Stock
                </p>
              )}
            </div>
            
            <div className="quantity-selector">
              <label>Quantity:</label>
              <div className="quantity-control">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!isInStock}
                >-</button>
                <span>{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!isInStock || (inventory && quantity >= inventory.stock_quantity)}
                >+</button>
              </div>
            </div>
            
            {stockError && (
              <div className="stock-error">
                {stockError}
              </div>
            )}
            
            <div className="action-buttons">
              <button 
                className="add-to-cart-btn" 
                onClick={handleAddToCart}
                disabled={inCart || !isInStock || !hasEnoughStock}
              >
                {inCart ? 'Added to Cart!' : isInStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              
              <button 
                className="add-to-collection-btn" 
                onClick={handleAddToCollection}
                disabled={addedToCollection}
              >
                {addedToCollection ? 'Added to Collection!' : 'Add to My Collection'}
              </button>
            </div>
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
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [activeFilters, setActiveFilters] = useState({});
  const [breakdown, setBreakdown] = useState({ byRarity: {}, byType: {}, byPitch: {} });
  
  useEffect(() => {
    fetchInventory();
  }, [userId]);
  
  useEffect(() => {
    if (inventory.length > 0) {
      applyFilters();
      calculateBreakdown();
    }
  }, [inventory, activeFilters]);
  
  const fetchInventory = () => {
    setIsLoading(true);
    
    fetch(`${API_URL}/inventory/${userId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // Enhance each item with additional data
        const enhancedData = data.map(item => ({
          ...item,
          total_value: item.purchase_price * item.quantity,
          pitch_class: getPitchClass(item.pitch)
        }));
        
        setInventory(enhancedData);
        setFilteredInventory(enhancedData);
        setIsLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setIsLoading(false);
      });
  };
  
  const getPitchClass = (pitch) => {
    switch(pitch) {
      case '1': return 'red';
      case '2': return 'yellow';
      case '3': return 'blue';
      default: return 'grey';
    }
  };
  
  const applyFilters = () => {
    let filtered = [...inventory];
    
    // Apply active filters
    if (activeFilters.cardClass) {
      filtered = filtered.filter(item => 
        item.type_text && item.type_text.includes(activeFilters.cardClass)
      );
    }
    
    if (activeFilters.cardType) {
      filtered = filtered.filter(item => 
        item.type_text && item.type_text.includes(activeFilters.cardType)
      );
    }
    
    if (activeFilters.rarity) {
      filtered = filtered.filter(item => 
        item.rarity === activeFilters.rarity
      );
    }
    
    if (activeFilters.pitch) {
      filtered = filtered.filter(item => 
        item.pitch === activeFilters.pitch
      );
    }
    
    if (activeFilters.minCost) {
      filtered = filtered.filter(item => 
        parseInt(item.cost || 0) >= parseInt(activeFilters.minCost)
      );
    }
    
    if (activeFilters.maxCost) {
      filtered = filtered.filter(item => 
        parseInt(item.cost || 0) <= parseInt(activeFilters.maxCost)
      );
    }
    
    setFilteredInventory(filtered);
  };
  
  const calculateBreakdown = () => {
    const byRarity = {};
    const byType = {};
    const byPitch = {};
    
    // Only calculate breakdowns on the filtered inventory
    filteredInventory.forEach(item => {
      // Breakdown by rarity
      byRarity[item.rarity] = byRarity[item.rarity] || { count: 0, value: 0 };
      byRarity[item.rarity].count += item.quantity;
      byRarity[item.rarity].value += item.total_value;
      
      // Breakdown by card type (use main type)
      const mainType = item.type_text ? item.type_text.split(' ')[0] : 'Unknown';
      byType[mainType] = byType[mainType] || { count: 0, value: 0 };
      byType[mainType].count += item.quantity;
      byType[mainType].value += item.total_value;
      
      // Breakdown by pitch
      const pitchKey = item.pitch || 'Unknown';
      byPitch[pitchKey] = byPitch[pitchKey] || { count: 0, value: 0 };
      byPitch[pitchKey].count += item.quantity;
      byPitch[pitchKey].value += item.total_value;
    });
    
    setBreakdown({ byRarity, byType, byPitch });
  };
  
  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
  };
  
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  
  if (isLoading) return <div className="loading">Loading your collection...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  
  // Calculate collection stats
  const totalCards = filteredInventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = filteredInventory.reduce((sum, item) => sum + item.total_value, 0);
  const uniqueCards = filteredInventory.length;
  
  return (
    <div className="inventory-page">
      <h2>My Card Collection</h2>
      
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {sidebarVisible ? 'Hide Filters' : 'Show Filters'}
      </button>
      
      <div className="search-layout">
        {sidebarVisible && (
          <FilterSidebar onFilterChange={handleFilterChange} />
        )}
        
        <div className="inventory-main">
          <div className="inventory-stats">
            <div className="stat-box">
              <h3>{uniqueCards}</h3>
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
          
          {/* Collection Breakdowns */}
          <div className="collection-breakdowns">
            <div className="breakdown-section">
              <h3>Collection Breakdown</h3>
              
              <div className="breakdown-tabs">
                <div className="breakdown-tab">
                  <h4>By Rarity</h4>
                  <table className="breakdown-table">
                    <thead>
                      <tr>
                        <th>Rarity</th>
                        <th>Count</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(breakdown.byRarity).map(([rarity, data]) => (
                        <tr key={`rarity-${rarity}`}>
                          <td>{rarity || 'Unknown'}</td>
                          <td>{data.count}</td>
                          <td>${data.value.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="breakdown-tab">
                  <h4>By Card Type</h4>
                  <table className="breakdown-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Count</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(breakdown.byType).map(([type, data]) => (
                        <tr key={`type-${type}`}>
                          <td>{type}</td>
                          <td>{data.count}</td>
                          <td>${data.value.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="breakdown-tab">
                  <h4>By Pitch Value</h4>
                  <table className="breakdown-table">
                    <thead>
                      <tr>
                        <th>Pitch</th>
                        <th>Count</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(breakdown.byPitch).map(([pitch, data]) => (
                        <tr key={`pitch-${pitch}`} className={`pitch-${pitch.toLowerCase()}-row`}>
                          <td>{pitch}</td>
                          <td>{data.count}</td>
                          <td>${data.value.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          {/* Card Inventory Table */}
          {filteredInventory.length > 0 ? (
            <div className="inventory-table">
              <h3>Card Inventory {activeFilters && Object.keys(activeFilters).length > 0 && '(Filtered)'}</h3>
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
                  {filteredInventory.map(item => (
                    <tr key={item.inventory_id} className={`pitch-${item.pitch_class}-bg`}>
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
                      <td>${item.total_value.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="6" className="total-row">Total Value:</td>
                    <td className="total-value">${totalValue.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="empty-inventory">
              {inventory.length > 0 ? 
                <p>No cards match your current filters.</p> : 
                <p>Your inventory is empty. Add some cards!</p>
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
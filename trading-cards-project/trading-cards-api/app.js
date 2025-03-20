const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3001;
const dbPath = path.resolve(__dirname, 'trading_cards.db');

// Enable CORS for React app
app.use(cors());
app.use(express.json());

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database');
  }
});

// API endpoint to get all cards (paginated)
app.get('/api/cards', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  
  const sql = `
    SELECT c.card_id, c.name, c.pitch, c.cost, c.type_text,
           GROUP_CONCAT(DISTINCT t.type_name) as types,
           (SELECT image_url FROM Printings WHERE card_id = c.card_id LIMIT 1) as image_url
    FROM Cards c
    LEFT JOIN CardTypes t ON c.card_id = t.card_id
    GROUP BY c.card_id
    ORDER BY c.name
    LIMIT ? OFFSET ?
  `;
  
  db.all(sql, [limit, offset], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Get total count for pagination
    db.get('SELECT COUNT(*) as count FROM Cards', [], (err, countRow) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({
        total: countRow.count,
        page: page,
        limit: limit,
        totalPages: Math.ceil(countRow.count / limit),
        cards: rows.map(row => ({
          ...row,
          types: row.types ? row.types.split(',') : []
        }))
      });
    });
  });
});

// Enhanced search endpoint with keyword, cost, and price filtering
app.get('/api/cards/types', (req, res) => {
    const sql = `
      SELECT DISTINCT type_name 
      FROM CardTypes
      ORDER BY type_name
    `;
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Extract type names from rows
      const types = rows.map(row => row.type_name);
      res.json(types);
    });
  });
  
  // API endpoint to get all unique keywords
  app.get('/api/cards/keywords', (req, res) => {
    const sql = `
      SELECT DISTINCT keyword 
      FROM CardKeywords
      ORDER BY keyword
    `;
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Extract keywords from rows
      const keywords = rows.map(row => row.keyword);
      res.json(keywords);
    });
  });
  
  // Modify the existing search endpoint to support type and pitch filtering
// Enhanced search endpoint with advanced filtering and sorting
// Replace the existing /api/cards/search endpoint with this
app.get('/api/cards/search', (req, res) => {
    const query = req.query.q || '';
    const cardClass = req.query.cardClass || '';
    const cardType = req.query.cardType || '';
    const rarity = req.query.rarity || '';
    const pitch = req.query.pitch || '';
    const keyword = req.query.keyword || '';
    const minCost = req.query.minCost !== undefined ? parseInt(req.query.minCost) : null;
    const maxCost = req.query.maxCost !== undefined ? parseInt(req.query.maxCost) : null;
    const minPrice = req.query.minPrice !== undefined ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice !== undefined ? parseFloat(req.query.maxPrice) : null;
    const blitzLegal = req.query.blitz_legal === 'true';
    const ccLegal = req.query.cc_legal === 'true';
    const commonerLegal = req.query.commoner_legal === 'true';
    
    // Sorting
    const sortField = req.query.sortField || 'name';
    const sortDir = req.query.sortDir || 'asc';
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Start building the SQL query
    let sql = `
      SELECT c.card_id, c.name, c.pitch, c.cost, c.type_text, c.defense, c.power,
             GROUP_CONCAT(DISTINCT t.type_name) as types,
             GROUP_CONCAT(DISTINCT k.keyword) as keywords,
             (SELECT image_url FROM Printings WHERE card_id = c.card_id LIMIT 1) as image_url,
             (SELECT rarity FROM Printings WHERE card_id = c.card_id LIMIT 1) as rarity
      FROM Cards c
      LEFT JOIN CardTypes t ON c.card_id = t.card_id
      LEFT JOIN CardKeywords k ON c.card_id = k.card_id
      LEFT JOIN Printings p ON c.card_id = p.card_id
    `;
    
    // Build WHERE clause based on search parameters
    const whereConditions = [];
    const params = [];
    
    if (query) {
      whereConditions.push("c.name LIKE ?");
      params.push(`%${query}%`);
    }
    
    if (cardClass) {
      whereConditions.push("t.type_name = ?");
      params.push(cardClass);
    }
    
    if (cardType) {
      whereConditions.push("t.type_name = ?");
      params.push(cardType);
    }
    
    if (keyword) {
      whereConditions.push("k.keyword LIKE ?");
      params.push(`%${keyword}%`);
    }
    
    if (pitch) {
      whereConditions.push("c.pitch = ?");
      params.push(pitch);
    }
    
    if (rarity) {
      whereConditions.push("p.rarity = ?");
      params.push(rarity);
    }
    
    // Handle cost range
    if (minCost !== null) {
      whereConditions.push("CAST(c.cost AS INTEGER) >= ?");
      params.push(minCost);
    }
    
    if (maxCost !== null) {
      whereConditions.push("CAST(c.cost AS INTEGER) <= ?");
      params.push(maxCost);
    }
    
    // Format legality filters
    if (blitzLegal) {
      whereConditions.push("c.blitz_legal = 1");
    }
    
    if (ccLegal) {
      whereConditions.push("c.cc_legal = 1");
    }
    
    if (commonerLegal) {
      whereConditions.push("c.commoner_legal = 1");
    }
    
    // Combine all WHERE conditions
    if (whereConditions.length > 0) {
      sql += " WHERE " + whereConditions.join(" AND ");
    }
    
    // Group by card_id to handle the GROUP_CONCAT functions
    sql += " GROUP BY c.card_id";
    
    // Add price filtering as HAVING clause since it might depend on aggregated data
    if (minPrice !== null || maxPrice !== null) {
      const havingConditions = [];
      
      if (minPrice !== null) {
        havingConditions.push("MIN(p.tcgplayer_product_id) >= ?");
        params.push(minPrice);
      }
      
      if (maxPrice !== null) {
        havingConditions.push("MAX(p.tcgplayer_product_id) <= ?");
        params.push(maxPrice);
      }
      
      if (havingConditions.length > 0) {
        sql += " HAVING " + havingConditions.join(" AND ");
      }
    }
    
    // Add sorting
    let orderField = "c.name";
    if (sortField === "cost") orderField = "CAST(c.cost AS INTEGER)";
    else if (sortField === "pitch") orderField = "CAST(c.pitch AS INTEGER)";
    
    sql += ` ORDER BY ${orderField} ${sortDir === 'desc' ? 'DESC' : 'ASC'}`;
    
    // Add pagination
    sql += " LIMIT ? OFFSET ?";
    params.push(limit, offset);
    
    // Execute the query
    db.all(sql, params, (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Get total count with the same filters but without pagination
      let countSql = `
        SELECT COUNT(DISTINCT c.card_id) as count
        FROM Cards c
        LEFT JOIN CardTypes t ON c.card_id = t.card_id
        LEFT JOIN CardKeywords k ON c.card_id = k.card_id
        LEFT JOIN Printings p ON c.card_id = p.card_id
      `;
      
      if (whereConditions.length > 0) {
        countSql += " WHERE " + whereConditions.join(" AND ");
      }
      
      // Execute count query with the same filters
      db.get(countSql, params.slice(0, params.length - 2), (err, countRow) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        res.json({
          total: countRow.count,
          page: page,
          limit: limit,
          totalPages: Math.ceil(countRow.count / limit),
          cards: rows.map(row => ({
            ...row,
            types: row.types ? row.types.split(',') : [],
            keywords: row.keywords ? row.keywords.split(',') : []
          }))
        });
      });
    });
  });
// API endpoint to get card details
app.get('/api/cards/:id', (req, res) => {
  const cardId = req.params.id;
  
  // Get card details
  const cardSql = `
    SELECT c.*,
           GROUP_CONCAT(DISTINCT t.type_name) as types,
           GROUP_CONCAT(DISTINCT k.keyword) as keywords
    FROM Cards c
    LEFT JOIN CardTypes t ON c.card_id = t.card_id
    LEFT JOIN CardKeywords k ON c.card_id = k.card_id
    WHERE c.card_id = ?
    GROUP BY c.card_id
  `;
  
  db.get(cardSql, [cardId], (err, card) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    
    // Get printings
    const printingsSql = `
      SELECT p.*,
             GROUP_CONCAT(DISTINCT a.artist_name) as artists
      FROM Printings p
      LEFT JOIN Artists a ON p.printing_id = a.printing_id
      WHERE p.card_id = ?
      GROUP BY p.printing_id
    `;
    
    db.all(printingsSql, [cardId], (err, printings) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({
        ...card,
        types: card.types ? card.types.split(',') : [],
        keywords: card.keywords ? card.keywords.split(',') : [],
        printings: printings.map(p => ({
          ...p,
          artists: p.artists ? p.artists.split(',') : []
        }))
      });
    });
  });
});

// API endpoint to get user inventory
// Enhanced inventory endpoints for the backend

// Get user inventory with additional card details

  // Get inventory breakdowns/statistics
  app.get('/api/inventory/:userId/stats', (req, res) => {
    const userId = req.params.userId;
    
    // Get count and value by rarity
    const rarityQuery = `
      SELECT p.rarity, 
             COUNT(ui.inventory_id) as unique_cards,
             SUM(ui.quantity) as total_cards,
             SUM(ui.quantity * ui.purchase_price) as total_value
      FROM UserInventory ui
      JOIN Printings p ON ui.printing_id = p.printing_id
      WHERE ui.user_id = ?
      GROUP BY p.rarity
    `;
    
    // Get count and value by card type
    const typeQuery = `
      SELECT 
          CASE 
              WHEN instr(c.type_text, ' ') > 0 
              THEN substr(c.type_text, 1, instr(c.type_text, ' ')-1) 
              ELSE c.type_text 
          END as card_type,
          COUNT(ui.inventory_id) as unique_cards,
          SUM(ui.quantity) as total_cards,
          SUM(ui.quantity * ui.purchase_price) as total_value
      FROM UserInventory ui
      JOIN Cards c ON ui.card_id = c.card_id
      WHERE ui.user_id = ?
      GROUP BY card_type
    `;
    
    // Get count and value by pitch
    const pitchQuery = `
      SELECT c.pitch, 
             COUNT(ui.inventory_id) as unique_cards,
             SUM(ui.quantity) as total_cards,
             SUM(ui.quantity * ui.purchase_price) as total_value
      FROM UserInventory ui
      JOIN Cards c ON ui.card_id = c.card_id
      WHERE ui.user_id = ?
      GROUP BY c.pitch
    `;
    
    // Execute all queries
    db.all(rarityQuery, [userId], (err, rarityStats) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.all(typeQuery, [userId], (err, typeStats) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        db.all(pitchQuery, [userId], (err, pitchStats) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Return all stats
          res.json({
            byRarity: rarityStats,
            byType: typeStats,
            byPitch: pitchStats
          });
        });
      });
    });
  });




// Add card to user collection
app.get('/api/inventory/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const sql = `
      SELECT ui.inventory_id, ui.card_id, ui.printing_id, ui.quantity, ui.condition, ui.purchase_price,
             c.name as card_name, c.pitch, c.type_text, c.cost,
             p.set_id, p.edition, p.foiling, p.rarity, p.image_url
      FROM UserInventory ui
      JOIN Cards c ON ui.card_id = c.card_id
      JOIN Printings p ON ui.printing_id = p.printing_id
      WHERE ui.user_id = ?
      ORDER BY c.name
    `;
    
    db.all(sql, [userId], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Ensure numeric price values before sending to client
      const processedRows = rows.map(row => ({
        ...row,
        purchase_price: parseFloat(row.purchase_price) || 0,
        // Pre-calculate total value to ensure consistency
        total_value: (parseFloat(row.purchase_price) || 0) * (parseInt(row.quantity) || 0)
      }));
      
      res.json(processedRows);
    });
  });
  
  // Update your /api/collection/add endpoint to ensure prices are numbers
  app.post('/api/collection/add', (req, res) => {
    const { user_id, card_id, printing_id, quantity, condition, purchase_price } = req.body;
    
    console.log('Received collection add request:', req.body);
    
    if (!user_id || !card_id || !printing_id || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // CRITICAL FIX: Ensure purchase_price is a number
    const finalPrice = typeof purchase_price === 'string' 
      ? parseFloat(purchase_price) 
      : (typeof purchase_price === 'number' ? purchase_price : 0);
    
    console.log('Normalized price:', finalPrice);
    
    // Check if this card/printing already exists in user's collection
    db.get(`
      SELECT inventory_id, quantity, purchase_price 
      FROM UserInventory 
      WHERE user_id = ? AND card_id = ? AND printing_id = ?
    `, [user_id, card_id, printing_id], (err, existing) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (existing) {
        // Update existing entry
        const newQuantity = existing.quantity + quantity;
        
        // Keep the original price if one wasn't provided
        const newPrice = finalPrice > 0 ? finalPrice : existing.purchase_price;
        
        console.log('Updating existing entry with price:', newPrice);
        
        db.run(`
          UPDATE UserInventory 
          SET quantity = ?, 
              condition = COALESCE(?, condition),
              purchase_price = ?,
              date_acquired = datetime('now')
          WHERE inventory_id = ?
        `, [newQuantity, condition, newPrice, existing.inventory_id], function(err) {
          if (err) {
            console.error('Update error:', err);
            return res.status(500).json({ error: err.message });
          }
          
          res.json({
            success: true,
            message: 'Card quantity updated in collection',
            inventory_id: existing.inventory_id,
            new_quantity: newQuantity,
            purchase_price: newPrice
          });
        });
      } else {
        // Create new entry with the provided price or default to 0
        console.log('Creating new entry with price:', finalPrice);
        
        db.run(`
          INSERT INTO UserInventory (user_id, card_id, printing_id, quantity, condition, purchase_price, date_acquired)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `, [user_id, card_id, printing_id, quantity, condition || 'Near Mint', finalPrice], function(err) {
          if (err) {
            console.error('Insert error:', err);
            return res.status(500).json({ error: err.message });
          }
          
          res.json({
            success: true,
            message: 'Card added to collection',
            inventory_id: this.lastID,
            purchase_price: finalPrice
          });
        });
      }
    });
  });
app.get('/api/inventory/printing/:printingId', (req, res) => {
    const printingId = req.params.printingId;
    
    db.get(`
      SELECT pi.inventory_id, pi.printing_id, pi.stock_quantity, pi.last_updated,
             p.set_id, p.edition, p.foiling, p.rarity,
             c.name as card_name
      FROM ProductInventory pi
      JOIN Printings p ON pi.printing_id = p.printing_id
      JOIN Cards c ON p.card_id = c.card_id
      WHERE pi.printing_id = ?
    `, [printingId], (err, inventory) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!inventory) {
        return res.status(404).json({ error: 'Inventory not found' });
      }
      
      res.json(inventory);
    });
  });
  
  // Check if item is in stock
  app.get('/api/inventory/check/:printingId', (req, res) => {
    const printingId = req.params.printingId;
    const quantity = parseInt(req.query.quantity) || 1;
    
    db.get(`
      SELECT stock_quantity, 
             (stock_quantity >= ?) as in_stock
      FROM ProductInventory
      WHERE printing_id = ?
    `, [quantity, printingId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!result) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json({
        printing_id: printingId,
        requested: quantity,
        available: result.stock_quantity,
        in_stock: result.in_stock === 1
      });
    });
  });
  
  // Update inventory (decrease quantity)
  app.post('/api/inventory/update', (req, res) => {
    const { printing_id, quantity } = req.body;
    
    if (!printing_id || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // First check if we have enough stock
    db.get(`
      SELECT stock_quantity
      FROM ProductInventory
      WHERE printing_id = ?
    `, [printing_id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!result) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      if (result.stock_quantity < quantity) {
        return res.status(400).json({ 
          error: 'Insufficient stock', 
          requested: quantity, 
          available: result.stock_quantity
        });
      }
      
      // Update the inventory
      db.run(`
        UPDATE ProductInventory
        SET stock_quantity = stock_quantity - ?,
            last_updated = datetime('now')
        WHERE printing_id = ?
      `, [quantity, printing_id], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json({ 
          success: true, 
          message: 'Inventory updated',
          printing_id,
          quantity,
          new_stock: result.stock_quantity - quantity
        });
      });
    });
  });
  
  // Get low stock items
  app.get('/api/inventory/low-stock', (req, res) => {
    const threshold = parseInt(req.query.threshold) || 5;
    
    db.all(`
      SELECT pi.inventory_id, pi.printing_id, pi.stock_quantity, pi.last_updated,
             p.set_id, p.edition, p.foiling, p.rarity,
             c.name as card_name, c.card_id
      FROM ProductInventory pi
      JOIN Printings p ON pi.printing_id = p.printing_id
      JOIN Cards c ON p.card_id = c.card_id
      WHERE pi.stock_quantity <= ?
      ORDER BY pi.stock_quantity ASC
    `, [threshold], (err, items) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json(items);
    });
  });


// Add these endpoints to your app.js API file

// Update quantity in collection
app.post('/api/collection/update', (req, res) => {
    const { inventory_id, quantity, user_id } = req.body;
    
    if (!inventory_id || !quantity || !user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Ensure quantity is valid
    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }
    
    // Update the inventory entry
    db.run(`
      UPDATE UserInventory 
      SET quantity = ?, 
          date_acquired = datetime('now')
      WHERE inventory_id = ? AND user_id = ?
    `, [quantity, inventory_id, user_id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Inventory entry not found or not owned by user' });
      }
      
      res.json({
        success: true,
        message: 'Quantity updated',
        inventory_id: inventory_id,
        new_quantity: quantity
      });
    });
  });
  
  // Remove card from collection
  app.post('/api/collection/remove', (req, res) => {
    const { inventory_id, user_id } = req.body;
    
    if (!inventory_id || !user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Delete the inventory entry
    db.run(`
      DELETE FROM UserInventory 
      WHERE inventory_id = ? AND user_id = ?
    `, [inventory_id, user_id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Inventory entry not found or not owned by user' });
      }
      
      res.json({
        success: true,
        message: 'Card removed from collection',
        inventory_id: inventory_id
      });
    });
  });




// Start the server
app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});




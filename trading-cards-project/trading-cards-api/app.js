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
app.get('/api/inventory/:userId', (req, res) => {
  const userId = req.params.userId;
  
  const sql = `
    SELECT ui.inventory_id, ui.card_id, ui.printing_id, ui.quantity, ui.condition, ui.purchase_price,
           c.name as card_name, c.pitch, c.type_text,
           p.set_id, p.edition, p.foiling, p.rarity, p.image_url
    FROM UserInventory ui
    JOIN Cards c ON ui.card_id = c.card_id
    JOIN Printings p ON ui.printing_id = p.printing_id
    WHERE ui.user_id = ?
    ORDER BY c.name
  `;
  
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json(rows);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
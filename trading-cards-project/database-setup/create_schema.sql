CREATE TABLE Cards (
    card_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pitch TEXT,
    cost TEXT,
    power TEXT,
    defense TEXT,
    health TEXT,
    intelligence TEXT,
    arcane TEXT,
    functional_text TEXT,
    type_text TEXT,
    played_horizontally INTEGER,
    blitz_legal INTEGER,
    cc_legal INTEGER,
    commoner_legal INTEGER,
    ll_legal INTEGER,
    blitz_banned INTEGER,
    cc_banned INTEGER,
    commoner_banned INTEGER,
    ll_banned INTEGER
);

-- Table for card types (many-to-many relationship)
CREATE TABLE CardTypes (
    card_id TEXT,
    type_name TEXT,
    PRIMARY KEY (card_id, type_name),
    FOREIGN KEY (card_id) REFERENCES Cards(card_id)
);

-- Table for card keywords (many-to-many relationship)
CREATE TABLE CardKeywords (
    card_id TEXT,
    keyword TEXT,
    PRIMARY KEY (card_id, keyword),
    FOREIGN KEY (card_id) REFERENCES Cards(card_id)
);

-- Table for card printings
CREATE TABLE Printings (
    printing_id TEXT PRIMARY KEY,
    card_id TEXT,
    set_id TEXT,
    set_printing_id TEXT,
    edition TEXT,
    foiling TEXT,
    rarity TEXT,
    expansion_slot INTEGER,
    flavor_text TEXT,
    image_url TEXT,
    tcgplayer_product_id TEXT,
    tcgplayer_url TEXT,
    FOREIGN KEY (card_id) REFERENCES Cards(card_id)
);

-- Table for artists (many-to-many with printings)
CREATE TABLE Artists (
    printing_id TEXT,
    artist_name TEXT,
    PRIMARY KEY (printing_id, artist_name),
    FOREIGN KEY (printing_id) REFERENCES Printings(printing_id)
);

-- Table for tracking inventory (for part 2 of your database)
CREATE TABLE UserInventory (
    inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    card_id TEXT,
    printing_id TEXT,
    quantity INTEGER DEFAULT 0,
    purchase_price REAL,
    date_acquired TEXT,
    condition TEXT,
    notes TEXT,
    FOREIGN KEY (card_id) REFERENCES Cards(card_id),
    FOREIGN KEY (printing_id) REFERENCES Printings(printing_id)
);

-- Table for users (for part 2 of your database)
CREATE TABLE Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT,
    password_hash TEXT,
    date_created TEXT
);

ALTER TABLE Printings ADD COLUMN stock_quantity INTEGER DEFAULT 10;

-- Create ProductInventory table for tracking specific printings
CREATE TABLE ProductInventory (
    inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
    printing_id TEXT NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    last_updated TEXT,
    FOREIGN KEY (printing_id) REFERENCES Printings(printing_id)
);

-- Populate the ProductInventory table with initial data
INSERT INTO ProductInventory (printing_id, stock_quantity, last_updated)
SELECT printing_id, 
       CASE 
           WHEN rarity = 'C' THEN 25 
           WHEN rarity = 'R' THEN 10 
           WHEN rarity = 'M' THEN 5
           WHEN rarity = 'L' THEN 2
           ELSE 10
       END as initial_stock,
       datetime('now')
FROM Printings;
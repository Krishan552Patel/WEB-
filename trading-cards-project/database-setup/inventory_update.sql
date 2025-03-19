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
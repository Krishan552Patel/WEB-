import json
import sqlite3
import os

# Path to your JSON file and database
json_file_path = 'card1.json'  # Update this if your file is elsewhere
db_file_path = '../trading-cards-api/trading_cards.db'  # Points to the database in the API folder

def create_database():
    """Create the database schema if it doesn't exist"""
    # Check if database exists, if so, ask before overwriting
    if os.path.exists(db_file_path):
        response = input(f"Database {db_file_path} already exists. Overwrite? (y/n): ")
        if response.lower() != 'y':
            print("Exiting without changes.")
            return False
    
    # Connect to database (will create if it doesn't exist)
    conn = sqlite3.connect(db_file_path)
    cursor = conn.cursor()
    
    # Read the schema file
    schema_file = 'create_schema.sql'
    if os.path.exists(schema_file):
        with open(schema_file, 'r') as f:
            schema_sql = f.read()
            
        # Split and execute each statement
        for statement in schema_sql.split(';'):
            if statement.strip():
                cursor.execute(statement)
    else:
        print(f"Schema file {schema_file} not found. Creating tables manually.")
        
        # Manual table creation (backup approach)
        cursor.execute("""
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
        )
        """)
        
        cursor.execute("""
        CREATE TABLE CardTypes (
            card_id TEXT,
            type_name TEXT,
            PRIMARY KEY (card_id, type_name),
            FOREIGN KEY (card_id) REFERENCES Cards(card_id)
        )
        """)
        
        cursor.execute("""
        CREATE TABLE CardKeywords (
            card_id TEXT,
            keyword TEXT,
            PRIMARY KEY (card_id, keyword),
            FOREIGN KEY (card_id) REFERENCES Cards(card_id)
        )
        """)
        
        cursor.execute("""
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
        )
        """)
        
        cursor.execute("""
        CREATE TABLE Artists (
            printing_id TEXT,
            artist_name TEXT,
            PRIMARY KEY (printing_id, artist_name),
            FOREIGN KEY (printing_id) REFERENCES Printings(printing_id)
        )
        """)
        
        cursor.execute("""
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
        )
        """)
        
        cursor.execute("""
        CREATE TABLE Users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT,
            password_hash TEXT,
            date_created TEXT
        )
        """)
        
        # Add a default user
        cursor.execute("""
        INSERT INTO Users (username, email, password_hash, date_created)
        VALUES ('testuser', 'test@example.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', '2025-03-17')
        """)
    
    conn.commit()
    conn.close()
    print(f"Database schema created at {db_file_path}")
    return True

def import_card_data():
    """Import card data from JSON file to SQLite database"""
    # Read JSON data
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            # The file contains JSON objects, try to parse them
            content = f.read()
            # Check if the content is already a JSON array
            if content.strip().startswith('['):
                cards_data = json.loads(content)
            else:
                # If it's not an array, make it one
                cards_data = json.loads('[' + content + ']')
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        print("Trying to fix the JSON format...")
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Try to fix common JSON issues
                # Remove trailing commas
                content = content.replace(',}', '}').replace(',]', ']')
                # Ensure it's wrapped in an array
                if not content.strip().startswith('['):
                    content = '[' + content + ']'
                cards_data = json.loads(content)
        except Exception as e2:
            print(f"Failed to fix JSON: {e2}")
            return
    
    # Connect to database
    conn = sqlite3.connect(db_file_path)
    if os.path.exists(db_file_path):
    # Drop existing tables if overwriting
        tables = [
            "Artists", "CardKeywords", "CardTypes", 
            "Printings", "UserInventory", "Users", "Cards"]
    for table in tables:
        try:
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
        except:
            pass
    cursor = conn.cursor()
    
    # Begin transaction (improves import speed)
    conn.execute("BEGIN TRANSACTION")
    
    # Counters for progress tracking
    total_cards = len(cards_data)
    cards_processed = 0
    
    try:
        for card in cards_data:
            # Insert card basic info
            cursor.execute("""
                INSERT INTO Cards (
                    card_id, name, pitch, cost, power, defense, health, 
                    intelligence, arcane, functional_text, type_text, 
                    played_horizontally, blitz_legal, cc_legal, commoner_legal,
                    ll_legal, blitz_banned, cc_banned, commoner_banned, ll_banned
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                card.get('unique_id'),
                card.get('name'),
                card.get('pitch'),
                card.get('cost'),
                card.get('power'),
                card.get('defense'),
                card.get('health'),
                card.get('intelligence'),
                card.get('arcane'),
                card.get('functional_text'),
                card.get('type_text'),
                1 if card.get('played_horizontally') else 0,
                1 if card.get('blitz_legal') else 0,
                1 if card.get('cc_legal') else 0,
                1 if card.get('commoner_legal') else 0,
                1 if card.get('ll_legal') else 0,
                1 if card.get('blitz_banned') else 0,
                1 if card.get('cc_banned') else 0,
                1 if card.get('commoner_banned') else 0,
                1 if card.get('ll_banned') else 0
            ))
            
            # Insert card types
            # Insert card types (ignore duplicates)
            for type_name in card.get('types', []):
                cursor.execute("INSERT OR IGNORE INTO CardTypes (card_id, type_name) VALUES (?, ?)", 
                  (card.get('unique_id'), type_name))
            
            # Insert card keywords
            for keyword in card.get('card_keywords', []):
                cursor.execute("INSERT INTO CardKeywords (card_id, keyword) VALUES (?, ?)", 
                              (card.get('unique_id'), keyword))
            
            # Insert printings and related artists
            for printing in card.get('printings', []):
                cursor.execute("""
                    INSERT INTO Printings (
                        printing_id, card_id, set_id, set_printing_id, edition, 
                        foiling, rarity, expansion_slot, flavor_text, image_url, 
                        tcgplayer_product_id, tcgplayer_url
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    printing.get('unique_id'),
                    card.get('unique_id'),
                    printing.get('set_id'),
                    printing.get('set_printing_unique_id'),
                    printing.get('edition'),
                    printing.get('foiling'),
                    printing.get('rarity'),
                    1 if printing.get('expansion_slot') else 0,
                    printing.get('flavor_text'),
                    printing.get('image_url'),
                    printing.get('tcgplayer_product_id'),
                    printing.get('tcgplayer_url')
                ))
                
                # Insert artists
                for artist in printing.get('artists', []):
                    cursor.execute("INSERT INTO Artists (printing_id, artist_name) VALUES (?, ?)",
                                 (printing.get('unique_id'), artist))
            
            # Update progress
            cards_processed += 1
            if cards_processed % 10 == 0 or cards_processed == total_cards:
                print(f"Processed {cards_processed}/{total_cards} cards")
        
        # Commit changes
        conn.commit()
        print(f"Successfully imported {cards_processed} cards!")
        
    except Exception as e:
        # If error occurs, rollback transaction
        conn.rollback()
        print(f"Error importing data: {e}")
    
    finally:
        # Close connection
        conn.close()

if __name__ == "__main__":
    print("Trading Cards Database Import Tool")
    print("----------------------------------")
    
    if create_database():
        proceed = input("Database created. Import card data now? (y/n): ")
        if proceed.lower() == 'y':
            import_card_data()
    
    print("Done!")
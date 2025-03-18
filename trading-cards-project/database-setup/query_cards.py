import sqlite3

def query_database():
    # Connect to the database in the API folder
    conn = sqlite3.connect('../trading-cards-api/trading_cards.db')
    # Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON")
    # Return rows as dictionaries
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    while True:
        print("\nTrading Card Database Query Tool")
        print("--------------------------------")
        print("1. Count cards by type")
        print("2. Search cards by name")
        print("3. List all card sets")
        print("4. Show card details")
        print("5. List all images for a card")
        print("6. Show cards with specific keyword")
        print("0. Exit")
        
        choice = input("\nEnter choice (0-6): ")
        
        if choice == '0':
            break
        
        elif choice == '1':
            # Count cards by type
            cursor.execute("""
                SELECT type_name, COUNT(*) as count 
                FROM CardTypes 
                GROUP BY type_name 
                ORDER BY count DESC
            """)
            
            results = cursor.fetchall()
            print("\n=== Card Types ===")
            for row in results:
                print(f"{row['type_name']}: {row['count']} cards")
        
        elif choice == '2':
            # Search cards by name
            search_term = input("Enter card name (or part of name): ")
            cursor.execute("""
                SELECT card_id, name, pitch, cost, type_text 
                FROM Cards 
                WHERE name LIKE ?
                ORDER BY name
            """, (f'%{search_term}%',))
            
            results = cursor.fetchall()
            print(f"\n=== Found {len(results)} cards ===")
            for row in results:
                print(f"{row['name']} (Pitch: {row['pitch']}, Cost: {row['cost']}) - {row['type_text']}")
        
        elif choice == '3':
            # List all card sets
            cursor.execute("""
                SELECT set_id, COUNT(*) as card_count 
                FROM Printings 
                GROUP BY set_id 
                ORDER BY set_id
            """)
            
            results = cursor.fetchall()
            print("\n=== Card Sets ===")
            for row in results:
                print(f"{row['set_id']}: {row['card_count']} printings")
        
        elif choice == '4':
            # Show card details
            card_name = input("Enter exact card name: ")
            cursor.execute("SELECT card_id, name, pitch, cost, functional_text, type_text FROM Cards WHERE name = ?", (card_name,))
            card = cursor.fetchone()
            
            if card:
                print(f"\n=== {card['name']} ===")
                print(f"Type: {card['type_text']}")
                print(f"Pitch: {card['pitch']}, Cost: {card['cost']}")
                print(f"Text: {card['functional_text']}")
                
                # Get types
                cursor.execute("SELECT type_name FROM CardTypes WHERE card_id = ?", (card['card_id'],))
                types = cursor.fetchall()
                print("Types: " + ", ".join([t['type_name'] for t in types]))
                
                # Get keywords
                cursor.execute("SELECT keyword FROM CardKeywords WHERE card_id = ?", (card['card_id'],))
                keywords = cursor.fetchall()
                if keywords:
                    print("Keywords: " + ", ".join([k['keyword'] for k in keywords]))
                
                # Get printings
                cursor.execute("""
                    SELECT p.set_id, p.edition, p.foiling, p.rarity, p.image_url,
                           GROUP_CONCAT(a.artist_name, ', ') as artists
                    FROM Printings p
                    LEFT JOIN Artists a ON p.printing_id = a.printing_id
                    WHERE p.card_id = ?
                    GROUP BY p.printing_id
                """, (card['card_id'],))
                
                printings = cursor.fetchall()
                print(f"\nPrintings ({len(printings)}):")
                for p in printings:
                    print(f"  Set: {p['set_id']} ({p['edition']}) - {p['foiling']} {p['rarity']}")
                    print(f"  Artists: {p['artists']}")
                    print(f"  Image: {p['image_url']}")
                    print()
            else:
                print(f"Card '{card_name}' not found")
        
        elif choice == '5':
            # List all images for a card
            card_name = input("Enter exact card name: ")
            cursor.execute("""
                SELECT p.image_url, p.set_id, p.edition, p.foiling, p.rarity
                FROM Printings p
                JOIN Cards c ON p.card_id = c.card_id
                WHERE c.name = ?
                ORDER BY p.set_id, p.edition
            """, (card_name,))
            
            images = cursor.fetchall()
            if images:
                print(f"\n=== Images for '{card_name}' ===")
                for img in images:
                    print(f"Set: {img['set_id']} ({img['edition']}) - {img['foiling']} {img['rarity']}")
                    print(f"URL: {img['image_url']}")
                    print()
            else:
                print(f"No images found for '{card_name}'")
        
        elif choice == '6':
            # Cards with specific keyword
            keyword = input("Enter keyword: ")
            cursor.execute("""
                SELECT c.name, c.pitch, c.cost, c.type_text
                FROM Cards c
                JOIN CardKeywords k ON c.card_id = k.card_id
                WHERE k.keyword LIKE ?
                ORDER BY c.name
            """, (f'%{keyword}%',))
            
            results = cursor.fetchall()
            print(f"\n=== Cards with keyword '{keyword}' ({len(results)}) ===")
            for row in results:
                print(f"{row['name']} (Pitch: {row['pitch']}, Cost: {row['cost']}) - {row['type_text']}")
        
        else:
            print("Invalid choice. Please try again.")
    
    conn.close()
    print("Goodbye!")

if __name__ == "__main__":
    query_database()
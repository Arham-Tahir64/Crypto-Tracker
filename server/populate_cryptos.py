import requests
import sys
import os
from datetime import datetime

# Add the current directory to Python path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import Crypto

def fetch_crypto_data():
    """Fetch cryptocurrency data from CoinGecko API"""
    try:
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {
            'vs_currency': 'usd',
            'order': 'market_cap_desc',
            'per_page': 100,
            'page': 1,
            'sparkline': 'false'
        }
        
        print("Fetching cryptocurrency data from CoinGecko...")
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        
        coins = response.json()
        print(f"Successfully fetched {len(coins)} cryptocurrencies")
        return coins
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from CoinGecko: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None

def populate_database(coins_data):
    """Populate the database with cryptocurrency data"""
    if not coins_data:
        print("No data to populate")
        return
    
    app = create_app()
    
    with app.app_context():
        try:
            # Clear existing crypto data (optional - comment out if you want to keep existing data)
            print("Clearing existing cryptocurrency data...")
            Crypto.query.delete()
            db.session.commit()
            print("Existing data cleared")
            
            # Add new crypto data
            print("Adding new cryptocurrency data to database...")
            added_count = 0
            skipped_count = 0
            seen_symbols = set()
            
            for coin in coins_data:
                try:
                    symbol_upper = coin['symbol'].upper()
                    if symbol_upper in seen_symbols:
                        print(f"Skipping {coin['name']} - symbol {symbol_upper} already added")
                        skipped_count += 1
                        continue
                    seen_symbols.add(symbol_upper)
                    # Check if crypto already exists (shouldn't happen after clearing, but good practice)
                    existing_crypto = Crypto.query.filter_by(api_id=coin['id']).first()
                    if existing_crypto:
                        print(f"Skipping {coin['name']} - already exists by api_id")
                        skipped_count += 1
                        continue
                    # Create new crypto entry
                    new_crypto = Crypto(
                        name=coin['name'],
                        symbol=symbol_upper,
                        api_id=coin['id'],
                        logo_url=coin['image'],
                        last_updated_price=coin['current_price'],
                        last_price_fetch_time=datetime.utcnow()
                    )
                    db.session.add(new_crypto)
                    added_count += 1
                    # Print progress every 10 coins
                    if added_count % 10 == 0:
                        print(f"Added {added_count} cryptocurrencies...")
                except Exception as e:
                    print(f"Error adding {coin.get('name', 'Unknown')}: {e}")
                    skipped_count += 1
                    continue
            
            # Commit all changes
            db.session.commit()
            print(f"\nDatabase population completed!")
            print(f"Added: {added_count} cryptocurrencies")
            print(f"Skipped: {skipped_count} cryptocurrencies")
            
            # Verify the data
            total_in_db = Crypto.query.count()
            print(f"Total cryptocurrencies in database: {total_in_db}")
            
        except Exception as e:
            db.session.rollback()
            print(f"Error during database population: {e}")
            raise

def main():
    """Main function to run the population script"""
    print("=== Cryptocurrency Database Population Script ===")
    print("This script will fetch the top 100 cryptocurrencies from CoinGecko")
    print("and populate your PostgreSQL database.\n")
    
    # Fetch data from CoinGecko
    coins_data = fetch_crypto_data()
    
    if coins_data:
        # Populate the database
        populate_database(coins_data)
        print("\n✅ Database population completed successfully!")
    else:
        print("❌ Failed to fetch cryptocurrency data")
        sys.exit(1)

if __name__ == "__main__":
    main() 
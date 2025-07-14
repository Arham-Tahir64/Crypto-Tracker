# server/app/routes.py
# API endpoints for the crypto tracker app.

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
# Import JWT-Extended components
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import requests # For making external API calls (e.g., to CoinGecko)
from datetime import datetime
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# Import all your models
from .models import db, User, Crypto, Transaction, PortfolioHolding

# Define a single Blueprint for all routes in this file.
main_bp = Blueprint('main_api', __name__)
auth_bp = Blueprint('auth', __name__)



# ----------- USER AUTHENTICATION -----------

@auth_bp.route('/auth/google', methods=['POST'])
def google_auth():
    data = request.get_json()
    token = data.get('credential')
    if not token:
        return jsonify({'message': 'Missing token'}), 400

    try:
        print(f"Received token: {token[:50]}...")  # Debug: print first 50 chars
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request())
        print(f"Token verified successfully. User info: {idinfo}")  # Debug
        email = idinfo['email']
        name = idinfo.get('name')
        picture = idinfo.get('picture')

        # Find or create user
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(username=email, email=email, password_hash='', profile_picture=picture)
            db.session.add(user)
            db.session.commit()
            print(f"Created new user: {email}")  # Debug

        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'access_token': create_access_token(identity=str(user.id))
        }), 200

    except Exception as e:
        print(f"Google auth error: {e}")
        print(f"Error type: {type(e)}")  # Debug
        return jsonify({'message': f'Invalid token: {str(e)}'}), 400
    

@main_bp.route('/register', methods=['POST'])
def register():
    # User registration endpoint. Expects username, email, and password in JSON.
    data = request.get_json()
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Missing username, email, or password"}), 400
    username = data['username']
    email = data['email']
    password = data['password']
    # Check if user or email is already taken
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"message": "Username or email already exists"}), 409
    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    new_user = User(username=username, email=email, password_hash=hashed_password)
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({
            "message": "User registered successfully",
            "user": new_user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error during registration: {e}")
        return jsonify({"message": "An error occurred during registration"}), 500


@main_bp.route('/login', methods=['POST'])
def login():
    # User login. Accepts username or email and password, returns JWT if valid.
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"message": "Missing username or password"}), 400
    username_or_email = data['username']
    password = data['password']
    user = User.query.filter((User.username == username_or_email) | (User.email == username_or_email)).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid credentials"}), 401
    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": user.to_dict()
    }), 200


# ----------- CRYPTOCURRENCY ROUTES -----------

@main_bp.route('/cryptos', methods=['GET'])
@jwt_required()
def get_all_cryptos():
    # Get top 100 cryptos from CoinGecko. If that fails, use our DB as backup.
    try:
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {
            'vs_currency': 'usd',
            'order': 'market_cap_desc',
            'per_page': 100,
            'page': 1,
            'sparkline': 'false'
        }
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        coins = response.json()
        result = [
            {
                'id': coin['id'],
                'symbol': coin['symbol'],
                'name': coin['name'],
                'current_price': coin['current_price'],
                'market_cap': coin['market_cap'],
                'image': coin['image'],
                'price_change_percentage_24h': coin.get('price_change_percentage_24h'),
            }
            for coin in coins
        ]
        return jsonify(result), 200
    except Exception as e:
        print(f"CoinGecko API error: {e}")
        cryptos = Crypto.query.all()
        return jsonify([crypto.to_dict() for crypto in cryptos]), 200


@main_bp.route('/cryptos/<string:symbol>', methods=['GET'])
@jwt_required()
def get_crypto_by_symbol(symbol):
    # Get info for a specific crypto by symbol from our DB.
    crypto = Crypto.query.filter_by(symbol=symbol.upper()).first()
    if not crypto:
        return jsonify({"message": f"Cryptocurrency with symbol '{symbol}' not found"}), 404
    return jsonify(crypto.to_dict()), 200


@main_bp.route('/cryptos/db', methods=['GET'])
@jwt_required()
def get_db_cryptos():
    # Get all cryptos from our database for transaction modal
    cryptos = Crypto.query.all()
    return jsonify([crypto.to_dict() for crypto in cryptos]), 200


# ----------- TRANSACTIONS -----------

@main_bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_user_transactions():
    # Get all transactions for the logged-in user, newest first.
    current_user_id = get_jwt_identity()
    transactions = Transaction.query.filter_by(user_id=current_user_id).order_by(Transaction.transaction_date.desc()).all()
    return jsonify([tx.to_dict() for tx in transactions]), 200


@main_bp.route('/transactions', methods=['POST'])
@jwt_required()
def add_transaction():
    # Add a buy or sell transaction for the logged-in user. Updates portfolio too.
    current_user_id = get_jwt_identity()
    data = request.get_json()
    required_fields = ['crypto_id', 'quantity', 'price_per_coin', 'transaction_type', 'transaction_date']
    if not data or not all(field in data for field in required_fields):
        return jsonify({"message": "Missing required transaction data"}), 400
    crypto_id = data['crypto_id']
    quantity = float(data['quantity'])
    price_per_coin = float(data['price_per_coin'])
    transaction_type = data['transaction_type'].lower()
    transaction_date = datetime.fromisoformat(data['transaction_date'])
    if transaction_type not in ['buy', 'sell']:
        return jsonify({"message": "Invalid transaction_type. Must be 'buy' or 'sell'."}), 400
    if quantity <= 0 or price_per_coin <= 0:
        return jsonify({"message": "Quantity and price must be positive values."}), 400
    crypto = Crypto.query.get(crypto_id)
    if not crypto:
        return jsonify({"message": "Cryptocurrency not found."}), 404
    fiat_value = quantity * price_per_coin
    new_transaction = Transaction(
        user_id=current_user_id,
        crypto_id=crypto_id,
        transaction_type=transaction_type,
        quantity=quantity,
        price_per_coin=price_per_coin,
        fiat_value=fiat_value,
        transaction_date=transaction_date
    )
    try:
        db.session.add(new_transaction)
        db.session.flush()
        holding = PortfolioHolding.query.filter_by(
            user_id=current_user_id,
            crypto_id=crypto_id
        ).first()
        if transaction_type == 'buy':
            if holding:
                # Buying more: update quantity and average price
                new_total_fiat_cost = (holding.quantity * holding.average_buy_price) + fiat_value
                new_total_quantity = holding.quantity + quantity
                holding.quantity = new_total_quantity
                holding.average_buy_price = new_total_fiat_cost / new_total_quantity
                holding.last_updated = datetime.utcnow()
            else:
                # First time buying this crypto
                new_holding = PortfolioHolding(
                    user_id=current_user_id,
                    crypto_id=crypto_id,
                    quantity=quantity,
                    average_buy_price=price_per_coin,
                    last_updated=datetime.utcnow()
                )
                db.session.add(new_holding)
        elif transaction_type == 'sell':
            if not holding or holding.quantity < quantity:
                db.session.rollback()
                return jsonify({"message": "Cannot sell more quantity than held in portfolio."}), 400
            else:
                holding.quantity -= quantity
                holding.last_updated = datetime.utcnow()
                if holding.quantity <= 0.0000001:
                    db.session.delete(holding)
        db.session.commit()
        return jsonify({
            "message": "Transaction added and portfolio updated successfully",
            "transaction": new_transaction.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error adding transaction or updating portfolio: {e}")
        return jsonify({"message": "An error occurred while processing transaction"}), 500


# ----------- PORTFOLIO -----------

@main_bp.route('/portfolio', methods=['GET'])
@jwt_required()
def get_user_portfolio():
    # Get the logged-in user's portfolio, including P&L and live prices from CoinGecko.
    current_user_id = get_jwt_identity()
    holdings = PortfolioHolding.query.filter_by(user_id=current_user_id).join(Crypto).all()
    portfolio_data = []
    
    # Get current prices from CoinGecko for all cryptos in portfolio
    crypto_ids = [holding.crypto.api_id for holding in holdings]
    current_prices = {}
    
    if crypto_ids:
        try:
            # Fetch current prices from CoinGecko
            url = "https://api.coingecko.com/api/v3/simple/price"
            params = {
                'ids': ','.join(crypto_ids),
                'vs_currencies': 'usd'
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            current_prices = response.json()
        except Exception as e:
            print(f"Error fetching current prices: {e}")
            # Fallback to cached prices
            current_prices = {}
    
    for holding in holdings:
        holding_dict = holding.to_dict()
        
        # Add crypto object to match frontend expectations
        holding_dict['crypto'] = {
            'id': holding.crypto.id,
            'name': holding.crypto.name,
            'symbol': holding.crypto.symbol,
            'api_id': holding.crypto.api_id,
            'logo_url': holding.crypto.logo_url
        }
        
        # Get current price (live from CoinGecko or cached)
        current_price = current_prices.get(holding.crypto.api_id, {}).get('usd', holding.crypto.last_updated_price)
        if current_price is None:
            current_price = holding.crypto.last_updated_price or 0
        
        current_value = holding.quantity * current_price
        gain_loss = current_value - (holding.quantity * holding.average_buy_price)
        percentage_change = (gain_loss / (holding.quantity * holding.average_buy_price)) * 100 if (holding.quantity * holding.average_buy_price) else 0
        
        holding_dict['current_price'] = current_price
        holding_dict['current_value'] = current_value
        holding_dict['gain_loss'] = gain_loss
        holding_dict['percentage_change'] = percentage_change
        portfolio_data.append(holding_dict)
    
    return jsonify(portfolio_data), 200


@main_bp.route('/portfolio/summary', methods=['GET'])
@jwt_required()
def get_portfolio_summary():
    # Give a quick summary of the user's portfolio: total value, P&L, etc.
    current_user_id = get_jwt_identity()
    holdings = PortfolioHolding.query.filter_by(user_id=current_user_id).join(Crypto).all()
    
    # Get current prices from CoinGecko for all cryptos in portfolio
    crypto_ids = [holding.crypto.api_id for holding in holdings]
    current_prices = {}
    
    if crypto_ids:
        try:
            # Fetch current prices from CoinGecko
            url = "https://api.coingecko.com/api/v3/simple/price"
            params = {
                'ids': ','.join(crypto_ids),
                'vs_currencies': 'usd'
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            current_prices = response.json()
        except Exception as e:
            print(f"Error fetching current prices: {e}")
            # Fallback to cached prices
            current_prices = {}
    
    total_current_value = 0
    total_cost_basis = 0
    
    for holding in holdings:
        # Get current price (live from CoinGecko or cached)
        current_price = current_prices.get(holding.crypto.api_id, {}).get('usd', holding.crypto.last_updated_price)
        if current_price is None:
            current_price = holding.crypto.last_updated_price or 0
        
        total_current_value += holding.quantity * current_price
        total_cost_basis += holding.quantity * holding.average_buy_price
    
    total_gain_loss = total_current_value - total_cost_basis
    total_percentage_change = (total_gain_loss / total_cost_basis) * 100 if total_cost_basis else 0
    
    summary = {
        "total_current_value": total_current_value,
        "total_cost_basis": total_cost_basis,
        "total_gain_loss": total_gain_loss,
        "total_percentage_change": total_percentage_change,
        "num_holdings": len(holdings)
    }
    return jsonify(summary), 200
# server/app/models.py
# This file defines the database models for your crypto-tracker application
# using Flask-SQLAlchemy. Each class represents a table in your database.

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# User Model: Represents the 'users' table
# Stores user authentication information and links to their transactions and portfolio.
class User(db.Model):
    __tablename__ = 'users' # Explicitly set the table name

    # Primary Key: Unique identifier for each user
    id = db.Column(db.Integer, primary_key=True)

    # Username: Must be unique for each user and cannot be empty
    username = db.Column(db.String(80), unique=True, nullable=False)

    # Email: Must be unique for each user and cannot be empty
    email = db.Column(db.String(120), unique=True, nullable=False)

    # Password Hash: Stores the hashed password for security. Cannot be empty.
    # A longer string length (e.g., 255) is recommended for storing password hashes.
    password_hash = db.Column(db.String(255), nullable=False)

    # Creation Timestamp: Automatically set when a new user is created
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Last Update Timestamp: Automatically updated whenever the user record is modified
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships: Define how this User model relates to other models
    # 'transactions': A user can have many transactions.
    #   'backref='user'' creates a 'user' attribute on the Transaction object
    #   that links back to the User who made the transaction.
    #   'lazy=True' means the related objects are loaded when accessed (efficient).
    transactions = db.relationship('Transaction', backref='user', lazy=True)

    # 'portfolio_holdings': A user can have many crypto holdings in their portfolio.
    portfolio_holdings = db.relationship('PortfolioHolding', backref='user', lazy=True)

    # __repr__ method: Provides a readable representation of a User object,
    # useful for debugging.
    def __repr__(self):
        return f"<User {self.username} (ID: {self.id})>"

    # Optional: A simple method to convert User object to a dictionary for JSON serialization
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() + 'Z', # ISO format for date/time + Z for UTC
            'updated_at': self.updated_at.isoformat() + 'Z'
        }

# Crypto Model: Represents the 'cryptocurrencies' table
# Stores information about individual cryptocurrencies.
class Crypto(db.Model):
    __tablename__ = 'cryptocurrencies'

    # Primary Key: Unique identifier for each cryptocurrency
    id = db.Column(db.Integer, primary_key=True)

    # Name: Full name of the cryptocurrency (e.g., Bitcoin), must be unique
    name = db.Column(db.String(100), unique=True, nullable=False)

    # Symbol: Abbreviated symbol (e.g., BTC), must be unique
    symbol = db.Column(db.String(10), unique=True, nullable=False)

    # API ID: The identifier used by external crypto APIs (e.g., 'bitcoin' for CoinGecko).
    # This is crucial for fetching live data and should be unique.
    api_id = db.Column(db.String(100), unique=True, nullable=False)

    # Logo URL: URL to the cryptocurrency's logo (optional)
    logo_url = db.Column(db.String(255), nullable=True)

    # Last Updated Price: Cached price for quick access (optional, update periodically)
    last_updated_price = db.Column(db.Float, nullable=True)

    # Last Price Fetch Time: Timestamp of when the cached price was last updated
    last_price_fetch_time = db.Column(db.DateTime, nullable=True)

    # Relationships: Define how this Crypto model relates to other models
    # 'transactions': A crypto can be involved in many transactions.
    transactions = db.relationship('Transaction', backref='crypto', lazy=True)

    # 'portfolio_holdings': A crypto can be held by many users in their portfolios.
    portfolio_holdings = db.relationship('PortfolioHolding', backref='crypto', lazy=True)

    def __repr__(self):
        return f"<Crypto {self.name} ({self.symbol})>"

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'symbol': self.symbol,
            'api_id': self.api_id,
            'logo_url': self.logo_url,
            'last_updated_price': self.last_updated_price,
            'last_price_fetch_time': self.last_price_fetch_time.isoformat() + 'Z' if self.last_price_fetch_time else None
        }

# Transaction Model: Represents the 'transactions' table
# Records every buy or sell action made by a user.
class Transaction(db.Model):
    __tablename__ = 'transactions'

    # Primary Key: Unique identifier for each transaction
    id = db.Column(db.Integer, primary_key=True)

    # Foreign Key to User: Links this transaction to the user who made it
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Foreign Key to Crypto: Links this transaction to the cryptocurrency involved
    crypto_id = db.Column(db.Integer, db.ForeignKey('cryptocurrencies.id'), nullable=False)

    # Transaction Type: 'buy' or 'sell'
    transaction_type = db.Column(db.String(10), nullable=False)

    # Quantity: Amount of cryptocurrency bought or sold
    quantity = db.Column(db.Float, nullable=False)

    # Price Per Coin: The price of one coin (in fiat) at the time of the transaction.
    # Crucial for calculating cost basis and P&L.
    price_per_coin = db.Column(db.Float, nullable=False)

    # Fiat Value: Total value of the transaction in fiat (quantity * price_per_coin)
    fiat_value = db.Column(db.Float, nullable=False)

    # Transaction Date: Timestamp of when the transaction occurred
    transaction_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Notes: Optional field for user notes about the transaction
    notes = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return (f"<Transaction ID: {self.id}, User: {self.user_id}, "
                f"Crypto: {self.crypto_id}, Type: {self.transaction_type}, "
                f"Qty: {self.quantity}, Price: {self.price_per_coin}>")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'crypto_id': self.crypto_id,
            'transaction_type': self.transaction_type,
            'quantity': self.quantity,
            'price_per_coin': self.price_per_coin,
            'fiat_value': self.fiat_value,
            'transaction_date': self.transaction_date.isoformat() + 'Z',
            'notes': self.notes,
            # Include related object details if they exist and are loaded
            'crypto_symbol': self.crypto.symbol if hasattr(self, 'crypto') and self.crypto else None,
            'crypto_name': self.crypto.name if hasattr(self, 'crypto') and self.crypto else None,
            'username': self.user.username if hasattr(self, 'user') and self.user else None, # Assuming 'user' backref exists
        }


# PortfolioHolding Model: Represents the 'portfolio_holdings' table
# Stores a user's current aggregated holdings for each cryptocurrency.
# This table is typically updated after each relevant transaction.
class PortfolioHolding(db.Model):
    __tablename__ = 'portfolio_holdings'

    # Primary Key: Unique identifier for each portfolio holding entry
    id = db.Column(db.Integer, primary_key=True)

    # Foreign Key to User: Links this holding to a specific user
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Foreign Key to Crypto: Links this holding to a specific cryptocurrency
    crypto_id = db.Column(db.Integer, db.ForeignKey('cryptocurrencies.id'), nullable=False)

    # Quantity: The total current amount of this cryptocurrency the user holds
    quantity = db.Column(db.Float, nullable=False)

    # Average Buy Price: The average price (in fiat) at which the user acquired this quantity.
    # This is essential for accurate Profit & Loss calculation.
    average_buy_price = db.Column(db.Float, nullable=False) # <--- Changed from cost_basis

    # Last Updated Timestamp: Automatically updated whenever the holding is modified
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False) # <--- Changed from last_updated_date

    # Composite Unique Constraint:
    # Ensures that a user can only have ONE entry for a specific cryptocurrency in their portfolio.
    # This prevents duplicate holdings for the same crypto by the same user.
    __table_args__ = (
        db.UniqueConstraint('user_id', 'crypto_id', name='_user_crypto_uc'),
    )

    def __repr__(self):
        return (f"<PortfolioHolding User:{self.user_id}, Crypto:{self.crypto_id}, "
                f"Qty:{self.quantity}, AvgPrice:{self.average_buy_price}>")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'crypto_id': self.crypto_id,
            'quantity': self.quantity,
            'average_buy_price': self.average_buy_price, # <--- Changed from cost_basis
            'last_updated': self.last_updated.isoformat() + 'Z', # <--- Changed from last_updated_date + 'Z'
            # Include related object details if they exist and are loaded via lazy loading
            'crypto_symbol': self.crypto.symbol if hasattr(self, 'crypto') and self.crypto else None,
            'crypto_name': self.crypto.name if hasattr(self, 'crypto') and self.crypto else None,
            'crypto_logo_url': self.crypto.logo_url if hasattr(self, 'crypto') and self.crypto else None,
            'username': self.user.username if hasattr(self, 'user') and self.user else None, # Assuming 'user' backref exists
        }

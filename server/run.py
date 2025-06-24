# server/run.py (Excerpt)
from app import create_app, db # Ensure 'db' is imported here

app = create_app()

if __name__ == '__main__':
    with app.app_context(): # Essential for database operations outside request context
        # This line will inspect your models and try to create tables.
        # If tables already exist, it typically does nothing unless forced.
        db.create_all()
        print("Database tables checked/created.")
    app.run(debug=True)
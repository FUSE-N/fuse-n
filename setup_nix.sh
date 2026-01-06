#!/bin/bash

echo "Setting up Nix environment for Fuse-IN..."

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install packages
echo "Installing Python packages..."
pip install Flask==2.3.3
pip install gunicorn==21.2.0
pip install python-dotenv==1.0.0
pip install Flask-Mail==0.9.1
pip install flask-bcrypt==1.0.1
pip install supabase
pip install stripe==7.7.0
pip install paystack

# Verify installation
echo "Verifying installation..."
python3 -c "import flask; print(f'✓ Flask {flask.__version__} installed')"
python3 -c "import supabase; print('✓ Supabase installed')"
python3 -c "import stripe; print('✓ Stripe installed')"
python3 -c "import paystack; print('✓ Paystack installed')"

echo "✅ Setup complete!"
echo ""
echo "To activate the virtual environment: source venv/bin/activate"
echo "To run the Flask app: python3 app.py"

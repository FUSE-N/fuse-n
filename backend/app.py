# backend/app.py
import os
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_mail import Mail, Message
from dotenv import load_dotenv
import sys

# Add the parent directory to Python path so we can import modules from root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

# Get the absolute path to the project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates')
STATIC_DIR = os.path.join(BASE_DIR, 'static')

print(f"📁 Project root: {BASE_DIR}")
print(f"📁 Templates directory: {TEMPLATES_DIR}")
print(f"📁 Static directory: {STATIC_DIR}")

# Check if directories exist
if not os.path.exists(TEMPLATES_DIR):
    print(f"⚠️  Warning: Templates directory does not exist: {TEMPLATES_DIR}")
    print("Creating templates directory...")
    os.makedirs(TEMPLATES_DIR, exist_ok=True)
    
if not os.path.exists(STATIC_DIR):
    print(f"⚠️  Warning: Static directory does not exist: {STATIC_DIR}")

# List files in templates directory
print(f"📂 Files in templates directory: {os.listdir(TEMPLATES_DIR) if os.path.exists(TEMPLATES_DIR) else 'Directory not found'}")

app = Flask(__name__,
            template_folder=TEMPLATES_DIR,
            static_folder=STATIC_DIR)

app.secret_key = os.getenv('APP_SECRET_KEY', 'dev-secret-key')

# Configure mail if credentials exist
if os.getenv('MAIL_USERNAME') and os.getenv('MAIL_PASSWORD'):
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    mail = Mail(app)
else:
    mail = None
    print("⚠️  Email not configured. Set MAIL_USERNAME and MAIL_PASSWORD environment variables.")

@app.route('/')
def home():
    print(f"🔍 Rendering index.html from: {TEMPLATES_DIR}")
    try:
        return render_template('index.html')
    except Exception as e:
        return f"Error loading template: {str(e)}", 500

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/start-project')
def start_project():
    return render_template('start-project.html')

@app.route('/messages')
def messages():
    return render_template('messages.html')

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'service': 'Fuse-IN API',
        'template_dir': TEMPLATES_DIR,
        'static_dir': STATIC_DIR
    })

@app.route('/api/debug')
def debug():
    """Debug endpoint to check file structure"""
    import glob
    
    return jsonify({
        'current_dir': os.getcwd(),
        'base_dir': BASE_DIR,
        'templates_dir': TEMPLATES_DIR,
        'static_dir': STATIC_DIR,
        'templates_exist': os.path.exists(TEMPLATES_DIR),
        'templates_files': os.listdir(TEMPLATES_DIR) if os.path.exists(TEMPLATES_DIR) else [],
        'static_exist': os.path.exists(STATIC_DIR),
        'static_files': os.listdir(STATIC_DIR) if os.path.exists(STATIC_DIR) else [],
        'all_html_files': glob.glob(os.path.join(BASE_DIR, '**/*.html'), recursive=True)
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Starting Flask application on port {port}")
    print(f"🌐 Access at: http://localhost:{port}")
    print(f"🔍 Debug info at: http://localhost:{port}/api/debug")
    app.run(host='0.0.0.0', port=port, debug=True)

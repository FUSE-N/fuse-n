import webbrowser
import os
import sys
from backend.app import app

PORT = 5501

def run_server():
    # Ensure we are serving from the script's directory (project root)
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print(f"Starting Flask server at http://localhost:{PORT}")
    print("=" * 50)
    print("Important URLs:")
    print(f"1. Login: http://localhost:{PORT}/login")
    print(f"2. Dashboard: http://localhost:{PORT}/dashboard")
    print(f"3. Home: http://localhost:{PORT}/")
    print("=" * 50)
    print("\nPress Ctrl+C to stop the server.")
    
    # Open the browser to the login page
    webbrowser.open(f"http://localhost:{PORT}/login")
    
    try:
        app.run(host="0.0.0.0", port=PORT, debug=True)
    except KeyboardInterrupt:
        print("\nStopping server...")
        sys.exit(0)

if __name__ == "__main__":
    run_server()

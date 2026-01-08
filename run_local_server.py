import http.server
import socketserver
import webbrowser
import os
import sys
from urllib.parse import urlparse, parse_qs

PORT = 8080

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for OAuth
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        # Custom logging to see requests
        print(f"{self.address_string()} - [{self.log_date_time_string()}] {format % args}")

def run_server():
    # Ensure we are serving from the script's directory (project root)
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        print("=" * 50)
        print("Important OAuth URLs:")
        print(f"1. Login: http://localhost:{PORT}/templates/login.html")
        print(f"2. Callback: http://localhost:{PORT}/templates/oauth_consent.html")
        print(f"3. Dashboard: http://localhost:{PORT}/templates/dashboard.html")
        print("=" * 50)
        print("\nPress Ctrl+C to stop the server.")
        
        # Open the browser to the login page directly
        webbrowser.open(f"http://localhost:{PORT}/templates/login.html")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopping server...")
            httpd.shutdown()
            sys.exit(0)

if __name__ == "__main__":
    run_server()

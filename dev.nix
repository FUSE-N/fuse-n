{ pkgs }:
pkgs.mkShell {
  buildInputs = with pkgs; [
    # Python and packages
    python311
    python311Packages.flask
    python311Packages.gunicorn
    python311Packages.python-dotenv
    python311Packages.flask-mail
    python311Packages.flask-bcrypt
    python311Packages.supabase
    python311Packages.stripe
    python311Packages.paystack
    
    # System tools
    nodejs
    wget
    curl
  ];
  
  shellHook = ''
    echo "Python environment ready!"
    echo "Python version: $(python3 --version)"
    echo "Flask version: $(python3 -c 'import flask; print(flask.__version__)')"
  '';
}

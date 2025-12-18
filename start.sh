#!/bin/bash

# 3D Print Quote Generator - Start Script
# This script tries multiple methods to serve the app
# If no server is found, it will attempt to install Python or Node.js

PORT=8000
DIR="$(cd "$(dirname "$0")" && pwd)"
URL="http://localhost:$PORT"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           3D Print Quote Generator v2.0                   ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Function to open browser
open_browser() {
    sleep 1
    if command -v xdg-open &> /dev/null; then
        xdg-open "$URL" 2>/dev/null &
    elif command -v open &> /dev/null; then
        open "$URL" 2>/dev/null &
    elif command -v gnome-open &> /dev/null; then
        gnome-open "$URL" 2>/dev/null &
    fi
}

# Function to start server with Python 3
start_python3() {
    echo "✓ Starting server with Python 3..."
    echo "  Open your browser at: $URL"
    echo "  Press Ctrl+C to stop the server"
    echo ""
    open_browser
    cd "$DIR" && python3 -m http.server $PORT
    exit 0
}

# Function to install Python
install_python() {
    echo ""
    echo "⚙ No web server found. Attempting to install Python..."
    echo ""
    
    # Detect OS and install Python
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo "  Installing Python via Homebrew..."
            brew install python3 --quiet
            if [ $? -eq 0 ]; then
                echo "✓ Python installed successfully!"
                return 0
            fi
        else
            echo "  Homebrew not found. Installing Homebrew first..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            if command -v brew &> /dev/null; then
                brew install python3 --quiet
                if [ $? -eq 0 ]; then
                    echo "✓ Python installed successfully!"
                    return 0
                fi
            fi
        fi
    elif [[ -f /etc/debian_version ]]; then
        # Debian/Ubuntu
        echo "  Installing Python via apt..."
        sudo apt-get update -qq && sudo apt-get install -y -qq python3
        if [ $? -eq 0 ]; then
            echo "✓ Python installed successfully!"
            return 0
        fi
    elif [[ -f /etc/redhat-release ]]; then
        # RHEL/CentOS/Fedora
        if command -v dnf &> /dev/null; then
            echo "  Installing Python via dnf..."
            sudo dnf install -y -q python3
        else
            echo "  Installing Python via yum..."
            sudo yum install -y -q python3
        fi
        if [ $? -eq 0 ]; then
            echo "✓ Python installed successfully!"
            return 0
        fi
    elif [[ -f /etc/arch-release ]]; then
        # Arch Linux
        echo "  Installing Python via pacman..."
        sudo pacman -S --noconfirm --quiet python
        if [ $? -eq 0 ]; then
            echo "✓ Python installed successfully!"
            return 0
        fi
    elif [[ -f /etc/alpine-release ]]; then
        # Alpine Linux
        echo "  Installing Python via apk..."
        sudo apk add --quiet python3
        if [ $? -eq 0 ]; then
            echo "✓ Python installed successfully!"
            return 0
        fi
    fi
    
    return 1
}

# Try Python 3
if command -v python3 &> /dev/null; then
    start_python3
fi

# Try Python 2
if command -v python &> /dev/null; then
    echo "✓ Starting server with Python..."
    echo "  Open your browser at: $URL"
    echo "  Press Ctrl+C to stop the server"
    echo ""
    open_browser
    cd "$DIR" && python -m SimpleHTTPServer $PORT
    exit 0
fi

# Try Node.js with npx
if command -v npx &> /dev/null; then
    echo "✓ Starting server with Node.js (npx http-server)..."
    echo "  Open your browser at: $URL"
    echo "  Press Ctrl+C to stop the server"
    echo ""
    open_browser
    cd "$DIR" && npx --yes http-server -p $PORT -c-1
    exit 0
fi

# Try PHP
if command -v php &> /dev/null; then
    echo "✓ Starting server with PHP..."
    echo "  Open your browser at: $URL"
    echo "  Press Ctrl+C to stop the server"
    echo ""
    open_browser
    cd "$DIR" && php -S localhost:$PORT
    exit 0
fi

# Try Ruby
if command -v ruby &> /dev/null; then
    echo "✓ Starting server with Ruby..."
    echo "  Open your browser at: $URL"
    echo "  Press Ctrl+C to stop the server"
    echo ""
    open_browser
    cd "$DIR" && ruby -run -ehttpd . -p$PORT
    exit 0
fi

# No server found - try to install Python
if install_python; then
    # Refresh PATH and try again
    hash -r
    if command -v python3 &> /dev/null; then
        start_python3
    fi
fi

# Fallback: Open directly in browser (limited functionality)
echo ""
echo "⚠ Could not install a web server automatically."
echo ""
echo "Opening the app directly in your browser..."
echo "Note: File auto-save feature requires a web server."
echo ""
echo "To install manually, run one of these:"
echo "  • macOS:  brew install python3"
echo "  • Ubuntu: sudo apt install python3"
echo "  • Fedora: sudo dnf install python3"
echo ""

if command -v xdg-open &> /dev/null; then
    xdg-open "$DIR/index.html"
elif command -v open &> /dev/null; then
    open "$DIR/index.html"
elif command -v gnome-open &> /dev/null; then
    gnome-open "$DIR/index.html"
else
    echo "Please open this file manually in your browser:"
    echo "  $DIR/index.html"
fi

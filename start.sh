#!/bin/bash

# 3D Print Quote Generator - Start Script
# This script tries multiple methods to serve the app

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

# Try Python 3
if command -v python3 &> /dev/null; then
    echo "✓ Starting server with Python 3..."
    echo "  Open your browser at: $URL"
    echo "  Press Ctrl+C to stop the server"
    echo ""
    open_browser
    cd "$DIR" && python3 -m http.server $PORT
    exit 0
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

# Fallback: Open directly in browser (limited functionality)
echo "⚠ No web server found (Python, Node.js, PHP, or Ruby)."
echo ""
echo "Opening the app directly in your browser..."
echo "Note: File auto-save feature requires a web server."
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


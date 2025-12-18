@echo off
setlocal enabledelayedexpansion

REM 3D Print Quote Generator - Start Script (Windows)
REM This script tries multiple methods to serve the app
REM If no server is found, it will attempt to install Python

set PORT=8000
set URL=http://localhost:%PORT%
set DIR=%~dp0

echo ===============================================================
echo            3D Print Quote Generator v2.0
echo ===============================================================
echo.

REM Try Python 3
where python3 >nul 2>nul
if %errorlevel%==0 (
    echo [OK] Starting server with Python 3...
    echo      Open your browser at: %URL%
    echo      Press Ctrl+C to stop the server
    echo.
    start "" %URL%
    cd /d "%DIR%"
    python3 -m http.server %PORT%
    goto :end
)

REM Try Python (might be Python 3 on some systems)
where python >nul 2>nul
if %errorlevel%==0 (
    REM Check if it's Python 3
    python --version 2>&1 | findstr /C:"Python 3" >nul
    if %errorlevel%==0 (
        echo [OK] Starting server with Python...
        echo      Open your browser at: %URL%
        echo      Press Ctrl+C to stop the server
        echo.
        start "" %URL%
        cd /d "%DIR%"
        python -m http.server %PORT%
        goto :end
    ) else (
        echo [OK] Starting server with Python 2...
        echo      Open your browser at: %URL%
        echo      Press Ctrl+C to stop the server
        echo.
        start "" %URL%
        cd /d "%DIR%"
        python -m SimpleHTTPServer %PORT%
        goto :end
    )
)

REM Try Node.js with npx
where npx >nul 2>nul
if %errorlevel%==0 (
    echo [OK] Starting server with Node.js (npx http-server)...
    echo      Open your browser at: %URL%
    echo      Press Ctrl+C to stop the server
    echo.
    start "" %URL%
    cd /d "%DIR%"
    npx --yes http-server -p %PORT% -c-1
    goto :end
)

REM Try PHP
where php >nul 2>nul
if %errorlevel%==0 (
    echo [OK] Starting server with PHP...
    echo      Open your browser at: %URL%
    echo      Press Ctrl+C to stop the server
    echo.
    start "" %URL%
    cd /d "%DIR%"
    php -S localhost:%PORT%
    goto :end
)

REM No server found - try to install Python
echo.
echo [!] No web server found. Attempting to install Python...
echo.

REM Try winget (Windows 10/11 built-in package manager)
where winget >nul 2>nul
if %errorlevel%==0 (
    echo     Installing Python via winget (Windows Package Manager)...
    winget install Python.Python.3.12 --silent --accept-package-agreements --accept-source-agreements
    if %errorlevel%==0 (
        echo.
        echo [OK] Python installed successfully!
        echo     Please restart this script to use Python.
        echo.
        pause
        goto :end
    )
)

REM Try chocolatey
where choco >nul 2>nul
if %errorlevel%==0 (
    echo     Installing Python via Chocolatey...
    choco install python3 -y --no-progress
    if %errorlevel%==0 (
        echo.
        echo [OK] Python installed successfully!
        echo     Please restart this script to use Python.
        echo.
        pause
        goto :end
    )
)

REM Try scoop
where scoop >nul 2>nul
if %errorlevel%==0 (
    echo     Installing Python via Scoop...
    scoop install python
    if %errorlevel%==0 (
        echo.
        echo [OK] Python installed successfully!
        echo     Please restart this script to use Python.
        echo.
        pause
        goto :end
    )
)

REM Fallback: Open directly in browser (limited functionality)
echo.
echo [!] Could not install a web server automatically.
echo.
echo     Opening the app directly in your browser...
echo     Note: File auto-save feature requires a web server.
echo.
echo     To install Python manually:
echo       1. Go to https://www.python.org/downloads/
echo       2. Download and install Python 3
echo       3. Make sure to check "Add Python to PATH"
echo       4. Run this script again
echo.
echo     Or install via command line:
echo       - winget install Python.Python.3.12
echo       - choco install python3
echo.
start "" "%DIR%index.html"

:end
endlocal

@echo off
setlocal enabledelayedexpansion

REM 3D Print Quote Generator - Start Script (Windows)
REM This script tries multiple methods to serve the app

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

REM Fallback: Open directly in browser (limited functionality)
echo [!] No web server found (Python, Node.js, or PHP).
echo.
echo Opening the app directly in your browser...
echo Note: File auto-save feature requires a web server.
echo.
start "" "%DIR%index.html"

:end
endlocal


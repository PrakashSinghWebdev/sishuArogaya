@echo off
echo.
echo ========================================
echo   Shishu Arogaya - Development Start
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed:
node --version

echo.
echo Checking MongoDB...
echo [INFO] Make sure MongoDB is running on localhost:27017
echo.

REM Start the server in a new window
echo Starting Backend Server (Port 5000)...
echo.
start "Shishu Arogaya - Backend Server" cmd /k "cd server && npm run dev"

REM Wait a bit for server to start
timeout /t 3 /nobreak

REM Start the client in a new window
echo Starting Frontend Client (Port 5175)...
echo.
start "Shishu Arogaya - Frontend Client" cmd /k "cd client && npm run dev"

echo.
echo ========================================
echo   Servers Starting...
echo ========================================
echo.
echo Backend Server:  http://localhost:5000
echo Frontend Client: http://localhost:5175
echo.
echo Login with demo credentials:
echo   Parent: parent@sishu.gov.in / Parent@123
echo   ASHA:   asha@sishu.gov.in / Asha@123
echo   Admin:  admin@sishu.gov.in / Admin@123
echo.
pause

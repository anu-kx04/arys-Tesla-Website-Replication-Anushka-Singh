@echo off
echo ===================================================
echo      TESLA CLONE - ONE-CLICK FIX & START
echo ===================================================
echo.
echo 1. Killing old processes to free up ports...
taskkill /F /IM node.exe >nul 2>&1
echo Done.

echo.
echo 2. Setting up Backend (Server)...
cd server
echo Installing server dependencies...
call npm install
if %errorlevel% neq 0 (
    echo FAILED to install server dependencies.
    pause
    exit /b
)
echo Starting Server on Port 5001...
start "Tesla Backend" cmd /k "npm run dev"
cd ..

echo.
echo 3. Setting up Frontend (Client)...
cd client
echo Starting Client...
start "Tesla Frontend" cmd /k "npm start"
cd ..

echo.
echo ===================================================
echo      ALL SYSTEMS GO! 
echo ===================================================
echo Backend is running in a new window.
echo Frontend is running in a new window.
echo.
echo Please wait for the browser to open...
pause

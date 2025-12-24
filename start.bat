@echo off
echo Starting OpenAlgo Flow...
echo.

:: Start Backend with uv
echo Starting Backend...
cd backend
start "OpenAlgo Flow Backend" cmd /k "uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
cd ..

:: Wait for backend to start
timeout /t 3 /nobreak > nul

:: Start Frontend
echo Starting Frontend...
cd frontend
start "OpenAlgo Flow Frontend" cmd /k "npm run dev"
cd ..

echo.
echo OpenAlgo Flow is starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to open the app in browser...
pause > nul
start http://localhost:5173

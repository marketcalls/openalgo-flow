@echo off
echo Setting up OpenAlgo Flow...
echo.

:: Check if uv is installed
where uv >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing uv...
    powershell -ExecutionPolicy ByPass -Command "irm https://astral.sh/uv/install.ps1 | iex"
    echo Please restart your terminal and run setup.bat again.
    pause
    exit /b 1
)

:: Setup Backend
echo.
echo Setting up Backend with uv...
cd backend
uv sync
cd ..

echo.

:: Setup Frontend
echo Installing Frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo Setup complete!
echo Run 'start.bat' to launch OpenAlgo Flow
pause

#!/bin/bash
echo "Setting up OpenAlgo Flow..."
echo ""

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    echo "Please restart your terminal and run setup.sh again."
    exit 1
fi

# Setup Backend
echo ""
echo "Setting up Backend with uv..."
cd backend
uv sync
cd ..

echo ""

# Setup Frontend
echo "Installing Frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "Setup complete!"
echo "Run './start.sh' to launch OpenAlgo Flow"

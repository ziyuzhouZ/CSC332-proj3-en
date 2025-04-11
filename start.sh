#!/bin/bash

echo "====== Starting Simple Login/Registration System ======"
echo "Checking system environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js not found, please install Node.js first"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm not found, please install npm first"
    exit 1
fi

echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# Ensure script has execution permission
chmod +x start.sh

echo "Installing dependencies..."
npm install

# Check if dependencies installed successfully
if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies"
    exit 1
fi

echo "Starting server..."
node server.js

# If server failed to start
if [ $? -ne 0 ]; then
    echo "Error: Server failed to start"
    exit 1
fi 
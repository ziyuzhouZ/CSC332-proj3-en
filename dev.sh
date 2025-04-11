#!/bin/bash

# Ensure script stops on error
set -e

echo "Starting development server..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python3 is required"
    exit 1
fi

# Create necessary directories (if they don't exist)
mkdir -p public/images/{products,banners,icons}
mkdir -p public/fonts

# Start Python HTTP server
echo "Server started at http://localhost:8000"
python3 -m http.server 8000 --directory src 
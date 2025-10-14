#!/bin/bash

# Setup MeTTa environment for Darma agents

set -e

echo "🔧 Setting up MeTTa environment..."

cd agents

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python -m venv venv
fi

source venv/bin/activate

echo "Installing MeTTa and dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Verify MeTTa installation
python -c "import metta_language; print('✅ MeTTa installed successfully')" || {
    echo "❌ MeTTa installation failed"
    exit 1
}

echo "Loading MeTTa credit rules..."
if [ -f "config/metta_rules.metta" ]; then
    echo "✅ MeTTa rules loaded"
else
    echo "❌ MeTTa rules file not found"
    exit 1
fi

echo "✅ MeTTa environment setup completed!"
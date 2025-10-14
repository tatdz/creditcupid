#!/bin/bash

# Deploy Darma Agents to Fetch.ai Agentverse

set -e

echo "🚀 Deploying Darma Agents to Agentverse..."

cd agents

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Python virtual environment not found. Run setup first."
    exit 1
fi

source venv/bin/activate

# Check if Agentverse API key is set
if [ -z "$AGENTVERSE_API_KEY" ]; then
    echo "❌ AGENTVERSE_API_KEY environment variable not set"
    echo "Please set your Agentverse API key:"
    echo "export AGENTVERSE_API_KEY=your_api_key_here"
    exit 1
fi

echo "📦 Deploying agents to Agentverse..."
python agentverse_deploy.py

echo "✅ Agent deployment completed!"
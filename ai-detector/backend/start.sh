#!/usr/bin/env bash
# Beta-AI Backend - Quick Start Script

set -e

echo "🚀 Beta-AI Backend - Quick Start"
echo "=================================="

cd ai-detector/backend

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "✅ Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -q -r requirements.txt

# Create .env if not exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your Supabase credentials!"
fi

# Run the application
echo "🚀 Starting Beta-AI Backend..."
echo "📍 API available at: http://localhost:8001"
echo "📖 Docs available at: http://localhost:8001/docs"
echo ""
python run.py

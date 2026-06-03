@echo off
REM Beta-AI Backend - Quick Start Script for Windows

setlocal enabledelayedexpansion

echo 🚀 Beta-AI Backend - Quick Start
echo ==================================

cd ai-detector\backend

REM Create virtual environment if not exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo ✅ Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📚 Installing dependencies...
pip install -q -r requirements.txt

REM Create .env if not exists
if not exist ".env" (
    echo ⚙️  Creating .env file...
    copy .env.example .env
    echo ⚠️  Please update .env with your Supabase credentials!
)

REM Run the application
echo 🚀 Starting Beta-AI Backend...
echo 📍 API available at: http://localhost:8001
echo 📖 Docs available at: http://localhost:8001/docs
echo.
python run.py

pause

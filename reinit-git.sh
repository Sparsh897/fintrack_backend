#!/bin/bash

echo "🔄 Reinitializing Git repository for Fintrack Backend..."

# Navigate to server directory
cd "$(dirname "$0")"

# Remove existing Git repository
echo "📁 Removing existing .git directory..."
rm -rf .git

# Initialize new Git repository
echo "🆕 Initializing new Git repository..."
git init

# Set default branch to main
git branch -M main

# Add all files (respecting .gitignore)
echo "📝 Adding files (respecting .gitignore)..."
git add .

# Show what will be committed
echo "📋 Files to be committed:"
git status --short

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Fintrack Backend API

Features:
- MongoDB with Mongoose ODM
- JWT Authentication with mobile OTP
- Express.js REST API
- TypeScript support
- Security middleware (Helmet, CORS, Rate limiting)
- Production-ready configuration
- Comprehensive error handling
- Health check endpoints

API Endpoints:
- Authentication: /api/auth/*
- Transactions: /api/transactions
- Investments: /api/investments  
- Goals: /api/goals
- Health: /health"

echo "✅ Git repository reinitialized successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Add remote repository:"
echo "   git remote add origin https://github.com/yourusername/fintrack-backend.git"
echo ""
echo "2. Push to remote:"
echo "   git push -u origin main"
echo ""
echo "3. Verify ignored files:"
echo "   git status --ignored"

# Show final status
echo ""
echo "📊 Repository status:"
git log --oneline
echo ""
git status
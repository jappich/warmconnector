#!/bin/bash

# WarmConnector GitHub Push Script
echo "🚀 Pushing WarmConnector to GitHub..."

# Clean up any lock files
echo "Cleaning up Git lock files..."
rm -f .git/index.lock .git/config.lock 2>/dev/null

# Add remote origin
echo "Adding GitHub repository as remote..."
git remote add origin https://github.com/jappich/warmconnector.git 2>/dev/null || echo "Remote origin already exists"

# Set main branch
echo "Setting main branch..."
git branch -M main

# Stage all files
echo "Staging all files..."
git add .

# Commit changes
echo "Committing changes..."
git commit -m "feat: Complete WarmConnector open access platform

- Add AI-powered professional networking platform
- Implement modern dashboard with cosmic theme
- Configure open access mode (no authentication required)
- Add comprehensive API endpoints (50+ routes)
- Include multi-database architecture (PostgreSQL, MongoDB, Neo4j)
- Build production-ready deployment configuration
- Add complete documentation and setup guides"

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main

echo "✅ Done! Check your repository at: https://github.com/jappich/warmconnector"
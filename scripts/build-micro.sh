#!/bin/bash

echo "🏗️ Building for t2.micro (1GB RAM)..."

# Set minimal memory allocation
export NODE_OPTIONS="--max-old-space-size=512"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf .next
rm -rf out

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile --prefer-offline

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
pnpm prisma generate

# Build with minimal memory
echo "🏗️ Building application (512MB limit)..."
NODE_OPTIONS="--max-old-space-size=512" pnpm build

# Check if build was successful
if [ -d ".next" ]; then
    echo "✅ Build successful!"
    
    # Copy static files for standalone mode
    echo "📁 Copying static files for standalone mode..."
    if [ -d ".next/static" ]; then
        cp -r .next/static .next/standalone/.next/
        echo "✅ Static files copied successfully"
    else
        echo "⚠️ Warning: .next/static directory not found"
    fi
    
    if [ -d "public" ]; then
        cp -r public .next/standalone/
        echo "✅ Public files copied successfully"
    else
        echo "⚠️ Warning: public directory not found"
    fi
    
    echo "🚀 Build completed successfully!"
else
    echo "❌ Build failed! Check the logs above."
    exit 1
fi 
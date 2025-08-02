#!/bin/bash

echo "🏗️ Building with increased memory allocation..."

# Set Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=1024"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf .next
rm -rf out

# Install dependencies if needed
echo "📦 Checking dependencies..."
pnpm install --frozen-lockfile

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
pnpm prisma generate

# Build with increased memory
echo "🏗️ Building application..."
NODE_OPTIONS="--max-old-space-size=1024" pnpm build

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
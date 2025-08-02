#!/bin/bash

echo "🏗️ Building for t2.micro (ULTRA AGGRESSIVE - 256MB RAM)..."

# Set ultra-minimal memory allocation
export NODE_OPTIONS="--max-old-space-size=256"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf .next
rm -rf out

# Install dependencies with minimal memory
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile --prefer-offline --no-optional

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
pnpm prisma generate

# Build with ultra-minimal memory and optimizations
echo "🏗️ Building application (256MB limit + optimizations)..."
export NODE_OPTIONS="--max-old-space-size=256"
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production

# Try building with minimal features
pnpm build --no-lint

# Check if build was successful (more thorough check)
if [ -d ".next" ] && [ -d ".next/standalone" ] && [ -f ".next/standalone/server.js" ]; then
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
    echo "Expected files:"
    echo "  - .next directory: $([ -d ".next" ] && echo "✅" || echo "❌")"
    echo "  - .next/standalone: $([ -d ".next/standalone" ] && echo "✅" || echo "❌")"
    echo "  - server.js: $([ -f ".next/standalone/server.js" ] && echo "✅" || echo "❌")"
    exit 1
fi 
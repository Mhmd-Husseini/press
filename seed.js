/**
 * This script runs the Prisma seed to populate the database with initial data.
 * It creates:
 * - Default permissions
 * - Default roles (SUPER_ADMIN, ADMIN, EDITOR, USER)
 * - Super admin user with email: superadmin@gmail.com, password: superadmin@gmail.com
 */

const { execSync } = require('child_process');

console.log('📦 Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

console.log('\n🔄 Running database migrations...');
execSync('npx prisma migrate dev', { stdio: 'inherit' });

console.log('\n🌱 Seeding database...');
execSync('npx prisma db seed', { stdio: 'inherit' });

console.log('\n✅ Setup complete!');
console.log('\n👤 Super Admin Credentials:');
console.log('   Email: superadmin@gmail.com');
console.log('   Password: superadmin@gmail.com'); 
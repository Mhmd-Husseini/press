#!/usr/bin/env node

/**
 * This is a simplified script to seed the database with essential data:
 * - Default permissions
 * - Default roles (SUPER_ADMIN, ADMIN, EDITOR, USER)
 * - Super admin user with email: superadmin@gmail.com, password: superadmin@gmail.com
 */

const { execSync } = require('child_process');

try {
  console.log('🌱 Seeding database...');
  execSync('npx prisma db seed', { stdio: 'inherit' });
  
  console.log('\n✅ Database seeded successfully!');
  console.log('\n👤 Super Admin Credentials:');
  console.log('   Email: superadmin@gmail.com');
  console.log('   Password: superadmin@gmail.com');
} catch (error) {
  console.error('❌ Error seeding database:', error.message);
  process.exit(1);
} 
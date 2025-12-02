/**
 * Script to create the first super admin user
 * 
 * Usage:
 * 1. Get your Supabase User ID from Supabase Dashboard > Authentication > Users
 * 2. Run: npx tsx scripts/create-super-admin.ts
 */

import { PrismaClient } from '../prisma/generated/client';

async function main() {
  const prisma = new PrismaClient();

  try {
    // CONFIGURE THIS: Replace with your actual Supabase user ID
    const SUPABASE_USER_ID = process.env.SUPER_ADMIN_SUPABASE_ID || 'YOUR_SUPABASE_USER_ID_HERE';
    const EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@yourdomain.com';
    const FIRST_NAME = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
    const LAST_NAME = process.env.SUPER_ADMIN_LAST_NAME || 'Admin';

    if (SUPABASE_USER_ID === 'YOUR_SUPABASE_USER_ID_HERE') {
      console.error('❌ ERROR: Please set your Supabase user ID in the script or environment variable');
      console.log('\n📝 How to find your Supabase User ID:');
      console.log('1. Go to Supabase Dashboard');
      console.log('2. Navigate to Authentication > Users');
      console.log('3. Click on your user');
      console.log('4. Copy the UUID from the "ID" field');
      console.log('\n💡 Then run:');
      console.log('   $env:SUPER_ADMIN_SUPABASE_ID="your-uuid-here"; npx tsx scripts/create-super-admin.ts');
      process.exit(1);
    }

    // Check if super admin already exists
    const existing = await prisma.superAdmin.findUnique({
      where: { supabaseUserId: SUPABASE_USER_ID },
    });

    if (existing) {
      console.log('⚠️  Super admin already exists:', existing);
      console.log('✅ You can login with this account');
      return;
    }

    // Create super admin
    const superAdmin = await prisma.superAdmin.create({
      data: {
        supabaseUserId: SUPABASE_USER_ID,
        email: EMAIL,
        firstName: FIRST_NAME,
        lastName: LAST_NAME,
        isActive: true,
      },
    });

    console.log('✅ Created super admin successfully!');
    console.log('\n📋 Super Admin Details:');
    console.log('   ID:', superAdmin.id);
    console.log('   Email:', superAdmin.email);
    console.log('   Name:', `${superAdmin.firstName} ${superAdmin.lastName}`);
    console.log('   Supabase User ID:', superAdmin.supabaseUserId);
    console.log('\n🚀 You can now login to /super-admin using your Supabase credentials');
    console.log('   (Use the same email/password you use for regular login)');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

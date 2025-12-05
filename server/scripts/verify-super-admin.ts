import { PrismaClient } from '../prisma/generated/client';

const prisma = new PrismaClient();

async function verifySuperAdmin() {
  const supabaseUserId = '5da86572-7b52-4397-a65d-e03638214d4a';
  
  console.log(`🔍 Checking super admin with Supabase ID: ${supabaseUserId}\n`);

  // Check users table
  const user = await prisma.user.findUnique({
    where: { supabaseUserId },
  });

  console.log('📋 Users table:');
  if (user) {
    console.log(`  ✅ Found user: ${user.email}`);
    console.log(`     ID: ${user.id}`);
    console.log(`     Tenant ID: ${user.tenantId}`);
    console.log(`     Role: ${user.role}`);
  } else {
    console.log(`  ❌ No user found with Supabase ID: ${supabaseUserId}`);
  }

  // Check super_admins table
  const superAdmin = await prisma.superAdmin.findUnique({
    where: { supabaseUserId },
  });

  console.log('\n📋 Super Admins table:');
  if (superAdmin) {
    console.log(`  ✅ Found super admin: ${superAdmin.email}`);
    console.log(`     ID: ${superAdmin.id}`);
    console.log(`     Is Active: ${superAdmin.isActive}`);
    console.log(`     Last Login: ${superAdmin.lastLoginAt}`);
  } else {
    console.log(`  ❌ No super admin found with Supabase ID: ${supabaseUserId}`);
  }

  console.log('\n' + '='.repeat(50));
  
  if (user && superAdmin && user.tenantId === null && superAdmin.isActive) {
    console.log('✅ Super admin setup is CORRECT!');
    console.log('✅ User has no tenant (tenantId = null)');
    console.log('✅ Super admin is active');
    console.log('\nThe backend should work. Check:');
    console.log('1. Are you logged in with the same email in Supabase?');
    console.log('2. Try clearing browser cookies and logging in again');
  } else {
    console.log('❌ Super admin setup has issues:');
    if (!user) console.log('   - User not found in users table');
    if (!superAdmin) console.log('   - Super admin not found in super_admins table');
    if (user && user.tenantId !== null) console.log(`   - User has tenantId: ${user.tenantId} (should be null)`);
    if (superAdmin && !superAdmin.isActive) console.log('   - Super admin is not active');
  }

  await prisma.$disconnect();
}

verifySuperAdmin().catch(console.error);

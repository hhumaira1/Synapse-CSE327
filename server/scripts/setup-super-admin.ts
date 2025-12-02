import { PrismaClient } from '../prisma/generated/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

async function setupSuperAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide email: npm run setup-super-admin <email>');
    process.exit(1);
  }

  console.log(`🔍 Setting up super admin for: ${email}`);

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Find Supabase user by email
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    if (!usersData) {
      throw new Error('No users data returned from Supabase');
    }

    const supabaseUser = usersData.users.find((u: any) => u.email === email);

    if (!supabaseUser) {
      console.error(`❌ No Supabase user found with email: ${email}`);
      console.log('Available users:');
      usersData.users.forEach((u: any) => console.log(`  - ${u.email} (${u.id})`));
      process.exit(1);
    }

    console.log(`✅ Found Supabase user: ${supabaseUser.email}`);
    console.log(`   Supabase ID: ${supabaseUser.id}`);

    // Check if user exists in users table
    let user = await prisma.user.findUnique({
      where: { supabaseUserId: supabaseUser.id },
    });

    if (!user) {
      console.log('⚠️  User not found in users table, creating...');
      user = await prisma.user.create({
        data: {
          supabaseUserId: supabaseUser.id,
          email: supabaseUser.email!,
          firstName: supabaseUser.user_metadata?.firstName || 'Super',
          lastName: supabaseUser.user_metadata?.lastName || 'Admin',
          tenantId: null, // Super admins don't belong to a tenant
          role: 'ADMIN',
          isActive: true,
        },
      });
      console.log(`✅ Created user in users table: ${user.id}`);
    } else {
      console.log(`✅ User exists in users table: ${user.id}`);
      
      // Make sure tenantId is null for super admins
      if (user.tenantId !== null) {
        console.log('⚠️  Setting tenantId to null for super admin...');
        await prisma.user.update({
          where: { id: user.id },
          data: { tenantId: null },
        });
      }
    }

    // Check if super admin entry exists
    let superAdmin = await prisma.superAdmin.findUnique({
      where: { supabaseUserId: supabaseUser.id },
    });

    if (!superAdmin) {
      console.log('⚠️  Super admin entry not found, creating...');
      superAdmin = await prisma.superAdmin.create({
        data: {
          supabaseUserId: supabaseUser.id,
          email: supabaseUser.email!,
          firstName: supabaseUser.user_metadata?.firstName || 'Super',
          lastName: supabaseUser.user_metadata?.lastName || 'Admin',
          isActive: true,
        },
      });
      console.log(`✅ Created super admin: ${superAdmin.id}`);
    } else {
      console.log(`✅ Super admin exists: ${superAdmin.id}`);
      
      // Ensure it's active
      if (!superAdmin.isActive) {
        console.log('⚠️  Activating super admin...');
        await prisma.superAdmin.update({
          where: { id: superAdmin.id },
          data: { isActive: true },
        });
      }
    }

    console.log('\n🎉 Super admin setup complete!');
    console.log(`   Email: ${email}`);
    console.log(`   Supabase ID: ${supabaseUser.id}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Super Admin ID: ${superAdmin.id}`);
    console.log('\n✅ You can now login as super admin!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupSuperAdmin();

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '../prisma/generated/client';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const prisma = new PrismaClient();

async function backfillUserNames() {
  console.log('🔄 Starting user name/avatar backfill...\n');

  try {
    // Get all users from database
    const dbUsers = await prisma.user.findMany({
      select: {
        id: true,
        supabaseUserId: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    console.log(`Found ${dbUsers.length} users in database\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const dbUser of dbUsers) {
      try {
        // Get Supabase user data
        const { data: supabaseUser, error } = await supabase.auth.admin.getUserById(
          dbUser.supabaseUserId,
        );

        if (error || !supabaseUser) {
          console.log(`⚠️  User ${dbUser.email}: Supabase user not found`);
          errorCount++;
          continue;
        }

        const metadata = supabaseUser.user.user_metadata;
        const googleName = metadata?.full_name || metadata?.name;
        const googleAvatar = metadata?.avatar_url || metadata?.picture;

        // Check if update needed
        const needsUpdate =
          (!dbUser.name && googleName) ||
          (!dbUser.avatarUrl && googleAvatar) ||
          (!dbUser.firstName && googleName);

        if (!needsUpdate) {
          console.log(`✓ User ${dbUser.email}: Already has data, skipping`);
          skippedCount++;
          continue;
        }

        // Parse name if we have it from Google
        let firstName = dbUser.firstName;
        let lastName = dbUser.lastName;

        if (googleName && !firstName) {
          const nameParts = googleName.split(' ');
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        }

        // Update user
        await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            name: googleName || dbUser.name,
            firstName: firstName || dbUser.firstName,
            lastName: lastName || dbUser.lastName,
            avatarUrl: googleAvatar || dbUser.avatarUrl,
          },
        });

        console.log(
          `✅ User ${dbUser.email}: Updated with ${googleName ? 'name' : ''} ${googleAvatar ? 'avatar' : ''}`,
        );
        updatedCount++;
      } catch (error) {
        console.error(`❌ Error updating user ${dbUser.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Backfill Summary:');
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Total: ${dbUsers.length}`);
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run backfill
backfillUserNames()
  .then(() => {
    console.log('\n✅ Backfill completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Backfill failed:', error);
    process.exit(1);
  });

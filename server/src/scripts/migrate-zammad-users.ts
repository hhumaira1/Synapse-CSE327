import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma/prisma.service';
import { ZammadIdentityService } from '../zammad/services/zammad-identity.service';

/**
 * Migration Script: Create Zammad Agent Accounts for Existing Users
 * 
 * ✨ UPDATED: Uses ZammadIdentityService for dual-role support
 * - Handles same email as agent + customer in different tenants
 * - Stores zammadUserId and zammadEmail for SSO
 * - Respects user roles (ADMIN, MANAGER, MEMBER)
 * 
 * Usage:
 *   npm run migrate:zammad-users
 */
async function bootstrap() {
    console.log('🚀 Starting Zammad User Migration (with SSO)...\n');

    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);
    const zammadIdentity = app.get(ZammadIdentityService);

    try {
        // Get all users with their tenants
        const users = await prisma.user.findMany({
            include: {
                tenant: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        console.log(`📊 Found ${users.length} users in database\n`);

        let created = 0;
        let skipped = 0;
        let failed = 0;
        let adminCount = 0;
        let managerCount = 0;
        let memberCount = 0;

        for (const user of users) {
            console.log(`\n📋 Processing user: ${user.email} (Tenant: ${user.tenant.name}, Role: ${user.role})`);

            // Skip if already has Zammad account
            if (user.zammadUserId) {
                console.log(`   ⏭️  SKIPPED - Already has Zammad account (ID: ${user.zammadUserId})`);
                skipped++;
                continue;
            }

            try {
                // Use ZammadIdentityService for dual-role support
                const zammadAccount = await zammadIdentity.getOrCreateAgentAccount(
                    user.email,
                    user.firstName || 'User',
                    user.lastName || '',
                    user.tenantId,
                    user.role,  // Pass CRM role for proper Zammad role mapping
                );

                // Update user with Zammad info for SSO
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        zammadUserId: zammadAccount.zammadUserId.toString(),
                        zammadEmail: zammadAccount.zammadEmail,
                    },
                });

                const roleInfo = user.role === 'ADMIN' ? 'Agent+Admin' : 'Agent';
                console.log(`   ✅ SUCCESS - ${roleInfo} account created (Zammad ID: ${zammadAccount.zammadUserId})`);
                console.log(`   📧 Email: ${zammadAccount.zammadEmail}`);
                console.log(`   🔑 SSO enabled for this user`);
                created++;

                // Track role counts
                if (user.role === 'ADMIN') adminCount++;
                else if (user.role === 'MANAGER') managerCount++;
                else if (user.role === 'MEMBER') memberCount++;
            } catch (error) {
                console.error(`   ❌ FAILED - ${error.message}`);
                failed++;
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Created:  ${created}`);
        console.log(`   👑 ADMINs:    ${adminCount} (Agent+Admin access)`);
        console.log(`   👔 MANAGERs:  ${managerCount} (Agent access)`);
        console.log(`   👤 MEMBERs:   ${memberCount} (Agent access)`);
        console.log(`⏭️  Skipped:  ${skipped}`);
        console.log(`❌ Failed:   ${failed}`);
        console.log(`📋 Total:    ${users.length}`);
        console.log('='.repeat(60) + '\n');

        if (failed > 0) {
            console.warn('⚠️  Some agent accounts failed to create. Check errors above.');
        } else if (created > 0) {
            console.log('🎉 All agent accounts created successfully!');
            console.log('\n📧 Users will receive password reset emails from Zammad.');
            console.log('\n🎭 Role Mapping:');
            console.log('   ADMIN (CRM)   → Agent + Admin (Zammad) - Full access');
            console.log('   MANAGER (CRM) → Agent (Zammad) - Manage tickets');
            console.log('   MEMBER (CRM)  → Agent (Zammad) - Work on tickets');
        } else {
            console.log('ℹ️  No new agent accounts needed.');
        }

    } catch (error) {
        console.error('\n❌ Migration failed', error);
        process.exit(1);
    } finally {
        await app.close();
        console.log('\n✨ Migration complete!\n');
    }
}

bootstrap();

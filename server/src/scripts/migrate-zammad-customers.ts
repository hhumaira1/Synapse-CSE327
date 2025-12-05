import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma/prisma.service';
import { ZammadIdentityService } from '../zammad/services/zammad-identity.service';

/**
 * Migration Script: Create Zammad Customer Accounts for Portal Users
 * 
 * ✨ UPDATED: Uses ZammadIdentityService for dual-role support
 * - Handles same email as agent + customer in different tenants
 * - Stores zammadUserId and zammadEmail for SSO
 * - Creates "Customer" role accounts (read-only portal access)
 * 
 * Usage:
 *   npm run migrate:zammad-customers
 */
async function bootstrap() {
    console.log('🚀 Starting Zammad Customer Migration (with SSO)...\n');

    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);
    const zammadIdentity = app.get(ZammadIdentityService);

    try {
        // Get all portal customers with their tenants
        const portalCustomers = await prisma.portalCustomer.findMany({
            where: {
                isActive: true,  // Only active customers
            },
            include: {
                tenant: true,
                contact: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        console.log(`📊 Found ${portalCustomers.length} portal customers\n`);

        let created = 0;
        let skipped = 0;
        let failed = 0;

        for (const customer of portalCustomers) {
            console.log(`\n📋 Processing customer: ${customer.email} (Tenant: ${customer.tenant.name})`);

            // Skip if already has Zammad account
            if (customer.zammadUserId) {
                console.log(`   ⏭️  SKIPPED - Already has Zammad account (ID: ${customer.zammadUserId})`);
                skipped++;
                continue;
            }

            try {
                // Use ZammadIdentityService for dual-role support
                const zammadAccount = await zammadIdentity.getOrCreateCustomerAccount(
                    customer.email,
                    customer.name?.split(' ')[0] || 'Customer',
                    customer.name?.split(' ').slice(1).join(' ') || '',
                    customer.tenantId,
                );

                // Update portal customer with Zammad info for SSO
                await prisma.portalCustomer.update({
                    where: { id: customer.id },
                    data: {
                        zammadUserId: zammadAccount.zammadUserId.toString(),
                        zammadEmail: zammadAccount.zammadEmail,
                    },
                });

                console.log(`   ✅ SUCCESS - Customer account created (Zammad ID: ${zammadAccount.zammadUserId})`);
                console.log(`   📧 Email: ${zammadAccount.zammadEmail}`);
                console.log(`   🔑 SSO enabled for this customer`);
                created++;
            } catch (error) {
                console.error(`   ❌ FAILED - ${error.message}`);
                failed++;
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Created:  ${created} customer accounts`);
        console.log(`⏭️  Skipped:  ${skipped}`);
        console.log(`❌ Failed:   ${failed}`);
        console.log(`📋 Total:    ${portalCustomers.length}`);
        console.log('='.repeat(60) + '\n');

        if (failed > 0) {
            console.warn('⚠️  Some customer accounts failed to create. Check errors above.');
        } else if (created > 0) {
            console.log('🎉 All customer accounts created successfully!');
            console.log('\n👥 Account Type: Customer (Read-only portal access)');
            console.log('🎫 Can: Submit tickets, view own tickets, add comments');
            console.log('❌ Cannot: View other customers\' tickets, access admin features');
        } else {
            console.log('ℹ️  No new customer accounts needed.');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await app.close();
        console.log('\n✨ Migration complete!\n');
    }
}

bootstrap();

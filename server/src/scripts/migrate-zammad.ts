import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma/prisma.service';
import { ZammadService } from '../zammad/services/zammad.service';

/**
 * Migration Script: Provision Zammad Organizations for Existing Tenants
 * 
 * Run this script to create Zammad organizations for all tenants
 * that don't have a Zammad integration yet.
 * 
 * Usage:
 *   npm run migrate:zammad
 */
async function bootstrap() {
    console.log('🚀 Starting Zammad Migration...\n');

    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);
    const zammadService = app.get(ZammadService);

    try {
        // Get all tenants
        const tenants = await prisma.tenant.findMany({
            orderBy: { createdAt: 'asc' },
        });

        console.log(`📊 Found ${tenants.length} tenants in database\n`);

        let created = 0;
        let skipped = 0;
        let failed = 0;

        for (const tenant of tenants) {
            console.log(`\n📋 Processing tenant: ${tenant.name} (${tenant.id})`);

            // Check if integration already exists
            const existingIntegration = await prisma.integration.findUnique({
                where: {
                    tenantId_serviceName: {
                        tenantId: tenant.id,
                        serviceName: 'zammad',
                    },
                },
            });

            if (existingIntegration) {
                console.log(`   ⏭️  SKIPPED - Integration already exists`);
                skipped++;
                continue;
            }

            // Create Zammad organization for this tenant
            try {
                const integration = await zammadService.createOrganizationForTenant(tenant);
                console.log(`   ✅ SUCCESS - Organization created (Zammad ID: ${integration.config.organizationId})`);
                console.log(`   🔗 Portal URL: ${integration.config.customerPortalUrl}`);
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
        console.log(`✅ Created:  ${created}`);
        console.log(`⏭️  Skipped:  ${skipped}`);
        console.log(`❌ Failed:   ${failed}`);
        console.log(`📋 Total:    ${tenants.length}`);
        console.log('='.repeat(60) + '\n');

        if (failed > 0) {
            console.warn('⚠️  Some organizations failed to create. Check errors above.');
        } else if (created > 0) {
            console.log('🎉 All organizations created successfully!');
        } else {
            console.log('ℹ️  No new organizations needed.');
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

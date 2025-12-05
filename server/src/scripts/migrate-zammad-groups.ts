import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma/prisma.service';
import { ZammadApiService } from '../zammad/services/zammad-api.service';

/**
 * Migration Script: Create Zammad Groups for Existing Organizations
 * 
 * Run this to create groups for tenants that already have
 * Zammad organizations but no groups.
 * 
 * Usage:
 *   npm run migrate:zammad-groups
 */
async function bootstrap() {
    console.log('🚀 Starting Zammad Groups Migration...\n');

    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);
    const zammadApi = app.get(ZammadApiService);

    try {
        // Get all Zammad integrations
        const integrations = await prisma.integration.findMany({
            where: {
                serviceName: 'zammad',
            },
            include: {
                tenant: true,
            },
        });

        console.log(`📊 Found ${integrations.length} Zammad integrations\n`);

        let created = 0;
        let skipped = 0;
        let failed = 0;

        for (const integration of integrations) {
            const config = integration.config as any;

            console.log(`\n📋 Processing tenant: ${integration.tenant.name}`);

            // Check if group already exists
            if (config.groupId) {
                console.log(`   ⏭️  SKIPPED - Group already exists (ID: ${config.groupId})`);
                skipped++;
                continue;
            }

            try {
                // Create group in Zammad
                const groupName = `${integration.tenant.name} - Support`;
                const groupResponse = await zammadApi['axiosInstance'].post('/api/v1/groups', {
                    name: groupName,
                    active: true,
                    note: `Auto-created for tenant: ${integration.tenant.name}`,
                });

                const groupId = groupResponse.data.id;

                // Update integration with group info
                await prisma.integration.update({
                    where: { id: integration.id },
                    data: {
                        config: {
                            ...config,
                            groupId: groupId,
                            groupName: groupName,
                        },
                    },
                });

                console.log(`   ✅ SUCCESS - Group created: ${groupName} (ID: ${groupId})`);
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
        console.log(`📋 Total:    ${integrations.length}`);
        console.log('='.repeat(60) + '\n');

        if (failed > 0) {
            console.warn('⚠️  Some groups failed to create. Check errors above.');
        } else if (created > 0) {
            console.log('🎉 All groups created successfully!');
            console.log('\n📝 Next step: Run user migration to assign users to groups:');
            console.log('   npm run migrate:zammad-users');
        } else {
            console.log('ℹ️  All tenants already have groups.');
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

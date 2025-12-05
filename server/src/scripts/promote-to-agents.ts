import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ZammadApiService } from '../zammad/services/zammad-api.service';

/**
 * Script: Promote Customer Users to Agent Role
 * 
 * Upgrades existing Customer role users to Agent+Admin
 * Use when a user needs to be both customer and staff member
 * 
 * Usage:
 *   npm run promote:zammad-agents
 */
async function bootstrap() {
    console.log('🚀 Promoting Customers to Agents...\n');

    const app = await NestFactory.createApplicationContext(AppModule);
    const zammadApi = app.get(ZammadApiService);

    // List of emails to promote
    const emailsToPromote = [
        'iftikherazam@gmail.com',
        'iftikherazamcolab2@gmail.com',
        'iftikherazam9@gmail.com',
        // Add more as needed
    ];

    try {
        for (const email of emailsToPromote) {
            console.log(`\n📋 Processing: ${email}`);

            try {
                // Search for user
                const searchResponse = await zammadApi['axiosInstance'].get('/api/v1/users/search', {
                    params: { query: email },
                });

                if (!searchResponse.data || searchResponse.data.length === 0) {
                    console.log(`   ⏭️  SKIPPED - User not found in Zammad`);
                    continue;
                }

                const user = searchResponse.data[0];

                // Check current roles
                const currentRoles = user.role_ids || [];
                console.log(`   Current roles: ${user.roles?.join(', ') || 'None'}`);

                // Update to Agent + Admin
                await zammadApi['axiosInstance'].put(`/api/v1/users/${user.id}`, {
                    roles: ['Agent', 'Admin'],  // Promote to Agent+Admin
                });

                console.log(`   ✅ SUCCESS - Promoted to Agent+Admin`);
            } catch (error) {
                console.error(`   ❌ FAILED - ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✨ Promotion complete!');
        console.log('='.repeat(60));
        console.log('\n🔍 Verify in Zammad:');
        console.log('   1. Go to Manage → Users');
        console.log('   2. Filter by "Agent" role');
        console.log('   3. Verify users have Agent+Admin access\n');

    } catch (error) {
        console.error('\n❌ Failed:', error);
        process.exit(1);
    } finally {
        await app.close();
    }
}

bootstrap();

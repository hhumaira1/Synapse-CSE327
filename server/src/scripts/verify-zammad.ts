import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma/prisma.service';
import { ZammadApiService } from '../zammad/services/zammad-api.service';

/**
 * Verification Script: Check Zammad Integration Status
 *
 * Verifies:
 * - Zammad connection
 * - Organization setup for each tenant
 * - User accounts in Zammad
 * - SSO configuration (zammadUserId stored)
 *
 * Usage:
 *   npm run verify:zammad
 */
async function bootstrap() {
  console.log('🔍 Starting Zammad Integration Verification...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const zammadApi = app.get(ZammadApiService);

  try {
    // 1. Check Zammad connection
    console.log('1️⃣  Testing Zammad Connection...');
    const isConnected = await zammadApi.testConnection();
    if (isConnected) {
      console.log('   ✅ Zammad is reachable and configured\n');
    } else {
      console.error('   ❌ Cannot connect to Zammad');
      console.log('\n💡 Check:');
      console.log(
        '   - Is Zammad running? (docker ps or http://localhost:8080)',
      );
      console.log('   - Is ZAMMAD_URL correct in .env?');
      console.log('   - Is ZAMMAD_API_TOKEN valid?\n');
      process.exit(1);
    }

    // 2. Check tenants and integrations
    console.log('2️⃣  Checking Tenant Organizations...');
    const tenants = await prisma.tenant.findMany({
      include: {
        integrations: {
          where: { serviceName: 'zammad' },
        },
      },
    });

    console.log(`   Found ${tenants.length} tenants\n`);

    const tenantsWithZammad = tenants.filter((t) => t.integrations.length > 0);
    const tenantsWithoutZammad = tenants.filter(
      (t) => t.integrations.length === 0,
    );

    if (tenantsWithZammad.length > 0) {
      console.log(
        `   ✅ ${tenantsWithZammad.length} tenants have Zammad integration:`,
      );
      for (const tenant of tenantsWithZammad) {
        const config = tenant.integrations[0].config as any;
        console.log(
          `      - ${tenant.name} (Org ID: ${config.organizationId})`,
        );
      }
      console.log();
    }

    if (tenantsWithoutZammad.length > 0) {
      console.log(
        `   ⚠️  ${tenantsWithoutZammad.length} tenants missing Zammad integration:`,
      );
      for (const tenant of tenantsWithoutZammad) {
        console.log(`      - ${tenant.name} (ID: ${tenant.id})`);
      }
      console.log('\n   💡 Run: npm run migrate:zammad\n');
    }

    // 3. Check CRM users
    console.log('3️⃣  Checking CRM User Accounts...');
    const users = await prisma.user.findMany({
      include: { tenant: true },
    });

    const usersWithZammad = users.filter((u) => u.zammadUserId);
    const usersWithoutZammad = users.filter((u) => !u.zammadUserId);

    console.log(`   Total CRM users: ${users.length}`);
    console.log(`   ✅ With Zammad SSO: ${usersWithZammad.length}`);
    console.log(`   ⚠️  Without Zammad SSO: ${usersWithoutZammad.length}`);

    if (usersWithZammad.length > 0) {
      console.log('\n   Users with SSO enabled:');
      for (const user of usersWithZammad.slice(0, 5)) {
        console.log(
          `      - ${user.email} (${user.tenant.name}) → Zammad ID: ${user.zammadUserId}`,
        );
      }
      if (usersWithZammad.length > 5) {
        console.log(`      ... and ${usersWithZammad.length - 5} more`);
      }
    }

    if (usersWithoutZammad.length > 0) {
      console.log('\n   ⚠️  Users missing Zammad accounts:');
      for (const user of usersWithoutZammad.slice(0, 5)) {
        console.log(
          `      - ${user.email} (${user.tenant.name}, Role: ${user.role})`,
        );
      }
      if (usersWithoutZammad.length > 5) {
        console.log(`      ... and ${usersWithoutZammad.length - 5} more`);
      }
      console.log('\n   💡 Run: npm run migrate:zammad-users\n');
    }

    // 4. Check portal customers
    console.log('4️⃣  Checking Portal Customer Accounts...');
    const customers = await prisma.portalCustomer.findMany({
      where: { isActive: true },
      include: { tenant: true },
    });

    const customersWithZammad = customers.filter((c) => c.zammadUserId);
    const customersWithoutZammad = customers.filter((c) => !c.zammadUserId);

    console.log(`   Total portal customers: ${customers.length}`);
    console.log(`   ✅ With Zammad SSO: ${customersWithZammad.length}`);
    console.log(`   ⚠️  Without Zammad SSO: ${customersWithoutZammad.length}`);

    if (customersWithZammad.length > 0) {
      console.log('\n   Customers with SSO enabled:');
      for (const customer of customersWithZammad.slice(0, 5)) {
        console.log(
          `      - ${customer.email} (${customer.tenant.name}) → Zammad ID: ${customer.zammadUserId}`,
        );
      }
      if (customersWithZammad.length > 5) {
        console.log(`      ... and ${customersWithZammad.length - 5} more`);
      }
    }

    if (customersWithoutZammad.length > 0) {
      console.log('\n   ⚠️  Customers missing Zammad accounts:');
      for (const customer of customersWithoutZammad.slice(0, 5)) {
        console.log(`      - ${customer.email} (${customer.tenant.name})`);
      }
      if (customersWithoutZammad.length > 5) {
        console.log(`      ... and ${customersWithoutZammad.length - 5} more`);
      }
      console.log('\n   💡 Run: npm run migrate:zammad-customers\n');
    }

    // 5. Check for dual-role users (same email as agent + customer)
    console.log('5️⃣  Checking for Dual-Role Users...');
    const allEmails = [
      ...users.map((u) => u.email.toLowerCase()),
      ...customers.map((c) => c.email.toLowerCase()),
    ];
    const emailCounts = allEmails.reduce(
      (acc, email) => {
        acc[email] = (acc[email] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const dualRoleEmails = Object.entries(emailCounts)
      .filter(([_, count]) => count > 1)
      .map(([email]) => email);

    if (dualRoleEmails.length > 0) {
      console.log(
        `   🎭 Found ${dualRoleEmails.length} email(s) with dual roles:`,
      );
      for (const email of dualRoleEmails.slice(0, 5)) {
        const userRoles: string[] = [];
        const user = users.find((u) => u.email.toLowerCase() === email);
        if (user) userRoles.push(`Agent in ${user.tenant.name}`);

        const customer = customers.find((c) => c.email.toLowerCase() === email);
        if (customer) userRoles.push(`Customer in ${customer.tenant.name}`);

        console.log(`      - ${email}`);
        console.log(`        ${userRoles.join(' + ')}`);
      }
      if (dualRoleEmails.length > 5) {
        console.log(`      ... and ${dualRoleEmails.length - 5} more`);
      }
      console.log('\n   ✅ Dual-role support is handled automatically!');
    } else {
      console.log('   ℹ️  No dual-role users found');
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(
      `Zammad Connection:     ${isConnected ? '✅ OK' : '❌ FAILED'}`,
    );
    console.log(
      `Tenants with Orgs:     ${tenantsWithZammad.length}/${tenants.length}`,
    );
    console.log(
      `Users with SSO:        ${usersWithZammad.length}/${users.length}`,
    );
    console.log(
      `Customers with SSO:    ${customersWithZammad.length}/${customers.length}`,
    );
    console.log(`Dual-Role Users:       ${dualRoleEmails.length}`);
    console.log('='.repeat(60));

    const allGood =
      isConnected &&
      tenantsWithoutZammad.length === 0 &&
      usersWithoutZammad.length === 0 &&
      customersWithoutZammad.length === 0;

    if (allGood) {
      console.log(
        '\n🎉 All systems operational! Zammad integration fully configured.\n',
      );
    } else {
      console.log('\n⚠️  Action required:');
      if (tenantsWithoutZammad.length > 0) {
        console.log('   1. Run: npm run migrate:zammad');
      }
      if (usersWithoutZammad.length > 0) {
        console.log('   2. Run: npm run migrate:zammad-users');
      }
      if (customersWithoutZammad.length > 0) {
        console.log('   3. Run: npm run migrate:zammad-customers');
      }
      console.log();
    }
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();

import { PrismaClient } from 'prisma/generated/client';

const prisma = new PrismaClient();

async function seedContacts() {
  try {
    // First, let's get a tenant to add contacts to
    const tenant = await prisma.tenant.findFirst();

    if (!tenant) {
      console.log('No tenant found. Please create a tenant first.');
      return;
    }

    console.log(`Adding contacts to tenant: ${tenant.name}`);

    // Create sample contacts
    const contacts = await Promise.all([
      prisma.contact.create({
        data: {
          tenantId: tenant.id,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1 (555) 123-4567',
          company: 'Example Corp',
          jobTitle: 'CEO',
          notes:
            'Potential high-value client. Interested in enterprise solutions.',
        },
      }),
      prisma.contact.create({
        data: {
          tenantId: tenant.id,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@techstart.com',
          phone: '+1 (555) 987-6543',
          company: 'TechStart Inc',
          jobTitle: 'CTO',
          notes: 'Technical decision maker. Prefers detailed documentation.',
        },
      }),
      prisma.contact.create({
        data: {
          tenantId: tenant.id,
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike@globalcorp.com',
          phone: '+1 (555) 555-0123',
          company: 'Global Corp',
          jobTitle: 'VP of Operations',
          notes:
            'Budget owner for operations. Looking for cost-effective solutions.',
        },
      }),
      prisma.contact.create({
        data: {
          tenantId: tenant.id,
          firstName: 'Sarah',
          lastName: 'Wilson',
          email: 'sarah.wilson@innovate.co',
          company: 'Innovate Co',
          jobTitle: 'Product Manager',
          notes: 'Early adopter. Values innovation and cutting-edge features.',
        },
      }),
      prisma.contact.create({
        data: {
          tenantId: tenant.id,
          firstName: 'David',
          lastName: 'Brown',
          email: 'david.brown@enterprise.org',
          phone: '+1 (555) 888-9999',
          company: 'Enterprise Solutions',
          jobTitle: 'IT Director',
          notes: 'Security-focused. Requires compliance documentation.',
        },
      }),
    ]);

    console.log(`Created ${contacts.length} sample contacts:`);
    contacts.forEach((contact) => {
      console.log(
        `- ${contact.firstName} ${contact.lastName} (${contact.email})`,
      );
    });
  } catch (error) {
    console.error('Error seeding contacts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedContacts();

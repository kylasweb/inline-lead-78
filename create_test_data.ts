import { db } from './src/lib/db';

async function main() {
  // Create a new Lead
  const newLead = await db.lead.create({
    name: 'Test Lead',
    email: 'testlead@example.com',
  });
  console.log('Created lead:', newLead);

  // Create a new Staff member
  const newStaff = await db.staff.create({
    name: 'Test Staff',
    email: 'teststaff@example.com',
    role: 'Manager',
  });
  console.log('Created staff:', newStaff);

  // Create a new Opportunity
  const newOpportunity = await db.opportunity.create({
    title: 'Test Opportunity',
    amount: 1000,
    leadId: newLead.id, // Associate with the created lead
  });
  console.log('Created opportunity:', newOpportunity);
}

main();
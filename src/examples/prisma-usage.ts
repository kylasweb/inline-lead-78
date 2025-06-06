/**
 * Example usage of Prisma ORM integration for the CRM application
 * 
 * This file demonstrates how to use the database utilities created in src/lib/db.ts
 * These examples can be integrated into your React components or API routes.
 */

import { db, testConnection, disconnectDb } from '../lib/db';

// Example: Initialize and test database connection
export async function initializeDatabase() {
  console.log('🔌 Testing database connection...');
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('✅ Database connection successful!');
    return true;
  } else {
    console.error('❌ Database connection failed!');
    return false;
  }
}

// Example: User Management
export async function userExamples() {
  try {
    // Create a new user
    const newUser = await db.user.create({
      email: 'admin@company.com',
      name: 'Admin User',
      role: 'ADMIN'
    });
    console.log('Created user:', newUser);

    // Find user by email
    const user = await db.user.findByEmail('admin@company.com');
    console.log('Found user:', user);

    // Get all users
    const allUsers = await db.user.findMany();
    console.log('All users:', allUsers);

    return newUser;
  } catch (error) {
    console.error('User operation failed:', error);
    throw error;
  }
}

// Example: Lead Management
export async function leadExamples() {
  try {
    // Create a new lead
    const newLead = await db.lead.create({
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+1-555-0123',
      company: 'Tech Corp',
      status: 'NEW'
    });
    console.log('Created lead:', newLead);

    // Get all leads with relationships
    const allLeads = await db.lead.findMany();
    console.log('All leads:', allLeads);

    // Update lead status
    const updatedLead = await db.lead.update(newLead.id, {
      status: 'QUALIFIED'
    });
    console.log('Updated lead:', updatedLead);

    return newLead;
  } catch (error) {
    console.error('Lead operation failed:', error);
    throw error;
  }
}

// Example: Opportunity Management
export async function opportunityExamples(leadId: string) {
  try {
    // Create a new opportunity
    const newOpportunity = await db.opportunity.create({
      title: 'Enterprise Software License',
      amount: 75000,
      stage: 'PROSPECT',
      leadId: leadId
    });
    console.log('Created opportunity:', newOpportunity);

    // Get opportunities for a specific lead
    const leadOpportunities = await db.opportunity.findByLead(leadId);
    console.log('Lead opportunities:', leadOpportunities);

    // Update opportunity stage
    const updatedOpportunity = await db.opportunity.update(newOpportunity.id, {
      stage: 'PROPOSAL',
      amount: 80000
    });
    console.log('Updated opportunity:', updatedOpportunity);

    return newOpportunity;
  } catch (error) {
    console.error('Opportunity operation failed:', error);
    throw error;
  }
}

// Example: Analytics and Reporting
export async function analyticsExamples() {
  try {
    // Get lead statistics by status
    const leadStats = await db.analytics.getLeadsByStatus();
    console.log('Lead statistics by status:', leadStats);

    // Get opportunity statistics by stage
    const opportunityStats = await db.analytics.getOpportunitiesByStage();
    console.log('Opportunity statistics by stage:', opportunityStats);

    // Get total revenue
    const totalRevenue = await db.analytics.getTotalRevenue();
    console.log('Total revenue:', totalRevenue);

    // Get user statistics
    const userStats = await db.analytics.getUserStats();
    console.log('User statistics:', userStats);

    return {
      leadStats,
      opportunityStats,
      totalRevenue,
      userStats
    };
  } catch (error) {
    console.error('Analytics operation failed:', error);
    throw error;
  }
}

// Example: Complete workflow
export async function completeWorkflowExample() {
  try {
    console.log('🚀 Starting complete CRM workflow example...');

    // 1. Initialize database
    await initializeDatabase();

    // 2. Create a user
    const user = await userExamples();

    // 3. Create a lead
    const lead = await leadExamples();

    // 4. Create an opportunity for the lead
    const opportunity = await opportunityExamples(lead.id);

    // 5. Assign the lead to the user
    await db.lead.update(lead.id, {
      assignedTo: user.id
    });

    // 6. Assign the opportunity to the user
    await db.opportunity.update(opportunity.id, {
      assignedTo: user.id
    });

    // 7. Get analytics
    const analytics = await analyticsExamples();

    console.log('✅ Complete workflow example finished successfully!');
    
    return {
      user,
      lead,
      opportunity,
      analytics
    };
  } catch (error) {
    console.error('❌ Workflow example failed:', error);
    throw error;
  } finally {
    // Always disconnect when done
    await disconnectDb();
  }
}

// Export for use in React components
export {
  db,
  testConnection,
  disconnectDb
};

// React Hook Example
export function useDatabaseOperations() {
  const createUser = async (userData: { email: string; name: string; role?: string }) => {
    return await db.user.create(userData);
  };

  const createLead = async (leadData: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    status?: string;
  }) => {
    return await db.lead.create(leadData);
  };

  const createOpportunity = async (opportunityData: {
    title: string;
    amount: number;
    stage?: string;
    leadId: string;
    assignedTo?: string;
  }) => {
    return await db.opportunity.create(opportunityData);
  };

  const getAnalytics = async () => {
    return await analyticsExamples();
  };

  return {
    createUser,
    createLead,
    createOpportunity,
    getAnalytics
  };
}

/**
 * Usage in React Components:
 * 
 * import { useDatabaseOperations } from '../examples/prisma-usage';
 * 
 * function MyComponent() {
 *   const { createUser, createLead, getAnalytics } = useDatabaseOperations();
 *   
 *   const handleCreateUser = async () => {
 *     const user = await createUser({
 *       email: 'user@example.com',
 *       name: 'New User'
 *     });
 *     console.log('Created:', user);
 *   };
 *   
 *   return <button onClick={handleCreateUser}>Create User</button>;
 * }
 */
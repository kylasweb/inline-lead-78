import { PrismaClient } from '@prisma/client'

// Database connection wrapper for Netlify Functions
export const withDatabase = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  try {
    console.log("Connecting to the database...");
    const result = await operation();
    return result;
  } catch (error) {
    console.error('Database operation failed:', error);
    throw error;
  }
};

// Initialize Prisma Client for Netlify Functions
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Database utility functions for Netlify Functions
export const db = {
  // User operations
  user: {
    findMany: () => prisma.user.findMany(),
    findById: (id: string) => prisma.user.findUnique({ where: { id } }),
    findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
    create: (data: { email: string; name: string; role?: string }) => 
      prisma.user.create({ data }),
    update: (id: string, data: { name?: string; role?: string }) => 
      prisma.user.update({ where: { id }, data }),
    delete: (id: string) => prisma.user.delete({ where: { id } }),
  },

  // Lead operations
  lead: {
    findMany: () => prisma.lead.findMany({
      include: { assignedUser: true, opportunities: true }
    }),
    findById: (id: string) => prisma.lead.findUnique({ 
      where: { id },
      include: { assignedUser: true, opportunities: true }
    }),
    create: (data: { 
      name: string; 
      email: string; 
      phone?: string; 
      company?: string; 
      status?: string;
      assignedTo?: string;
    }) => prisma.lead.create({ data }),
    update: (id: string, data: { 
      name?: string; 
      email?: string; 
      phone?: string; 
      company?: string; 
      status?: string;
      assignedTo?: string;
    }) => prisma.lead.update({ where: { id }, data }),
    delete: (id: string) => prisma.lead.delete({ where: { id } }),
  },

  // Opportunity operations
  opportunity: {
    findMany: () => prisma.opportunity.findMany({
      include: { lead: true, assignedUser: true }
    }),
    findById: (id: string) => prisma.opportunity.findUnique({ 
      where: { id },
      include: { lead: true, assignedUser: true }
    }),
    findByLead: (leadId: string) => prisma.opportunity.findMany({
      where: { leadId },
      include: { assignedUser: true }
    }),
    create: (data: { 
      title: string; 
      amount: number; 
      stage?: string;
      leadId: string;
      assignedTo?: string;
    }) => prisma.opportunity.create({ data }),
    update: (id: string, data: { 
      title?: string; 
      amount?: number; 
      stage?: string;
      assignedTo?: string;
    }) => prisma.opportunity.update({ where: { id }, data }),
    delete: (id: string) => prisma.opportunity.delete({ where: { id } }),
  },

  // Staff operations
  staff: {
    findMany: () => prisma.staff.findMany(),
    findById: (id: string) => prisma.staff.findUnique({ where: { id } }),
    findByEmail: (email: string) => prisma.staff.findUnique({ where: { email } }),
    create: (data: {
      email: string;
      name: string;
      role: string;
      department?: string;
      phone?: string;
      status?: string;
    }) => prisma.staff.create({ data }),
    update: (id: string, data: {
      name?: string;
      email?: string;
      role?: string;
      department?: string;
      phone?: string;
      status?: string;
    }) => prisma.staff.update({ where: { id }, data }),
    delete: (id: string) => prisma.staff.delete({ where: { id } }),
  },

  // Analytics and aggregations
  analytics: {
    getLeadsByStatus: () => prisma.lead.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    getOpportunitiesByStage: () => prisma.opportunity.groupBy({
      by: ['stage'],
      _count: { stage: true },
      _sum: { amount: true }
    }),
    getTotalRevenue: () => prisma.opportunity.aggregate({
      _sum: { amount: true }
    }),
    getUserStats: () => prisma.user.findMany({
      include: {
        _count: {
          select: {
            assignedLeads: true,
            assignedOpportunities: true
          }
        }
      }
    }),
  }
};

// Export types for use in functions
export type User = Awaited<ReturnType<typeof db.user.findById>>
export type Lead = Awaited<ReturnType<typeof db.lead.findById>>
export type Opportunity = Awaited<ReturnType<typeof db.opportunity.findById>>
export type Staff = Awaited<ReturnType<typeof db.staff.findById>>

// Connection test function
export async function testConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

// Graceful shutdown
export async function disconnectDb() {
  await prisma.$disconnect()
}
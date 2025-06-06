// Temporary Prisma types until packages are installed
declare module '@prisma/client' {
  export interface PrismaClient {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    user: {
      findMany(args?: any): Promise<User[]>;
      findUnique(args: { where: { id?: string; email?: string } }): Promise<User | null>;
      create(args: { data: any }): Promise<User>;
      update(args: { where: { id: string }; data: any }): Promise<User>;
      delete(args: { where: { id: string } }): Promise<User>;
      groupBy(args: any): Promise<any>;
      aggregate(args: any): Promise<any>;
    };
    lead: {
      findMany(args?: any): Promise<Lead[]>;
      findUnique(args: { where: { id: string }; include?: any }): Promise<Lead | null>;
      create(args: { data: any }): Promise<Lead>;
      update(args: { where: { id: string }; data: any }): Promise<Lead>;
      delete(args: { where: { id: string } }): Promise<Lead>;
      groupBy(args: any): Promise<any>;
    };
    opportunity: {
      findMany(args?: any): Promise<Opportunity[]>;
      findUnique(args: { where: { id: string }; include?: any }): Promise<Opportunity | null>;
      create(args: { data: any }): Promise<Opportunity>;
      update(args: { where: { id: string }; data: any }): Promise<Opportunity>;
      delete(args: { where: { id: string } }): Promise<Opportunity>;
      aggregate(args: any): Promise<any>;
      groupBy(args: any): Promise<any>;
    };
  }

  export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    assignedLeads?: Lead[];
    assignedOpportunities?: Opportunity[];
    _count?: {
      assignedLeads: number;
      assignedOpportunities: number;
    };
  }

  export interface Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    status: string;
    assignedTo?: string;
    createdAt: Date;
    updatedAt: Date;
    assignedUser?: User;
    opportunities?: Opportunity[];
  }

  export interface Opportunity {
    id: string;
    title: string;
    amount: number;
    stage: string;
    leadId: string;
    assignedTo?: string;
    createdAt: Date;
    updatedAt: Date;
    lead?: Lead;
    assignedUser?: User;
  }

  export const PrismaClient: new (options?: any) => PrismaClient;
}
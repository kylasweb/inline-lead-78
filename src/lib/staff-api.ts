// Enhanced API utilities specifically for the StaffManagement component
import { safeFetch, isDevelopment } from '@/lib/safer-api-utils';

// Staff interface matching the component's expectations
export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hireDate: string;
  status: 'active' | 'inactive' | 'on-leave';
  performance: number;
  trainingsCompleted: number;
  location: string;
}

// API staff interface
interface ApiStaffMember {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string | null;
  phone?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Transform API staff data to the local format expected by the component
 */
function transformApiStaffToLocal(apiStaff: ApiStaffMember[]): Staff[] {
  return apiStaff.map((member) => ({
    id: member.id,
    firstName: member.name.split(' ')[0] || '',
    lastName: member.name.split(' ').slice(1).join(' ') || '',
    email: member.email,
    phone: member.phone || '',
    department: member.department || '',
    position: member.role || '',
    hireDate: member.createdAt?.split('T')[0] || '',
    status: member.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
    performance: Math.floor(Math.random() * 40) + 60, // Random performance between 60-100
    trainingsCompleted: Math.floor(Math.random() * 10), // Random training count
    location: 'Main Office' // Default location
  }));
}

/**
 * Transform local staff data to the API format
 */
function transformLocalStaffToApi(staff: Partial<Staff>): Partial<ApiStaffMember> {
  return {
    name: `${staff.firstName} ${staff.lastName}`.trim(),
    email: staff.email,
    phone: staff.phone,
    role: staff.position,
    department: staff.department,
    status: staff.status?.toUpperCase()
  };
}

/**
 * Fetch all staff members with proper error handling
 */
export async function fetchAllStaff(): Promise<Staff[]> {
  const staffEndpoint = isDevelopment ? '/api/staff' : '/.netlify/functions/staff';
  
  try {
    console.log(`Fetching staff from ${staffEndpoint}...`);
    
    const result = await safeFetch<ApiStaffMember[]>(staffEndpoint);
    
    // Handle API errors
    if (!result.success) {
      console.error('API error fetching staff:', result.error);
      throw new Error(result.error || 'Failed to fetch staff data');
    }
    
    // Verify that we have data
    if (!result.data) {
      console.error('No staff data returned');
      throw new Error('No staff data returned from API');
    }
    
    console.log('Staff data fetched successfully');
    return transformApiStaffToLocal(result.data);
  } catch (error) {
    console.error('Error fetching staff:', error);
    
    // In development, return mock data
    if (isDevelopment) {
      console.warn('Using mock staff data as fallback');
      return mockStaffData();
    }
    
    // In production, return empty array to prevent UI errors
    return [];
  }
}

/**
 * Create a new staff member
 */
export async function createStaffMember(staff: Partial<Staff>): Promise<Staff> {
  const staffEndpoint = isDevelopment ? '/api/staff' : '/.netlify/functions/staff';
  
  try {
    const apiStaffData = transformLocalStaffToApi(staff);
    
    console.log(`Creating staff member at ${staffEndpoint}...`, apiStaffData);
    
    const result = await safeFetch<ApiStaffMember>(staffEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiStaffData)
    });
    
    // Handle API errors
    if (!result.success || !result.data) {
      console.error('API error creating staff:', result.error);
      throw new Error(result.error || 'Failed to create staff member');
    }
    
    console.log('Staff created successfully');
    return transformApiStaffToLocal([result.data])[0];
  } catch (error) {
    console.error('Error creating staff member:', error);
    throw error;
  }
}

/**
 * Update an existing staff member
 */
export async function updateStaffMember(id: string, staff: Partial<Staff>): Promise<Staff> {
  const staffEndpoint = isDevelopment ? `/api/staff/${id}` : `/.netlify/functions/staff/${id}`;
  
  try {
    const apiStaffData = transformLocalStaffToApi(staff);
    
    console.log(`Updating staff member at ${staffEndpoint}...`, apiStaffData);
    
    const result = await safeFetch<ApiStaffMember>(staffEndpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiStaffData)
    });
    
    // Handle API errors
    if (!result.success || !result.data) {
      console.error('API error updating staff:', result.error);
      throw new Error(result.error || 'Failed to update staff member');
    }
    
    console.log('Staff updated successfully');
    return transformApiStaffToLocal([result.data])[0];
  } catch (error) {
    console.error('Error updating staff member:', error);
    throw error;
  }
}

/**
 * Delete a staff member
 */
export async function deleteStaffMember(id: string): Promise<void> {
  const staffEndpoint = isDevelopment ? `/api/staff/${id}` : `/.netlify/functions/staff/${id}`;
  
  try {
    console.log(`Deleting staff member at ${staffEndpoint}...`);
    
    const result = await safeFetch<void>(staffEndpoint, {
      method: 'DELETE'
    });
    
    // Handle API errors
    if (!result.success) {
      console.error('API error deleting staff:', result.error);
      throw new Error(result.error || 'Failed to delete staff member');
    }
    
    console.log('Staff deleted successfully');
  } catch (error) {
    console.error('Error deleting staff member:', error);
    throw error;
  }
}

/**
 * Generate mock staff data for development
 */
function mockStaffData(): Staff[] {
  return [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      department: 'Sales',
      position: 'Sales Manager',
      hireDate: '2023-01-15',
      status: 'active',
      performance: 92,
      trainingsCompleted: 8,
      location: 'Main Office'
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1 (555) 987-6543',
      department: 'Marketing',
      position: 'Marketing Director',
      hireDate: '2023-02-20',
      status: 'active',
      performance: 88,
      trainingsCompleted: 6,
      location: 'Main Office'
    },
    {
      id: '3',
      firstName: 'Michael',
      lastName: 'Johnson',
      email: 'michael.johnson@example.com',
      phone: '+1 (555) 234-5678',
      department: 'Sales',
      position: 'Sales Representative',
      hireDate: '2023-03-10',
      status: 'active',
      performance: 78,
      trainingsCompleted: 4,
      location: 'Branch Office'
    },
    {
      id: '4',
      firstName: 'Emily',
      lastName: 'Williams',
      email: 'emily.williams@example.com',
      phone: '+1 (555) 876-5432',
      department: 'Customer Support',
      position: 'Support Specialist',
      hireDate: '2023-04-05',
      status: 'active',
      performance: 85,
      trainingsCompleted: 7,
      location: 'Remote'
    },
    {
      id: '5',
      firstName: 'David',
      lastName: 'Brown',
      email: 'david.brown@example.com',
      phone: '+1 (555) 345-6789',
      department: 'IT',
      position: 'Systems Administrator',
      hireDate: '2023-05-15',
      status: 'inactive',
      performance: 90,
      trainingsCompleted: 9,
      location: 'Main Office'
    }
  ];
}

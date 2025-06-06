
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Staff {
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

// Real API functions
const staffApi = {
  getAll: async (): Promise<Staff[]> => {
    try {
      const response = await fetch('/netlify/functions/staff');
      if (!response.ok) {
        throw new Error('Failed to fetch staff');
      }
      const staff = await response.json();
      
      // Transform API staff to match our interface
      return staff.map((member: any) => ({
        id: member.id,
        firstName: member.name.split(' ')[0] || '',
        lastName: member.name.split(' ').slice(1).join(' ') || '',
        email: member.email,
        phone: member.phone || '',
        department: member.department || '',
        position: member.role || '',
        hireDate: member.createdAt?.split('T')[0] || '',
        status: member.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
        performance: 0, // Default values for client-side fields
        trainingsCompleted: 0,
        location: ''
      }));
    } catch (error) {
      console.error('Error fetching staff:', error);
      return [];
    }
  },
  
  create: async (data: Omit<Staff, 'id'>): Promise<Staff> => {
    try {
      const staffData = {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        role: data.position,
        department: data.department,
        phone: data.phone,
        status: data.status.toUpperCase()
      };
      
      const response = await fetch('/netlify/functions/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(staffData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create staff member');
      }

      const createdStaff = await response.json();
      
      return {
        id: createdStaff.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: createdStaff.email,
        phone: createdStaff.phone || '',
        department: createdStaff.department || '',
        position: createdStaff.role || '',
        hireDate: createdStaff.createdAt?.split('T')[0] || '',
        status: data.status,
        performance: data.performance,
        trainingsCompleted: data.trainingsCompleted,
        location: data.location
      };
    } catch (error) {
      console.error('Error creating staff:', error);
      throw error;
    }
  },
  
  update: async (id: string, data: Partial<Staff>): Promise<Staff> => {
    try {
      const updateData: any = {};
      if (data.firstName || data.lastName) {
        updateData.name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
      }
      if (data.email) updateData.email = data.email;
      if (data.position) updateData.role = data.position;
      if (data.department) updateData.department = data.department;
      if (data.phone) updateData.phone = data.phone;
      if (data.status) updateData.status = data.status.toUpperCase();
      
      const response = await fetch(`/netlify/functions/staff/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update staff member');
      }

      const updatedStaff = await response.json();
      
      return {
        id: updatedStaff.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: updatedStaff.email,
        phone: updatedStaff.phone || '',
        department: updatedStaff.department || '',
        position: updatedStaff.role || '',
        hireDate: data.hireDate || '',
        status: data.status || 'active',
        performance: data.performance || 0,
        trainingsCompleted: data.trainingsCompleted || 0,
        location: data.location || ''
      };
    } catch (error) {
      console.error('Error updating staff:', error);
      throw error;
    }
  },
  
  delete: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/netlify/functions/staff/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
  }
};

export function StaffManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<Omit<Staff, 'id'>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    hireDate: '',
    status: 'active',
    performance: 0,
    trainingsCompleted: 0,
    location: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: staffApi.getAll
  });

  const createMutation = useMutation({
    mutationFn: staffApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: 'Success', description: 'Staff member created successfully' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Staff> }) => staffApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setEditingStaff(null);
      resetForm();
      toast({ title: 'Success', description: 'Staff member updated successfully' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: staffApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({ title: 'Success', description: 'Staff member deleted successfully' });
    }
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      hireDate: '',
      status: 'active',
      performance: 0,
      trainingsCompleted: 0,
      location: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      updateMutation.mutate({ id: editingStaff.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const startEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData(staff);
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || member.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage your team members and track their performance</p>
        </div>
        <Dialog open={isCreateDialogOpen || !!editingStaff} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingStaff(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="neomorphism-button bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="neomorphism-input"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="neomorphism-input"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="neomorphism-input"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="neomorphism-input"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="neomorphism-input"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                    <SelectTrigger className="neomorphism-input">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="neomorphism-input"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="hireDate">Hire Date</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="neomorphism-input"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="performance">Performance Score</Label>
                  <Input
                    id="performance"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.performance}
                    onChange={(e) => setFormData({ ...formData, performance: parseInt(e.target.value) })}
                    className="neomorphism-input"
                  />
                </div>
                <div>
                  <Label htmlFor="trainingsCompleted">Trainings Completed</Label>
                  <Input
                    id="trainingsCompleted"
                    type="number"
                    min="0"
                    value={formData.trainingsCompleted}
                    onChange={(e) => setFormData({ ...formData, trainingsCompleted: parseInt(e.target.value) })}
                    className="neomorphism-input"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'on-leave') => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="neomorphism-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingStaff(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue text-white">
                  {editingStaff ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="neomorphism-card p-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search staff members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neomorphism-input pl-10"
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="neomorphism-input w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <Card key={member.id} className="neomorphism-card hover:shadow-neomorphism-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-gray-800">
                    {member.firstName} {member.lastName}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{member.position}</p>
                </div>
                <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                  {member.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  {member.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {member.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {member.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  Hired: {new Date(member.hireDate).toLocaleDateString()}
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Performance</span>
                  <span className="text-sm font-medium">{member.performance}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue h-2 rounded-full"
                    style={{ width: `${member.performance}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-neomorphism-blue" />
                  <span>{member.trainingsCompleted} trainings</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(member)}
                    className="neomorphism-button"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(member.id)}
                    className="neomorphism-button text-neomorphism-red"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neomorphism-violet mx-auto"></div>
        </div>
      )}
    </div>
  );
}

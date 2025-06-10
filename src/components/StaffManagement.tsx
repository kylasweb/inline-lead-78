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
import { Staff, fetchAllStaff, createStaffMember, updateStaffMember, deleteStaffMember } from '@/lib/staff-api';

export function StaffManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  const { data: staff = [], isLoading, error: staffError } = useQuery({
    queryKey: ['staff'],
    queryFn: fetchAllStaff
  });

  const createMutation = useMutation({
    mutationFn: createStaffMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: 'Success', description: 'Staff member created successfully' });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Failed to create staff member');
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create staff member',
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Staff> }) => updateStaffMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setEditingStaff(null);
      resetForm();
      toast({ title: 'Success', description: 'Staff member updated successfully' });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Failed to update staff member');
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update staff member',
        variant: 'destructive'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStaffMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({ title: 'Success', description: 'Staff member deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to delete staff member',
        variant: 'destructive'
      });
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
            setErrorMessage(null);
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
            
            {/* Display error message if exists */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
                <p className="font-medium">Error</p>
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}
            
            {/* Form content */}
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
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue text-white"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? 
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingStaff ? 'Updating...' : 'Creating...'}
                    </div> : 
                    editingStaff ? 'Update' : 'Create'
                  }
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

      {/* Error state */}
      {staffError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg text-center">
          <p className="font-medium text-lg mb-2">Failed to load staff data</p>
          <p className="text-sm">{staffError instanceof Error ? staffError.message : 'Please try again later'}</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['staff'] })}
            variant="outline" 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading staff data...</p>
        </div>
      )}

      {/* Staff Grid */}
      {!isLoading && !staffError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.length === 0 ? (
            <div className="col-span-3 p-8 text-center bg-gray-50 rounded-xl">
              <p className="text-gray-500">No staff members found matching your criteria</p>
            </div>
          ) : (
            filteredStaff.map((member) => (
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
            ))
          )}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neomorphism-violet mx-auto"></div>
        </div>
      )}
    </div>
  );
}

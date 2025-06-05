
import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Star,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  location: string;
  score: number;
  status: 'new' | 'qualified' | 'contacted' | 'converted';
  source: string;
  lastContact: string;
  value: number;
}

const mockLeads: Lead[] = [
  {
    id: 1,
    name: 'John Martinez',
    email: 'john.martinez@techcorp.com',
    phone: '+1 (555) 123-4567',
    company: 'TechCorp Inc.',
    position: 'CTO',
    location: 'San Francisco, CA',
    score: 85,
    status: 'qualified',
    source: 'Website',
    lastContact: '2024-01-15',
    value: 25000
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 's.johnson@innovatesoft.com',
    phone: '+1 (555) 987-6543',
    company: 'InnovateSoft',
    position: 'VP Engineering',
    location: 'New York, NY',
    score: 92,
    status: 'new',
    source: 'LinkedIn',
    lastContact: '2024-01-14',
    value: 45000
  },
  {
    id: 3,
    name: 'Michael Chen',
    email: 'mchen@datasystems.com',
    phone: '+1 (555) 456-7890',
    company: 'DataSystems Ltd.',
    position: 'IT Director',
    location: 'Austin, TX',
    score: 78,
    status: 'contacted',
    source: 'Referral',
    lastContact: '2024-01-13',
    value: 32000
  },
  {
    id: 4,
    name: 'Emma Wilson',
    email: 'e.wilson@cloudtech.io',
    phone: '+1 (555) 321-0987',
    company: 'CloudTech Solutions',
    position: 'Head of IT',
    location: 'Seattle, WA',
    score: 88,
    status: 'qualified',
    source: 'Email Campaign',
    lastContact: '2024-01-12',
    value: 38000
  }
];

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  qualified: 'bg-green-100 text-green-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  converted: 'bg-purple-100 text-purple-700'
};

export function LeadManagement() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || lead.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Lead Management</h1>
          <p className="text-gray-600 mt-1">Manage and track your sales leads</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue hover:from-neomorphism-blue hover:to-neomorphism-violet text-white px-6 py-2 rounded-xl shadow-neomorphism-sm hover:shadow-neomorphism transition-all duration-200"
        >
          <Plus size={20} className="mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="neomorphism-card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search leads by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 neomorphism-input"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-xl border-0 neomorphism-input text-gray-700 focus:outline-none focus:ring-2 focus:ring-neomorphism-blue"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="qualified">Qualified</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
            </select>
            <Button variant="outline" size="sm" className="neomorphism-button border-0">
              <Filter size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="neomorphism-card p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{leads.length}</p>
            <p className="text-sm text-gray-600">Total Leads</p>
          </div>
        </div>
        <div className="neomorphism-card p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{leads.filter(l => l.status === 'qualified').length}</p>
            <p className="text-sm text-gray-600">Qualified</p>
          </div>
        </div>
        <div className="neomorphism-card p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{leads.filter(l => l.status === 'new').length}</p>
            <p className="text-sm text-gray-600">New Leads</p>
          </div>
        </div>
        <div className="neomorphism-card p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-neomorphism-violet">
              ${leads.reduce((sum, lead) => sum + lead.value, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Value</p>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="neomorphism-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Lead</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Company</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Score</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Value</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Contact</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{lead.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Mail size={12} />
                            {lead.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone size={12} />
                            {lead.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-800">{lead.company}</p>
                      <p className="text-sm text-gray-500">{lead.position}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin size={10} />
                        {lead.location}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Star size={16} className={getScoreColor(lead.score)} fill="currentColor" />
                      <span className={`font-semibold ${getScoreColor(lead.score)}`}>{lead.score}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-gray-800">${lead.value.toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">{lead.lastContact}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="p-2 hover:bg-blue-50 hover:text-neomorphism-blue">
                        <Eye size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-2 hover:bg-violet-50 hover:text-neomorphism-violet">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-2 hover:bg-red-50 hover:text-neomorphism-red">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Users, Shield, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestCredentials = (role: 'admin' | 'manager' | 'user') => {
    const credentials = {
      admin: { email: 'admin@demo.com', password: 'admin123' },
      manager: { email: 'manager@demo.com', password: 'manager123' },
      user: { email: 'user@demo.com', password: 'user123' }
    };
    setEmail(credentials[role].email);
    setPassword(credentials[role].password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neomorphism-violet via-neomorphism-blue to-neomorphism-red flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding and Features */}
        <div className="text-white space-y-8">
          <div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">
              Inline CRM
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 mb-8">
              Powerful CRM for IT Companies
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">User Management</h3>
                <p className="text-white/80">Comprehensive user and role management system</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Lead & Opportunity Management</h3>
                <p className="text-white/80">Track leads and manage sales pipeline effectively</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Advanced Analytics</h3>
                <p className="text-white/80">Detailed insights and reporting capabilities</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="neomorphism-card p-8 max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-neomorphism-violet to-neomorphism-blue hover:from-neomorphism-blue hover:to-neomorphism-violet"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8">
            <p className="text-sm text-gray-600 text-center mb-4">Demo Credentials:</p>
            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillTestCredentials('admin')}
                className="text-xs"
              >
                Admin: admin@demo.com / admin123
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillTestCredentials('manager')}
                className="text-xs"
              >
                Manager: manager@demo.com / manager123
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillTestCredentials('user')}
                className="text-xs"
              >
                User: user@demo.com / user123
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

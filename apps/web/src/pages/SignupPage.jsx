import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { HeartPulse, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    role: 'family' // Default to family for public signups
  });
  const [loading, setLoading] = useState(false);
  const { signup, login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.passwordConfirm) {
      return toast.error('Passwords do not match');
    }
    
    setLoading(true);
    try {
      await signup(formData);
      await login(formData.email, formData.password);
      toast.success('Account created successfully');
      navigate('/family');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-muted/30 p-4 py-12">
      <Card className="w-full max-w-md shadow-soft border-0">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
            <HeartPulse className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-heading font-bold">Create Account</CardTitle>
          <CardDescription>Join SeniorCare Xpress as a family member</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" name="name" 
                placeholder="Jane Doe" 
                value={formData.name} onChange={handleChange}
                required className="bg-white text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" name="email" type="email" 
                placeholder="name@example.com" 
                value={formData.email} onChange={handleChange}
                required className="bg-white text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" name="password" type="password" 
                value={formData.password} onChange={handleChange}
                required minLength={8} className="bg-white text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Confirm Password</Label>
              <Input 
                id="passwordConfirm" name="passwordConfirm" type="password" 
                value={formData.passwordConfirm} onChange={handleChange}
                required minLength={8} className="bg-white text-foreground"
              />
            </div>
            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignupPage;
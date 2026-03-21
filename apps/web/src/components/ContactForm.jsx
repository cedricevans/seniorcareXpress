
import React, { useState } from 'react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import PremiumButton from './PremiumButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await pb.collection('contacts').create(formData, { $autoCancel: false });
      toast.success('Message sent successfully. We will be in touch soon.');
      setFormData({ name: '', email: '', message: '' });
      setErrors({});
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-foreground font-medium">Full Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="bg-white border-border focus:border-primary focus:ring-primary/20 h-12 rounded-xl text-foreground shadow-sm"
          placeholder="Jane Doe"
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className="bg-white border-border focus:border-primary focus:ring-primary/20 h-12 rounded-xl text-foreground shadow-sm"
          placeholder="jane@example.com"
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-foreground font-medium">How can we help?</Label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={5}
          className="bg-white border-border focus:border-primary focus:ring-primary/20 rounded-xl resize-none text-foreground shadow-sm"
          placeholder="Please share any details about your care needs..."
        />
        {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
      </div>

      <PremiumButton 
        type="submit" 
        variant="primary" 
        className="w-full"
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Send Message'}
      </PremiumButton>
    </form>
  );
};

export default ContactForm;

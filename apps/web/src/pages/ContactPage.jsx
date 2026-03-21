
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { MapPin, Phone, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await pb.collection('contacts').create(formData, { $autoCancel: false });
      toast.success('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | SeniorCare Xpress</title>
      </Helmet>
      
      <div className="py-16 md:py-24 bg-muted/30 min-h-[calc(100vh-4rem)]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-soft overflow-hidden border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Contact Info */}
              <div className="bg-primary p-10 text-primary-foreground flex flex-col justify-between">
                <div>
                  <h2 className="text-3xl font-heading font-bold mb-4">Get in Touch</h2>
                  <p className="text-primary-foreground/80 mb-12">
                    Have questions about our services or want to schedule a consultation? We're here to help.
                  </p>
                  
                  <div className="space-y-8">
                    <div className="flex items-start gap-4">
                      <MapPin className="w-6 h-6 mt-1 shrink-0 text-accent" />
                      <div>
                        <h4 className="font-semibold text-lg">Our Office</h4>
                        <p className="text-primary-foreground/80">123 Care Avenue, Suite 100<br/>Wellness City, ST 12345</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Phone className="w-6 h-6 mt-1 shrink-0 text-accent" />
                      <div>
                        <h4 className="font-semibold text-lg">Phone</h4>
                        <p className="text-primary-foreground/80">(555) 123-4567</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Mail className="w-6 h-6 mt-1 shrink-0 text-accent" />
                      <div>
                        <h4 className="font-semibold text-lg">Email</h4>
                        <p className="text-primary-foreground/80">hello@seniorcarexpress.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="p-10">
                <h3 className="text-2xl font-heading font-bold mb-6">Send a Message</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required 
                      placeholder="John Doe"
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required 
                      placeholder="john@example.com"
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      required 
                      placeholder="How can we help you?"
                      className="min-h-[150px] bg-muted/50"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;

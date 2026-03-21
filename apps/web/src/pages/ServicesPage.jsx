
import React from 'react';
import { Helmet } from 'react-helmet';
import { Activity, Shield, MessageSquare, PhoneCall, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ServicesPage = () => {
  const services = [
    { 
      icon: Activity, 
      title: 'Daily Care Monitoring', 
      desc: 'Comprehensive tracking of daily activities, vitals, and overall well-being. Caregivers log meals, hydration, and mood, accessible instantly via the family portal.',
      benefits: ['Real-time health tracking', 'Nutritional monitoring', 'Mood assessment']
    },
    { 
      icon: Shield, 
      title: 'Medication Management', 
      desc: 'Strict adherence to medication schedules with real-time logging. We ensure the right dose at the right time, every time.',
      benefits: ['Missed dose alerts', 'Refill reminders', 'Pharmacy coordination']
    },
    { 
      icon: MessageSquare, 
      title: 'Family Communication', 
      desc: 'Direct messaging and updates to keep families connected and informed. Share photos, notes, and coordinate care seamlessly.',
      benefits: ['Secure messaging', 'Photo sharing', 'Care team group chats']
    },
    { 
      icon: PhoneCall, 
      title: 'Emergency Response', 
      desc: '24/7 rapid response protocols for any urgent medical situations. Immediate family notification and medical coordination.',
      benefits: ['24/7 availability', 'Instant alerts', 'Medical history ready']
    },
    { 
      icon: Users, 
      title: 'Companionship', 
      desc: 'Meaningful social interaction to prevent isolation and depression. We match caregivers based on personality and interests.',
      benefits: ['Conversation', 'Hobby engagement', 'Emotional support']
    },
    { 
      icon: Calendar, 
      title: 'Activity Planning', 
      desc: 'Engaging physical and mental activities tailored to individual capabilities to maintain cognitive function and mobility.',
      benefits: ['Light exercise', 'Cognitive games', 'Outing assistance']
    }
  ];

  return (
    <>
      <Helmet>
        <title>Our Services | SeniorCare Xpress</title>
      </Helmet>
      
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">Comprehensive Care Services</h1>
            <p className="text-lg text-muted-foreground">
              We offer a full spectrum of care services, all integrated into our secure portal so you always know how your loved one is doing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, idx) => (
              <Card key={idx} className="border-0 shadow-soft overflow-hidden">
                <div className="h-2 bg-primary/20 w-full" />
                <CardHeader>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <service.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{service.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{service.desc}</p>
                  <ul className="space-y-2">
                    {service.benefits.map((benefit, bIdx) => (
                      <li key={bIdx} className="flex items-center gap-2 text-sm font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ServicesPage;

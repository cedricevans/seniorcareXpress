
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Target, Eye, Heart } from 'lucide-react';

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>About Us | SeniorCare Xpress</title>
      </Helmet>
      
      <div className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">About SeniorCare Xpress</h1>
            <p className="text-lg text-muted-foreground">
              Founded on the belief that every senior deserves to age with dignity, and every family deserves peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
            <img 
              src="https://images.unsplash.com/photo-1529260836273-4726e171b4b8?q=80&w=1000&auto=format&fit=crop" 
              alt="Team of caregivers" 
              className="rounded-2xl shadow-lg object-cover aspect-video"
            />
            <div className="space-y-6">
              <h2 className="text-3xl font-heading font-bold">Our History</h2>
              <p className="text-muted-foreground leading-relaxed">
                SeniorCare Xpress began when our founders struggled to find transparent, reliable care for their own parents. They realized that while there were many caregiving services, few offered the real-time communication and technological integration that modern families need.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, we combine compassionate, highly-trained caregivers with a state-of-the-art portal that keeps families connected to their loved ones' daily lives, no matter the distance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div whileHover={{ y: -5 }} className="bg-white p-8 rounded-2xl shadow-soft border border-border">
              <Target className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">Our Mission</h3>
              <p className="text-muted-foreground">To provide exceptional, transparent care that empowers seniors to live fully while giving their families complete peace of mind.</p>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="bg-white p-8 rounded-2xl shadow-soft border border-border">
              <Eye className="w-10 h-10 text-secondary mb-4" />
              <h3 className="text-xl font-bold mb-3">Our Vision</h3>
              <p className="text-muted-foreground">To set a new standard in senior care where technology and human compassion work seamlessly together.</p>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="bg-white p-8 rounded-2xl shadow-soft border border-border">
              <Heart className="w-10 h-10 text-accent mb-4" />
              <h3 className="text-xl font-bold mb-3">Our Values</h3>
              <p className="text-muted-foreground">Empathy, transparency, respect, and continuous improvement in everything we do.</p>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;


import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import PremiumButton from './PremiumButton';

const ModernJobCard = ({ title, department, location, type, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group bg-card border border-border rounded-3xl p-6 md:p-8 hover:border-primary/30 transition-all duration-300 shadow-warm hover:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
    >
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="px-4 py-1.5 rounded-full bg-secondary/10 text-secondary-foreground font-medium text-sm">
            {department}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" /> {type}
          </span>
        </div>
        <h3 className="text-2xl font-heading font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4" /> {location}
        </div>
      </div>
      
      <PremiumButton variant="outline" className="md:w-auto w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
        Apply Now <ArrowRight className="w-4 h-4 ml-2" />
      </PremiumButton>
    </motion.div>
  );
};

export default ModernJobCard;

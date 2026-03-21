
import React from 'react';
import { motion } from 'framer-motion';

const BenefitCard = ({ icon: Icon, title, description, index = 0, featured = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`${featured ? 'md:col-span-2' : ''}`}
    >
      <div className={`h-full p-8 rounded-3xl transition-all duration-300 shadow-warm border border-border ${
        featured 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-card hover:-translate-y-1'
      }`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
          featured ? 'bg-white/20' : 'bg-primary/10'
        }`}>
          <Icon className={`w-7 h-7 ${featured ? 'text-white' : 'text-primary'}`} />
        </div>
        <h3 className="text-xl font-heading font-semibold mb-3 text-balance">{title}</h3>
        <p className={`leading-relaxed ${featured ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export default BenefitCard;

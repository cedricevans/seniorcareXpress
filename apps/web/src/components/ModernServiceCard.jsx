
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ModernServiceCard = ({ icon: Icon, title, description, index = 0, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      className={cn(
        "group relative p-8 rounded-3xl bg-card border border-border shadow-warm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
        <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors duration-300" />
      </div>
      
      <h3 className="text-2xl font-heading font-semibold mb-3 text-balance text-foreground">
        {title}
      </h3>
      
      <p className="text-muted-foreground leading-relaxed mb-6 flex-grow">
        {description}
      </p>
      
      <div className="flex items-center text-primary font-medium mt-auto group-hover:translate-x-2 transition-transform duration-300">
        Learn more <ArrowRight className="w-4 h-4 ml-2" />
      </div>
    </motion.div>
  );
};

export default ModernServiceCard;


import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const GlassmorphismCard = ({ children, className, delay = 0, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={cn("glass-card p-8 relative overflow-hidden group transition-all duration-300 hover:shadow-lg", className)}
      {...props}
    >
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassmorphismCard;

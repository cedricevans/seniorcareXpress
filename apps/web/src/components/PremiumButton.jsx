
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const PremiumButton = ({ children, variant = 'primary', className, ...props }) => {
  const baseStyles = "relative inline-flex items-center justify-center px-8 py-4 font-heading font-medium tracking-wide rounded-full overflow-hidden transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-warm hover:-translate-y-0.5",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-warm hover:-translate-y-0.5",
    outline: "border-2 border-primary/20 text-foreground hover:border-primary hover:text-primary bg-transparent",
    glass: "bg-white/90 text-foreground hover:bg-white shadow-warm hover:-translate-y-0.5"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
};

export default PremiumButton;

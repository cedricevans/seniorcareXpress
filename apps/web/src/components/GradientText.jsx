
import React from 'react';
import { cn } from '@/lib/utils';

const GradientText = ({ children, className, as: Component = 'span' }) => {
  return (
    <Component className={cn("text-gradient font-heading", className)}>
      {children}
    </Component>
  );
};

export default GradientText;


import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

const ParallaxSection = ({ 
  children, 
  backgroundImage, 
  height = "min-h-[90vh]", 
  offset = 150, 
  className,
  overlay = "bg-slate-950/60"
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Move background slower than foreground
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);

  return (
    <section 
      ref={ref} 
      className={cn("relative overflow-hidden flex items-center w-full", height, className)}
    >
      {/* Parallax Background */}
      <motion.div 
        className="absolute inset-0 z-0 w-full h-full origin-center"
        style={{ y, scale: 1.15 }}
      >
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      </motion.div>

      {/* Overlay */}
      <div className={cn("absolute inset-0 z-10", overlay)} />

      {/* Content */}
      <div className="relative z-20 w-full">
        {children}
      </div>
    </section>
  );
};

export default ParallaxSection;

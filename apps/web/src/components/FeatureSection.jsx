
import React from 'react';
import { motion } from 'framer-motion';

const FeatureSection = ({ title, description, imageSrc, imageAlt, reverse = false, children }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${reverse ? 'md:flex-row-reverse' : ''}`}>
      <motion.div
        initial={{ opacity: 0, x: reverse ? 20 : -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className={reverse ? 'md:order-2' : ''}
      >
        <img 
          src={imageSrc} 
          alt={imageAlt}
          className="w-full h-[400px] object-cover rounded-2xl shadow-lg"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: reverse ? -20 : 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={reverse ? 'md:order-1' : ''}
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">{title}</h2>
        <div className="text-lg leading-relaxed text-muted-foreground space-y-4">
          {description}
        </div>
        {children}
      </motion.div>
    </div>
  );
};

export default FeatureSection;


import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const ImageCard = ({ 
  src, 
  alt, 
  title, 
  description, 
  className, 
  aspectRatio = "aspect-[4/3]",
  index = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={cn("group relative overflow-hidden rounded-3xl shadow-warm cursor-pointer", aspectRatio, className)}
    >
      <img 
        src={src} 
        alt={alt || title} 
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
      
      <div className="absolute inset-0 p-8 flex flex-col justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
        {title && (
          <h3 className="text-2xl font-heading font-bold text-white mb-2">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ImageCard;

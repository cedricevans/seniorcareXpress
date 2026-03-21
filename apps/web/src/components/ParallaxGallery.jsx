
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const ParallaxGallery = ({ images }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Create staggered parallax effects for different columns
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [50, -150]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -80]);

  const columns = [
    { images: images.slice(0, 2), y: y1 },
    { images: images.slice(2, 4), y: y2, className: "mt-12 md:mt-24" },
    { images: images.slice(4, 6), y: y3 }
  ];

  return (
    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-4 py-12">
      {columns.map((col, colIndex) => (
        <motion.div 
          key={colIndex} 
          style={{ y: col.y }} 
          className={`flex flex-col gap-6 md:gap-8 ${col.className || ''}`}
        >
          {col.images.map((img, imgIndex) => (
            <div 
              key={imgIndex} 
              className="relative overflow-hidden rounded-3xl shadow-warm group aspect-[4/5]"
            >
              <img 
                src={img.src} 
                alt={img.alt} 
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
};

export default ParallaxGallery;

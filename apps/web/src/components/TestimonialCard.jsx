
import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const TestimonialCard = ({ quote, author, role, avatar, rating = 5, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-card p-8 rounded-3xl shadow-warm border border-border flex flex-col h-full"
    >
      <div className="flex gap-1 mb-6">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-primary text-primary" />
        ))}
      </div>
      
      <blockquote className="text-lg leading-relaxed mb-8 flex-grow text-foreground/90 italic">
        "{quote}"
      </blockquote>
      
      <div className="flex items-center gap-4 mt-auto">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20">
          <img src={avatar} alt={author} className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="font-heading font-semibold text-foreground">{author}</div>
          <div className="text-sm text-muted-foreground">{role}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default TestimonialCard;

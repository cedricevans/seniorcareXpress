
import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';

const AnimatedCounter = ({ from = 0, to, duration = 2, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(from);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      let startTime;
      let animationFrame;

      const updateCounter = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        
        // Ease out expo
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        setCount(Math.floor(easeProgress * (to - from) + from));

        if (progress < 1) {
          animationFrame = requestAnimationFrame(updateCounter);
        }
      };

      animationFrame = requestAnimationFrame(updateCounter);
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [isInView, from, to, duration]);

  return (
    <span ref={ref} className="inline-block tabular-nums">
      {prefix}{count}{suffix}
    </span>
  );
};

export default AnimatedCounter;

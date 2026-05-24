import { motion } from 'motion/react';

export const pageContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

export const pageItem = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 220, damping: 22 },
  },
};

export const cardEntry = {
  hidden: { opacity: 0, y: 12 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: Math.min(index * 0.05, 0.4),
      type: 'spring',
      stiffness: 240,
      damping: 24,
    },
  }),
};

export const hoverLift = {
  whileHover: { y: -3, transition: { type: 'spring', stiffness: 320, damping: 20 } },
  whileTap: { scale: 0.98 },
};

export const popIn = {
  initial: { scale: 0, rotate: -180, opacity: 0 },
  animate: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 220, damping: 12 },
  },
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 220, damping: 24 } },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 220, damping: 24 } },
};

/**
 * Wrap any content in an animated container so children inheriting `pageItem`
 * (or any visible variant) stagger in. Plays once on mount.
 */
export function AnimatedPage({ children, className, style }) {
  return (
    <motion.div
      variants={pageContainer}
      initial="hidden"
      animate="visible"
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedItem({ children, className, style, custom }) {
  return (
    <motion.div
      variants={pageItem}
      custom={custom}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function HoverCard({ children, className, style, onClick }) {
  return (
    <motion.div
      variants={pageItem}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 320, damping: 22 } }}
      whileTap={{ scale: 0.985 }}
      className={className}
      style={style}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

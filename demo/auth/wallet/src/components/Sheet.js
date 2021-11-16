import { AnimatePresence, motion } from 'framer-motion/dist/framer-motion';

export const Sheet = ({ children, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="sheet"
          initial={{ y: 800 }}
          animate={{ y: 0 }}
          exit={{ y: 800 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

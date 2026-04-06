'use client';

import { motion } from 'framer-motion';

interface FatigueMessageProps {
  message: string;
}

export function FatigueMessage({ message }: FatigueMessageProps): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center py-4"
    >
      <p className="text-sm text-primary font-medium">{message}</p>
    </motion.div>
  );
}

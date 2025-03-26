
import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const NewFormButton = ({ onClick }) => {
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Link to="/builder/new" onClick={handleClick}>
      <motion.div
        whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className="h-full min-h-[228px] border border-dashed border-form-card-border rounded-lg flex flex-col items-center justify-center p-6 hover:border-primary transition-colors duration-200 bg-white"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center text-white mb-4 shadow-lg">
          <Plus size={28} />
        </div>
        <h3 className="font-medium text-lg text-form-dark-gray">Create new form</h3>
      </motion.div>
    </Link>
  );
};

export default NewFormButton;

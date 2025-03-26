import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from '@/features/CreateEvent/components/PageTransition';
import FormCard from '@/features/CreateEvent/components/FormCard';
import NewFormButton from '@/features/CreateEvent/components/NewFormButton';
import { useForm } from '@/features/CreateEvent/context/FormContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { state } = useForm();
  const [search, setSearch] = useState('');
  
  const filteredForms = state.forms.filter(form => 
    form.title.toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <PageTransition>
      <div className="max-w-screen-xl mx-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-form-dark-gray">My Forms</h1>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <p className="text-form-gray">Create, manage, and analyze your forms</p>
            
            <input
              type="text"
              placeholder="Search forms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md px-4 py-2 border border-form-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-form-accent-blue"
            />
          </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <NewFormButton />
          </motion.div>
          
          {filteredForms.map((form, index) => (
            <motion.div
              key={form.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + (index + 1) * 0.05 }}
            >
              <FormCard
                form={form}
                onEdit={() => navigate(`/builder/${form.id}`)}
                onResponses={() => navigate(`/responses/${form.id}`)}
                onPreview={() => navigate(`/preview/${form.id}`)}
              />
            </motion.div>
          ))}
          
          {filteredForms.length === 0 && search && (
            <div className="col-span-full text-center p-6">
              <p className="text-form-dark-gray">No forms found matching "{search}"</p>
            </div>
          )}
          
          {state.forms.length === 0 && (
            <div className="col-span-full text-center p-6">
              <p className="text-form-dark-gray">No forms yet. Click "Create New Form" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
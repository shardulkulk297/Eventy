/* Eventy/Frontend/src/features/CreateEvent/components/NewFormButton.jsx */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/shared/ui/card'; // Assuming Card is in shared/ui
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const NewFormButton = ({ className }) => {
  const navigate = useNavigate();

  // Function to handle navigation to the new form builder page
  const handleCreateNewForm = () => {
    // --- FIX: Navigate to the correct nested route ---
    navigate('/posts/builder/new');
    // --- END FIX ---
  };

  return (
    <Card
      className={cn(
        'flex flex-col items-center justify-center p-6 h-full min-h-[200px] border-2 border-dashed border-form-card-border hover:border-form-accent-blue transition-colors duration-200 cursor-pointer bg-form-light-gray hover:bg-blue-50',
        className
      )}
      onClick={handleCreateNewForm}
      role="button"
      tabIndex={0} // Make it focusable
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCreateNewForm()} // Keyboard accessibility
      aria-label="Create new form"
    >
      <Plus className="w-10 h-10 text-form-accent-blue mb-3" strokeWidth={1.5} />
      <span className="text-sm font-medium text-form-accent-blue">Create New Form</span>
    </Card>
  );
};

export default NewFormButton;
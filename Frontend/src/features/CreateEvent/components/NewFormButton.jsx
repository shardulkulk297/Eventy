/* Eventy/Frontend/src/features/CreateEvent/components/NewFormButton.jsx */
import React, { useState } from 'react'; // Added useState
import { useNavigate } from 'react-router-dom';
import { Card } from '@/shared/ui/card'; // Assuming shared UI path
import { Button } from '@/shared/ui/button'; // Assuming shared UI path
import { Plus, Loader2 } from 'lucide-react'; // Added Loader2 for visual feedback
import { cn } from '@/lib/utils';
import { useEvent } from '@/features/CreateEvent/context/EventContext';
const NewFormButton = ({ className }) => {
  const navigate = useNavigate();
  const { createForm } = useEvent(); // Get createForm function from context
  const [isCreating, setIsCreating] = useState(false); // State for loading indicator

  const handleCreateClick = async () => {
    setIsCreating(true); // Show loading indicator
    try {
      // Call createForm from the context, which handles Firebase saving
      const newForm = await createForm('Untitled Form', ''); // Pass initial title/desc

      if (newForm && newForm.id) {
        // Navigate to the builder page with the *newly created* form ID
        navigate(`/posts/builder/${newForm.id}`);
      } else {
        // Handle case where form creation failed (context should show toast)
        console.error("Form creation failed or returned no ID.");
        // Optionally show another toast here
      }
    } catch (error) {
      // Context should handle errors, but catch just in case
      console.error("Error during form creation navigation:", error);
    } finally {
      setIsCreating(false); // Hide loading indicator
    }
  };

  return (
    <Card
      className={cn(
        'flex flex-col items-center justify-center text-center p-6 h-full', // Ensure card takes height if needed
        'border-2 border-dashed border-gray-300 dark:border-gray-700',
        'hover:border-form-accent-blue hover:bg-form-accent-blue/5 dark:hover:bg-form-accent-blue/10',
        'transition-colors duration-200 cursor-pointer group',
        className
      )}
      onClick={!isCreating ? handleCreateClick : undefined} // Prevent clicks while creating
      role="button"
      aria-label="Create new form"
    >
      <div className="mb-3 flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-form-accent-blue/10 dark:group-hover:bg-form-accent-blue/20">
        {isCreating ? (
          <Loader2 className="h-6 w-6 animate-spin text-form-accent-blue" />
        ) : (
          <Plus className="h-6 w-6 text-gray-500 dark:text-gray-400 group-hover:text-form-accent-blue" />
        )}
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-form-accent-blue">
        Create New Form
      </p>
    </Card>
  );
};

export default NewFormButton;
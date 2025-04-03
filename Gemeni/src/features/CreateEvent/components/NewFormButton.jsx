/* src/features/CreateEvent/components/NewFormButton.jsx */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/shared/ui/card';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner'; // Import toast for error handling

// --- FIX: Accept eventId as a prop ---
const NewFormButton = ({ className, eventId }) => {
// --- END FIX ---
  const navigate = useNavigate();

  const handleCreateNewForm = () => {
    // --- FIX: Navigate to the new form builder route for the specific event ---
    if (eventId) {
      navigate(`/posts/events/${eventId}/forms/builder/new`);
    } else {
      // Handle the case where eventId is missing (shouldn't happen if used correctly)
      toast.error("Cannot create form: Event context is missing.");
      console.error("NewFormButton: eventId prop is missing!");
    }
    // --- END FIX ---
  };

  return (
    <Card
      className={cn(
        'flex flex-col items-center justify-center p-6 h-full min-h-[200px] border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-blue-400 transition-colors duration-200 cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-gray-700/50', // Adjusted styles
        className
      )}
      onClick={handleCreateNewForm}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCreateNewForm()}
      aria-label="Create new form for this event"
    >
      <Plus className="w-10 h-10 text-primary dark:text-blue-400 mb-3" strokeWidth={1.5} />
      <span className="text-sm font-medium text-primary dark:text-blue-400">Create New Form</span>
    </Card>
  );
};

export default NewFormButton;
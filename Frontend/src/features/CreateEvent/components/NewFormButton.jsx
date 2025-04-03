/* src/features/CreateEvent/components/NewFormButton.jsx */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/shared/ui/card';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const NewFormButton = ({ className, eventId }) => {
  const navigate = useNavigate();

  const handleCreateNewForm = () => {
    // *** MOVED LOG TO THE VERY TOP ***
    console.log(`[NewFormButton] handleCreateNewForm CLICKED! eventId prop: ${eventId}`);

    if (eventId) {
      const targetUrl = `/posts/events/${eventId}/forms/builder/new`;
      console.log(`[NewFormButton] Navigating to: ${targetUrl}`);
      navigate(targetUrl);
    } else {
      toast.error("Cannot create form: Event context is missing.");
      console.error("NewFormButton: eventId prop is missing!");
    }
  };

  return (
    <Card
      className={cn(
        'flex flex-col items-center justify-center p-6 h-full min-h-[200px] border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-blue-400 transition-colors duration-200 cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-gray-700/50',
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
/* src/features/CreateEvent/components/FormCard.jsx */
import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { Card } from '@/shared/ui/card';
import { MoreHorizontal, Trash2, Calendar, Edit, Eye, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
// --- FIX: Import the new context hook ---
import { useEventManager } from '@/features/CreateEvent/context/EventManagerContext';
// --- END FIX ---
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator, // Import Separator
  DropdownMenuTrigger
} from '@/shared/ui/dropdown-menu';
import { toast } from 'sonner';

const FormCard = ({
  form,
  eventId, // --- FIX: Expect eventId as a prop ---
  className,
  // Removed specific onEdit etc props, navigation handled internally or via general onClick
}) => {
  const navigate = useNavigate(); // Initialize navigate
  // Destructure directly from the form object for clarity
  const { id: formId, title: formTitle, updatedAt, responseCount = 0, thumbnail } = form || {};

  // --- FIX: Use the new context hook and delete function ---
  const { deleteFormForEvent } = useEventManager();
  // --- END FIX ---

  // Format date nicely
  const formLastEdited = updatedAt ? new Date(updatedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  }) : 'N/A';

  const handleDelete = (e) => {
    e.stopPropagation();
    // --- FIX: Check for eventId and formId, call new delete function ---
    if (eventId && formId) {
      deleteFormForEvent(eventId, formId);
      // Toast is likely handled within the context function now
    } else {
       toast.error("Cannot delete form: Event ID or Form ID is missing.");
    }
    // --- END FIX ---
  };

   // Prevent action if form or eventId is not loaded yet
   if (!formId || !eventId) {
     return (
       <Card className={cn('p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 opacity-50', className)}>
         Loading form...
       </Card>
     );
   }

   // --- FIX: Define navigation functions ---
   const goToEdit = () => navigate(`/posts/events/${eventId}/forms/builder/${formId}`);
   const goToPreview = () => navigate(`/posts/events/${eventId}/forms/preview/${formId}`);
   const goToResponses = () => navigate(`/posts/events/${eventId}/forms/responses/${formId}`);
   // --- END FIX ---

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 8px 15px rgba(0,0,0,0.1)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        className={cn(
          'overflow-hidden transition-all duration-200 hover:shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer group', // Simplified hover shadow
          className
        )}
        onClick={goToEdit} // Clicking the card goes to edit
      >
        {/* Card header/thumbnail */}
        <div
          className="h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 flex items-center justify-center p-4 text-gray-700 dark:text-gray-300 relative overflow-hidden" // Adjusted colors
          style={thumbnail ? { backgroundImage: `url(${thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {!thumbnail && (
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
          )}
           <div className="text-center z-10 relative p-2 bg-black/20 rounded-md backdrop-blur-sm text-white"> {/* Added backdrop blur */}
            <div className="text-base md:text-lg truncate max-w-[250px] font-semibold">{formTitle || 'Untitled Form'}</div>
          </div>
        </div>

        {/* Card body */}
        <div className="p-3">
          <div className="flex justify-between items-start">
            {/* Info Section */}
            <div className="truncate pr-2 flex-1">
              <h3 className="font-medium text-sm md:text-base truncate dark:text-white">{formTitle || 'Untitled Form'}</h3>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1 space-x-2">
                <div className="flex items-center" title="Last edited">
                  <Calendar size={12} className="mr-1 shrink-0" />
                  <span>{formLastEdited}</span>
                </div>
                <div className="flex items-center" title={`${responseCount} responses`}>
                  <MessageSquare size={12} className="mr-1 shrink-0" />
                  <span>{responseCount} {responseCount === 1 ? 'response' : 'responses'}</span>
                </div>
              </div>
            </div>

            {/* Actions Dropdown */}
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Form options"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 dark:bg-gray-800 dark:border-gray-700">
                  {/* --- FIX: Use internal navigation functions --- */}
                   <DropdownMenuItem onClick={(e) => { e.stopPropagation(); goToEdit(); }} className="flex items-center gap-2 cursor-pointer dark:text-gray-200 dark:focus:bg-gray-700">
                      <Edit size={14} /> Edit
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={(e) => { e.stopPropagation(); goToPreview(); }} className="flex items-center gap-2 cursor-pointer dark:text-gray-200 dark:focus:bg-gray-700">
                      <Eye size={14} /> Preview
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={(e) => { e.stopPropagation(); goToResponses(); }} className="flex items-center gap-2 cursor-pointer dark:text-gray-200 dark:focus:bg-gray-700">
                      <MessageSquare size={14} /> Responses
                   </DropdownMenuItem>
                  {/* --- END FIX --- */}
                   <DropdownMenuSeparator className="dark:bg-gray-700" />
                  <DropdownMenuItem
                    className="text-red-600 dark:text-red-500 flex items-center gap-2 cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/50 focus:text-red-700 dark:focus:text-red-400"
                    onClick={handleDelete}
                  >
                    <Trash2 size={14} /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default FormCard;
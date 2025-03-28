/* Eventy/Frontend/src/features/CreateEvent/components/FormCard.jsx */

import React from 'react';
// --- FIX: Corrected import path for Card ---
import { Card } from '@/shared/ui/card'; // Assuming Card is in shared/ui
// --- END FIX ---
import { MoreHorizontal, Trash2, Calendar, Edit, Eye, MessageSquare } from 'lucide-react'; // Removed Clock3 as lastEdited covers time
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useForm } from '@/features/CreateEvent/context/FormContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/shared/ui/dropdown-menu';
import { toast } from 'sonner';

const FormCard = ({
  // Removed individual props in favor of 'form' object
  form,
  className,
  onEdit,
  onResponses,
  onPreview,
}) => {
  // Destructure directly from the form object for clarity
  const { id: formId, title: formTitle, updatedAt, responseCount = 0, thumbnail } = form || {}; // Provide default responseCount

  const { deleteForm } = useForm();

  // Format date nicely
  const formLastEdited = updatedAt ? new Date(updatedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  }) : 'N/A';

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent card click event
    if (formId) {
       // Optional: Add a confirmation dialog before deleting
      deleteForm(formId);
      toast.success(`Form "${formTitle || 'Untitled'}" deleted successfully`);
    } else {
       toast.error("Cannot delete form: ID is missing.");
    }
  };

   // Prevent action if form is not loaded yet
   if (!formId) {
     return (
       <Card className={cn('p-4 border border-form-card-border bg-white opacity-50', className)}>
         Loading form...
       </Card>
     );
   }

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 8px 15px rgba(0,0,0,0.1)' }} // Enhanced hover effect
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Wrap Card with Link or make Card itself clickable */}
      <Card
        className={cn(
          'overflow-hidden transition-all duration-200 hover:shadow-elevation-1 border border-form-card-border bg-white cursor-pointer group', // Added cursor-pointer and group
          className
        )}
        onClick={onEdit} // Example: Clicking the card goes to edit
      >
        {/* Card header/thumbnail */}
        <div
          className="h-32 bg-gradient-to-br from-form-accent-blue/80 to-form-accent-purple/80 flex items-center justify-center p-4 text-white relative overflow-hidden" // Adjusted height and gradient opacity
          style={thumbnail ? { backgroundImage: `url(${thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {/* Overlay for better text readability on image */}
          {!thumbnail && (
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
          )}
          <div className="text-center z-10 relative p-2 bg-black/10 rounded-md backdrop-blur-sm"> {/* Added backdrop blur */}
            <div className="text-base md:text-lg truncate max-w-[250px] font-semibold">{formTitle || 'Untitled Form'}</div>
          </div>
        </div>

        {/* Card body */}
        <div className="p-3">
          <div className="flex justify-between items-start">
            {/* Info Section */}
            <div className="truncate pr-2 flex-1">
              <h3 className="font-medium text-sm md:text-base truncate">{formTitle || 'Untitled Form'}</h3>
              <div className="flex items-center text-xs text-form-dark-gray mt-1 space-x-2">
                <div className="flex items-center" title="Last edited">
                  <Calendar size={12} className="mr-1 shrink-0" />
                  <span>{formLastEdited}</span>
                </div>
                <div className="flex items-center" title={`${formResponseCount} responses`}>
                  <MessageSquare size={12} className="mr-1 shrink-0" />
                  <span>{formResponseCount} {formResponseCount === 1 ? 'response' : 'responses'}</span>
                </div>
              </div>
            </div>

            {/* Actions Dropdown */}
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="text-form-dark-gray hover:bg-form-light-gray p-1 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-form-accent-blue outline-none"
                    onClick={(e) => e.stopPropagation()} // Prevent card click when opening dropdown
                    aria-label="Form options"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {onEdit && (
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }} className="flex items-center gap-2 cursor-pointer">
                      <Edit size={14} />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onPreview && (
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onPreview();
                    }} className="flex items-center gap-2 cursor-pointer">
                      <Eye size={14} />
                      Preview
                    </DropdownMenuItem>
                  )}
                  {onResponses && (
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onResponses();
                    }} className="flex items-center gap-2 cursor-pointer">
                      <MessageSquare size={14} />
                      Responses
                    </DropdownMenuItem>
                  )}
                   <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-form-accent-red flex items-center gap-2 cursor-pointer focus:bg-red-50 focus:text-red-700"
                    onClick={handleDelete} // Already stops propagation
                  >
                    <Trash2 size={14} />
                    Delete
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
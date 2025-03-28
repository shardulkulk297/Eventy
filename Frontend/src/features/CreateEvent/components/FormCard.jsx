/* Eventy/Frontend/src/features/CreateEvent/components/FormCard.jsx */
import React from 'react';
import { Card } from '@/shared/ui/card';
import { MoreHorizontal, Trash2, Calendar, Edit, Eye, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useForm } from '@/features/CreateEvent/context/FormContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator, // Import Separator
  DropdownMenuTrigger
} from '@/shared/ui/dropdown-menu';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const FormCard = ({
  form,
  className,
  // Remove navigation props, handle navigation internally or pass navigate func
  // onEdit,
  // onResponses,
  // onPreview,
}) => {
  const { id: formId, title: formTitle, updatedAt, responseCount = 0, thumbnail } = form || {};
  const { deleteForm } = useForm();
  const navigate = useNavigate(); // Use the hook here

  const formLastEdited = updatedAt ? new Date(updatedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  }) : 'N/A';

  // --- FIX: Define navigation handlers ---
  const handleEdit = (e) => {
      e.stopPropagation();
      if (formId) navigate(`/posts/builder/${formId}`);
  };
  const handlePreview = (e) => {
      e.stopPropagation();
      if (formId) navigate(`/posts/preview/${formId}`);
  };
  const handleResponses = (e) => {
      e.stopPropagation();
      if (formId) navigate(`/posts/responses/${formId}`);
  };
  // --- END FIX ---

  const handleDelete = (e) => {
    e.stopPropagation();
    if (formId) {
      // Consider adding a confirmation dialog here
      deleteForm(formId);
      toast.success(`Form "${formTitle || 'Untitled'}" deleted.`);
    } else {
       toast.error("Cannot delete form: ID is missing.");
    }
  };

   if (!formId) {
     return (
       <Card className={cn('p-4 border border-form-card-border bg-white opacity-50 animate-pulse', className)}>
         Loading...
       </Card>
     );
   }

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 8px 15px rgba(0,0,0,0.1)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* --- FIX: Use handleEdit for the main card click --- */}
      <Card
        className={cn(
          'overflow-hidden transition-all duration-200 hover:shadow-elevation-1 border border-form-card-border bg-white cursor-pointer group',
          className
        )}
        onClick={handleEdit} // Main card click goes to edit
      >
      {/* --- END FIX --- */}
        {/* Card header/thumbnail */}
        <div
          className="h-32 bg-gradient-to-br from-form-accent-blue/80 to-form-accent-purple/80 flex items-center justify-center p-4 text-white relative overflow-hidden"
          style={thumbnail ? { backgroundImage: `url(${thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {!thumbnail && (
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
          )}
          <div className="text-center z-10 relative p-2 bg-black/10 rounded-md backdrop-blur-sm">
            <div className="text-base md:text-lg truncate max-w-[250px] font-semibold">{formTitle || 'Untitled Form'}</div>
          </div>
        </div>

        {/* Card body */}
        <div className="p-3">
          <div className="flex justify-between items-start">
            {/* Info Section */}
            <div className="truncate pr-2 flex-1">
              <h3 className="font-medium text-sm md:text-base truncate">{formTitle || 'Untitled Form'}</h3>
              <div className="flex items-center text-xs text-form-dark-gray mt-1 space-x-2 flex-wrap"> {/* Added flex-wrap */}
                <div className="flex items-center shrink-0" title="Last edited"> {/* Added shrink-0 */}
                  <Calendar size={12} className="mr-1" />
                  <span>{formLastEdited}</span>
                </div>
                <div className="flex items-center shrink-0" title={`${responseCount} responses`}> {/* Added shrink-0 */}
                  <MessageSquare size={12} className="mr-1" />
                  <span>{responseCount} {responseCount === 1 ? 'response' : 'responses'}</span>
                </div>
              </div>
            </div>

            {/* Actions Dropdown */}
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="text-form-dark-gray hover:bg-form-light-gray p-1 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-form-accent-blue outline-none"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Form options"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                   {/* --- FIX: Use internal handlers for dropdown items --- */}
                   <DropdownMenuItem onClick={handleEdit} className="flex items-center gap-2 cursor-pointer">
                      <Edit size={14} />
                      Edit
                    </DropdownMenuItem>
                   <DropdownMenuItem onClick={handlePreview} className="flex items-center gap-2 cursor-pointer">
                      <Eye size={14} />
                      Preview
                    </DropdownMenuItem>
                   <DropdownMenuItem onClick={handleResponses} className="flex items-center gap-2 cursor-pointer">
                      <MessageSquare size={14} />
                      Responses
                    </DropdownMenuItem>
                    {/* --- END FIX --- */}
                   <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-form-accent-red flex items-center gap-2 cursor-pointer focus:bg-red-50 focus:text-red-700"
                    onClick={handleDelete}
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
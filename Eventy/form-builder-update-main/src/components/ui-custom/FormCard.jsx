
import React from 'react';
import { Card } from '@/components/ui/card';
import { MoreHorizontal, Trash2, Calendar, Clock3, Edit, Eye, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useForm } from '@/context/FormContext';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const FormCard = ({
  id,
  title,
  lastEdited,
  responseCount,
  thumbnail,
  className,
  form,
  onEdit,
  onResponses,
  onPreview,
}) => {
  // Use form properties if form is provided, otherwise use individual props
  const formId = form?.id || id;
  const formTitle = form?.title || title;
  const formLastEdited = form?.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : lastEdited;
  const formResponseCount = form?.responseCount !== undefined ? form.responseCount : responseCount;
  
  const { deleteForm } = useForm();
  
  const handleDelete = (e) => {
    e.stopPropagation();
    if (formId) {
      deleteForm(formId);
      toast.success("Form deleted successfully");
    }
  };
  
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Card className={cn(
        'overflow-hidden transition-all duration-200 hover:shadow-elevation-2 border border-form-card-border bg-white',
        className
      )}>
        {/* Card header/thumbnail */}
        <div 
          className="h-36 bg-gradient-to-br from-form-accent-blue to-form-accent-purple flex items-center justify-center p-4 text-white font-medium"
          style={thumbnail ? { backgroundImage: `url(${thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {!thumbnail && (
            <div className="text-center">
              <div className="text-lg truncate max-w-[250px] font-semibold">{formTitle}</div>
            </div>
          )}
        </div>
        
        {/* Card body */}
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="truncate pr-2">
              <h3 className="font-medium text-base truncate">{formTitle}</h3>
              <div className="flex items-center text-xs text-form-dark-gray mt-1.5 space-x-1">
                <Calendar size={14} className="mr-1" />
                <span>{formLastEdited}</span>
                <span className="mx-1">•</span>
                <MessageSquare size={14} className="mr-1" />
                <span>{formResponseCount} {formResponseCount === 1 ? 'response' : 'responses'}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="text-form-dark-gray hover:bg-form-light-gray p-1.5 rounded-full transition-colors"
                    onClick={(e) => e.preventDefault()}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onEdit && (
                    <DropdownMenuItem onClick={(e) => {
                      e.preventDefault();
                      onEdit();
                    }} className="flex items-center py-2">
                      <Edit size={16} className="mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onPreview && (
                    <DropdownMenuItem onClick={(e) => {
                      e.preventDefault();
                      onPreview();
                    }} className="flex items-center py-2">
                      <Eye size={16} className="mr-2" />
                      Preview
                    </DropdownMenuItem>
                  )}
                  {onResponses && (
                    <DropdownMenuItem onClick={(e) => {
                      e.preventDefault();
                      onResponses();
                    }} className="flex items-center py-2">
                      <MessageSquare size={16} className="mr-2" />
                      Responses
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    className="text-form-accent-red flex items-center py-2"
                    onClick={handleDelete}
                  >
                    <Trash2 size={16} className="mr-2" />
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

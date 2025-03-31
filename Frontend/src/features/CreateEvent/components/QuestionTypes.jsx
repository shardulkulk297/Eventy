/* src/features/CreateEvent/components/QuestionTypes.jsx */
import React, { useState, useRef, useEffect, useCallback } from 'react'; // Added useCallback
import {
  AlignLeft, CheckSquare, ChevronDown, Clock, CopyPlus, GripVertical,
  List, Plus, Trash, Type, Calendar, Upload, Settings // Added Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
// --- FIX: Import renamed hook ---
import { useEventManager } from '@/features/CreateEvent/context/EventManagerContext';
// --- END FIX ---
import { Button } from '@/shared/ui/button'; // Assuming Button is shared
import { Switch } from '@/shared/ui/switch'; // Assuming Switch is shared
import { Label } from '@/shared/ui/label'; // Assuming Label is shared
import { toast } from 'sonner';

// Debounce function (keep as is)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}


export const QuestionCard = ({
  question,
  eventId, // Receive eventId
  formId, // Receive formId
  index,
  isSelected,
  onSelect
}) => {
  // --- FIX: Use renamed hook ---
  const { updateQuestionInForm, deleteQuestionFromForm, addQuestionToForm } = useEventManager();
  // --- END FIX ---
  const [title, setTitle] = useState(question.title);
  const [description, setDescription] = useState(question.description || '');
  const [required, setRequired] = useState(question.required);
  const [options, setOptions] = useState(question.options || []);
  const titleRef = useRef(null);

   // Debounced update function using useCallback
   const debouncedUpdate = useCallback(
       debounce((updatedQuestionData) => {
           // --- FIX: Pass eventId and formId to update function ---
           updateQuestionInForm(eventId, formId, updatedQuestionData);
           // --- END FIX ---
       }, 500), // 500ms debounce
       [updateQuestionInForm, eventId, formId] // Add dependencies
   );


  // Effect to trigger debounced update when local state changes
  useEffect(() => {
    // Check against the original question prop for changes
    if (
      title !== question.title ||
      description !== (question.description || '') ||
      required !== question.required ||
      JSON.stringify(options) !== JSON.stringify(question.options || [])
    ) {
      debouncedUpdate({
        ...question, // Keep original id and type
        title,
        description: description || undefined,
        required,
        options: options.length > 0 ? options : undefined
      });
    }
    // Depend on local state and the original question object (and the debounced function)
  }, [title, description, required, options, question, debouncedUpdate]);

   // Effect for auto-resizing title textarea (remains the same)
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [title]);

  const addOption = () => {
    const newOption = { id: `opt-${Date.now()}`, value: `Option ${options.length + 1}` };
    setOptions([...options, newOption]); // Update local state, useEffect will trigger save
  };

  const updateOption = (id, value) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, value } : opt));
  };

  const removeOption = (id) => {
    setOptions(options.filter(opt => opt.id !== id));
  };

  // Function to handle duplication
  const handleDuplicate = (e) => {
    e.stopPropagation();
     // Create a new question object, removing the old ID
     const { id, ...questionWithoutId } = question;
     const newQuestionData = {
       ...questionWithoutId,
       title: `${question.title} (Copy)`, // Append copy to title
       // Reset options IDs if they exist
       options: question.options?.map(opt => ({ ...opt, id: `opt-${Date.now()}-${Math.random()}` }))
     };
     // Call context function to add the duplicated question
     addQuestionToForm(eventId, formId, newQuestionData); // Pass eventId, formId
     toast.success("Question duplicated");
  };


  const TypeIcon = () => {
    // ... (TypeIcon logic remains the same)
    switch (question.type) {
      case 'short': return <Type size={18} />;
      case 'paragraph': return <AlignLeft size={18} />;
      case 'multiple_choice': return <List size={18} />;
      case 'checkbox': return <CheckSquare size={18} />;
      case 'dropdown': return <ChevronDown size={18} />;
      case 'date': return <Calendar size={18} />;
      case 'time': return <Clock size={18} />;
      case 'file': return <Upload size={18} />;
      default: return <Type size={18} />;
    }
  };

  return (
    <motion.div
      layout // Animate layout changes
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
       className={cn(
         'question-container group bg-white dark:bg-gray-800 p-6 rounded-lg border border-form-card-border dark:border-gray-700 mb-4 transition-all duration-300 hover:shadow-elevation-1',
         isSelected && 'selected border-l-4 border-l-primary border-t-form-card-border border-r-form-card-border border-b-form-card-border shadow-blue-glow dark:border-l-primary dark:border-t-gray-700 dark:border-r-gray-700 dark:border-b-gray-700' // Use primary color for selected border
       )}
      onClick={onSelect}
    >
       {/* Top section: Icon, Title, Description, Index */}
      <div className="flex items-start gap-3 mb-4">
         <div className="mt-1 text-form-dark-gray dark:text-gray-400">
          <TypeIcon />
        </div>
         <div className="flex-1">
           <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
             className="w-full resize-none overflow-hidden text-lg font-medium border-b-2 border-transparent focus:border-primary bg-transparent focus:outline-none dark:text-white" // Adjusted focus color
            placeholder="Question title"
            rows={1}
          />
           {/* Only show description for non-short answer types */}
           {question.type !== 'short' && (
             <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
               className="w-full mt-2 text-sm text-form-dark-gray dark:text-gray-400 resize-none border-b-2 border-transparent focus:border-primary bg-transparent focus:outline-none" // Adjusted focus color
              placeholder="Description (optional)"
              rows={1}
            />
          )}
        </div>
         {/* Index number (Optional, kept original logic) */}
         {/* <div className="text-form-dark-gray opacity-0 group-hover:opacity-100 transition-opacity">
          {index + 1}
         </div> */}
      </div>

      {/* Content section based on question type */}
       <div className="ml-8 mt-6 pl-3"> {/* Added padding-left */}
        {(question.type === 'short') && (
           <div className="border-b border-form-card-border dark:border-gray-700 py-2 text-form-dark-gray dark:text-gray-400 italic">
            Short answer text
          </div>
        )}
         {(question.type === 'paragraph') && (
           <div className="border-b border-form-card-border dark:border-gray-700 py-2 pb-12 text-form-dark-gray dark:text-gray-400 italic">
            Long answer text
          </div>
        )}
         {(question.type === 'date') && (
           <div className="border-b border-form-card-border dark:border-gray-700 py-2 text-form-dark-gray dark:text-gray-400 flex items-center gap-2 italic">
            <Calendar size={16} /> Date input placeholder
          </div>
        )}
         {(question.type === 'time') && (
           <div className="border-b border-form-card-border dark:border-gray-700 py-2 text-form-dark-gray dark:text-gray-400 flex items-center gap-2 italic">
            <Clock size={16} /> Time input placeholder
          </div>
        )}
         {(question.type === 'file') && (
           <div className="border-b border-form-card-border dark:border-gray-700 py-2 text-form-dark-gray dark:text-gray-400 flex items-center gap-2 italic">
            <Upload size={16} /> File upload placeholder
          </div>
        )}
         {/* Options for relevant types */}
         {(question.type === 'multiple_choice' || question.type === 'checkbox' || question.type === 'dropdown') && (
          <div className="space-y-3">
            {options.map((option, idx) => (
              <div key={option.id} className="flex items-center gap-3">
                {/* Icon based on type */}
                {question.type === 'multiple_choice' && <div className="w-4 h-4 rounded-full border border-form-dark-gray dark:border-gray-500 flex-shrink-0"></div>}
                {question.type === 'checkbox' && <div className="w-4 h-4 border border-form-dark-gray dark:border-gray-500 flex-shrink-0"></div>}
                {question.type === 'dropdown' && <div className="w-4 text-center flex-shrink-0 text-xs text-form-dark-gray dark:text-gray-400">{idx + 1}.</div>}

                <input
                  type="text"
                  value={option.value}
                  onChange={(e) => updateOption(option.id, e.target.value)}
                   className="flex-1 border-b border-form-card-border dark:border-gray-600 focus:border-primary bg-transparent py-1 focus:outline-none dark:text-white"
                  placeholder={`Option ${idx + 1}`}
                />
                 <button
                   onClick={(e) => { e.stopPropagation(); removeOption(option.id); }}
                   className="text-form-dark-gray dark:text-gray-400 hover:text-form-accent-red dark:hover:text-red-500 p-1 rounded-full"
                  aria-label={`Remove option ${idx + 1}`}
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
             {/* Add Option Button */}
             <button
               onClick={(e) => { e.stopPropagation(); addOption(); }}
               className="flex items-center gap-2 text-primary dark:text-blue-400 hover:text-primary/80 dark:hover:text-blue-300 mt-2 text-sm"
             >
               <Plus size={14} />
              Add option
            </button>
          </div>
        )}
      </div>

      {/* Footer section */}
       <div className="flex items-center justify-end mt-6 pt-4 border-t border-form-card-border dark:border-gray-700">
         <div className="flex items-center gap-4">
          {/* Duplicate Button */}
           <Button
             variant="ghost" size="icon"
             onClick={handleDuplicate}
             className="text-form-dark-gray dark:text-gray-400 hover:text-primary dark:hover:text-blue-400"
             aria-label="Duplicate question"
             title="Duplicate question"
           >
             <CopyPlus size={18} />
           </Button>
           {/* Delete Button */}
           <Button
             variant="ghost" size="icon"
             onClick={(e) => {
               e.stopPropagation();
               // --- FIX: Pass eventId and formId ---
               deleteQuestionFromForm(eventId, formId, question.id);
               // --- END FIX ---
             }}
             className="text-form-dark-gray dark:text-gray-400 hover:text-form-accent-red dark:hover:text-red-500"
             aria-label="Delete question"
             title="Delete question"
           >
             <Trash size={18} />
           </Button>

           {/* Drag Handle - Styling only */}
           {/* <Button variant="ghost" size="icon" className="text-form-dark-gray dark:text-gray-400 cursor-move" aria-label="Drag to reorder" title="Drag to reorder">
             <GripVertical size={18} />
           </Button> */}

           <span className="w-px h-6 bg-form-card-border dark:bg-gray-600 mx-2"></span> {/* Separator */}

           {/* Required Toggle */}
           <div className="flex items-center gap-2">
             <Label htmlFor={`required-${question.id}`} className="text-sm text-form-dark-gray dark:text-gray-300 cursor-pointer">Required</Label>
             <Switch
               id={`required-${question.id}`}
               checked={required}
               onCheckedChange={(checked) => {
                 // e.stopPropagation(); // Not needed for Shadcn Switch usually
                 setRequired(checked);
               }}
               aria-label="Toggle question required"
             />
           </div>
         </div>
       </div>
    </motion.div>
  );
};


// AddQuestionButton (Keep as is, maybe adjust styling slightly)
export const AddQuestionButton = ({ onSelectType }) => {
  const [isOpen, setIsOpen] = useState(false);

  const questionTypes = [
    { type: 'short', label: 'Short answer', icon: <Type size={18} /> },
    { type: 'paragraph', label: 'Paragraph', icon: <AlignLeft size={18} /> },
    { type: 'multiple_choice', label: 'Multiple choice', icon: <List size={18} /> },
    { type: 'checkbox', label: 'Checkboxes', icon: <CheckSquare size={18} /> },
    { type: 'dropdown', label: 'Dropdown', icon: <ChevronDown size={18} /> },
    { type: 'date', label: 'Date', icon: <Calendar size={18} /> },
    { type: 'time', label: 'Time', icon: <Clock size={18} /> },
    { type: 'file', label: 'File upload', icon: <Upload size={18} /> },
  ];

  return (
    <div className="relative mt-6 flex justify-center"> {/* Centered button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
         className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-form-card-border dark:border-gray-600 rounded-full py-2 px-5 text-form-dark-gray dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 hover:border-primary dark:hover:border-blue-400 transition-colors shadow-sm hover:shadow-md"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Plus size={18} />
        <span>Add question</span>
      </motion.button>

      {/* Dropdown Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -5 }}
           className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-elevation-2 w-64 overflow-hidden z-20 border dark:border-gray-700"
          role="menu"
        >
          <div className="p-1">
            {questionTypes.map((item) => (
              <button
                key={item.type}
                role="menuitem"
                onClick={() => {
                  onSelectType(item.type);
                  setIsOpen(false);
                }}
                 className="flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm hover:bg-form-light-gray dark:hover:bg-gray-700 rounded-md transition-colors text-gray-700 dark:text-gray-200"
              >
                 <span className="text-gray-500 dark:text-gray-400">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
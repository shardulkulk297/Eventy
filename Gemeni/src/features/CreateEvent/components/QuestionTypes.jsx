import React, { useState, useRef, useEffect } from 'react';
import {
  AlignLeft,
  CheckSquare, // Check import name if different
  ChevronDown,
  Clock,
  CopyPlus,
  GripVertical,
  List,
  Plus,
  Trash,
  Type,
  Calendar, // Added Calendar import
  Upload // Added Upload import
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this utility function exists in your project
import { motion } from 'framer-motion';
import { useForm } from '@/features/CreateEvent/context/FormContext'; // Assuming FormContext provides Question and Option types/shapes implicitly

// Removed interface QuestionProps

export const QuestionCard = ({
  question,
  index,
  isSelected,
  onSelect
}) => {
  const { updateQuestion, deleteQuestion } = useForm();
  const [title, setTitle] = useState(question.title);
  const [description, setDescription] = useState(question.description || '');
  const [required, setRequired] = useState(question.required);
  const [options, setOptions] = useState(question.options || []);
  const titleRef = useRef(null); // Removed type annotation

  useEffect(() => {
    // Debounced update or direct update on change - kept the direct update logic
    // Ensure options comparison is robust if needed (deep compare)
    if (
      title !== question.title ||
      description !== (question.description || '') || // Ensure comparison handles null/undefined description
      required !== question.required ||
      JSON.stringify(options) !== JSON.stringify(question.options || []) // Ensure comparison handles null/undefined options
    ) {
      updateQuestion({
        ...question,
        title,
        description: description || undefined, // Keep sending undefined if empty
        required,
        options: options.length > 0 ? options : undefined // Keep sending undefined if empty
      });
    }
    // Added question object properties to dependency array for accurate updates if question prop changes externally
  }, [title, description, required, options, question, updateQuestion]);

  useEffect(() => {
    // Auto-resize textarea
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [title]);

  const addOption = () => {
    const newOption = { id: `opt-${Date.now()}`, value: '' }; // Removed Option type
    setOptions([...options, newOption]);
  };

  const updateOption = (id, value) => { // Removed type annotations
    setOptions(options.map(opt => opt.id === id ? { ...opt, value } : opt));
  };

  const removeOption = (id) => { // Removed type annotation
    setOptions(options.filter(opt => opt.id !== id));
  };

  const TypeIcon = () => {
    switch (question.type) {
      case 'short':
        return <Type size={18} />;
      case 'paragraph':
        return <AlignLeft size={18} />;
      case 'multiple_choice':
        return <List size={18} />;
      case 'checkbox':
        return <CheckSquare size={18} />;
      case 'dropdown':
        return <ChevronDown size={18} />;
      case 'date':
        return <Calendar size={18} />;
      case 'time':
        return <Clock size={18} />;
      case 'file':
        return <Upload size={18} />;
      default:
        return <Type size={18} />; // Default icon
    }
  };

  // --- Handler for duplicating a question ---
  // NOTE: The original code had a placeholder comment.
  // You need to implement the actual duplication logic in your FormContext
  // or pass down a specific duplication function prop.
  // Example assuming `duplicateQuestion` exists in `useForm()`:
  const handleDuplicate = (e) => {
     e.stopPropagation();
     const { duplicateQuestion } = useForm(); // Assuming this function exists
     if (duplicateQuestion) {
       duplicateQuestion(question.id);
     } else {
       console.warn("duplicateQuestion function not found in FormContext");
       // Fallback or error handling
       const questionCopy = { ...question, id: `q-${Date.now()}` };
       // You would need an 'addQuestionAtIndex' function or similar in context
       // addQuestionAtIndex(questionCopy, index + 1);
     }
  };
  // --- End Handler ---


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'question-container group', // Ensure 'question-container' style exists in your CSS
        isSelected && 'selected'   // Ensure 'selected' style exists in your CSS
      )}
      onClick={onSelect}
    >
      {/* Top section: Icon, Title, Description, Index */}
      <div className="flex items-start gap-3 mb-4">
        <div className="mt-1 text-form-dark-gray"> {/* Ensure text-form-dark-gray exists */}
          <TypeIcon />
        </div>

        <div className="flex-1">
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full resize-none overflow-hidden text-lg font-medium border-b-2 border-transparent focus:border-form-accent-blue bg-transparent focus:outline-none" // Ensure styles exist
            placeholder="Question title"
            rows={1}
          />

          {/* Only show description for non-short answer types */}
           {question.type !== 'short' && (
             <textarea
               value={description} // Use state variable
               onChange={(e) => setDescription(e.target.value)}
               className="w-full mt-2 text-sm text-form-dark-gray resize-none border-b-2 border-transparent focus:border-form-accent-blue bg-transparent focus:outline-none" // Ensure styles exist
               placeholder="Description (optional)"
               rows={1}
             />
           )}
        </div>

        {/* Index number appears on hover */}
        <div className="text-form-dark-gray opacity-0 group-hover:opacity-100 transition-opacity">
          {index + 1}
        </div>
      </div>

      {/* Content section based on question type */}
      <div className="ml-8 mt-6"> {/* Adjust margin as needed */}
        {(question.type === 'short') && (
          <div className="border-b border-form-card-border py-2 text-form-dark-gray"> {/* Ensure styles exist */}
            Short answer text
          </div>
        )}

        {(question.type === 'paragraph') && (
          <div className="border-b border-form-card-border py-2 pb-12 text-form-dark-gray"> {/* Ensure styles exist */}
            Long answer text
          </div>
        )}

        {(question.type === 'date') && (
          <div className="border-b border-form-card-border py-2 text-form-dark-gray flex items-center gap-2">
            <Calendar size={16} /> Date input
          </div>
        )}

        {(question.type === 'time') && (
          <div className="border-b border-form-card-border py-2 text-form-dark-gray flex items-center gap-2">
            <Clock size={16} /> Time input
          </div>
        )}

        {(question.type === 'file') && (
          <div className="border-b border-form-card-border py-2 text-form-dark-gray flex items-center gap-2">
            <Upload size={16} /> File upload
          </div>
        )}

        {/* Options for relevant types */}
        {(question.type === 'multiple_choice' || question.type === 'checkbox' || question.type === 'dropdown') && (
          <div className="space-y-3">
            {options.map((option, idx) => (
              <div key={option.id} className="flex items-center gap-3">
                {/* Icon based on type */}
                {question.type === 'multiple_choice' && (
                  <div className="w-4 h-4 rounded-full border border-form-dark-gray flex-shrink-0"></div>
                )}
                {question.type === 'checkbox' && (
                  <div className="w-4 h-4 border border-form-dark-gray flex-shrink-0"></div>
                )}
                {question.type === 'dropdown' && (
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-xs text-form-dark-gray">
                    {idx + 1}.
                  </div>
                )}

                <input
                  type="text"
                  value={option.value}
                  onChange={(e) => updateOption(option.id, e.target.value)}
                  className="flex-1 border-b border-form-card-border focus:border-form-accent-blue bg-transparent py-1 focus:outline-none" // Ensure styles exist
                  placeholder={`Option ${idx + 1}`}
                />

                <button
                  onClick={(e) => { e.stopPropagation(); removeOption(option.id); }} // Added stopPropagation
                  className="text-form-dark-gray hover:text-form-accent-red p-1 rounded-full" // Ensure styles exist
                  aria-label={`Remove option ${idx + 1}`} // Added aria-label
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}

            {/* Add Option Button */}
            <button
              onClick={(e) => { e.stopPropagation(); addOption(); }} // Added stopPropagation
              className="flex items-center gap-2 text-form-accent-blue hover:text-form-hover-blue mt-2" // Ensure styles exist
            >
              {/* Simple circle or icon for adding */}
              <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                 <Plus size={12} />
              </span>
              {/* Use specific text like "Add option" or "Add 'Other' option" */}
              <span>Add option</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer section: Actions (Duplicate, Delete, Drag), Required toggle */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-form-card-border"> {/* Ensure styles exist */}
        <div className="flex items-center gap-4">
           <button
             onClick={handleDuplicate} // Use the handler defined above
             className="text-form-dark-gray hover:text-form-accent-blue p-1 rounded-full"
             aria-label="Duplicate question"
           >
             <CopyPlus size={18} />
           </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteQuestion(question.id);
            }}
            className="text-form-dark-gray hover:text-form-accent-red p-1 rounded-full" // Ensure styles exist
            aria-label="Delete question"
          >
            <Trash size={18} />
          </button>

          {/* Drag Handle (requires drag-and-drop library implementation) */}
          <div className="text-form-dark-gray cursor-move p-1 rounded-full" aria-label="Drag to reorder">
            <GripVertical size={18} />
          </div>
        </div>

        {/* Required Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-form-dark-gray">Required</span>
          {/* Using a button for toggle */}
          <button
            role="switch" // Add role for accessibility
            aria-checked={required} // Add aria-checked
            onClick={(e) => {
              e.stopPropagation();
              setRequired(!required);
            }}
            className={cn(
              "relative inline-flex flex-shrink-0 h-5 w-10 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-form-accent-blue", // Base styles for toggle
              required ? "bg-form-accent-blue" : "bg-gray-300" // Background color based on state
            )}
          >
             <span className="sr-only">Use setting</span> {/* Screen reader text */}
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200", // Knob styles
                required ? "translate-x-5" : "translate-x-0" // Knob position based on state
              )}
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- AddQuestionButton Component ---
export const AddQuestionButton = ({ onSelectType }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Define question types directly as an array of objects
  const questionTypes = [
    { type: 'short', label: 'Short answer', icon: <Type size={18} /> },
    { type: 'paragraph', label: 'Paragraph', icon: <AlignLeft size={18} /> },
    { type: 'multiple_choice', label: 'Multiple choice', icon: <List size={18} /> },
    { type: 'checkbox', label: 'Checkboxes', icon: <CheckSquare size={18} /> },
    { type: 'dropdown', label: 'Dropdown', icon: <ChevronDown size={18} /> },
    { type: 'date', label: 'Date', icon: <Calendar size={18} /> },
    { type: 'time', label: 'Time', icon: <Clock size={18} /> },
    { type: 'file', label: 'File upload', icon: <Upload size={18} /> },
  ]; // Removed 'as const'

  return (
    <div className="relative mt-4">
      {/* Button to open the dropdown */}
      <motion.button
        whileHover={{ y: -2 }} // Subtle hover animation
        whileTap={{ y: 0 }}    // Tap animation
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-form-card-border rounded-lg py-3 px-4 text-form-dark-gray hover:text-form-accent-blue hover:border-form-accent-blue transition-colors shadow-subtle" // Ensure styles exist
        aria-haspopup="true" // Accessibility attribute
        aria-expanded={isOpen} // Accessibility attribute
      >
        <Plus size={20} />
        <span>Add question</span>
      </motion.button>

      {/* Dropdown Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }} // Added exit animation
          className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-elevation-2 w-64 overflow-hidden z-10" // Ensure styles exist
          role="menu" // Accessibility role
        >
          <div className="p-1">
            {questionTypes.map((item) => (
              <button
                key={item.type}
                role="menuitem" // Accessibility role
                onClick={() => {
                  onSelectType(item.type);
                  setIsOpen(false); // Close menu on selection
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-form-light-gray rounded-md transition-colors" // Ensure styles exist
              >
                <span className="text-form-dark-gray">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
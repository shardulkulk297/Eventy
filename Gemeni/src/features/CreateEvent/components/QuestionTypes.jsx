/* Eventy/Frontend/src/features/CreateEvent/components/QuestionTypes.jsx */
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Checkbox } from "@/shared/ui/checkbox"; // Use Checkbox primitive
import { Label } from "@/shared/ui/label";
import { Card } from '@/shared/ui/card';
import { Switch } from '@/shared/ui/switch';
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"; // If needed for rendering options
import { Plus, Trash2, GripVertical, Copy, ChevronDown, Type, MessageSquare, CheckSquare, CircleDot, ChevronDownSquare, CalendarDays, Clock, ArrowDownUp, Upload, AlertCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/shared/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// --- Question Type Definitions ---
const QUESTION_TYPES_CONFIG = {
  short: { icon: Type, label: 'Short Answer' },
  paragraph: { icon: MessageSquare, label: 'Paragraph' },
  multiple_choice: { icon: CircleDot, label: 'Multiple Choice' },
  checkbox: { icon: CheckSquare, label: 'Checkboxes' },
  dropdown: { icon: ChevronDownSquare, label: 'Dropdown' },
  date: { icon: CalendarDays, label: 'Date' },
  time: { icon: Clock, label: 'Time' },
  // linear_scale: { icon: ArrowDownUp, label: 'Linear Scale' }, // Example
  file: { icon: Upload, label: 'File Upload' },
};

// --- Question Card Component ---
export const QuestionCard = React.memo(({ question, index, isSelected, onSelect, updateQuestion, deleteQuestion }) => {
  // Local state for controlled inputs within the card
  const [localTitle, setLocalTitle] = useState(question.title || '');
  const [localDescription, setLocalDescription] = useState(question.description || '');
  const [localOptions, setLocalOptions] = useState(question.options || []); // Use local state for options array

  // Sync local state if the question prop changes from parent
  useEffect(() => {
    setLocalTitle(question.title || '');
    setLocalDescription(question.description || '');
    // Deep copy or check for changes before setting options to prevent infinite loops
    if (JSON.stringify(question.options) !== JSON.stringify(localOptions)) {
        setLocalOptions(JSON.parse(JSON.stringify(question.options || [])));
    }
  }, [question]); // Rerun when the question object reference changes

  // --- Debounced Update Logic (Optional - Parent FormBuilder handles main debounce) ---
  // If frequent updates within the card cause issues, debounce updates from here too.
  // For now, we update parent state immediately on blur or significant action.

  const handleFieldChange = (field, value) => {
     const updatedQuestion = { ...question, [field]: value };
     // Immediately call updateQuestion - parent FormBuilder will debounce the save to Firestore
     updateQuestion(updatedQuestion);
  };

   // Specific handler for title with potential local state sync
  const handleTitleChange = (e) => {
      setLocalTitle(e.target.value);
      // Optionally debounce updateQuestion call here if needed
      handleFieldChange('title', e.target.value); // Or update on blur/enter
  };
    // Update on blur to reduce calls
  const handleTitleBlur = () => {
       if (localTitle !== question.title) {
          handleFieldChange('title', localTitle);
       }
  };

   // Specific handler for description
  const handleDescriptionChange = (e) => {
      setLocalDescription(e.target.value);
  };
   const handleDescriptionBlur = () => {
       if (localDescription !== question.description) {
          handleFieldChange('description', localDescription || null); // Send null if empty
       }
  };


  // --- Option Management ---
  const handleOptionChange = (index, value) => {
    const newOptions = localOptions.map((opt, i) =>
      i === index ? { ...opt, value: value || '' } : opt // Ensure value is not undefined
    );
    setLocalOptions(newOptions); // Update local state first
    updateQuestion({ ...question, options: newOptions }); // Trigger parent update -> debounce save
  };

  const addOption = () => {
    const newOption = { id: `opt-${Date.now()}`, value: `Option ${localOptions.length + 1}` };
    const newOptions = [...localOptions, newOption];
    setLocalOptions(newOptions);
    updateQuestion({ ...question, options: newOptions });
  };

  const deleteOption = (indexToDelete) => {
     // Prevent deleting the last option if needed, or handle accordingly
    // if (localOptions.length <= 1) {
    //     toast.error("Must have at least one option.");
    //     return;
    // }
    const newOptions = localOptions.filter((_, index) => index !== indexToDelete);
    setLocalOptions(newOptions);
    updateQuestion({ ...question, options: newOptions });
  };

  const handleRequiredToggle = (checked) => {
    handleFieldChange('required', checked);
  };

  const handleCardClick = () => {
      if (!isSelected) {
          onSelect(question.id);
      }
  };

  const hasOptions = question.type === 'multiple_choice' || question.type === 'checkbox' || question.type === 'dropdown';

  return (
    <Card
      className={cn(
        "border transition-all duration-150 ease-in-out",
        isSelected ? 'border-primary ring-2 ring-primary/30 shadow-md' : 'border-border hover:border-muted-foreground/50',
        'bg-card'
      )}
      onClick={handleCardClick}
    >
      <div className='p-5'>
        <div className='flex gap-4 items-start'>
          {/* Drag Handle (Optional) */}
          {/* <GripVertical className='h-5 w-5 text-muted-foreground mt-2 cursor-grab' /> */}

          <div className='flex-grow'>
            {/* Question Title Input */}
            <Input
              value={localTitle}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur} // Update on blur
              placeholder="Question Title"
              className={cn(
                "w-full text-base font-medium h-auto p-1 focus-visible:ring-1 focus-visible:ring-ring",
                 isSelected ? 'bg-transparent' : 'bg-transparent border-transparent hover:border-muted-foreground/30'
               )}
              aria-label="Question title"
            />
             {/* Question Description Input (Optional) */}
              <Textarea
                value={localDescription}
                onChange={handleDescriptionChange}
                onBlur={handleDescriptionBlur}
                placeholder="Description (optional)"
                className={cn(
                   "w-full text-xs font-normal h-auto p-1 mt-1 resize-none text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring min-h-[20px]",
                   isSelected ? 'bg-transparent' : 'bg-transparent border-transparent hover:border-muted-foreground/30'
                 )}
                 rows={1}
                aria-label="Question description"
              />

            {/* Placeholder for the actual input type preview (optional) */}
            <div className="mt-4 text-sm text-muted-foreground opacity-75">
              {/* Example: Short answer placeholder */}
              {question.type === 'short' && <Input placeholder="Short answer text" disabled className="bg-muted/50" />}
              {question.type === 'paragraph' && <Textarea placeholder="Long answer text" disabled className="bg-muted/50" rows={2} />}
              {/* Render options only if they exist */}
              {hasOptions && localOptions && localOptions.length > 0 && (
                <div className='space-y-2 mt-3'>
                  {localOptions.map((option, index) => (
                    <div key={option.id || index} className='flex items-center gap-2'>
                      {/* Icon based on type */}
                      {question.type === 'multiple_choice' && <CircleDot className='h-4 w-4 text-muted-foreground' />}
                      {question.type === 'checkbox' && <CheckSquare className='h-4 w-4 text-muted-foreground' />}
                      {question.type === 'dropdown' && <span className='text-xs text-muted-foreground w-4 text-center'>{index+1}.</span>}

                      <Input
                        value={option.value || ''}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="h-8 text-sm flex-grow bg-muted/50 focus-visible:bg-background"
                        aria-label={`Option ${index + 1} value`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className='h-7 w-7 text-muted-foreground hover:text-destructive'
                        onClick={(e) => { e.stopPropagation(); deleteOption(index); }} // Prevent card click
                        aria-label={`Delete Option ${index + 1}`}
                        disabled={localOptions.length <= 1 && question.type !== 'checkbox'} // Allow deleting last checkbox option
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                  {/* Add Option Button */}
                  <Button variant="ghost" size="sm" onClick={addOption} className='text-primary hover:text-primary text-xs'>
                    <Plus size={14} className='mr-1' /> Add Option
                  </Button>
                </div>
              )}
              {/* Add placeholders for other types */}
              {question.type === 'date' && <div className="flex items-center gap-2 p-2 border rounded bg-muted/50 text-muted-foreground"><CalendarDays size={14}/> Date Input</div>}
              {question.type === 'time' && <div className="flex items-center gap-2 p-2 border rounded bg-muted/50 text-muted-foreground"><Clock size={14}/> Time Input</div>}
              {question.type === 'file' && <div className="flex items-center gap-2 p-2 border rounded bg-muted/50 text-muted-foreground"><Upload size={14}/> File Upload Input</div>}

            </div>
          </div>

           {/* Question Type Indicator (Optional) */}
           {/* <div className='text-xs text-muted-foreground ml-auto pt-1'>
                {QUESTION_TYPES_CONFIG[question.type]?.label || question.type}
           </div> */}
        </div>

        {/* Footer Actions - Show only when selected */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-border flex justify-end items-center gap-3"
            >
               {/* Duplicate Button (Optional) */}
               {/* <Button variant="ghost" size="icon" title="Duplicate Question" onClick={() => console.log("Duplicate action")}> <Copy size={16} /> </Button> */}

                <Label htmlFor={`required-${question.id}`} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    Required
                </Label>
                <Switch
                    id={`required-${question.id}`}
                    checked={question.required || false}
                    onCheckedChange={handleRequiredToggle}
                    aria-label="Mark question as required"
                />
               <Button variant="ghost" size="icon" title="Delete Question" onClick={(e) => { e.stopPropagation(); deleteQuestion(question.id); }}>
                 <Trash2 size={16} className='text-destructive' />
               </Button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Card>
  );
});


// --- Add Question Button Component ---
export const AddQuestionButton = ({ onSelectType }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className='w-full border-dashed border-2 hover:border-solid hover:border-primary hover:text-primary group'>
          <Plus size={18} className='mr-2 group-hover:rotate-90 transition-transform' /> Add Question
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        {Object.entries(QUESTION_TYPES_CONFIG).map(([type, { icon: Icon, label }]) => (
          <DropdownMenuItem key={type} onSelect={() => onSelectType(type)} className='cursor-pointer'>
            <Icon size={16} className='mr-2' /> {label}
          </DropdownMenuItem>
        ))}
        {/* Add separator or more complex types if needed */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
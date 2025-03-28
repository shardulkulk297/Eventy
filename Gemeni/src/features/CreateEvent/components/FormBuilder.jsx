/* Eventy/Frontend/src/features/CreateEvent/components/FormBuilder.jsx */
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from './PageTransition';
import { Button } from '@/shared/ui/button';
import { QuestionCard, AddQuestionButton } from '@/features/CreateEvent/components/QuestionTypes';
import { useForm } from '@/features/CreateEvent/context/FormContext';
import { Eye, ArrowLeft, Settings, Palette } from 'lucide-react';
import { toast } from 'sonner';
import ThemeSelector from './ThemeSelector';
import SettingsDialog from './SettingsDialog';

// Debounce helper function
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


const FormBuilder = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  // Destructure only needed functions/state once
  const { state, createForm, getForm, setCurrentForm, updateForm, addQuestion } = useForm();
  const { currentForm } = state; // Get currentForm from state

  // Local state for inputs
  const [formTitle, setFormTitle] = useState(''); // Initialize empty
  const [formDescription, setFormDescription] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  // Effect for initializing form or creating a new one
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    if (formId === 'new') {
      try {
        const newForm = createForm('Untitled Form', '');
        if (newForm && newForm.id && isMounted) {
          // --- FIX: Navigate to the CORRECT ABSOLUTE path ---
          navigate(`/posts/builder/${newForm.id}`, { replace: true });
          // --- END FIX ---
          // Let the re-render with the new formId handle loading state and data setting
        } else if (isMounted) {
            toast.error("Failed to initiate form creation.");
            navigate('/posts/forms');
        }
      } catch (error) {
        if (isMounted) {
            console.error("Error creating form:", error);
            toast.error("Error during form creation.");
            navigate('/posts/forms');
        }
      }
    } else if (formId) {
      // If formId is not 'new', try to get/set the form
      const existingForm = getForm(formId);
      if (existingForm) {
        if (isMounted) {
          // Avoid calling setCurrentForm if it's already the current one
          if (state.currentForm?.id !== formId) {
             setCurrentForm(formId);
          }
          setFormTitle(existingForm.title);
          setFormDescription(existingForm.description || '');
          setIsLoading(false);
        }
      } else if (isMounted) {
        // Form ID in URL but no data found in context state
        toast.error(`Form data for ID ${formId} not found.`);
        navigate('/posts/forms');
      }
    } else if (isMounted) {
      // No formId in URL
      toast.error("No form specified.");
      navigate('/posts/forms');
    }

    return () => { isMounted = false; };
  // Add ALL external variables/functions used inside the effect
  }, [formId, createForm, getForm, setCurrentForm, navigate, state.currentForm?.id]); // Added state.currentForm?.id

  // Debounced update function using useCallback
  const debouncedUpdate = useCallback(
    debounce((title, description) => {
        if (currentForm) { // Ensure currentForm exists before updating
             updateForm({ id: currentForm.id, title, description }); // Pass ID explicitly
        }
    }, 500), // 500ms debounce
    [updateForm, currentForm] // updateForm and currentForm are dependencies
  );

  // Effect to trigger debounced update when local title/description change
  useEffect(() => {
    // Only run if not loading, there's a current form, and local state differs from context state
    if (!isLoading && currentForm && (formTitle !== currentForm.title || formDescription !== (currentForm.description || ''))) {
        debouncedUpdate(formTitle, formDescription);
    }
    // No cleanup needed here as debounce handles it internally
  }, [formTitle, formDescription, currentForm, isLoading, debouncedUpdate]);


  const handleAddQuestion = (type) => {
    if (!currentForm) return;
    const newQuestion = {
      type, title: 'Untitled Question', required: false,
      options: (type === 'multiple_choice' || type === 'checkbox' || type === 'dropdown')
        ? [{ id: `opt-${Date.now()}`, value: 'Option 1' }] : undefined
    };
    addQuestion(newQuestion);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-form-dark-gray">Loading form...</div>
      </div>
    );
  }

  // Render only if currentForm is loaded
  if (!currentForm) {
       // This case might be hit briefly during navigation or if form load failed
       // You could show a specific message or rely on the redirect in useEffect
       return (
          <div className="flex items-center justify-center h-screen">
              <div className="text-gray-500">Initializing...</div>
          </div>
       );
  }


  return (
    <PageTransition className="min-h-screen bg-form-light-gray pb-16">
      {/* Header */}
       <header className="bg-white border-b border-form-card-border sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/posts/forms')} aria-label="Back to forms">
              <ArrowLeft size={18} />
            </Button>
            <div className="flex flex-col">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="text-base sm:text-lg font-medium focus:outline-none border-b-2 border-transparent focus:border-primary truncate max-w-[150px] sm:max-w-[300px]"
                placeholder="Form title"
                aria-label="Form title input"
              />
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" onClick={() => setThemeDialogOpen(true)} title="Customize Theme" aria-label="Customize Theme">
              <Palette size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSettingsDialogOpen(true)} title="Form Settings" aria-label="Form Settings">
              <Settings size={18} />
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/posts/preview/${currentForm.id}`)} size="sm">
              <Eye size={16} className="mr-1 sm:mr-2" />
              Preview
            </Button>
          </div>
        </div>
      </header>

      {/* Main builder area */}
      <div className="max-w-screen-md mx-auto pt-8 px-4">
        {/* Form Title/Description Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-form-card-border shadow-subtle p-6 mb-6"
        >
          <div className="border-l-4 border-primary pl-4">
             <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full text-xl sm:text-2xl font-medium focus:outline-none border-b-2 border-transparent focus:border-primary mb-2"
                placeholder="Form title"
                aria-label="Form title header input"
             />
             <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full text-sm sm:text-base resize-none text-gray-600 dark:text-gray-400 focus:outline-none border-b-2 border-transparent focus:border-primary"
                placeholder="Form description (optional)"
                rows={2}
                aria-label="Form description input"
            />
          </div>
        </motion.div>

        {/* Questions List */}
        <div className="space-y-4">
          {/* Ensure currentForm.questions is checked before mapping */}
          {currentForm.questions && currentForm.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              isSelected={selectedQuestionId === question.id}
              onSelect={() => setSelectedQuestionId(question.id)}
            />
          ))}
          <AddQuestionButton onSelectType={handleAddQuestion} />
        </div>
      </div>

      {/* Dialogs */}
      <ThemeSelector open={themeDialogOpen} onOpenChange={setThemeDialogOpen} />
      <SettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} />
    </PageTransition>
  );
};

export default FormBuilder;
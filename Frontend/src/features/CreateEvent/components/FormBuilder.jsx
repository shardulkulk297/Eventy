/* Eventy/Frontend/src/features/CreateEvent/components/FormBuilder.jsx */
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

// Debounce helper function (remains the same)
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
  const {
    state: { currentForm: contextForm }, // Renamed to avoid conflict
    createForm,
    // getForm, // We'll use contextForm directly more often now
    setCurrentForm,
    updateForm,
    addQuestion
  } = useForm();

  // Local state for inputs
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start loading by default

  // --- Effect 1: Initialize or Set Current Form in Context ---
  useEffect(() => {
    let isMounted = true;
    // Reset loading state when formId changes, except for 'new' which handles navigation
    if (formId !== 'new') {
        setIsLoading(true);
    }

    if (formId === 'new') {
      // Create new form
      const newForm = createForm('Untitled Form', '');
      if (newForm?.id && isMounted) {
        navigate(`/posts/builder/${newForm.id}`, { replace: true });
        // Don't set loading false here; wait for navigation and context update
      } else if (isMounted) {
        toast.error("Failed to initiate form creation.");
        navigate('/posts/forms');
      }
    } else if (formId) {
      // If formId exists and context doesn't match, tell context to load it
      if (!contextForm || contextForm.id !== formId) {
        // console.log(`FormBuilder Effect 1: Setting current form to ${formId}`);
        setCurrentForm(formId); // This should trigger context update
      } else {
          // If context *already* matches formId, we might be ready (but Effect 2 handles this)
          // console.log(`FormBuilder Effect 1: contextForm already matches ${formId}`);
          // setIsLoading(false); // Removed: Let Effect 2 handle this
      }
    } else if (isMounted) {
      toast.error("No form specified.");
      navigate('/posts/forms');
    }

    return () => { isMounted = false; };
  // Dependencies: Only run when formId changes or context functions change (which should be stable)
  }, [formId, createForm, setCurrentForm, navigate, contextForm?.id]); // Added contextForm?.id to re-evaluate if context changes externally

  // --- Effect 2: Sync Local State FROM Context and Finish Loading ---
  useEffect(() => {
      // Only run if contextForm is available and matches the current URL formId
      if (contextForm && contextForm.id === formId) {
          // console.log(`FormBuilder Effect 2: Syncing local state for ${formId}`);
          setFormTitle(contextForm.title);
          setFormDescription(contextForm.description || '');
          setIsLoading(false); // Mark loading as complete *after* state is synced
      } else {
          // If contextForm is null or doesn't match, ensure we stay in loading state
          // console.log(`FormBuilder Effect 2: Waiting for contextForm ${formId}. Current context: ${contextForm?.id}`);
          setIsLoading(true);
      }
  // Dependencies: Watch the contextForm object reference and formId
  }, [contextForm, formId]);

  // --- Effect 3: Debounced Update for Title/Description (Push TO Context) ---
  // Debounced update function
  const debouncedUpdate = useCallback(
    debounce((id, title, description) => {
      if (id) {
        // console.log(`FormBuilder Debounce: Updating ${id} with title: ${title}`);
        updateForm({ id, title, description });
      }
    }, 750),
    [updateForm] // Depends only on the stable updateForm function
  );

  // Trigger debounce when local state changes *and* not loading
  useEffect(() => {
    // Only run the debounce if we are not loading and have a valid context form ID
    if (!isLoading && contextForm && contextForm.id === formId) {
      // Check if local state differs from context state before debouncing
      const contextTitle = contextForm.title || '';
      const contextDescription = contextForm.description || '';
      if (formTitle !== contextTitle || formDescription !== contextDescription) {
        // console.log(`FormBuilder Effect 3: Debouncing update for ${contextForm.id}`);
        debouncedUpdate(contextForm.id, formTitle, formDescription);
      }
    }
  // Dependencies: local input state, contextForm ID (to ensure we update the right one), loading state, formId, and the stable debounce function
  }, [formTitle, formDescription, contextForm?.id, formId, isLoading, debouncedUpdate]);

  // --- Effect 4: Reset selected question when formId changes ---
  useEffect(() => {
      setSelectedQuestionId(null);
  }, [formId]);


  // Add question function
  const handleAddQuestion = useCallback((type) => { // Wrap in useCallback
    if (!contextForm) return;
    const newQuestion = {
      type, title: 'Untitled Question', required: false,
      options: (type === 'multiple_choice' || type === 'checkbox' || type === 'dropdown')
        ? [{ id: `opt-${Date.now()}`, value: 'Option 1' }] : undefined
    };
    addQuestion(newQuestion); // context's addQuestion should handle adding to currentForm
  }, [contextForm, addQuestion]); // Dependency is stable addQuestion and potentially changing contextForm


  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-form-dark-gray">Loading form...</div>
      </div>
    );
  }

  // Render failsafe if form somehow didn't load correctly after loading=false
  if (!contextForm || contextForm.id !== formId) {
       console.error(`FormBuilder Render Error: isLoading is false, but contextForm ID (${contextForm?.id}) doesn't match URL formId (${formId}).`);
       return (
          <div className="flex flex-col items-center justify-center h-screen">
              <div className="text-red-600 font-semibold mb-4">Error loading form data.</div>
              <Button onClick={() => navigate('/posts/forms')}>Back to Forms</Button>
          </div>
       );
  }

  // Main Render - uses local state for inputs, contextForm for questions list
  return (
    <PageTransition className="min-h-screen bg-form-light-gray pb-16">
      {/* Header */}
       <header className="bg-white border-b border-form-card-border sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Left Side */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/posts/forms')} aria-label="Back to forms">
              <ArrowLeft size={18} />
            </Button>
            <div className="flex flex-col">
              {/* Title Input (Controlled by local state) */}
              <input
                type="text"
                value={formTitle} // Use local state
                onChange={(e) => setFormTitle(e.target.value)}
                className="text-base sm:text-lg font-medium focus:outline-none border-b-2 border-transparent focus:border-primary truncate max-w-[150px] sm:max-w-[300px]"
                placeholder="Form title"
                aria-label="Form title input"
              />
            </div>
          </div>
          {/* Right Side */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" onClick={() => setThemeDialogOpen(true)} title="Customize Theme" aria-label="Customize Theme">
              <Palette size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSettingsDialogOpen(true)} title="Form Settings" aria-label="Form Settings">
              <Settings size={18} />
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/posts/preview/${contextForm.id}`)} size="sm">
              <Eye size={16} className="mr-1 sm:mr-2" />
              Preview
            </Button>
          </div>
        </div>
      </header>

      {/* Main builder area */}
      <div className="max-w-screen-md mx-auto pt-8 px-4">
        {/* Form Header Card (uses local state for inputs) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-form-card-border shadow-subtle p-6 mb-6"
        >
          <div className="border-l-4 border-primary pl-4">
             <input
                type="text"
                value={formTitle} // Use local state
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full text-xl sm:text-2xl font-medium focus:outline-none border-b-2 border-transparent focus:border-primary mb-2"
                placeholder="Form title"
                aria-label="Form title header input"
             />
             <textarea
                value={formDescription} // Use local state
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full text-sm sm:text-base resize-none text-gray-600 dark:text-gray-400 focus:outline-none border-b-2 border-transparent focus:border-primary"
                placeholder="Form description (optional)"
                rows={2}
                aria-label="Form description input"
            />
          </div>
        </motion.div>

        {/* Questions List (reads from contextForm) */}
        <div className="space-y-4">
          {contextForm.questions && contextForm.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              isSelected={selectedQuestionId === question.id}
              onSelect={() => setSelectedQuestionId(question.id)} // Updates local state
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
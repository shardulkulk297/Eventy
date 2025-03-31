/* src/features/CreateEvent/components/FormBuilder.jsx */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from './PageTransition';
import { Button } from '@/shared/ui/button';
import { QuestionCard, AddQuestionButton } from '@/features/CreateEvent/components/QuestionTypes';
// --- FIX: Import renamed context hook ---
import { useEventManager } from '@/features/CreateEvent/context/EventManagerContext';
// --- END FIX ---
import { Eye, ArrowLeft, Settings, Palette } from 'lucide-react';
import { toast } from 'sonner';
import ThemeSelector from './ThemeSelector';
import SettingsDialog from './SettingsDialog';

// Debounce function (keep as is)
function debounce(func, wait) {
  // ... (implementation remains the same)
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
  // --- FIX: Get eventId and formId from params ---
  const { eventId, formId } = useParams();
  // --- END FIX ---
  const navigate = useNavigate();
  // --- FIX: Use renamed context hook and relevant functions ---
  const {
    state,
    setCurrentEventId, // Use this if needed to ensure event context is set
    getFormsForEvent, // Use this to find the specific form
    createFormForEvent,
    updateFormForEvent,
    addQuestionToForm,
    // deleteQuestionFromForm, // Assuming QuestionCard handles delete via context
    // updateQuestionInForm,  // Assuming QuestionCard handles update via context
  } = useEventManager();
  const { currentEvent, currentEventForms } = state; // Get relevant state
  // --- END FIX ---

  const [currentForm, setCurrentFormLocal] = useState(null); // Local state for the specific form being built
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Effect to set the current event context based on URL
  useEffect(() => {
    if (eventId && eventId !== currentEvent?.id) {
       setCurrentEventId(eventId);
        // Note: Fetching forms for the event is now handled within setCurrentEventId/context effect
    }
     // If eventId matches but forms aren't loaded yet, context effect will handle loading
  }, [eventId, currentEvent?.id, setCurrentEventId]);

  // Effect to find or create the form once the event context and forms are ready
  useEffect(() => {
    let isMounted = true;
     setIsLoading(true); // Start loading for form setup

    // Ensure the correct event's forms are loaded in the context state
    if (currentEvent?.id === eventId && currentEventForms) {
        if (formId === 'new') {
             // Create a new form for the *current* event
            createFormForEvent(eventId, 'Untitled Form', '')
                .then(newForm => {
                     if (newForm && newForm.id && isMounted) {
                          // Navigate to the builder page for the newly created form ID
                         navigate(`/posts/events/${eventId}/forms/builder/${newForm.id}`, { replace: true });
                         // The component will re-render with the new formId
                     } else if (isMounted) {
                          toast.error("Failed to initiate form creation.");
                          navigate(`/posts/events/${eventId}/manage`); // Go back to event management
                     }
                })
                .catch(error => {
                     if (isMounted) {
                          console.error("Error creating form:", error);
                          toast.error("Error during form creation.");
                          navigate(`/posts/events/${eventId}/manage`); // Go back
                     }
                 });

        } else if (formId) {
            // Find the existing form within the current event's forms
            const existingForm = currentEventForms.find(f => f.id === formId);
            if (existingForm && isMounted) {
                 setCurrentFormLocal(existingForm); // Set local state for the form being built
                setFormTitle(existingForm.title);
                setFormDescription(existingForm.description || '');
                setIsLoading(false); // Form found and set
            } else if (isMounted) {
                // Form ID exists, but not found in the current event's forms
                toast.error(`Form [${formId}] not found for this event.`);
                navigate(`/posts/events/${eventId}/manage`); // Navigate back
            }
        } else if (isMounted){
             // Invalid state (e.g., no formId and not 'new')
            toast.error("Invalid form URL.");
            navigate(`/posts/events/${eventId}/manage`);
        }
    } else if (!currentEvent && !isLoading && eventId) {
        // Event context is not set yet or event not found
        // This might indicate an issue or just loading delay, handled by outer useEffect
         // console.log("Waiting for event context or event not found...");
         // setIsLoading(true); // Keep loading indicator
    } else {
        // Still loading event or forms, wait for context effects
        // console.log("Waiting for event/forms data...");
         // setIsLoading(true); // Keep loading indicator
    }

     return () => { isMounted = false; };
  // Depend on eventId, formId, currentEvent, currentEventForms, createFormForEvent, navigate
  }, [eventId, formId, currentEvent, currentEventForms, createFormForEvent, navigate]);


  // Debounced update specifically for the form being edited
  const debouncedUpdateForm = useCallback(
    debounce((title, description) => {
      if (currentForm) { // Use the locally managed currentForm
        updateFormForEvent(eventId, { ...currentForm, title, description }); // Pass eventId and full update
      }
    }, 500),
    [updateFormForEvent, eventId, currentForm] // Add eventId and local currentForm
  );

  // Effect to trigger debounced update for title/description changes
  useEffect(() => {
    if (!isLoading && currentForm && (formTitle !== currentForm.title || formDescription !== (currentForm.description || ''))) {
        // Only update if title/desc differs from the *local* form state
        if(formTitle !== currentForm.title || formDescription !== (currentForm.description || '')) {
             debouncedUpdateForm(formTitle, formDescription);
        }
    }
  }, [formTitle, formDescription, currentForm, isLoading, debouncedUpdateForm]);


  const handleAddQuestion = (type) => {
     if (!currentForm) return; // Use local form state
    // --- FIX: Pass eventId and formId to addQuestionToForm ---
    const newQuestionBase = {
      type, title: 'Untitled Question', required: false,
      options: (type === 'multiple_choice' || type === 'checkbox' || type === 'dropdown')
        ? [{ id: `opt-${Date.now()}`, value: 'Option 1' }] : undefined
    };
     addQuestionToForm(eventId, currentForm.id, newQuestionBase);
    // --- END FIX ---
  };

   // Navigate back to the event's form list or management page
   const handleGoBack = () => {
        // Choose the appropriate back destination
        // Option 1: Go to the event-specific forms dashboard
        navigate(`/posts/events/${eventId}/forms`);
        // Option 2: Go to the general event management page
        // navigate(`/posts/events/${eventId}/manage`);
   };


  if (isLoading || !currentForm) { // Show loading if context is loading OR local form isn't set
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-form-dark-gray">Loading form builder...</div>
      </div>
    );
  }

  // Now we know currentForm (local state) is loaded
  return (
    <PageTransition className="min-h-screen bg-form-light-gray pb-16">
      {/* Header */}
      <header className="bg-white border-b border-form-card-border sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 sm:gap-4">
             {/* --- FIX: Update Back Button Navigation --- */}
            <Button variant="ghost" size="icon" onClick={handleGoBack} aria-label="Back to forms">
              <ArrowLeft size={18} />
            </Button>
             {/* --- END FIX --- */}
            <div className="flex flex-col">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                 className="text-base sm:text-lg font-medium focus:outline-none border-b-2 border-transparent focus:border-primary truncate max-w-[150px] sm:max-w-[300px] dark:bg-gray-800 dark:text-white" // Added dark mode styles
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
             {/* --- FIX: Update Preview Navigation --- */}
             <Button variant="secondary" onClick={() => navigate(`/posts/events/${eventId}/forms/preview/${currentForm.id}`)} size="sm">
              <Eye size={16} className="mr-1 sm:mr-2" />
              Preview
            </Button>
             {/* --- END FIX --- */}
          </div>
        </div>
      </header>

      {/* Main builder area */}
      <div className="max-w-screen-md mx-auto pt-8 px-4">
        {/* Form Title/Description Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-form-card-border dark:border-gray-700 shadow-subtle p-6 mb-6"
        >
          <div className="border-l-4 border-primary pl-4">
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full text-xl sm:text-2xl font-medium focus:outline-none border-b-2 border-transparent focus:border-primary mb-2 bg-transparent dark:text-white" // Make bg transparent
              placeholder="Form title"
              aria-label="Form title header input"
            />
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full text-sm sm:text-base resize-none text-gray-600 dark:text-gray-400 focus:outline-none border-b-2 border-transparent focus:border-primary bg-transparent" // Make bg transparent
              placeholder="Form description (optional)"
              rows={2}
              aria-label="Form description input"
            />
          </div>
        </motion.div>

        {/* Questions List */}
        <div className="space-y-4">
           {/* --- FIX: Pass eventId and formId to QuestionCard --- */}
           {(currentForm.questions || []).map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              eventId={eventId} // Pass eventId
              formId={currentForm.id} // Pass formId
              index={index}
              isSelected={selectedQuestionId === question.id}
              onSelect={() => setSelectedQuestionId(question.id)}
            />
          ))}
          {/* --- END FIX --- */}
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
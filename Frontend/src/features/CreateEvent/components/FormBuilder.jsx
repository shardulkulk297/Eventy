/* src/features/CreateEvent/components/FormBuilder.jsx */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { QuestionCard, AddQuestionButton } from '@/features/CreateEvent/components/QuestionTypes';
// --- FIX: Import renamed context hook ---
import { useEventManager } from '@/features/CreateEvent/context/EventManagerContext';
import PageTransition from './PageTransition';
// --- END FIX ---
import { Eye, ArrowLeft, Settings, Palette } from 'lucide-react';
import { toast } from 'sonner';
import ThemeSelector from './ThemeSelector';
import SettingsDialog from './SettingsDialog';
import { Input } from '@/shared/ui/input'; // Import Input for header
import { Skeleton } from '@/shared/ui/skeleton'; // Import Skeleton for loading
import { motion } from 'framer-motion'; // Ensure motion is imported

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

const FormBuilder = () => {
  const { eventId, formId } = useParams();
  const navigate = useNavigate();
  const {
    state,
    setCurrentEventId,
    createFormForEvent,
    updateFormForEvent,
    addQuestionToForm,
  } = useEventManager();
  const { currentEvent, currentEventForms, isLoading: contextLoading, error: contextError } = state; // Get loading/error state

  const [currentForm, setCurrentFormLocal] = useState(null); // Local state for the specific form being built
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // Page-specific loading
  const [pageError, setPageError] = useState(null); // Page-specific error

  // Effect 1: Set the current event context based on URL
  useEffect(() => {
    if (eventId && eventId !== currentEvent?.id) {
       setPageLoading(true); // Start loading when ID changes or context needs update
       setPageError(null); // Clear previous errors
       setCurrentEventId(eventId);
    } else if (eventId && currentEvent?.id === eventId) {
        // Event context is correct, check if forms are loaded (or context finished loading)
        if (!contextLoading) {
            setPageLoading(false); // Stop loading if context isn't loading and event matches
            setPageError(contextError); // Reflect context error if any
        }
    } else if (!eventId) {
        setPageError("Event ID is missing from the URL.");
        setPageLoading(false);
        toast.error("Invalid URL: Event ID missing.");
    } else if (!contextLoading && eventId && !currentEvent) {
         // Context isn't loading, eventId exists, but currentEvent is null (not found)
         setPageError(`Event with ID [${eventId}] could not be found.`);
         setPageLoading(false);
    }
    // If contextLoading is true, pageLoading remains true
  }, [eventId, currentEvent?.id, contextLoading, contextError, setCurrentEventId]);


  // Effect 2: Find or create the form once the event context and forms are ready
  useEffect(() => {
    let isMounted = true;
    // Only proceed if event context is set and forms for *this* event are available
    if (currentEvent?.id === eventId && currentEventForms) {
        // Don't reset loading here, let it be controlled by finding/creating the form
        setPageError(null); // Clear errors if we reached here

        if (formId === 'new') {
            setPageLoading(true); // Ensure loading is true while creating
            createFormForEvent(eventId, 'Untitled Form', '')
                .then(newForm => {
                     if (newForm && newForm.id && isMounted) {
                         navigate(`/posts/events/${eventId}/forms/builder/${newForm.id}`, { replace: true });
                         // State will update on navigation + reload
                     } else if (isMounted) {
                          const errMsg = "Failed to initiate form creation.";
                          toast.error(errMsg);
                          setPageError(errMsg);
                          setPageLoading(false);
                     }
                })
                .catch(error => {
                     if (isMounted) {
                          console.error("Error creating form:", error);
                          const errMsg = "Error during form creation.";
                          toast.error(errMsg);
                          setPageError(errMsg);
                          setPageLoading(false);
                          // Consider navigating back
                          // navigate(`/posts/events/${eventId}/forms`);
                     }
                 });

        } else if (formId) {
            const existingForm = currentEventForms.find(f => f.id === formId);
            if (existingForm && isMounted) {
                 setCurrentFormLocal(existingForm);
                 setFormTitle(existingForm.title || '');
                 setFormDescription(existingForm.description || '');
                 setPageLoading(false); // Form found, stop loading
            } else if (isMounted && !contextLoading) {
                // Forms loaded, ID exists, but form not found
                const errMsg = `Form [${formId}] not found for this event.`;
                toast.error(errMsg);
                setPageError(errMsg);
                setPageLoading(false); // Stop loading, show error
            }
            // else: Context might still be loading forms in background, wait
        } else if (isMounted){
             // Invalid state (no formId and not 'new')
            const errMsg = "Invalid form URL.";
            toast.error(errMsg);
            setPageError(errMsg);
            setPageLoading(false);
        }
    }
    // Else: Waiting for event context or forms to load (handled by Effect 1 and context state)

     return () => { isMounted = false; };
  }, [eventId, formId, currentEvent, currentEventForms, contextLoading, createFormForEvent, navigate]); // Added contextLoading


  // Debounced update specifically for the form being edited
  const debouncedUpdateForm = useCallback(
    debounce((title, description) => {
      if (currentForm && eventId) { // Ensure eventId is also available
        // Only send update if title or description actually changed
        if(title !== currentForm.title || description !== (currentForm.description || '')) {
             updateFormForEvent(eventId, { id: currentForm.id, title, description });
             // Update local state immediately? No, let context handle it to avoid conflicts
        }
      }
    }, 750), // Adjusted debounce time slightly
    [updateFormForEvent, eventId, currentForm] // Dependencies
  );

  // Effect to trigger debounced update for title/description changes from local state
  useEffect(() => {
    // Only run if form is loaded and not loading page anymore
    if (!pageLoading && currentForm) {
      // Compare local state (formTitle, formDescription) with loaded form (currentForm)
       if(formTitle !== currentForm.title || formDescription !== (currentForm.description || '')) {
             debouncedUpdateForm(formTitle, formDescription);
       }
    }
  }, [formTitle, formDescription, currentForm, pageLoading, debouncedUpdateForm]); // Added pageLoading dependency


  const handleAddQuestion = (type) => {
     if (!currentForm || !eventId) return;
    const newQuestionBase = {
      type, title: 'Untitled Question', required: false,
      options: (type === 'multiple_choice' || type === 'checkbox' || type === 'dropdown')
        ? [{ id: `opt-${Date.now()}`, value: 'Option 1' }] : undefined
    };
     addQuestionToForm(eventId, currentForm.id, newQuestionBase);
     // Select the new question? Could find the last question added.
     // setTimeout(() => {
     //     const questions = getFormsForEvent(eventId)?.find(f => f.id === currentForm.id)?.questions;
     //     if (questions && questions.length > 0) {
     //         setSelectedQuestionId(questions[questions.length - 1].id);
     //     }
     // }, 100); // Short delay
  };

   const handleGoBack = () => {
        navigate(`/posts/events/${eventId}/forms`); // Go back to event-specific forms dashboard
   };


  // --- Loading State ---
  if (pageLoading) {
    return (
      <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900 pb-16">
        <div className="max-w-screen-xl mx-auto p-4 md:p-8">
          {/* Header Skeleton */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
                 <div className="flex items-center gap-2 sm:gap-4">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-6 w-40 rounded-md" />
                 </div>
                 <div className="flex items-center gap-1 sm:gap-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-9 w-24 rounded-md" />
                 </div>
            </div>
           </header>
           {/* Body Skeleton */}
           <div className="max-w-screen-md mx-auto pt-8 px-4">
                {/* Title Card Skeleton */}
                 <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
                    <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 space-y-3">
                         <Skeleton className="h-7 w-3/4 rounded-md" />
                         <Skeleton className="h-4 w-full rounded-md" />
                         <Skeleton className="h-4 w-5/6 rounded-md" />
                    </div>
                 </div>
                 {/* Question Card Skeleton */}
                 <div className="space-y-4">
                      <Skeleton className="h-40 w-full rounded-lg" />
                      <Skeleton className="h-40 w-full rounded-lg" />
                 </div>
                 {/* Add Button Skeleton */}
                 <div className="relative mt-6 flex justify-center">
                     <Skeleton className="h-10 w-36 rounded-full" />
                 </div>
           </div>
        </div>
      </PageTransition>
    );
  }

   // --- Error State ---
   if (pageError) {
     return (
        <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900 pb-16">
            <div className="max-w-screen-lg mx-auto p-4 md:p-8">
                 {/* Header with Back Button */}
                 <header className="mb-8 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <Button variant="ghost" size="icon" onClick={handleGoBack} aria-label="Back">
                       <ArrowLeft size={18} />
                     </Button>
                     <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">Form Builder</h1>
                   </div>
                 </header>
                 {/* Error Message */}
                 <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg relative flex items-center gap-3" role="alert">
                     <AlertCircle className="w-5 h-5" /> {/* Ensure AlertCircle is imported */}
                     <span className="block sm:inline">{pageError}</span>
                 </div>
            </div>
        </PageTransition>
     );
  }

  // --- Main Content ---
  // Should only render if !pageLoading and !pageError and currentForm is set
  if (!currentForm) {
      // This case might happen briefly if navigation occurs before state update,
      // or if there was an issue setting the local form state despite no error flag.
       return (
          <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900 pb-16">
               <div className="flex items-center justify-center h-screen text-gray-500 dark:text-gray-400">
                   Preparing form builder...
               </div>
          </PageTransition>
      );
  }

  // Now we know currentForm (local state) is loaded
  return (
    <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900 pb-16"> {/* Standardized background */}
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"> {/* Adjusted borders */}
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={handleGoBack} aria-label="Back to forms">
              <ArrowLeft size={18} />
            </Button>
            <div className="flex flex-col">
              <Input // Use Input component for consistency
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                 className="text-base sm:text-lg font-medium h-auto p-0 bg-transparent border-0 focus-visible:ring-0 shadow-none truncate max-w-[150px] sm:max-w-[300px] dark:text-white" // Simplified styling
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
             <Button variant="secondary" onClick={() => navigate(`/posts/events/${eventId}/forms/preview/${currentForm.id}`)} size="sm">
              <Eye size={16} className="mr-1 sm:mr-2" />
              Preview
            </Button>
          </div>
        </div>
      </header>

      {/* Builder Area */}
      <div className="max-w-screen-md mx-auto pt-8 px-4">
        {/* Form Title/Description Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6" // Adjusted shadow/border
        >
          <div className="border-l-4 border-primary pl-4">
            <Input // Use Input component
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full text-xl sm:text-2xl font-medium focus:outline-none border-b-2 border-transparent focus:border-primary mb-2 bg-transparent dark:text-white"
              placeholder="Form title"
              aria-label="Form title header input"
            />
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full text-sm sm:text-base resize-none text-gray-600 dark:text-gray-400 focus:outline-none border-b-2 border-transparent focus:border-primary bg-transparent"
              placeholder="Form description (optional)"
              rows={2}
              aria-label="Form description input"
            />
          </div>
        </motion.div>

        {/* Questions List */}
        <div className="space-y-4">
           {(currentForm.questions || []).map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              eventId={eventId}
              formId={currentForm.id}
              index={index}
              isSelected={selectedQuestionId === question.id}
              onSelect={() => setSelectedQuestionId(question.id)}
            />
          ))}
          <AddQuestionButton onSelectType={handleAddQuestion} />
        </div>
      </div>

       {/* Dialogs (Uncomment if implemented) */}
       {/* Make sure these components are correctly implemented */}
       <ThemeSelector open={themeDialogOpen} onOpenChange={setThemeDialogOpen} />
       <SettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} />
    </PageTransition>
  );
};

export default FormBuilder;
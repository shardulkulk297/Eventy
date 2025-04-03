/* src/features/CreateEvent/components/FormBuilder.jsx */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { QuestionCard, AddQuestionButton } from '@/features/CreateEvent/components/QuestionTypes';
import { useEventManager } from '@/features/CreateEvent/context/EventManagerContext';
import PageTransition from './PageTransition';
import { Eye, ArrowLeft, Settings, Palette, AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import ThemeSelector from './ThemeSelector';
import SettingsDialog from './SettingsDialog';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // Ensure cn is imported

// Debounce function
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
  const { currentEvent, currentEventForms, isLoading: contextLoading, error: contextError } = state;

  const [currentFormLocal, setCurrentFormLocal] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(formId === 'new'); // Track if actively creating

  // Effect 1: Set event context & handle event-level errors/loading
  useEffect(() => {
    setPageError(null); // Clear previous page errors on ID change
    if (!eventId) {
      setPageError("Event ID is missing from the URL.");
      setPageLoading(false);
      toast.error("Invalid URL: Event ID missing.");
      return; // Stop processing if no eventId
    }

    // If the eventId changes OR the current event in context doesn't match, request update
    if (eventId !== currentEvent?.id) {
       setPageLoading(true); // Show loading when context needs update
       setCurrentEventId(eventId);
    } else {
        // Event context matches, page loading depends on context loading status
        setPageLoading(contextLoading);
        if (!contextLoading && contextError) {
           setPageError(`Error loading event data: ${contextError}`);
        } else if (!contextLoading && !currentEvent) {
           setPageError(`Event with ID [${eventId}] could not be found.`);
        }
    }
  }, [eventId, currentEvent?.id, contextLoading, contextError, setCurrentEventId]);


  // --- REFINED Effect 2: Handle finding existing form or triggering creation for 'new' ---
  useEffect(() => {
    let isMounted = true;

    // --- Conditions to EXIT early (wait for context readiness) ---
    // 1. Still loading context, or event doesn't match, or forms array not ready
    if (contextLoading || !currentEvent || currentEvent.id !== eventId || !currentEventForms) {
        // Keep loading true unless we know there's an error already or event mismatch
        if (!pageError && (contextLoading || !currentEvent || currentEvent.id !== eventId)) {
            setPageLoading(true);
        }
        return () => { isMounted = false; };
    }
    // 2. Already encountered a page-level error in previous steps
    if (pageError) {
        setPageLoading(false); // Ensure loading stops if error occurred
        return () => { isMounted = false; };
    }

    // --- Context is ready for this eventId, and its forms array exists ---
    setPageLoading(true); // Set loading true for the find/create operation
    setPageError(null); // Clear previous errors now that context is ready

    if (formId === 'new') {
        // Only attempt creation if we are still in the 'isCreatingNew' state
        if (isCreatingNew) {
            createFormForEvent(eventId, 'Untitled Form', '')
                .then(newForm => {
                     if (newForm?.id && isMounted) {
                          setIsCreatingNew(false); // Mark creation attempt as done
                          // IMPORTANT: Navigate and let the new render handle state
                          navigate(`/posts/events/${eventId}/forms/builder/${newForm.id}`, { replace: true });
                     } else if (isMounted) {
                          const errMsg = "Failed to initiate form creation (invalid response).";
                          toast.error(errMsg);
                          setPageError(errMsg);
                          setIsCreatingNew(false); // Mark as done even on failure
                          setPageLoading(false);
                     }
                })
                .catch(error => {
                     if (isMounted) {
                          console.error("Error creating form:", error);
                          const errMsg = `Error during form creation: ${error.message || 'Unknown error'}`;
                          toast.error(errMsg);
                          setPageError(errMsg);
                          setIsCreatingNew(false); // Mark as done even on failure
                          setPageLoading(false);
                     }
                 });
        } else {
             // If formId is 'new' but isCreatingNew is false, it means navigation likely happened
             // but this effect ran again before the component updated fully. Do nothing/wait.
             // Or potentially, try finding the form if it exists now? Let's just wait for re-render.
             setPageLoading(false); // Assume navigation will handle it
        }
    } else if (formId) {
         // Find existing form within the loaded currentEventForms
         setIsCreatingNew(false); // Not creating new if formId exists
         const existingForm = currentEventForms.find(f => f.id === formId);
         if (existingForm && isMounted) {
              setCurrentFormLocal(existingForm);
              setFormTitle(existingForm.title || '');
              setFormDescription(existingForm.description || '');
              setPageLoading(false); // Found the form, stop loading
         } else if (isMounted) {
             // Forms loaded, ID exists, but form not found
             const errMsg = `Form [${formId}] not found for event [${eventId}].`;
             toast.error(errMsg);
             setPageError(errMsg);
             setPageLoading(false); // Stop loading, show error
         }
    } else if (isMounted) {
          // URL is invalid (e.g., /builder/ without 'new' or ID)
          setIsCreatingNew(false); // Not creating new
          const errMsg = "Invalid form URL: Form ID is missing.";
          toast.error(errMsg);
          setPageError(errMsg);
          setPageLoading(false); // Stop loading, show error
    }

    // Cleanup function
    return () => { isMounted = false; };

  }, [
      eventId, formId, currentEvent, currentEventForms, contextLoading,
      createFormForEvent, navigate, isCreatingNew, pageError, // Include relevant states/funcs
      setCurrentEventId // Although used in effect 1, changes might influence readiness here
  ]);


  // Debounced update for title/description (using currentFormLocal)
  const debouncedUpdateForm = useCallback(
    debounce((title, description) => {
      if (currentFormLocal && eventId) {
        if (title !== currentFormLocal.title || description !== (currentFormLocal.description || '')) {
             updateFormForEvent(eventId, {
                id: currentFormLocal.id,
                title,
                description
            });
        }
      }
    }, 750),
    [updateFormForEvent, eventId, currentFormLocal]
  );

  // Effect to trigger debounced update
  useEffect(() => {
    // Only run if form is loaded locally and page isn't loading
    if (!pageLoading && currentFormLocal) {
         if(formTitle !== currentFormLocal.title || formDescription !== (currentFormLocal.description || '')) {
             debouncedUpdateForm(formTitle, formDescription);
         }
    }
  }, [formTitle, formDescription, currentFormLocal, pageLoading, debouncedUpdateForm]);

  // Add question handler
  const handleAddQuestion = (type) => {
     if (!currentFormLocal || !eventId) return; // Check local form state
    const newQuestionBase = {
      type, title: 'Untitled Question', required: false,
      options: (type === 'multiple_choice' || type === 'checkbox' || type === 'dropdown')
        ? [{ id: `opt-${Date.now()}`, value: 'Option 1' }] : undefined
    };
     addQuestionToForm(eventId, currentFormLocal.id, newQuestionBase);
  };

  // Navigation handler
  const handleGoBack = () => {
     navigate(`/posts/events/${eventId}/forms`);
  };


  // --- Loading State ---
  if (pageLoading) {
    return (
      <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900 pb-16">
        <div className="max-w-screen-xl mx-auto p-4 md:p-8">
          {/* Header Skeleton */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            {/* ... (skeleton content) ... */}
             <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
                  <div className="flex items-center gap-2 sm:gap-4"> <Skeleton className="h-9 w-9 rounded-md" /> <Skeleton className="h-6 w-40 rounded-md" /> </div>
                  <div className="flex items-center gap-1 sm:gap-2"> <Skeleton className="h-9 w-9 rounded-full" /> <Skeleton className="h-9 w-9 rounded-full" /> <Skeleton className="h-9 w-24 rounded-md" /> </div>
             </div>
          </header>
          {/* Body Skeleton */}
          <div className="max-w-screen-md mx-auto pt-8 px-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
                 <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 space-y-3">
                      <Skeleton className="h-7 w-3/4 rounded-md" /> <Skeleton className="h-4 w-full rounded-md" /> <Skeleton className="h-4 w-5/6 rounded-md" />
                 </div>
              </div>
              <div className="space-y-4"> <Skeleton className="h-40 w-full rounded-lg" /> <Skeleton className="h-40 w-full rounded-lg" /> </div>
              <div className="relative mt-6 flex justify-center"> <Skeleton className="h-10 w-36 rounded-full" /> </div>
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
             <header className="mb-8 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <Button variant="ghost" size="icon" onClick={handleGoBack} aria-label="Back"> <ArrowLeft size={18} /> </Button>
                 <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">Form Builder Error</h1>
               </div>
             </header>
             <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg relative flex items-center gap-3" role="alert">
                 <AlertCircle className="w-5 h-5" />
                 <span className="block sm:inline">{pageError}</span>
             </div>
         </div>
       </PageTransition>
     );
  }

  // --- Main Content ---
  // Render only if loading finished, no error, and local form state is populated
  if (!currentFormLocal) {
       return (
          <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900 pb-16">
               <div className="flex items-center justify-center h-screen text-gray-500 dark:text-gray-400">
                   Preparing form builder... (Form data unavailable)
               </div>
          </PageTransition>
      );
  }

  // Render the actual builder UI
  return (
    <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900 pb-16">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={handleGoBack} aria-label="Back to forms">
              <ArrowLeft size={18} />
            </Button>
            <div className="flex flex-col">
              <Input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="text-base sm:text-lg font-medium h-auto p-0 bg-transparent border-0 focus-visible:ring-0 shadow-none truncate max-w-[150px] sm:max-w-[300px] dark:text-white"
                placeholder="Form title"
                aria-label="Form title input"
              />
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
             {/* Theme/Settings buttons remain commented out */}
             {/* <Button variant="ghost" size="icon" onClick={() => setThemeDialogOpen(true)} title="Customize Theme" aria-label="Customize Theme"><Palette size={18} /></Button> */}
             {/* <Button variant="ghost" size="icon" onClick={() => setSettingsDialogOpen(true)} title="Form Settings" aria-label="Form Settings"><Settings size={18} /></Button> */}
             <Button variant="secondary" onClick={() => navigate(`/posts/events/${eventId}/forms/preview/${currentFormLocal.id}`)} size="sm">
              <Eye size={16} className="mr-1 sm:mr-2" /> Preview
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
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6"
        >
          <div className="border-l-4 border-primary pl-4">
            <Input
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
           {(currentFormLocal.questions || []).map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              eventId={eventId}
              formId={currentFormLocal.id}
              index={index}
              isSelected={selectedQuestionId === question.id}
              onSelect={() => setSelectedQuestionId(question.id)}
            />
          ))}
          <AddQuestionButton onSelectType={handleAddQuestion} />
        </div>
      </div>

       {/* Dialogs (Keep commented) */}
       {/* <ThemeSelector open={themeDialogOpen} onOpenChange={setThemeDialogOpen} /> */}
       {/* <SettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} /> */}
    </PageTransition>
  );
};

export default FormBuilder;
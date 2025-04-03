/* src/features/CreateEvent/components/FormBuilder.jsx */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { QuestionCard, AddQuestionButton } from '@/features/CreateEvent/components/QuestionTypes';
import { useEventManager } from '@/features/CreateEvent/context/EventManagerContext';
import PageTransition from './PageTransition';
import { Eye, ArrowLeft, Settings, Palette, AlertCircle, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Skeleton } from '@/shared/ui/skeleton';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const { eventId, formId: formIdFromUrl } = useParams();
  const navigate = useNavigate();
  const {
    state,
    setCurrentEventId,
    createFormForEvent,
    updateFormForEvent,
    addQuestionToForm,
    updateQuestion, // Assuming context has these (rename if needed)
    deleteQuestion, // Assuming context has these (rename if needed)
  } = useEventManager();
  const { currentEvent, currentEventForms, events: contextEvents, isLoading: contextLoading, error: contextError } = state; // Destructure events

  // --- State Management ---
  const [currentFormLocal, setCurrentFormLocal] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [pageLoading, setPageLoading] = useState(true); // Still useful for initial mount & form find/create phase
  const [pageError, setPageError] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(formId === 'new');
  const [isSaving, setIsSaving] = useState(false);

  console.log(`FormBuilder Render: eventId=${eventId}, formId=${formId}, pageLoading=${pageLoading}, contextLoading=${contextLoading}, currentEventId=${currentEvent?.id}, isCreatingNew=${isCreatingNew}`);

  // --- Effects for Context and Form Loading ---

  // Effect 1: Validate eventId and trigger context update if needed
  useEffect(() => {
    console.log(`Effect 1 RUN: eventId=${eventId}, currentEvent?.id=${currentEvent?.id}, contextLoading=${contextLoading}, contextError=${contextError}`);
    setPageError(null); // Clear page-specific errors when IDs change

    if (!eventId) {
      console.error("Effect 1: Event ID is missing from URL.");
      setPageError("Event ID is missing from the URL.");
      if (pageLoading) setPageLoading(false); // Stop loading if error
      toast.error("Invalid URL: Event ID missing.");
      navigate('/posts/events', { replace: true });
      return;
    }

    // If the event context is already loaded and matches, OR if it's currently loading, do nothing here.
    // Let Effect 2 handle form logic once context is ready.
    if (currentEvent?.id === eventId || contextLoading) {
        console.log(`Effect 1: Context matches eventId (${currentEvent?.id === eventId}) or is loading (${contextLoading}). No action needed.`);
        // If context isn't loading BUT the page is, sync pageLoading state
        if (!contextLoading && pageLoading && currentEvent?.id === eventId) {
            console.log("Effect 1: Context is ready and matches, setting pageLoading false.");
            setPageLoading(false);
        }
        return;
    }

    // If context is NOT loading, and the event ID doesn't match the current context event:
    if (!contextLoading && eventId !== currentEvent?.id) {
        // Check for context errors *before* requesting the event
        if (contextError) {
            console.error(`Effect 1: Context has error: ${contextError}`);
            setPageError(`Error loading event context: ${contextError}`);
            if (pageLoading) setPageLoading(false);
        } else {
             console.log(`Effect 1: Event ID [${eventId}] differs from context [${currentEvent?.id}]. Calling setCurrentEventId.`);
             if (!pageLoading) setPageLoading(true); // Show loading as we trigger context change
             setCurrentEventId(eventId); // Request the context to load this event
        }
    } else if (!contextLoading && !currentEvent && !contextError) {
        // This case should be handled by setCurrentEventId logging "not found"
        // We might still be waiting for the event fetch to complete implicitly
         console.log("Effect 1: Context not loading, no current event, no error. Waiting for context.");
         if (!pageLoading) setPageLoading(true); // Ensure loading indicator stays on
    }

  }, [eventId, currentEvent?.id, contextLoading, contextError, setCurrentEventId, navigate]);
  // **Removed pageLoading from dependency array to fix infinite loop**

  // Effect 2: Handle finding existing form or triggering creation for 'new'
  useEffect(() => {
    let isMounted = true;
     console.log(`Effect 2 RUN: eventId=${eventId}, formId=${formId}, contextLoading=${contextLoading}, currentEventId=${currentEvent?.id}, pageError=${pageError}, isCreatingNew=${isCreatingNew}, currentEventForms length=${currentEventForms?.length}`);

    // --- Conditions to EXIT early ---
    // 1. Context is still loading the event/forms, or there's already a page error
    if (contextLoading || pageError) {
      console.log(`Effect 2: Exiting early - contextLoading=${contextLoading}, pageError=${pageError}`);
      // Ensure pageLoading reflects contextLoading unless there's an error
      if (!pageLoading && contextLoading && !pageError) setPageLoading(true);
      else if (pageLoading && !contextLoading) setPageLoading(false); // Stop if context finished (might have error)
      return () => { isMounted = false; };
    }
    // 2. Event context is ready, but doesn't match the requested eventId (should be caught by Effect 1, but double-check)
    if (!currentEvent || currentEvent.id !== eventId) {
        console.error(`Effect 2: Exiting early - Mismatch or missing currentEvent. currentEvent.id=${currentEvent?.id}, eventId=${eventId}`);
        if (!pageError) setPageError("Event context failed to load or does not match URL."); // Set error if not already set
        if (pageLoading) setPageLoading(false);
        return () => { isMounted = false; };
    }
    // 3. Correct event is loaded, but we are creating new and already did/failed
    if (isCreatingNew && currentFormLocal) {
        console.log("Effect 2: Exiting early - Already handled 'new' form creation.");
        if (pageLoading) setPageLoading(false);
        return () => { isMounted = false; };
    }

    // --- Context is ready for this eventId ---
    // Set loading true specifically for the find/create operation within this effect if not already loading
    if (!pageLoading) setPageLoading(true);
    // Don't clear pageError here, Effect 1 handles that on ID change

    // Handle 'new' form creation
    if (formId === 'new') {
      if (isCreatingNew) {
        console.log(`Effect 2: Creating new form for event ${eventId}...`);
        createFormForEvent(eventId, 'Untitled Form', '')
          .then(newForm => {
            if (newForm?.id && isMounted) {
              console.log(`Effect 2: New form created ${newForm.id}, navigating...`);
              setIsCreatingNew(false); // Prevent re-creation
              // Navigate will trigger a re-render with the new formId
              navigate(`/posts/events/${eventId}/forms/builder/${newForm.id}`, { replace: true });
              // Don't set local state here, let navigation + Effect re-run handle finding the new form
            } else if (isMounted) {
              const errMsg = "Failed to initiate form creation (context did not return a valid form).";
              console.error(`Effect 2: ${errMsg}`);
              toast.error(errMsg);
              setPageError(errMsg);
              setIsCreatingNew(false); // Stop trying
              setPageLoading(false);
            }
          })
          .catch(error => {
            if (isMounted) {
              console.error("Effect 2: Error during createFormForEvent call:", error);
              const errMsg = `Error during form creation: ${error.message || 'Unknown error'}`;
              toast.error(errMsg);
              setPageError(errMsg);
              setIsCreatingNew(false); // Stop trying
              setPageLoading(false);
            }
          });
      } else {
          // formId is 'new', but creation isn't active (likely redirect pending or failed)
          if (isMounted && pageLoading) setPageLoading(false); // Stop loading, wait for navigation or show error
          console.log("Effect 2: formId is 'new', but isCreatingNew is false. State may be inconsistent or navigation pending.");
      }
    }
    // Handle finding an existing form
    else if (formId && currentEventForms) {
      setIsCreatingNew(false);
      console.log(`Effect 2: Searching for form ${formId} in ${currentEventForms.length} loaded forms...`);
      const existingForm = currentEventForms.find(f => f.id === formId);

      if (existingForm && isMounted) {
         // Check if local state needs update
         if (currentFormLocal?.id !== existingForm.id || JSON.stringify(currentFormLocal) !== JSON.stringify(existingForm)) {
            console.log(`Effect 2: Found form ${formId}. Setting local state.`);
            setCurrentFormLocal(existingForm);
            setFormTitle(existingForm.title || '');
            setFormDescription(existingForm.description || '');
         } else {
             console.log(`Effect 2: Found form ${formId}, local state already matches.`);
         }
         if (pageLoading) setPageLoading(false); // Found it, stop loading
      } else if (isMounted) {
        // Correct event loaded, forms loaded (or empty), but specific formId not found
        const errMsg = `Form [${formId}] not found for event [${eventId}]. It might have been deleted or the ID is incorrect.`;
        console.error(`Effect 2: ${errMsg}`);
        if (!pageError) { // Avoid overwriting other errors
            toast.error(errMsg);
            setPageError(errMsg);
        }
        if (pageLoading) setPageLoading(false);
      }
    }
    // Handle case where formId exists but forms haven't loaded (should be caught by contextLoading check earlier)
    else if (formId && !currentEventForms && isMounted) {
        console.warn("Effect 2: formId exists, but currentEventForms is null/empty. Context might still be fetching forms.");
        // Keep pageLoading true, context should eventually provide forms or an error
        if (!pageLoading) setPageLoading(true);
    }
    // Handle invalid URL state (e.g., /builder/ without ID or 'new')
     else if (!formId && isMounted) {
        setIsCreatingNew(false);
        const errMsg = "Invalid form URL: Form ID or 'new' keyword is missing.";
        console.error(`Effect 2: ${errMsg}`);
         if (!pageError) {
            toast.error(errMsg);
            setPageError(errMsg);
        }
        if (pageLoading) setPageLoading(false);
    }

    return () => {
        console.log("Effect 2 CLEANUP");
        isMounted = false;
    }; // Cleanup

  }, [
    eventId, formId, currentEvent, currentEventForms, contextLoading, pageError, // Primary drivers
    createFormForEvent, navigate, isCreatingNew, currentFormLocal // Actions and state affecting logic
  ]);
  // Dependencies refined to only include what's necessary for this effect's logic. pageLoading removed.


  // Debounced update for title/description (Keep as is, but check dependencies)
  const debouncedUpdateFormDetails = useCallback(
    debounce(async (title, description) => {
      // Only save if form exists locally, eventId is present, and not currently saving
      if (currentFormLocal?.id && eventId && !isSaving) {
         // Check if values *actually* changed from the last known saved state (currentFormLocal)
         const descChanged = description !== (currentFormLocal.description || '');
         const titleChanged = title !== currentFormLocal.title;

         if (titleChanged || descChanged) {
            setIsSaving(true);
            try {
                 console.log(`Debounced Save: Updating form ${currentFormLocal.id} - Title: "${title}", Desc: "${description}"`);
                await updateFormForEvent(eventId, {
                    id: currentFormLocal.id,
                    title,
                    description: description || null
                });
                 // Optimistic UI update handled by context reducer, or re-fetch if necessary.
                 // We rely on Effect 2 to update currentFormLocal when context state changes.
                 console.log("Debounced Save: Update successful.");
            } catch (error) {
                 console.error("Debounced save failed:", error);
                 toast.error(`Failed to save form details: ${error.message}`);
            } finally {
                 setIsSaving(false);
            }
         } else {
             console.log("Debounced Save: No changes detected in title/description.");
         }
      } else {
          console.warn("Debounced Save: Skipping - No form loaded, missing eventId, or already saving.");
      }
    }, 1000),
    [updateFormForEvent, eventId, currentFormLocal, isSaving] // Ensure all used variables are dependencies
  );

  // Effect to trigger debounced update for title/description (Keep as is)
  useEffect(() => {
    if (!pageLoading && currentFormLocal && !isCreatingNew) {
      if (formTitle !== currentFormLocal.title || formDescription !== (currentFormLocal.description || '')) {
        debouncedUpdateFormDetails(formTitle, formDescription);
      }
    }
  }, [formTitle, formDescription, currentFormLocal, pageLoading, isCreatingNew, debouncedUpdateFormDetails]);


  // --- Question Handlers (Keep as is, but check context function names) ---
  const handleAddQuestion = useCallback((type) => {
    if (!currentFormLocal?.id || !eventId || contextLoading || pageLoading) {
      toast.warning("Please wait for the form to load fully.");
      return;
    }
    console.log(`handleAddQuestion: Type=${type} for form ${currentFormLocal.id}`);
    const newQuestionBase = {
      type,
      title: 'Untitled Question',
      required: false,
      options: (type === 'multiple_choice' || type === 'checkbox' || type === 'dropdown')
        ? [{ id: `opt-${Date.now()}-${Math.random().toString(16).slice(2)}`, value: 'Option 1' }] : undefined
    };
     addQuestionToForm(eventId, currentFormLocal.id, newQuestionBase)
       .then((updatedForm) => { // Assuming context action might return updated form or questions
          if (updatedForm?.questions?.length > (currentFormLocal.questions?.length || 0)) {
             const newQId = updatedForm.questions[updatedForm.questions.length - 1].id;
             console.log(`Selecting new question: ${newQId}`);
             setSelectedQuestionId(newQId);
          }
       })
       .catch(err => console.error("Error adding question via context:", err));
       // Selection logic might need adjustment based on how context updates state
  }, [currentFormLocal, eventId, contextLoading, pageLoading, addQuestionToForm]);

  const handleUpdateQuestion = useCallback((updatedQuestion) => {
     if (!currentFormLocal?.id || !eventId || !updatedQuestion?.id || contextLoading || pageLoading) return;
     console.log(`handleUpdateQuestion: Updating Q ${updatedQuestion.id} in form ${currentFormLocal.id}`);
     // Assuming context function 'updateQuestion' exists and takes (eventId, formId, question)
     updateQuestion(eventId, currentFormLocal.id, updatedQuestion)
        .catch(err => console.error("Error updating question via context:", err));
  }, [currentFormLocal, eventId, contextLoading, pageLoading, updateQuestion]);

  const handleDeleteQuestion = useCallback((questionId) => {
     if (!currentFormLocal?.id || !eventId || !questionId || contextLoading || pageLoading) return;
     console.log(`handleDeleteQuestion: Deleting Q ${questionId} from form ${currentFormLocal.id}`);
     // Assuming context function 'deleteQuestion' exists and takes (eventId, formId, questionId)
     deleteQuestion(eventId, currentFormLocal.id, questionId)
        .then(() => {
             if (selectedQuestionId === questionId) {
                 setSelectedQuestionId(null); // Deselect if deleted
             }
        })
        .catch(err => console.error("Error deleting question via context:", err));
  }, [currentFormLocal, eventId, contextLoading, pageLoading, deleteQuestion, selectedQuestionId]);


  // --- Navigation ---
  const handleGoBack = () => {
    navigate(`/posts/events/${eventId}/forms`);
  };

  const handlePreview = () => {
    if (!currentFormLocal?.id || !eventId) return;
    navigate(`/posts/events/${eventId}/forms/preview/${currentFormLocal.id}`);
  };


  // --- Render States ---

  // Initial Loading State (Covers context loading and initial form finding/creating)
  if (pageLoading && !pageError) { // Show skeleton only if loading and no error yet
     console.log("Rendering Skeleton Loader");
    return (
      <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900 pb-16">
          {/* Skeleton UI */}
          <div className="max-w-screen-xl mx-auto p-4 md:p-8">
          {/* Header Skeleton */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
             <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
                  <div className="flex items-center gap-2 sm:gap-4"> <Skeleton className="h-9 w-9 rounded-md" /> <Skeleton className="h-6 w-40 rounded-md" /> </div>
                  <div className="flex items-center gap-1 sm:gap-2"> <Skeleton className="h-9 w-9 rounded-full" /> <Skeleton className="h-9 w-9 rounded-full" /> <Skeleton className="h-9 w-24 rounded-md" /> </div>
             </div>
          </header>
          {/* Body Skeleton */}
          <div className="max-w-screen-md mx-auto pt-8 px-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
              <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 space-y-3">
                <Skeleton className="h-7 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
            <div className="relative mt-6 flex justify-center">
              <Skeleton className="h-10 w-36 rounded-full" />
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

   // Error State
   if (pageError) {
     console.log(`Rendering Error State: ${pageError}`);
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
             <Button onClick={handleGoBack} className="mt-4">Go Back</Button>
         </div>
       </PageTransition>
     );
  }

  // Form Not Found State (after loading finishes and form isn't available)
  if (!currentFormLocal && !isCreatingNew) {
     console.log("Rendering Form Not Found State");
     return (
         <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900">
             <div className="flex flex-col items-center justify-center h-screen text-center p-4">
                 <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
                 <h2 className="text-xl font-semibold mb-2 dark:text-white">Form Not Found</h2>
                 <p className="text-gray-600 dark:text-gray-400 mb-4">The requested form could not be found or is still loading. If you just created it, please wait a moment.</p>
                 <Button onClick={handleGoBack}>Back to Event Forms</Button>
             </div>
         </PageTransition>
     );
 }

 // --- Main Content: Builder UI ---
 // Render only if loading is false, no error, and form is loaded OR is 'new' (though 'new' should navigate quickly)
 console.log("Rendering Builder UI");
 const formToDisplay = currentFormLocal; // Use the locally loaded form
 return (
    <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900 pb-16">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={handleGoBack} aria-label="Back to forms">
              <ArrowLeft size={18} />
            </Button>
            <div className="flex items-center gap-1">
                <Input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="text-base sm:text-lg font-medium h-auto p-0 bg-transparent border-0 focus-visible:ring-0 shadow-none truncate max-w-[150px] sm:max-w-[300px] dark:text-white"
                    placeholder="Form title"
                    aria-label="Form title input"
                    disabled={!formToDisplay} // Disable if form not loaded
                />
                 {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="secondary" onClick={handlePreview} size="sm" disabled={!formToDisplay}>
              <Eye size={16} className="mr-1 sm:mr-2" /> Preview
            </Button>
          </div>
        </div>
      </header>

      {/* Builder Area */}
      <div className="max-w-screen-md mx-auto pt-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6"
          onClick={() => setSelectedQuestionId(null)}
        >
          <div className="border-l-4 border-primary pl-4">
            <Input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full text-xl sm:text-2xl font-medium focus:outline-none border-b-2 border-transparent focus:border-primary mb-2 bg-transparent dark:text-white focus-visible:ring-0"
              placeholder="Form title"
              aria-label="Form title header input"
               disabled={!formToDisplay}
            />
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full text-sm sm:text-base resize-none text-gray-600 dark:text-gray-400 focus:outline-none border-b-2 border-transparent focus:border-primary bg-transparent focus-visible:ring-0"
              placeholder="Form description (optional)"
              rows={2}
              aria-label="Form description input"
              disabled={!formToDisplay}
            />
          </div>
        </motion.div>

        {/* Questions List */}
        <div className="space-y-4">
           {(formToDisplay?.questions || []).map((question, index) => (
            <QuestionCard
              key={question.id || `q-new-${index}`}
              question={question}
              index={index}
              isSelected={selectedQuestionId === question.id}
              onSelect={() => setSelectedQuestionId(question.id)}
              updateQuestion={handleUpdateQuestion}
              deleteQuestion={handleDeleteQuestion}
            />
          ))}
          <AddQuestionButton onSelectType={handleAddQuestion} disabled={!formToDisplay} />
        </div>
      </div>
    </PageTransition>
  );
};

export default FormBuilder;

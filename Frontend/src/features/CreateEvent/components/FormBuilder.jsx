/* src/features/CreateEvent/components/FormBuilder.jsx */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { QuestionCard, AddQuestionButton } from '@/features/CreateEvent/components/QuestionTypes'; // Assuming QuestionTypes exports these
import { useEventManager } from '@/features/CreateEvent/context/EventManagerContext';
import PageTransition from './PageTransition';
import { Eye, ArrowLeft, AlertCircle, Save, Loader2 } from 'lucide-react'; // Removed unused Settings, Palette
import { toast } from 'sonner';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Skeleton } from '@/shared/ui/skeleton';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const { eventId, formId: formIdFromUrl } = useParams();
  const navigate = useNavigate();
  const {
    state,
    setCurrentEventId,
    createFormForEvent,
    updateFormForEvent,
    addQuestionToForm,
    updateQuestionInForm, // Renamed from updateQuestion for clarity if needed
    deleteQuestionFromForm, // Renamed from deleteQuestion for clarity if needed
  } = useEventManager();
  // Ensure `events` is destructured if used in Effect 1 guard logic
  const { currentEvent, currentEventForms, events, isLoading: contextLoading, error: contextError } = state;

  // --- State Management ---
  const [currentFormLocal, setCurrentFormLocal] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  // isCreatingNew tracks the *intent* to create on mount if formId is 'new'
  const [isCreatingNew, setIsCreatingNew] = useState(formIdFromUrl === 'new');
  const [isSaving, setIsSaving] = useState(false);
  // Ref to track the ID immediately after creation to handle navigation/state sync
  const justCreatedFormId = useRef(null);

  // --- Effects ---

  // Effect 1: Set event context, handle event loading/errors
  useEffect(() => {
    setPageError(null); // Clear page errors on ID change
    if (!eventId) {
      setPageError("Event ID is missing from the URL.");
      setPageLoading(false);
      return;
    }

    // Wait if context is loading events
    if (contextLoading) {
      setPageLoading(true);
      return;
    }

    // Handle context error after loading
    if (contextError && !currentEvent) {
         setPageError(`Error loading event context: ${contextError}`);
         setPageLoading(false);
         return;
    }

    // Set context or handle event not found after context loaded
    if (eventId !== currentEvent?.id) {
        const eventExists = events?.some(e => e.id === eventId); // Use optional chaining on events
        if (eventExists) {
             setCurrentEventId(eventId);
             setPageLoading(true); // Expect Effect 2 to load the form data
        } else {
             setPageError(`Event [${eventId}] not found.`);
             setPageLoading(false);
        }
    } else {
        // Context matches, Effect 2 will handle form loading
         setPageLoading(true); // Assume form loading is needed initially
    }
  }, [eventId, currentEvent?.id, contextLoading, contextError, events, setCurrentEventId]);


  // Effect 2: Find form, or create if 'new', handle loading/errors for the form itself
  useEffect(() => {
    let isMounted = true;

    // --- Exit Conditions ---
    // 1. Still waiting for Effect 1 to set the correct event context or if there's an error
    if (pageLoading || pageError || !currentEvent || currentEvent.id !== eventId) {
        return () => { isMounted = false; }; // Wait for correct context/error resolution
    }
    // 2. currentEventForms might still be loading in the context if setCurrentEventId just ran
    if (!currentEventForms) {
         console.log("Effect 2: Waiting for currentEventForms to load...");
         // Keep pageLoading true implicitly as it wasn't set false yet
         return () => { isMounted = false; };
    }

    // --- Proceed with Form Logic ---

    if (formIdFromUrl === 'new') {
      if (isCreatingNew) {
        createFormForEvent(eventId, 'Untitled Form', '')
          .then(newForm => {
            if (newForm?.id && isMounted) {
              justCreatedFormId.current = newForm.id; // Store ID temporarily
              setIsCreatingNew(false); // Mark creation process done
              navigate(`/posts/events/${eventId}/forms/builder/${newForm.id}`, { replace: true });
            } else if (isMounted) {
              throw new Error("Invalid form data returned after creation.");
            }
          })
          .catch(error => {
            if (isMounted) {
              console.error("Effect 2: Error creating form:", error);
              setPageError(`Form creation failed: ${error.message}`);
              setIsCreatingNew(false);
              setPageLoading(false);
            }
          });
      } else {
          // If formId is 'new' but not creating, waiting for navigation to complete
          if (pageLoading && isMounted) setPageLoading(false); // Stop loading if stuck
      }
    } else if (formIdFromUrl) {
        // --- Find existing form ---
        setIsCreatingNew(false); // Ensure this is false
        const formToLoad = currentEventForms.find(f => f.id === formIdFromUrl);

        if (formToLoad) {
             if (isMounted) {
                 // Found the form. Update local state ONLY if it differs.
                 if (currentFormLocal?.id !== formToLoad.id || JSON.stringify(currentFormLocal) !== JSON.stringify(formToLoad)) {
                     setCurrentFormLocal(formToLoad);
                     setFormTitle(formToLoad.title || '');
                     setFormDescription(formToLoad.description || '');
                 }
                 setPageError(null); // Clear error if form found
                 if (pageLoading) setPageLoading(false); // Stop loading
                 justCreatedFormId.current = null; // Clear ref
             }
         } else {
             // Form not found in context state yet.
             if (justCreatedFormId.current === formIdFromUrl) {
                 // We just created it, waiting for context state update. Keep loading.
                 if (isMounted && !pageLoading) setPageLoading(true);
             } else if (isMounted) {
                 // Form genuinely not found.
                 const errMsg = `Form [${formIdFromUrl}] not found for event [${eventId}].`;
                 if (pageError !== errMsg) setPageError(errMsg);
                 if (pageLoading) setPageLoading(false);
             }
         }
    } else {
        // --- Invalid URL State: formIdFromUrl is falsy, not 'new' ---
        if (isMounted && !isCreatingNew) {
             const errMsg = "Invalid form URL: Form ID is missing.";
             if (pageError !== errMsg) setPageError(errMsg);
             if (pageLoading) setPageLoading(false);
        }
    }

    return () => { isMounted = false; }; // Cleanup

  }, [
      // Key dependencies driving this effect
      eventId, formIdFromUrl,
      currentEvent, currentEventForms, // Context state
      contextLoading, contextError, // Context status
      isCreatingNew, // Local state for 'new' flow
      pageError, pageLoading, // Local status
      // Actions/navigation
      createFormForEvent, navigate
  ]);


  // Debounced save for title/description
  const debouncedUpdateFormDetails = useCallback(
    debounce(async (title, description) => {
      if (currentFormLocal?.id && eventId && !isSaving) {
        const descChanged = description !== (currentFormLocal.description || '');
        const titleChanged = title !== currentFormLocal.title;
        if (titleChanged || descChanged) {
          setIsSaving(true);
          try {
            await updateFormForEvent(eventId, {
              id: currentFormLocal.id,
              title,
              description: description || null
            });
             // Rely on context state to update currentFormLocal via Effect 2
          } catch (error) {
            toast.error(`Failed to save form details: ${error.message}`);
          } finally {
             // Use setTimeout to give a visual cue that saving happened
             setTimeout(() => setIsSaving(false), 300);
          }
        }
      }
    }, 1000), // 1 second debounce
    [updateFormForEvent, eventId, currentFormLocal, isSaving] // Add isSaving
  );

  // Effect to trigger debounced update
  useEffect(() => {
    // Only trigger if form is loaded locally, not loading page, not creating, and changes exist
    if (!pageLoading && currentFormLocal && !isCreatingNew) {
      if (formTitle !== currentFormLocal.title || formDescription !== (currentFormLocal.description || '')) {
        debouncedUpdateFormDetails(formTitle, formDescription);
      }
    }
  }, [formTitle, formDescription, currentFormLocal, pageLoading, isCreatingNew, debouncedUpdateFormDetails]);


  // --- Question Handlers ---
  const handleAddQuestion = useCallback((type) => {
    if (!currentFormLocal?.id || !eventId || pageLoading) return;
    const newQuestionBase = {
      type, title: 'Untitled Question', required: false,
      options: (type === 'multiple_choice' || type === 'checkbox' || type === 'dropdown')
        ? [{ id: `opt-${Date.now()}-${Math.random().toString(16).slice(2)}`, value: 'Option 1' }] : undefined
    };
    addQuestionToForm(eventId, currentFormLocal.id, newQuestionBase)
      .then((updatedFormOrSuccessFlag) => { // Check what context returns
          // Find the potential new question ID reliably AFTER state update
          // This might require context to return the full updated form or ID
          // For now, just clear selection or select last based on assumption
          // setSelectedQuestionId(findLastQuestionId(updatedForm)); // Need a reliable way
          setSelectedQuestionId(null); // Deselect for simplicity for now
      })
      .catch(err => console.error("Error adding question via context:", err));
  }, [currentFormLocal, eventId, pageLoading, addQuestionToForm]);

  const handleUpdateQuestion = useCallback((updatedQuestion) => {
    if (!currentFormLocal?.id || !eventId || !updatedQuestion?.id || pageLoading) return;
    // Use correct context function name
    updateQuestionInForm(eventId, currentFormLocal.id, updatedQuestion)
      .catch(err => console.error("Error updating question via context:", err));
  }, [currentFormLocal, eventId, pageLoading, updateQuestionInForm]); // Ensure correct function name

  const handleDeleteQuestion = useCallback((questionId) => {
    if (!currentFormLocal?.id || !eventId || !questionId || pageLoading) return;
     // Use correct context function name
    deleteQuestionFromForm(eventId, currentFormLocal.id, questionId)
      .then(() => {
        if (selectedQuestionId === questionId) setSelectedQuestionId(null);
      })
      .catch(err => console.error("Error deleting question via context:", err));
  }, [currentFormLocal, eventId, pageLoading, deleteQuestionFromForm, selectedQuestionId]); // Ensure correct function name

  // --- Navigation ---
  const handleGoBack = () => { navigate(`/posts/events/${eventId}/forms`); };
  const handlePreview = () => { if (currentFormLocal?.id && eventId) navigate(`/posts/events/${eventId}/forms/preview/${currentFormLocal.id}`); };

  // --- Render Logic ---

  if (pageLoading && !pageError) {
    return ( /* ... Skeleton UI ... */
       <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900 pb-16">
         <div className="max-w-screen-xl mx-auto p-4 md:p-8">
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
                    <div className="flex items-center gap-2 sm:gap-4"> <Skeleton className="h-9 w-9 rounded-md" /> <Skeleton className="h-6 w-40 rounded-md" /> </div>
                    <div className="flex items-center gap-1 sm:gap-2"> <Skeleton className="h-9 w-9 rounded-full" /> <Skeleton className="h-9 w-9 rounded-full" /> <Skeleton className="h-9 w-24 rounded-md" /> </div>
                </div>
            </header>
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

  if (pageError) {
    return ( /* ... Error UI ... */
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

  if (!currentFormLocal && !isCreatingNew) {
     return ( /* ... Form Not Found UI ... */
       <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900">
         <div className="flex flex-col items-center justify-center h-screen text-center p-4">
              <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2 dark:text-white">Form Not Available</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">The form data could not be loaded. It might not exist or is still being created.</p>
              <Button onClick={handleGoBack}>Back to Event Forms</Button>
         </div>
       </PageTransition>
     );
  }

   // --- Main Builder UI ---
   const formToDisplay = currentFormLocal; // Use the loaded form
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
                disabled={!formToDisplay} // Disable if no form loaded
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
        {/* Display Form Header/Description card only if formToDisplay is loaded */}
        {formToDisplay ? (
             <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6"
             onClick={() => setSelectedQuestionId(null)}
            >
                <div className={cn("border-l-4 pl-4 transition-colors", selectedQuestionId === null ? 'border-primary' : 'border-muted-foreground/20')}>
                    <Input
                      type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full text-xl sm:text-2xl font-medium focus:outline-none border-b-2 border-transparent focus:border-primary mb-2 bg-transparent dark:text-white focus-visible:ring-0"
                      placeholder="Form title" aria-label="Form title header input"
                    />
                    <Textarea
                      value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full text-sm sm:text-base resize-none text-gray-600 dark:text-gray-400 focus:outline-none border-b-2 border-transparent focus:border-primary bg-transparent focus-visible:ring-0"
                      placeholder="Form description (optional)" rows={2} aria-label="Form description input"
                    />
                </div>
           </motion.div>
        ) : (
             // Optional: Placeholder if form is null but not loading/error (unlikely with current logic)
             <div className="text-center p-6 text-gray-500">Loading form header...</div>
        )}

        {/* Questions List */}
        <div className="space-y-4">
            {(formToDisplay?.questions || []).map((question, index) => (
            <QuestionCard
                key={question.id || `q-new-${index}`} // Handle potential temp IDs if needed
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
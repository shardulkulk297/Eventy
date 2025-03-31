/* src/features/CreateEvent/components/FormResponses.jsx */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageTransition from './PageTransition';
// --- FIX: Use shared Button ---
import { Button } from '@/shared/ui/button';
// --- END FIX ---
// --- FIX: Use renamed hook ---
import { useEventManager } from '@/features/CreateEvent/context/EventManagerContext';
// --- END FIX ---
import { ArrowLeft, Download, ChevronDown, ChevronUp, ExternalLink, FileText, Image } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner'; // Import toast

const FormResponses = () => {
  // --- FIX: Get both eventId and formId ---
  const { eventId, formId } = useParams();
  // --- END FIX ---
  const navigate = useNavigate();
  // --- FIX: Use renamed hook ---
  const { state, setCurrentEventId, fetchResponses, getFormsForEvent } = useEventManager(); // Use fetchResponses if needed, getFormsForEvent to find form title
  const { currentEvent, currentEventForms, currentEventFormResponses } = state; // Use relevant state
  // --- END FIX ---

  const [form, setFormLocal] = useState(null); // Local state for the form details
  const [responses, setResponsesLocal] = useState([]); // Local state for responses
  const [expandedResponseId, setExpandedResponseId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Effect to set the current event context
  useEffect(() => {
    if (eventId && eventId !== currentEvent?.id) {
      setCurrentEventId(eventId);
       // Forms and responses will be fetched by subsequent effects or calls
    } else if (eventId && currentEvent?.id === eventId) {
       // Event context is set, proceed to find form/fetch responses
    } else if (!eventId) {
        toast.error("Event ID missing from URL.");
        navigate('/posts/events');
        setIsLoading(false);
    }
  }, [eventId, currentEvent?.id, setCurrentEventId, navigate]);

  // Effect to find the specific form and fetch/set responses once event context is ready
  useEffect(() => {
     let isMounted = true;
    if (currentEvent?.id === eventId) {
       setIsLoading(true);
       const targetForm = currentEventForms?.find(f => f.id === formId);

       if (targetForm) {
          if (isMounted) setFormLocal(targetForm);
          // Check if responses for this form are already in context state
          const contextResponses = currentEventFormResponses[formId];
          if (contextResponses) {
             if (isMounted) {
                setResponsesLocal(contextResponses);
                setIsLoading(false);
             }
          } else {
             // Fetch responses if not already loaded
             fetchResponses(eventId, formId)
               .then(fetchedResponses => {
                 if (isMounted) {
                    // Responses are now in context state, let's get them
                     setResponsesLocal(fetchedResponses || []); // Update local state
                    setIsLoading(false);
                 }
               })
               .catch(err => {
                 if (isMounted) setIsLoading(false); // Stop loading on error
                 // Error toast handled in fetchResponses
               });
          }
       } else if (currentEventForms) {
         // Forms loaded, but specific form not found
          if (isMounted) {
            toast.error(`Form [${formId}] not found for this event.`);
            navigate(`/posts/events/${eventId}/manage`); // Or back to event dashboard
            setIsLoading(false);
          }
       }
       // else: currentEventForms still loading, wait for context
    }
     return () => { isMounted = false; };
  }, [eventId, formId, currentEvent, currentEventForms, currentEventFormResponses, fetchResponses, navigate]);


  // Helper functions (remain the same)
  const toggleResponseExpansion = (responseId) => { /* ... */ };
  const formatDate = (dateString) => { /* ... */ };
  const findQuestionById = (questionId) => form?.questions.find(q => q.id === questionId);
  const isImageFile = (filename) => { /* ... */ };
  const exportResponsesToCSV = () => { /* ... (Update to use local `form` and `responses` state) */ };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-form-dark-gray dark:text-gray-400">Loading responses...</div>
      </div>
    );
  }

   if (!form) {
     return (
       <div className="flex items-center justify-center h-screen">
         <div className="text-red-500">Form details could not be loaded.</div>
       </div>
     );
   }


  return (
    <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900 pb-16">
       {/* Header */}
       <header className="bg-white dark:bg-gray-800 border-b border-form-card-border dark:border-gray-700 sticky top-0 z-10">
         <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
           <div className="flex items-center gap-4">
             {/* --- FIX: Navigate back to event forms/manage page --- */}
             <Button
               variant="ghost" size="icon"
               onClick={() => navigate(`/posts/events/${eventId}/forms`)} // Go back to event-specific forms list
               aria-label="Back to Event Forms"
             >
               <ArrowLeft size={18} />
             </Button>
             {/* --- END FIX --- */}
             <div className="flex flex-col">
               <span className="text-lg font-medium dark:text-white">Responses: {form.title}</span>
               <span className="text-sm text-form-dark-gray dark:text-gray-400">{responses.length} {responses.length === 1 ? 'response' : 'responses'}</span>
             </div>
           </div>
           <div className="flex items-center gap-2">
             {/* --- FIX: Update View Form navigation --- */}
             <Button
               variant="secondary"
               leftIcon={<ExternalLink size={16} />} // Adjusted size
               onClick={() => navigate(`/posts/events/${eventId}/forms/preview/${form.id}`)}
             >
               View form
             </Button>
             {/* --- END FIX --- */}
             <Button
               onClick={exportResponsesToCSV}
               leftIcon={<Download size={16} />} // Adjusted size
               disabled={responses.length === 0}
             >
               Export CSV
             </Button>
           </div>
         </div>
       </header>

       {/* Responses Content */}
       <div className="max-w-screen-lg mx-auto pt-8 px-4">
         {responses.length === 0 ? (
           <div className="bg-white dark:bg-gray-800 rounded-lg border border-form-card-border dark:border-gray-700 shadow-subtle p-8 text-center">
             <h2 className="text-xl font-medium mb-2 dark:text-white">No responses yet</h2>
             <p className="text-form-dark-gray dark:text-gray-400 mb-6">Share the form link to collect responses.</p>
              {/* --- FIX: Update View Form navigation --- */}
             <Button
               variant="secondary"
               onClick={() => navigate(`/posts/events/${eventId}/forms/preview/${form.id}`)}
             >
               View form
             </Button>
              {/* --- END FIX --- */}
           </div>
         ) : (
           <div className="space-y-4">
             {responses.map((response) => (
               <motion.div
                 key={response.id}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="bg-white dark:bg-gray-800 rounded-lg border border-form-card-border dark:border-gray-700 shadow-subtle overflow-hidden"
               >
                 <div
                   className="p-4 border-b border-form-card-border dark:border-gray-700 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                   onClick={() => toggleResponseExpansion(response.id)}
                 >
                   <div>
                     <span className="font-medium dark:text-gray-200">Response submitted: </span>
                     <span className="text-gray-600 dark:text-gray-400">{formatDate(response.submittedAt)}</span>
                   </div>
                   <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400">
                     {expandedResponseId === response.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                   </button>
                 </div>

                 {expandedResponseId === response.id && (
                   <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                     <div className="p-4 space-y-4">
                       {(response.answers || []).map((answer) => { // Add check for answers array
                         const question = findQuestionById(answer.questionId);
                         if (!question) return <div key={`missing-${answer.questionId}`} className="text-sm text-red-500 italic">Question data missing for ID: {answer.questionId}</div>;

                         return (
                           <div key={answer.questionId} className="grid grid-cols-1 md:grid-cols-[minmax(150px,auto)_1fr] gap-x-4 gap-y-1 border-b dark:border-gray-700 pb-3 last:border-b-0 last:pb-0">
                             <dt className="font-medium text-sm text-gray-700 dark:text-gray-300">{question.title}</dt>
                             <dd className="text-sm text-gray-900 dark:text-white mt-1 md:mt-0">
                               {/* ... (Existing rendering logic for different answer types) ... */}
                                {Array.isArray(answer.value) ? (
                                 <ul className="list-disc list-inside space-y-1">
                                   {answer.value.map((val, i) => ( <li key={i}>{val || <span className="italic text-gray-400">empty</span>}</li> ))}
                                 </ul>
                               ) : question.type === 'file' ? (
                                   <div>
                                       <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 hover:underline">
                                          <FileText size={16} />
                                          {/* Make filename clickable if you store a URL */}
                                          <span>{answer.value || <span className="italic text-gray-400">no file</span>}</span>
                                      </div>
                                       {isImageFile(answer.value) && answer.fileData && (
                                          <img src={answer.fileData} alt="Preview" className="mt-1 border rounded max-w-xs max-h-40 object-contain dark:border-gray-600" />
                                       )}
                                  </div>
                               ) : (
                                  answer.value || <span className="italic text-gray-400">No answer</span>
                               )}
                             </dd>
                           </div>
                         );
                       })}
                     </div>
                   </motion.div>
                 )}
               </motion.div>
             ))}
           </div>
         )}
       </div>
    </PageTransition>
  );
};

export default FormResponses;
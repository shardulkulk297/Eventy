/* src/features/CreateEvent/components/FormPreview.jsx */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageTransition from './PageTransition';
// --- FIX: Use correct Button import ---
import { Button } from '@/shared/ui/button';
// --- END FIX ---
// --- FIX: Use the correct EventManager context hook ---
import { useEventManager } from '@/features/CreateEvent/context/EventManagerContext';
// --- END FIX ---
// --- FIX: Added missing Check icon ---
import { ArrowLeft, Send, Calendar, Clock, Upload, FileText, Image, Check, AlertCircle } from 'lucide-react';
// --- END FIX ---
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Import necessary UI components
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { Checkbox } from '@/shared/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Label } from '@/shared/ui/label';
import { Skeleton } from '@/shared/ui/skeleton'; // Import Skeleton for loading

const FormPreview = () => {
  const { eventId, formId } = useParams();
  const navigate = useNavigate();
  // --- FIX: Use correct context hook and functions ---
  const { state, setCurrentEventId, submitResponse } = useEventManager();
  const { currentEvent, currentEventForms, isLoading: contextLoading, error: contextError } = state;
  // --- END FIX ---

  const [form, setFormLocal] = useState(null);
  const [answers, setAnswers] = useState({});
  const [fileData, setFileData] = useState({}); // For Base64 previews
  const [rawFiles, setRawFiles] = useState({}); // Store actual File objects
  const [submitted, setSubmitted] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // Page-specific loading
  const [pageError, setPageError] = useState(null); // Page-specific error

  // Effect 1: Set the current event context based on URL
  useEffect(() => {
    if (eventId && eventId !== currentEvent?.id) {
      setPageLoading(true); // Start loading when ID changes or context needs update
      setPageError(null); // Clear previous errors
      setCurrentEventId(eventId); // Triggers context to load event & forms
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

  // --- FIX: Corrected Effect 2: Find the specific form once event/forms are ready ---
  useEffect(() => {
      let isMounted = true;
      // Only proceed if event context matches URL, context is not loading, and no page error yet
      if (currentEvent?.id === eventId && !contextLoading && !pageError) {
          const targetForm = currentEventForms?.find(f => f.id === formId);

          if (targetForm) {
              if (isMounted) {
                  setFormLocal(targetForm);
                  // Initialize answers based on the found form
                  const initialAnswers = {};
                  const initialRawFiles = {};
                  const initialFileData = {};
                  (targetForm.questions || []).forEach(q => {
                     initialAnswers[q.id] = q.type === 'checkbox' ? [] : '';
                     initialRawFiles[q.id] = null;
                     initialFileData[q.id] = null;
                  });
                  setAnswers(initialAnswers);
                  setRawFiles(initialRawFiles);
                  setFileData(initialFileData);
                  setPageLoading(false); // Form found, stop page loading
              }
          } else if (currentEventForms && isMounted) {
               // Forms are loaded for the event, but this specific formId wasn't found
               const errMsg = `Form [${formId}] not found for this event.`;
               setPageError(errMsg);
               setPageLoading(false); // Stop loading, show error
               toast.error(errMsg);
          }
          // If currentEventForms is null/undefined, context might still be loading them; Effect 1 handles pageLoading state.
      }
      // else: Waiting for event context or forms to load

      return () => { isMounted = false; }; // Cleanup
  }, [eventId, formId, currentEvent, currentEventForms, contextLoading, pageError]); // Dependencies


  // --- Input Handlers (remain the same) ---
  const handleInputChange = useCallback((questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const handleCheckboxChange = useCallback((questionId, optionValue, checked) => {
    setAnswers(prev => {
      const currentValues = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...currentValues, optionValue] };
      } else {
        return { ...prev, [questionId]: currentValues.filter(v => v !== optionValue) };
      }
    });
  }, []);

  const handleFileChange = useCallback((questionId, file) => {
    if (file) {
      setAnswers(prev => ({ ...prev, [questionId]: file.name }));
      setRawFiles(prev => ({ ...prev, [questionId]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData(prev => ({ ...prev, [questionId]: reader.result }));
      };
      reader.onerror = (error) => {
          console.error("Error reading file:", error);
          setFileData(prev => ({ ...prev, [questionId]: null }));
          toast.error("Could not generate file preview.");
      };
      reader.readAsDataURL(file);
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: '' }));
      setRawFiles(prev => ({ ...prev, [questionId]: null }));
      setFileData(prev => ({ ...prev, [questionId]: null }));
    }
  }, []);


  const handleSubmit = (e) => {
    e.preventDefault();
    // --- FIX: Check pageLoading state as well ---
    if (!form || pageLoading) return;
    // --- END FIX ---

    // --- Validation (remains the same) ---
    const requiredMissing = form.questions
      ?.filter(q => q.required)
      ?.some(q => {
        const answer = answers[q.id];
        if (q.type === 'checkbox') {
          return !answer || answer.length === 0;
        } else if (q.type === 'file') {
          return !answer || answer === '';
        } else {
          return !answer || answer.toString().trim() === '';
        }
      });

    if (requiredMissing) {
      toast.error("Please fill out all required questions (*).");
      return;
    }

    // --- Format Answers (remains the same) ---
    const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value: value,
    }));

    // --- FIX: Ensure correct submitResponse from context is called ---
    submitResponse(eventId, form.id, formattedAnswers);
    // --- END FIX ---

    setSubmitted(true);
    // Success toast is handled within the context function
  };

  // --- Reset Form (remains the same) ---
  const resetForm = useCallback(() => {
     if (!form) return;
      const initialAnswers = {};
      const initialRawFiles = {};
      const initialFileData = {};
      (form.questions || []).forEach(q => {
         initialAnswers[q.id] = q.type === 'checkbox' ? [] : '';
         initialRawFiles[q.id] = null;
         initialFileData[q.id] = null;
      });
      setAnswers(initialAnswers);
      setRawFiles(initialRawFiles);
      setFileData(initialFileData);
      setSubmitted(false);
      toast.info("Form reset. You can submit another response.");
  }, [form]);


  // --- Loading State ---
  if (pageLoading) {
    return (
      <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900 pb-16">
        <div className="max-w-screen-lg mx-auto p-4 md:p-8">
           {/* Header Skeleton */}
           <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-9 w-9 rounded-md" />
                        <Skeleton className="h-6 w-48 rounded-md" />
                    </div>
                    <Skeleton className="h-9 w-32 rounded-md" />
                </div>
            </header>
            {/* Body Skeleton */}
            <div className="max-w-screen-md mx-auto pt-8 px-4">
                {/* Title Card Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-t-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-px">
                    <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 space-y-3">
                        <Skeleton className="h-7 w-3/4 rounded-md" />
                        <Skeleton className="h-4 w-full rounded-md" />
                    </div>
                </div>
                 {/* Question Input Skeleton */}
                 <div className="space-y-px">
                     <Skeleton className="h-28 w-full border-x border-b dark:border-gray-700 bg-white dark:bg-gray-800" />
                     <Skeleton className="h-28 w-full border-x border-b dark:border-gray-700 bg-white dark:bg-gray-800" />
                     <Skeleton className="h-28 w-full border-x border-b rounded-b-lg dark:border-gray-700 bg-white dark:bg-gray-800 mb-6" />
                 </div>
                 {/* Submit Button Skeleton */}
                 <div className="flex justify-between items-center mt-6">
                    <Skeleton className="h-10 w-28 rounded-md" />
                    <Skeleton className="h-4 w-24 rounded-md" />
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
                 <Button variant="ghost" size="icon" onClick={() => navigate(`/posts/events/${eventId}/forms`)} aria-label="Back"> {/* Navigate back to event forms */}
                   <ArrowLeft size={18} />
                 </Button>
                 <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">Form Preview</h1>
               </div>
             </header>
             {/* Error Message */}
             <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg relative flex items-center gap-3" role="alert">
                 <AlertCircle className="w-5 h-5" />
                 <span className="block sm:inline">{pageError}</span>
             </div>
         </div>
       </PageTransition>
     );
  }


  // --- Submitted State (remains the same) ---
  if (submitted) {
    return (
      <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900">
        <div className="max-w-screen-md mx-auto pt-16 px-4 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-subtle p-8 text-center" // Adjusted border
          >
            <div className="w-16 h-16 rounded-full bg-green-500 dark:bg-green-600 mx-auto flex items-center justify-center text-white mb-4">
              <Check size={32} strokeWidth={3}/>
            </div>
            <h2 className="text-2xl font-medium mb-2 dark:text-white">Form submitted</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Thank you for your response!</p> {/* Adjusted text color */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={resetForm}>Submit another response</Button>
              <Button variant="secondary" onClick={() => navigate(`/posts/events/${eventId}/manage`)}> {/* Navigate to event manage */}
                Back to Event
              </Button>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  // --- Main Return: Form Preview ---
  // Render only if form is loaded
  if (!form) {
       // This state should ideally be covered by pageLoading or pageError,
       // but serves as a fallback if form becomes null after loading phase.
       return (
           <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900 pb-16">
              <div className="flex items-center justify-center h-screen text-gray-500 dark:text-gray-400">
                   Form data is unavailable.
               </div>
          </PageTransition>
       )
  }

  return (
    <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900 pb-16">
      {/* Header */}
       <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
         <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
           <div className="flex items-center gap-4">
             <Button
               variant="ghost" size="icon"
               onClick={() => navigate(`/posts/events/${eventId}/forms/builder/${form.id}`)}
               aria-label="Back to Builder"
             >
               <ArrowLeft size={18} />
             </Button>
             <div className="flex flex-col">
               <span className="text-lg font-medium dark:text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg" title={form.title}>Preview: {form.title}</span>
             </div>
           </div>
           <Button onClick={() => navigate(`/posts/events/${eventId}/forms/builder/${form.id}`)}>
             Back to editing
           </Button>
         </div>
       </header>

      {/* Form preview content */}
      <div className="max-w-screen-md mx-auto pt-8 px-4">
        <form onSubmit={handleSubmit}>
          {/* Form header */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white dark:bg-gray-800 rounded-t-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-px" // Adjusted shadow/border
           >
             <div className="border-l-4 border-primary pl-4">
               <h1 className="text-2xl font-medium mb-2 dark:text-white">{form.title}</h1>
               {form.description && <p className="text-gray-500 dark:text-gray-400">{form.description}</p>} {/* Adjusted text color */}
             </div>
           </motion.div>

          {/* Questions */}
          {(form.questions || []).map((question, index) => (
            <QuestionInput
              key={`${question.id}-${index}`} // Add index to key
              question={question}
              value={answers[question.id]}
              filePreview={fileData[question.id]}
              onChange={(value) => handleInputChange(question.id, value)}
              onFileChange={(file) => handleFileChange(question.id, file)}
              onCheckboxChange={(optionValue, checked) => handleCheckboxChange(question.id, optionValue, checked)}
              className={cn(
                "border-x border-b border-gray-200 dark:border-gray-700", // Adjusted borders
                index === (form.questions?.length || 0) - 1 ? 'rounded-b-lg mb-6' : '' // Add bottom rounding/margin to last item
              )}
            />
          ))}

          {/* Submit button */}
           <div className="flex justify-between items-center mt-6">
             <Button type="submit">
                <Send size={16} className="mr-2"/>Submit
             </Button>
             <p className="text-sm text-gray-500 dark:text-gray-400"> {/* Adjusted text color */}
               * Required question
             </p>
           </div>
        </form>
      </div>
    </PageTransition>
  );
};


// --- QuestionInput Component (remains the same as the previous correct version) ---
const QuestionInput = ({ question, value, filePreview, onChange, onFileChange, onCheckboxChange, className }) => {
   const [localFile, setLocalFile] = useState(null);

   const handleLocalFileChange = (e) => {
     const files = e.target.files;
     if (files && files.length > 0) {
       setLocalFile(files[0]);
       onFileChange(files[0]);
     } else {
        setLocalFile(null);
        onFileChange(null);
     }
   };

   const isImageFile = (filename) => {
        if (!filename || typeof filename !== 'string') return false;
        return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(filename);
    };

   useEffect(() => {
       if (question.type === 'file' && !value) {
           setLocalFile(null);
       }
   }, [value, question.type]);

   return (
     <motion.div
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: 0.05 }}
       className={cn("bg-white dark:bg-gray-800 p-6", className)}
     >
       <div className="mb-4">
         <Label htmlFor={question.id} className="flex items-start text-base font-medium dark:text-white">
           {question.title}
           {question.required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
         </Label>
         {question.description && (
           <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{question.description}</p>
         )}
       </div>
       <div className="mt-2">
         {question.type === 'short' && (
           <input
             id={question.id} type="text" value={value || ''} onChange={(e) => onChange(e.target.value)}
             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-gray-50 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
             placeholder="Your answer" required={question.required}
           />
         )}
         {question.type === 'paragraph' && (
           <textarea
             id={question.id} value={value || ''} onChange={(e) => onChange(e.target.value)}
             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 resize-y min-h-[80px] bg-gray-50 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
             placeholder="Your answer" rows={4} required={question.required}
           />
         )}
         {question.type === 'date' && ( <input id={question.id} type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-gray-50 dark:bg-gray-700 dark:text-white dark:[color-scheme:dark]" required={question.required} /> )}
         {question.type === 'time' && ( <input id={question.id} type="time" value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-gray-50 dark:bg-gray-700 dark:text-white dark:[color-scheme:dark]" required={question.required} /> )}
         {question.type === 'multiple_choice' && question.options && (
           <RadioGroup id={question.id} value={value} onValueChange={onChange} required={question.required} className="space-y-2">
             {(question.options || []).map((option) => ( <div key={option.id} className="flex items-center space-x-2"> <RadioGroupItem value={option.value} id={`${question.id}-${option.id}`} /> <Label htmlFor={`${question.id}-${option.id}`} className="dark:text-gray-200 font-normal cursor-pointer">{option.value}</Label> </div> ))}
           </RadioGroup>
         )}
         {question.type === 'checkbox' && question.options && (
           <div id={question.id} className="space-y-2">
             {(question.options || []).map((option) => ( <div key={option.id} className="flex items-center space-x-2"> <Checkbox id={`${question.id}-${option.id}`} checked={(value || []).includes(option.value)} onCheckedChange={(checked) => onCheckboxChange(option.value, checked)} /> <Label htmlFor={`${question.id}-${option.id}`} className="dark:text-gray-200 font-normal cursor-pointer">{option.value}</Label> </div> ))}
           </div>
         )}
         {question.type === 'dropdown' && question.options && (
           <Select value={value} onValueChange={onChange} required={question.required}>
             <SelectTrigger id={question.id} className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white data-[placeholder]:text-gray-400 dark:data-[placeholder]:text-gray-500"> <SelectValue placeholder="Select an option" /> </SelectTrigger>
             <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
               {(question.options || []).map((option) => ( <SelectItem key={option.id} value={option.value} className="dark:text-gray-200 dark:focus:bg-gray-700 cursor-pointer">{option.value}</SelectItem> ))}
             </SelectContent>
           </Select>
         )}
         {question.type === 'file' && (
           <div className="w-full">
             <label className="flex flex-col items-center px-4 py-6 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-blue-400 hover:text-primary dark:hover:text-blue-400 cursor-pointer transition-colors">
               <Upload className="mb-2" size={24} />
               <span className="text-sm text-center">{localFile ? localFile.name : 'Click to upload or drag and drop'}</span>
               <input id={question.id} type="file" className="hidden" onChange={handleLocalFileChange} required={question.required} />
             </label>
             {filePreview && (
                <div className="mt-3 p-2 border rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                    {isImageFile(value) ? ( <img src={filePreview} alt={`Preview of ${value}`} className="max-w-full h-auto max-h-48 object-contain rounded" /> )
                    : ( <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"> <FileText size={18} /> <span className="truncate">{value || "File selected (no preview)"}</span> </div> )}
                </div>
             )}
           </div>
         )}
       </div>
     </motion.div>
   );
 };

export default FormPreview;
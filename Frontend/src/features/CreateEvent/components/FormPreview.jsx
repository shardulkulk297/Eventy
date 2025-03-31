/* src/features/CreateEvent/components/FormPreview.jsx */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageTransition from './PageTransition';
import { Button } from '@/shared/ui/button'; // Use shared Button
import { useEventManager } from '@/features/CreateEvent/context/EventManagerContext';
import { ArrowLeft, Send, Calendar, Clock, Upload, FileText, Image, Check } from 'lucide-react'; // Added Check
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils'; // Import cn utility

// Import necessary UI components (ensure these exist and are styled correctly)
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { Checkbox } from '@/shared/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Label } from '@/shared/ui/label';
// Assuming you have a DatePicker and TimePicker component or integration
// import DatePicker from '@/shared/ui/DatePicker'; // Example
// import TimePicker from '@/shared/ui/TimePicker'; // Example

const FormPreview = () => {
  const { eventId, formId } = useParams();
  const navigate = useNavigate();
  const { state, setCurrentEventId, submitResponse } = useEventManager();
  const { currentEvent, currentEventForms } = state;

  const [form, setFormLocal] = useState(null);
  const [answers, setAnswers] = useState({});
  const [fileData, setFileData] = useState({}); // For Base64 previews
  const [rawFiles, setRawFiles] = useState({}); // Store actual File objects
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorLoading, setErrorLoading] = useState(null); // State for loading errors

  // Effect to set the current event context based on URL
  useEffect(() => {
      let isMounted = true; // Flag to prevent state updates on unmounted component
      setErrorLoading(null); // Reset error on ID change

      if (eventId && eventId !== currentEvent?.id) {
        setCurrentEventId(eventId);
        // Forms will be fetched by the context's effect upon event change
      } else if (eventId && currentEvent?.id === eventId) {
        // Event context is already set, check if forms are loaded
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
                setIsLoading(false); // Form found
            }
         } else if (currentEventForms) {
              // Forms are loaded, but the specific formId wasn't found
              if (isMounted) {
                consterrMsg = `Form [${formId}] not found for this event.`;
                toast.error(errMsg);
                setErrorLoading(errMsg); // Set error state
                setIsLoading(false); // Stop loading
                // Optional: Redirect after a delay or let user click back
                // setTimeout(() => navigate(`/posts/events/${eventId}/manage`), 3000);
              }
         } else if (isMounted && !state.isLoading) {
            // Event context set, forms list is present but maybe empty or form not found yet
            // This could indicate a delay or an actual issue. Setting error state.
             const errMsg = `Could not locate form data. It might still be loading or does not exist.`;
             setErrorLoading(errMsg);
             setIsLoading(false); // Stop showing generic loading
         }
         // else: forms are still loading (state.isLoading is true), wait for context update
      } else if (!eventId) {
          if (isMounted) {
            const errMsg = "Event ID missing from URL.";
            toast.error(errMsg);
            setErrorLoading(errMsg);
            setIsLoading(false);
            navigate('/posts/events'); // Navigate to general event dashboard immediately
          }
      }

      return () => { isMounted = false; }; // Cleanup function
  }, [eventId, formId, currentEvent, currentEventForms, state.isLoading, setCurrentEventId, navigate]);


  // --- Input Handlers ---
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
    if (!form || isLoading) return;

    // --- Validation ---
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

    // --- Format Answers ---
    const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value: value,
    }));

    // --- Submit ---
    submitResponse(eventId, form.id, formattedAnswers);
    setSubmitted(true);
    // Success toast is usually handled within the submitResponse promise/callback
  };

  // --- Reset Form ---
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
      // It's tricky to reset native file inputs visually; changing the key on QuestionInput might work
      toast.info("Form reset. You can submit another response.");
  }, [form]);


  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-form-light-gray dark:bg-gray-900">
        <div className="flex flex-col items-center">
            <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-primary dark:text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-form-dark-gray dark:text-gray-400">Loading form preview...</p>
        </div>
      </div>
    );
  }

  // --- Error State ---
   if (errorLoading) {
     return (
       <div className="flex items-center justify-center h-screen bg-form-light-gray dark:bg-gray-900 px-4">
         <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-md">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-500 mb-3">Error Loading Form</h2>
            <p className="text-form-dark-gray dark:text-gray-400 mb-6">{errorLoading}</p>
            <Button
               variant="outline"
               onClick={() => navigate(`/posts/events/${eventId}/manage`)} // Navigate back
             >
               Back to Event Management
             </Button>
         </div>
       </div>
     );
   }


  // --- Form Not Found State (Should be covered by errorLoading now) ---
  // if (!form) {
  //   return (
  //     <div className="flex items-center justify-center h-screen bg-form-light-gray dark:bg-gray-900">
  //       <div className="text-red-500 dark:text-red-400">Form data could not be loaded or does not exist.</div>
  //     </div>
  //   );
  // }

  // --- Submitted State ---
  if (submitted) {
    return (
      <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900">
        <div className="max-w-screen-md mx-auto pt-16 px-4 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-form-card-border dark:border-gray-700 shadow-subtle p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-green-500 dark:bg-green-600 mx-auto flex items-center justify-center text-white mb-4">
              <Check size={32} strokeWidth={3}/>
            </div>
            <h2 className="text-2xl font-medium mb-2 dark:text-white">Form submitted</h2>
            <p className="text-form-dark-gray dark:text-gray-400 mb-6">Thank you for your response!</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={resetForm}>Submit another response</Button>
              <Button variant="secondary" onClick={() => navigate(`/posts/events/${eventId}/manage`)}>
                Back to Event
              </Button>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  // --- Main Return: Form Preview ---
  return (
    <PageTransition className="min-h-screen bg-form-light-gray dark:bg-gray-900 pb-16">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-form-card-border dark:border-gray-700 sticky top-0 z-10">
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
        {form ? ( // Add check for form existence before rendering form content
          <form onSubmit={handleSubmit}>
            {/* Form header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-t-lg border border-form-card-border dark:border-gray-700 shadow-subtle p-6 mb-px"
            >
              <div className="border-l-4 border-primary pl-4">
                <h1 className="text-2xl font-medium mb-2 dark:text-white">{form.title}</h1>
                {form.description && <p className="text-form-dark-gray dark:text-gray-400">{form.description}</p>}
              </div>
            </motion.div>

            {/* Questions */}
            {(form.questions || []).map((question, index) => (
              <QuestionInput
                key={`${question.id}-${index}`} // Add index to key to help with potential resets if needed
                question={question}
                value={answers[question.id]}
                filePreview={fileData[question.id]}
                onChange={(value) => handleInputChange(question.id, value)}
                onFileChange={(file) => handleFileChange(question.id, file)}
                onCheckboxChange={(optionValue, checked) => handleCheckboxChange(question.id, optionValue, checked)}
                className={cn(
                  "border-x border-form-card-border dark:border-gray-700",
                  index === (form.questions?.length || 0) - 1 ? 'rounded-b-lg mb-6 border-b dark:border-b' : 'border-b dark:border-b'
                )}
              />
            ))}

            {/* Submit button */}
            <div className="flex justify-between items-center mt-6">
              <Button type="submit">
                  <Send size={16} className="mr-2"/>Submit
              </Button>
              <p className="text-sm text-form-dark-gray dark:text-gray-400">
                * Required question
              </p>
            </div>
          </form>
        ) : (
          // This case should ideally be covered by the errorLoading state,
          // but added as a fallback if form becomes null unexpectedly after loading.
          <div className="text-center text-red-500 dark:text-red-400 mt-10">
             Form details are currently unavailable. Please try again later or contact support.
           </div>
        )}
      </div>
    </PageTransition>
  );
};


// --- QuestionInput Component ---
const QuestionInput = ({ question, value, filePreview, onChange, onFileChange, onCheckboxChange, className }) => {
   const [localFile, setLocalFile] = useState(null); // Keep local file state for input display

   // Handle file selection *within* QuestionInput to update local state
   const handleLocalFileChange = (e) => {
     const files = e.target.files;
     if (files && files.length > 0) {
       setLocalFile(files[0]); // Update local state for display
       onFileChange(files[0]); // Propagate *up* to FormPreview state
     } else {
        setLocalFile(null);
        onFileChange(null); // Clear file if selection is cancelled
     }
   };

   // Utility to check if a filename likely represents an image
    const isImageFile = (filename) => {
        if (!filename || typeof filename !== 'string') return false;
        return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(filename);
    };

   // Reset local file state if the value (filename) coming from props becomes empty
   // This helps if the form is reset externally
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
       className={cn("bg-white dark:bg-gray-800 p-6", className)} // Base styling
     >
       {/* Question Title & Description */}
       <div className="mb-4">
         <Label htmlFor={question.id} className="flex items-start text-base font-medium dark:text-white"> {/* Use Label */}
           {question.title}
           {question.required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>} {/* Use consistent red color */}
         </Label>
         {question.description && (
           <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{question.description}</p> 
         )}
       </div>

       {/* Input Element based on Type */}
       <div className="mt-2">
         {question.type === 'short' && (
           <input
             id={question.id}
             type="text"
             value={value || ''}
             onChange={(e) => onChange(e.target.value)}
             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-gray-50 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" // Added bg colors
             placeholder="Your answer"
             required={question.required}
           />
         )}

         {question.type === 'paragraph' && (
           <textarea
             id={question.id}
             value={value || ''}
             onChange={(e) => onChange(e.target.value)}
             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 resize-y min-h-[80px] bg-gray-50 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" // Added bg colors
             placeholder="Your answer"
             rows={4}
             required={question.required}
           />
         )}

         {question.type === 'date' && (
             <input
                 id={question.id}
                 type="date"
                 value={value || ''}
                 onChange={(e) => onChange(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-gray-50 dark:bg-gray-700 dark:text-white dark:[color-scheme:dark]"
                 required={question.required}
             />
         )}

         {question.type === 'time' && (
             <input
                 id={question.id}
                 type="time"
                 value={value || ''}
                 onChange={(e) => onChange(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-gray-50 dark:bg-gray-700 dark:text-white dark:[color-scheme:dark]"
                 required={question.required}
             />
         )}

          {question.type === 'multiple_choice' && question.options && (
             <RadioGroup
                id={question.id}
                value={value}
                onValueChange={onChange}
                required={question.required}
                className="space-y-2"
             >
               {(question.options || []).map((option) => (
                 <div key={option.id} className="flex items-center space-x-2">
                   <RadioGroupItem value={option.value} id={`${question.id}-${option.id}`} />
                   <Label htmlFor={`${question.id}-${option.id}`} className="dark:text-gray-200 font-normal cursor-pointer"> {/* Added cursor-pointer */}
                     {option.value}
                   </Label>
                 </div>
               ))}
             </RadioGroup>
         )}

          {question.type === 'checkbox' && question.options && (
             <div id={question.id} className="space-y-2">
               {(question.options || []).map((option) => (
                 <div key={option.id} className="flex items-center space-x-2">
                   <Checkbox
                     id={`${question.id}-${option.id}`}
                     checked={(value || []).includes(option.value)}
                     onCheckedChange={(checked) => onCheckboxChange(option.value, checked)}
                   />
                   <Label htmlFor={`${question.id}-${option.id}`} className="dark:text-gray-200 font-normal cursor-pointer"> {/* Added cursor-pointer */}
                     {option.value}
                   </Label>
                 </div>
               ))}
               {/* Required validation is handled in handleSubmit */}
             </div>
         )}

          {question.type === 'dropdown' && question.options && (
             <Select
                value={value}
                onValueChange={onChange}
                required={question.required}
             >
               <SelectTrigger id={question.id} className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white data-[placeholder]:text-gray-400 dark:data-[placeholder]:text-gray-500"> {/* Added placeholder styling */}
                 <SelectValue placeholder="Select an option" />
               </SelectTrigger>
               <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                 {(question.options || []).map((option) => (
                   <SelectItem key={option.id} value={option.value} className="dark:text-gray-200 dark:focus:bg-gray-700 cursor-pointer"> {/* Added cursor-pointer */}
                     {option.value}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
         )}

         {question.type === 'file' && (
           <div className="w-full">
             <label className="flex flex-col items-center px-4 py-6 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-blue-400 hover:text-primary dark:hover:text-blue-400 cursor-pointer transition-colors">
               <Upload className="mb-2" size={24} />
               <span className="text-sm text-center">
                  {localFile ? localFile.name : 'Click to upload or drag and drop'}
               </span>
               <input
                 id={question.id}
                 type="file"
                 className="hidden"
                 onChange={handleLocalFileChange}
                 required={question.required}
               />
             </label>
             {/* File Preview Area */}
             {filePreview && (
                <div className="mt-3 p-2 border rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                    {isImageFile(value) ? (
                        <img
                            src={filePreview}
                            alt={`Preview of ${value}`}
                            className="max-w-full h-auto max-h-48 object-contain rounded" // Increased max-h
                        />
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <FileText size={18} />
                            <span className="truncate">{value || "File selected (no preview)"}</span>
                        </div>
                    )}
                </div>
             )}
           </div>
         )}
       </div>
     </motion.div>
   );
 };

export default FormPreview;
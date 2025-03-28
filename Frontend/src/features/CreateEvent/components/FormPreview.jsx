/* Eventy/Frontend/src/features/CreateEvent/components/FormPreview.jsx */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageTransition from './PageTransition';
// --- FIX: Ensure Button import path is correct ---
import Button from './Button'; // Or '@/shared/ui/button' if that's the correct path
// --- END FIX ---
import { useForm } from '@/features/CreateEvent/context/FormContext';
import { ArrowLeft, Send, Calendar, Clock, Upload, FileText, Image } from 'lucide-react'; // Added Image
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const FormPreview = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { getForm, submitResponse } = useForm();

  const [form, setForm] = useState(undefined);
  const [answers, setAnswers] = useState({});
  const [fileData, setFileData] = useState({}); // To store file preview data URLs
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (formId) {
      const currentForm = getForm(formId);
      if (currentForm) {
        setForm(currentForm);
        // Initialize answers
        const initialAnswers = {};
        currentForm.questions.forEach(q => {
          initialAnswers[q.id] = q.type === 'checkbox' ? [] : '';
        });
        setAnswers(initialAnswers);
      } else {
        toast.error(`Form with ID ${formId} not found.`);
        navigate('/posts/forms'); // Redirect to forms dashboard if form not found
      }
    }
  }, [formId, getForm, navigate]); // Added dependencies

  // Input handlers remain the same...
  const handleInputChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCheckboxChange = (questionId, optionValue, checked) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...currentAnswers, optionValue] };
      } else {
        return { ...prev, [questionId]: currentAnswers.filter(v => v !== optionValue) };
      }
    });
  };

  const handleFileChange = (questionId, file) => {
    if (file) {
      // Store the file name in answers
      handleInputChange(questionId, file.name);
      // Create a preview URL for the file
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData(prev => ({
          ...prev,
          [questionId]: reader.result
        }));
      };
      reader.readAsDataURL(file);
    } else {
      // Clear if no file selected
      handleInputChange(questionId, '');
      setFileData(prev => {
          const newState = {...prev};
          delete newState[questionId];
          return newState;
      });
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    const requiredMissing = form?.questions
      .filter(q => q.required)
      .some(q => {
        const answer = answers[q.id];
        // Check for empty string, empty array, or null/undefined
        return answer === null || answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0);
      });

    if (requiredMissing) {
      toast.error("Please fill in all required fields marked with *");
      return;
    }

    // Format answers including file data URIs (optional, consider security/storage implications)
    const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value,
      // Include fileData if you need to store the preview/base64 data (often not recommended for large files)
      // fileData: fileData[questionId] || null
    }));

    if (form) {
      submitResponse(form.id, formattedAnswers);
      setSubmitted(true);
      toast.success("Form submitted successfully!");
    }
  };

  const resetForm = () => {
    if (form) {
      const initialAnswers = {};
      form.questions.forEach(q => {
        initialAnswers[q.id] = q.type === 'checkbox' ? [] : '';
      });
      setAnswers(initialAnswers);
      setFileData({});
      setSubmitted(false);
    }
  };

  // Loading state remains the same...
  if (!form) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-form-dark-gray">Loading form preview...</div>
      </div>
    );
  }

  // Submitted state remains the same...
  if (submitted) {
    return (
      <PageTransition className="min-h-screen bg-form-light-gray flex items-center justify-center p-4">
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg border border-form-card-border shadow-lg p-8 text-center max-w-md w-full" // Added max-width
        >
             <div className="w-16 h-16 rounded-full bg-form-accent-green mx-auto flex items-center justify-center text-white mb-4">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> {/* Increased size */}
                 <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/> {/* Increased strokeWidth */}
               </svg>
             </div>
            <h2 className="text-2xl font-medium mb-2">Form submitted</h2>
            <p className="text-form-dark-gray mb-6">Thank you for your response!</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={resetForm}>Submit another response</Button>
                {/* --- FIX: Navigate back to the forms dashboard (nested) --- */}
                <Button variant="secondary" onClick={() => navigate('/posts/forms')}>
                    Back to Forms
                </Button>
                {/* --- END FIX --- */}
            </div>
        </motion.div>
    </PageTransition>
    );
  }

  // Main form preview render
  return (
    <PageTransition className="min-h-screen bg-form-light-gray pb-16">
      {/* Header */}
      <header className="bg-white border-b border-form-card-border sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {/* --- FIX: Navigate back to the correct builder path --- */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/posts/builder/${form.id}`)} // Corrected path
              aria-label="Back to editing"
            >
              <ArrowLeft size={18} />
            </Button>
            {/* --- END FIX --- */}
            <div className="flex flex-col">
              <span className="text-lg font-medium truncate max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg">Preview: {form.title}</span>
            </div>
          </div>
          {/* --- FIX: Navigate back to the correct builder path --- */}
          <Button onClick={() => navigate(`/posts/builder/${form.id}`)}>
            Back to editing
          </Button>
           {/* --- END FIX --- */}
        </div>
      </header>

      {/* Form preview content */}
      <div className="max-w-screen-md mx-auto pt-8 px-4">
        <form onSubmit={handleSubmit}>
          {/* Form header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-t-lg border border-form-card-border shadow-subtle p-6 mb-px"
          >
            <div className="border-l-4 border-form-accent-blue pl-4">
              <h1 className="text-2xl font-medium mb-2">{form.title}</h1>
              {form.description && <p className="text-form-dark-gray">{form.description}</p>}
            </div>
             <p className="text-xs text-red-600 mt-4">* Indicates required question</p>
          </motion.div>

          {/* Questions */}
          {form.questions.map((question, index) => (
            <QuestionInput
              key={question.id}
              question={question}
              value={answers[question.id]}
              filePreview={fileData[question.id]} // Pass file preview data
              onChange={(value) => handleInputChange(question.id, value)}
              onFileChange={(file) => handleFileChange(question.id, file)}
              onCheckboxChange={(value, checked) => handleCheckboxChange(question.id, value, checked)}
              // Add rounded-b-lg to the last question card
              className={index === form.questions.length - 1 ? 'rounded-b-lg' : 'mb-px'}
            />
          ))}

          {/* Submit button */}
          <div className="mt-6 mb-10 flex justify-between items-center">
            <Button
              type="submit"
              rightIcon={<Send size={16} />}
            >
              Submit
            </Button>
             {/* Removed the "* Required question" text from here as it's now in the header */}
          </div>
        </form>
      </div>
    </PageTransition>
  );
};


// QuestionInput Component (minor update for file preview)
const QuestionInput = ({
  question,
  value,
  filePreview, // Receive file preview data
  onChange,
  onFileChange,
  onCheckboxChange,
  className
}) => {
  // File handling state remains local to this component
  const [fileName, setFileName] = useState(value || ''); // Use value for initial file name display

  const handleLocalFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileName(files[0].name); // Update local display name
      onFileChange(files[0]); // Pass the file object up
    } else {
      setFileName('');
      onFileChange(null); // Pass null up if cleared
    }
  };

  const isImageFile = (filename) => {
    return /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(filename || '');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }} // Slight delay for cascade effect
      className={`bg-white border-x border-b border-form-card-border shadow-sm p-6 ${className}`} // Adjusted border
    >
      <div className="mb-4">
        <div className="flex items-start">
          <h3 className="text-base font-medium">{question.title}</h3>
          {question.required && <span className="text-form-accent-red ml-1">*</span>}
        </div>
        {question.description && (
          <p className="text-sm text-form-dark-gray mt-1">{question.description}</p>
        )}
      </div>

      {/* Input Types */}
      {question.type === 'short' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-form-card-border rounded-md focus:border-form-accent-blue focus:ring-1 focus:ring-form-accent-blue/50 outline-none" // Added focus ring
          placeholder="Your answer"
          required={question.required}
        />
      )}

      {question.type === 'paragraph' && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-form-card-border rounded-md focus:border-form-accent-blue resize-y focus:ring-1 focus:ring-form-accent-blue/50 outline-none" // Added focus ring
          placeholder="Your answer"
          rows={4}
          required={question.required}
        />
      )}

       {question.type === 'date' && (
        <div className="relative">
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 pr-10 border border-form-card-border rounded-md focus:border-form-accent-blue focus:ring-1 focus:ring-form-accent-blue/50 outline-none appearance-none" // Added appearance-none
            required={question.required}
          />
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-form-dark-gray pointer-events-none" size={16} />
        </div>
      )}

      {question.type === 'time' && (
        <div className="relative">
          <input
            type="time"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 pr-10 border border-form-card-border rounded-md focus:border-form-accent-blue focus:ring-1 focus:ring-form-accent-blue/50 outline-none appearance-none" // Added appearance-none
            required={question.required}
          />
          <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-form-dark-gray pointer-events-none" size={16} />
        </div>
      )}

      {question.type === 'file' && (
        <div className="w-full">
          <label className="flex flex-col items-center px-4 py-6 bg-white text-form-dark-gray rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-form-accent-blue cursor-pointer transition-colors">
            <Upload className="mb-2 text-gray-400" size={24} />
            <span className="text-sm text-center">
              {fileName ? fileName : 'Click to upload or drag and drop'}
            </span>
             {/* Display file type restrictions if available */}
            {/* <span className="text-xs text-gray-500 mt-1">PDF, PNG, JPG up to 10MB</span> */}
            <input
              type="file"
              className="hidden"
              onChange={handleLocalFileChange} // Use local handler
              required={question.required}
            />
          </label>
           {/* Display preview if available */}
          {fileName && filePreview && (
            <div className="mt-3 p-3 border rounded-md">
              <div className="flex items-center gap-2 mb-2">
                {isImageFile(fileName) ? <Image size={16} /> : <FileText size={16} />}
                <span className="font-medium text-sm truncate">{fileName}</span>
              </div>
              {isImageFile(fileName) && (
                <div className="mt-2 border rounded-md overflow-hidden">
                  <img
                    src={filePreview}
                    alt="File preview"
                    className="w-full h-auto max-h-48 object-contain bg-gray-100 dark:bg-gray-700"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {question.type === 'multiple_choice' && question.options && (
        <div className="space-y-3">
          {question.options.map((option) => (
            <label key={option.id} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(e.target.value)}
                className="w-4 h-4 text-form-accent-blue focus:ring-form-accent-blue focus:ring-offset-0 border-gray-300 dark:border-gray-600" // Adjusted focus style
                required={question.required && !value} // Require only if no value selected yet
              />
              <span className="text-sm">{option.value}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'checkbox' && question.options && (
        <div className="space-y-3">
          {question.options.map((option) => (
            <label key={option.id} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                value={option.value}
                checked={Array.isArray(value) && value.includes(option.value)}
                onChange={(e) => onCheckboxChange(option.value, e.target.checked)}
                className="w-4 h-4 text-form-accent-blue rounded focus:ring-form-accent-blue focus:ring-offset-0 border-gray-300 dark:border-gray-600" // Adjusted focus style and added rounded
              />
               <span className="text-sm">{option.value}</span>
            </label>
          ))}
        </div>
      )}

       {question.type === 'dropdown' && question.options && (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-form-card-border rounded-md focus:border-form-accent-blue bg-white focus:ring-1 focus:ring-form-accent-blue/50 outline-none appearance-none" // Added appearance-none
          required={question.required}
        >
          <option value="" disabled>-- Select an option --</option>
          {question.options.map((option) => (
            <option key={option.id} value={option.value}>
              {option.value}
            </option>
          ))}
        </select>
      )}
    </motion.div>
  );
};


export default FormPreview;
/* Eventy/Frontend/src/features/CreateEvent/components/FormBuilder.jsx */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvent } from '@/features/CreateEvent/context/EventContext';
import { Button } from '@/shared/ui/button';
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Skeleton } from "@/shared/ui/skeleton";
// Assuming QuestionTypes is now in the same components folder
import { QuestionCard, AddQuestionButton } from './QuestionTypes';
import ThemeSelector from './ThemeSelector';
import SettingsDialog from './SettingsDialog';
import PageTransition from './PageTransition';
import { Eye, ArrowLeft, Settings, Palette, Loader2, AlertCircle, Info, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import debounce from 'lodash.debounce';

const FormBuilder = () => {
  const { eventId } = useParams(); // Get eventId from URL
  const navigate = useNavigate();
  const {
      state,
      setCurrentEvent, // Fetches the full event object
      updateEventFormDefinition, // Saves only formDefinition changes
      updateEventDetails // Saves changes to eventName, etc.
  } = useEvent();
  const { currentEvent, isLoading: contextIsLoading, error: contextError } = state;

  // Extract form definition, ensuring defaults if not present
  const formDefinition = useMemo(() => currentEvent?.formDefinition || { title: '', description: '', questions: [] }, [currentEvent]);
  const eventName = useMemo(() => currentEvent?.eventName || '', [currentEvent]);

  // --- Local State ---
  // For event details (potentially debounced)
  const [localEventName, setLocalEventName] = useState('');
  // For form definition fields (debounced)
  const [localFormTitle, setLocalFormTitle] = useState('');
  const [localFormDescription, setLocalFormDescription] = useState('');
  const [localQuestions, setLocalQuestions] = useState([]);
  // UI State
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- Effects ---

  // Fetch the current event when component mounts or eventId changes
  useEffect(() => {
      if (eventId) {
          // console.log(`FormBuilder: Setting current event to ${eventId}`);
          setCurrentEvent(eventId);
      }
      // Reset local state if eventId changes (or on unmount)
      return () => {
          setLocalEventName('');
          setLocalFormTitle('');
          setLocalFormDescription('');
          setLocalQuestions([]);
          setSelectedQuestionId(null);
      };
  }, [eventId, setCurrentEvent]);

  // Effect to sync local state when currentEvent data loads/changes from context
  useEffect(() => {
      if (currentEvent && currentEvent.id === eventId) {
          // console.log(`FormBuilder: Syncing local state from currentEvent ${eventId}`);
          setLocalEventName(currentEvent.eventName || '');
          setLocalFormTitle(currentEvent.formDefinition?.title || '');
          setLocalFormDescription(currentEvent.formDefinition?.description || '');
          // Deep copy questions to avoid direct state mutation issues
          setLocalQuestions(JSON.parse(JSON.stringify(currentEvent.formDefinition?.questions || [])));
      }
  }, [currentEvent, eventId]); // Depend on the currentEvent object from context

  // Debounced save for form definition (title, description, questions)
  const debouncedSaveFormDefinition = useMemo(
      () => debounce(async (eventToSaveId, updatedFormDef) => {
          if (!eventToSaveId || !updatedFormDef) return;
          setIsSaving(true);
          // console.log("Debounced Save: Updating Form Definition for", eventToSaveId);
          await updateEventFormDefinition(eventToSaveId, updatedFormDef);
          setIsSaving(false);
      }, 1200), // Adjust debounce delay as needed (e.g., 1200ms)
      [updateEventFormDefinition] // Dependency is stable context function
  );

  // Effect to trigger debounced form definition save
  useEffect(() => {
      // Only run if event is loaded, matches URL, and local state has been initialized
      if (currentEvent && currentEvent.id === eventId && !contextIsLoading && localQuestions !== null) {
         const currentLocalFormDef = {
             title: localFormTitle,
             description: localFormDescription,
             questions: localQuestions
         };
         // Compare against formDefinition from context to see if a save is needed
         if (JSON.stringify(currentLocalFormDef) !== JSON.stringify(currentEvent.formDefinition)) {
              debouncedSaveFormDefinition(eventId, currentLocalFormDef);
         }
      }
      return () => { debouncedSaveFormDefinition.cancel(); };
  }, [localFormTitle, localFormDescription, localQuestions, eventId, currentEvent, contextIsLoading, debouncedSaveFormDefinition]);

  // Debounced save for event details (e.g., event name)
  const debouncedSaveEventDetails = useMemo(
       () => debounce(async (eventToSaveId, details) => {
           if (!eventToSaveId || !details || Object.keys(details).length === 0) return;
           setIsSaving(true);
           // console.log("Debounced Save: Updating Event Details for", eventToSaveId);
           await updateEventDetails(eventToSaveId, details);
           setIsSaving(false);
       }, 1200),
       [updateEventDetails] // Dependency is stable context function
   );

   // Effect to trigger debounce for event name changes
   useEffect(() => {
        if (currentEvent && currentEvent.id === eventId && !contextIsLoading) {
             if (localEventName !== currentEvent.eventName) {
                debouncedSaveEventDetails(eventId, { eventName: localEventName });
             }
        }
        return () => { debouncedSaveEventDetails.cancel(); };
   }, [localEventName, eventId, currentEvent, contextIsLoading, debouncedSaveEventDetails]);


  // --- Question Manipulation Handlers ---
  // These now update the localQuestions state, which then triggers the debounced save via useEffect
  const handleAddQuestion = useCallback((type) => {
    const newQuestion = {
      id: `q-${Date.now()}`, type, title: 'Untitled Question', description: '', required: false,
      ...( (type === 'multiple_choice' || type === 'checkbox' || type === 'dropdown') &&
         { options: [{ id: `opt-${Date.now()}`, value: 'Option 1' }] } ),
    };
    setLocalQuestions(prev => [...prev, newQuestion]);
    setSelectedQuestionId(newQuestion.id);
  }, []); // Depends only on setLocalQuestions

  const handleUpdateQuestion = useCallback((updatedQuestion) => {
      // Important: Ensure updatedQuestion doesn't contain 'undefined'
      const sanitizedQuestion = sanitizeDataForFirestore(updatedQuestion); // Reuse sanitization locally? Or trust context save? Let's trust context for now.
      setLocalQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
  }, []); // Depends only on setLocalQuestions

  const handleDeleteQuestion = useCallback((questionId) => {
      setLocalQuestions(prev => prev.filter(q => q.id !== questionId));
      if (selectedQuestionId === questionId) { setSelectedQuestionId(null); }
  }, [selectedQuestionId]); // Depends on selectedQuestionId


  // --- Render Logic ---
  if (contextIsLoading || (!currentEvent && !contextError && eventId)) {
    return ( <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> );
  }
  if (contextError) {
     return ( <div className="container p-8 text-center"><AlertCircle className="mx-auto h-12 w-12 text-destructive" /><h2 className="mt-4 text-xl font-semibold text-destructive">Error</h2><p className="mt-2 text-muted-foreground">{contextError}</p><Button onClick={() => navigate('/events')} className="mt-6">Back to Dashboard</Button></div> );
  }
  // Specific check if the requested eventId couldn't be loaded into currentEvent
   if (!currentEvent || currentEvent.id !== eventId) {
       return ( <div className="container p-8 text-center"><AlertCircle className="mx-auto h-12 w-12 text-destructive" /><h2 className="mt-4 text-xl font-semibold">Event Not Found</h2><p className="mt-2 text-muted-foreground">Could not load data for this event ID.</p><Button onClick={() => navigate('/events')} className="mt-6">Back to Dashboard</Button></div>);
   }

  // Main builder render
  return (
    <PageTransition className="min-h-screen bg-muted/40 pb-16">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Left Side */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate('/events')} aria-label="Back to dashboard"> <ArrowLeft size={18} /> </Button>
             {/* Event Name Input */}
             <Input value={localEventName} onChange={(e) => setLocalEventName(e.target.value)} className="text-base sm:text-lg font-medium h-auto p-0 bg-transparent border-0 focus-visible:ring-0 shadow-none truncate flex-shrink min-w-[100px]" placeholder="Event Name" aria-label="Event name input" />
             {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />}
          </div>
          {/* Right Side */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* <Button variant="ghost" size="icon" onClick={() => setThemeDialogOpen(true)} title="Customize Theme" aria-label="Customize Theme"><Palette size={18} /></Button> */}
            {/* <Button variant="ghost" size="icon" onClick={() => setSettingsDialogOpen(true)} title="Form Settings" aria-label="Form Settings"><Settings size={18} /></Button> */}
            <Button variant="secondary" onClick={() => navigate(`/events/${eventId}/preview`)} size="sm"> <Eye size={16} className="mr-1 sm:mr-2" /> Preview </Button>
            {/* Maybe add an explicit Save button if auto-save feels unreliable */}
            {/* <Button size="sm" disabled={isSaving} onClick={handleExplicitSave}> {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className="mr-2" />} Save All </Button> */}
          </div>
        </div>
      </header>

      {/* Builder Area */}
      <div className="max-w-screen-md mx-auto pt-8 px-4">
          {/* Info Alert */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
             <Info size={16} className="mr-2 mt-0.5 flex-shrink-0" />
             <p className="text-xs">Editing the form for: <strong className='font-medium'>{currentEvent.eventName || 'Untitled Event'}</strong>. Changes auto-save.</p>
          </div>

         {/* Form Title/Description Card */}
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-lg border border-border shadow-sm p-6 mb-6">
           <div className="border-l-4 border-primary pl-4">
              <Input value={localFormTitle} onChange={(e) => setLocalFormTitle(e.target.value)} className="w-full text-xl sm:text-2xl font-medium h-auto p-0 bg-transparent border-0 focus-visible:ring-0 shadow-none mb-2" placeholder="Form Title (e.g., Registration)" aria-label="Form title input"/>
              <Textarea value={localFormDescription} onChange={(e) => setLocalFormDescription(e.target.value)} className="w-full text-sm sm:text-base resize-none text-muted-foreground h-auto p-0 bg-transparent border-0 focus-visible:ring-0 shadow-none mt-1 min-h-[24px]" placeholder="Form description (optional)" rows={1} aria-label="Form description input"/>
           </div>
         </motion.div>

        {/* Questions List */}
         <div className="space-y-4">
           {/* Map over localQuestions state */}
           {localQuestions?.map((question, index) => (
             <QuestionCard
               key={question.id} // Key should be stable ID
               question={question}
               index={index}
               isSelected={selectedQuestionId === question.id}
               onSelect={setSelectedQuestionId} // Pass setter directly
               updateQuestion={handleUpdateQuestion}
               deleteQuestion={handleDeleteQuestion}
             />
           ))}
           <AddQuestionButton onSelectType={handleAddQuestion} />
         </div>
      </div>

       {/* Dialogs (Keep if implemented) */}
       {/* <ThemeSelector open={themeDialogOpen} onOpenChange={setThemeDialogOpen} /> */}
       {/* <SettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} /> */}
    </PageTransition>
  );
};

export default FormBuilder;
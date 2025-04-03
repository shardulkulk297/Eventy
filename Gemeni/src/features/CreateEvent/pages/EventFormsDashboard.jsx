/* src/features/CreateEvent/pages/EventFormsDashboard.jsx */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // Added useParams
import { motion } from 'framer-motion';
import PageTransition from '@/features/CreateEvent/components/PageTransition';
import FormCard from '@/features/CreateEvent/components/FormCard'; // Uses the updated FormCard
import NewFormButton from '@/features/CreateEvent/components/NewFormButton'; // Uses the updated NewFormButton
// --- FIX: Import the new context hook ---
import { useEventManager } from '@/features/CreateEvent/context/EventManagerContext';
// --- END FIX ---
import { Input } from '@/shared/ui/input'; // Import Input
import { Skeleton } from '@/shared/ui/skeleton'; // Import Skeleton for loading
import { Button } from '@/shared/ui/button'; // Import Button for back navigation
import { ArrowLeft, AlertCircle } from 'lucide-react'; // Import Icons
import { toast } from 'sonner'; // Import toast

const EventFormsDashboard = () => {
  const navigate = useNavigate();
  const { eventId } = useParams(); // --- FIX: Get eventId from URL ---
  // --- FIX: Use the new context hook ---
  const { state, setCurrentEventId } = useEventManager();
  const { currentEvent, currentEventForms, isLoading: contextLoading, error: contextError } = state;
  // --- END FIX ---

  const [search, setSearch] = useState('');
  const [pageLoading, setPageLoading] = useState(true); // Separate loading state for initial setup
  const [pageError, setPageError] = useState(null); // Separate error state

   // Effect 1: Set the current event context based on URL
   useEffect(() => {
    if (eventId && eventId !== currentEvent?.id) {
      setPageLoading(true); // Start loading when ID changes or context needs update
      setPageError(null); // Clear previous errors
      setCurrentEventId(eventId); // This triggers form fetching in the context
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


  // Filter forms based on search term (using currentEventForms from state)
  const filteredForms = (currentEventForms || []).filter(form =>
    form.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleGoBack = () => {
     navigate(`/posts/events/${eventId}/manage`); // Option 1: Back to event manage page
     // navigate('/posts/events'); // Option 2: Back to main event dashboard
  };

  // --- Loading State ---
  if (pageLoading) {
     return (
       <PageTransition>
         <div className="max-w-screen-xl mx-auto p-4 md:p-8">
            {/* Header Skeleton */}
            <header className="mb-8">
                 <div className="flex items-center gap-3 mb-2">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-7 w-1/3 rounded-md" />
                 </div>
                 <div className="flex flex-col md:flex-row justify-between gap-4">
                    <Skeleton className="h-5 w-1/2 md:w-1/4 rounded-md" />
                    <Skeleton className="h-10 w-full md:max-w-md rounded-md" />
                 </div>
           </header>
           {/* Grid Skeleton */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Skeleton for NewFormButton */}
              <Skeleton className="h-[200px] rounded-lg" />
              {/* Skeleton for FormCards */}
              <Skeleton className="h-[200px] rounded-lg" />
              <Skeleton className="h-[200px] rounded-lg" />
           </div>
         </div>
       </PageTransition>
     );
  }

  // --- Error State ---
   if (pageError) {
     return (
       <PageTransition>
         <div className="max-w-screen-xl mx-auto p-4 md:p-8">
             {/* Header with Back Button */}
             <header className="mb-8 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <Button variant="ghost" size="icon" onClick={handleGoBack} aria-label="Back">
                   <ArrowLeft size={18} />
                 </Button>
                 <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">Event Forms</h1>
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


  // --- Main Content ---
  return (
    <PageTransition>
      <div className="max-w-screen-xl mx-auto p-4 md:p-8 dark:text-gray-100">
        <header className="mb-8">
           {/* --- FIX: Add Back button and dynamic title --- */}
           <div className="flex items-center gap-3 mb-2">
                <Button variant="outline" size="icon" onClick={handleGoBack} aria-label="Back to Event Management">
                    <ArrowLeft size={18} />
                </Button>
                <h1 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-white truncate">
                   Forms for: <span className="font-normal">{currentEvent?.title || '...'}</span>
                </h1>
           </div>
           {/* --- END FIX --- */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
             <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Create, manage, and analyze forms for this event.</p>

            <Input
              type="text"
              placeholder="Search forms in this event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 dark:bg-gray-700" // Added dark styles
            />
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> {/* Adjusted grid for potentially more cards */}
          {/* --- FIX: Pass eventId to NewFormButton --- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="h-full" // Ensure it takes full height for alignment
          >
            <NewFormButton eventId={eventId} />
          </motion.div>
          {/* --- END FIX --- */}

          {filteredForms.map((form, index) => (
            <motion.div
              key={form.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + (index + 1) * 0.05 }}
              className="h-full" // Ensure it takes full height for alignment
            >
              {/* --- FIX: Pass eventId to FormCard --- */}
              {/* The navigation (onEdit etc.) is now handled within FormCard */}
              <FormCard
                form={form}
                eventId={eventId}
              />
              {/* --- END FIX --- */}
            </motion.div>
          ))}

          {/* Empty States */}
          {currentEventForms && filteredForms.length === 0 && search && (
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 text-center p-6 text-gray-500 dark:text-gray-400">
              No forms found matching "{search}" for this event.
            </div>
          )}

          {currentEventForms && currentEventForms.length === 0 && !search && (
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 text-center p-6 text-gray-500 dark:text-gray-400">
              No forms created for this event yet. Click "Create New Form" to get started.
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

// --- FIX: Export with the new name ---
export default EventFormsDashboard;
// --- END FIX ---
/* src/features/CreateEvent/pages/EventFormsDashboard.jsx */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from '@/features/CreateEvent/components/PageTransition';
import FormCard from '@/features/CreateEvent/components/FormCard';
import NewFormButton from '@/features/CreateEvent/components/NewFormButton';
import { useEventManager } from '@/features/CreateEvent/context/EventManagerContext';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const EventFormsDashboard = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { state, setCurrentEventId } = useEventManager();
  const { currentEvent, currentEventForms, isLoading: contextLoading, error: contextError } = state;

  const [search, setSearch] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

   useEffect(() => {
       console.log(`[Dashboard] Effect 1 RUN - eventId: ${eventId}, currentEvent.id: ${currentEvent?.id}, contextLoading: ${contextLoading}`);
    if (eventId && eventId !== currentEvent?.id) {
      setPageLoading(true);
      setPageError(null);
      console.log(`[Dashboard] Effect 1: Calling setCurrentEventId(${eventId})`);
      setCurrentEventId(eventId);
    } else if (eventId && currentEvent?.id === eventId) {
        if (!contextLoading) {
            console.log(`[Dashboard] Effect 1: Event context matches and not loading. pageLoading: false, pageError: ${contextError}`);
            setPageLoading(false);
            setPageError(contextError);
        } else {
             console.log(`[Dashboard] Effect 1: Event context matches but still loading.`);
             if (!pageLoading) setPageLoading(true); // Ensure loading indicator is on
        }
    } else if (!eventId) {
        console.error("[Dashboard] Effect 1: Event ID missing from URL.");
        setPageError("Event ID is missing from the URL.");
        setPageLoading(false);
        toast.error("Invalid URL: Event ID missing.");
    } else if (!contextLoading && eventId && !currentEvent) {
         console.error(`[Dashboard] Effect 1: Context not loading, but event ${eventId} not found.`);
         setPageError(`Event with ID [${eventId}] could not be found.`);
         setPageLoading(false);
    }
  }, [eventId, currentEvent?.id, contextLoading, contextError, setCurrentEventId]);


  const filteredForms = (currentEventForms || []).filter(form =>
    form.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleGoBack = () => {
     console.log("[Dashboard] handleGoBack triggered.");
     navigate(`/posts/events`); // Go back to main event dashboard
     // Or navigate(`/posts/events/${eventId}/manage`); if you have a manage page
  };

  if (pageLoading) {
      console.log("[Dashboard] Rendering Skeleton Loader.");
     return ( <PageTransition> <div className="max-w-screen-xl mx-auto p-4 md:p-8"> {/* Header Skeleton */} <header className="mb-8"> <div className="flex items-center gap-3 mb-2"> <Skeleton className="h-9 w-9 rounded-md" /> <Skeleton className="h-7 w-1/3 rounded-md" /> </div> <div className="flex flex-col md:flex-row justify-between gap-4"> <Skeleton className="h-5 w-1/2 md:w-1/4 rounded-md" /> <Skeleton className="h-10 w-full md:max-w-md rounded-md" /> </div> </header> {/* Grid Skeleton */} <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> <Skeleton className="h-[200px] rounded-lg" /> <Skeleton className="h-[200px] rounded-lg" /> <Skeleton className="h-[200px] rounded-lg" /> </div> </div> </PageTransition> );
  }

   if (pageError) {
     console.log(`[Dashboard] Rendering Error State: ${pageError}`);
     return ( <PageTransition> <div className="max-w-screen-xl mx-auto p-4 md:p-8"> <header className="mb-8 flex items-center justify-between"> <div className="flex items-center gap-3"> <Button variant="ghost" size="icon" onClick={handleGoBack} aria-label="Back"> <ArrowLeft size={18} /> </Button> <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">Event Forms Error</h1> </div> </header> <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg relative flex items-center gap-3" role="alert"> <AlertCircle className="w-5 h-5" /> <span className="block sm:inline">{pageError}</span> </div> </div> </PageTransition> );
   }


  console.log(`[Dashboard] Rendering main content. Event: ${currentEvent?.title}, Forms Count: ${currentEventForms?.length}`);
  return (
    <PageTransition>
      <div className="max-w-screen-xl mx-auto p-4 md:p-8 dark:text-gray-100">
        <header className="mb-8">
           <div className="flex items-center gap-3 mb-2">
                <Button variant="outline" size="icon" onClick={handleGoBack} aria-label="Back to Events">
                    <ArrowLeft size={18} />
                </Button>
                <h1 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-white truncate">
                   Forms for: <span className="font-normal">{currentEvent?.title || 'Loading...'}</span>
                </h1>
           </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
             <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Create, manage, and analyze forms for this event.</p>
            <Input
              type="text"
              placeholder="Search forms in this event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 dark:bg-gray-700"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="h-full"
          >
            {/* *** ADDED LOG *** */}
            {console.log(`[Dashboard] Rendering NewFormButton with eventId: ${eventId}`)}
            <NewFormButton eventId={eventId} />
          </motion.div>

          {filteredForms.map((form, index) => {
             // *** ADDED LOG ***
             console.log(`[Dashboard] Rendering FormCard for formId: ${form.id}, eventId: ${eventId}`);
             if (!form.id) { console.error("[Dashboard] Rendering FormCard with MISSING form.id!", form); }
             return (
                <motion.div
                  key={form.id || `form-${index}`} // Added fallback key
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + (index + 1) * 0.05 }}
                  className="h-full"
                >
                  <FormCard
                    form={form}
                    eventId={eventId}
                  />
                </motion.div>
             );
          })}

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

export default EventFormsDashboard;
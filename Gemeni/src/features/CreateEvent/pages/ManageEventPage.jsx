/* src/features/CreateEvent/pages/ManageEventPage.jsx */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventManager } from '@/features/CreateEvent/context/EventManagerContext';
import PageTransition from '@/features/CreateEvent/components/PageTransition';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { ArrowLeft, Save, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog"; // Import Alert Dialog for delete confirmation

// Debounce function (optional but recommended for input updates)
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


const ManageEventPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { state, setCurrentEventId, updateEvent, deleteEvent } = useEventManager();
  const { currentEvent, isLoading: contextLoading, error: contextError } = state;

  const [localTitle, setLocalTitle] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // Separate loading state for this page
  const [pageError, setPageError] = useState(null); // Separate error state

  // Effect 1: Set the current event context based on URL
  useEffect(() => {
    if (eventId && eventId !== currentEvent?.id) {
      setPageLoading(true); // Start loading when ID changes or context needs update
      setPageError(null); // Clear previous errors
      setCurrentEventId(eventId);
    } else if (eventId && currentEvent?.id === eventId) {
        // Event is already in context, proceed to populate local state (handled in Effect 2)
    } else if (!eventId) {
        setPageError("Event ID is missing from the URL.");
        setPageLoading(false);
        toast.error("Invalid URL: Event ID missing.");
        // navigate('/posts/events'); // Optionally navigate away
    }
    // We don't necessarily stop loading here, wait for Effect 2 to confirm data presence
  }, [eventId, currentEvent?.id, setCurrentEventId]);


  // Effect 2: Populate local state when the correct event is loaded in context
  useEffect(() => {
    if (currentEvent && currentEvent.id === eventId) {
      setLocalTitle(currentEvent.title || '');
      setLocalDescription(currentEvent.description || '');
      setPageLoading(false); // Stop loading once data is populated
      setPageError(null); // Clear any previous errors
    } else if (!contextLoading && eventId && !currentEvent) {
       // Context isn't loading, eventId exists, but currentEvent is null or doesn't match
       setPageError(`Event with ID [${eventId}] could not be found or loaded.`);
       setPageLoading(false); // Stop loading as the event wasn't found
    } else if (contextError) {
        // Handle errors from the context itself
        setPageError(`Error loading event data: ${contextError}`);
        setPageLoading(false);
    }
     // If contextLoading is true, pageLoading remains true until context resolves
  }, [currentEvent, eventId, contextLoading, contextError]);


  // Debounced update function (optional, use if you want updates as user types)
  // const debouncedSave = useCallback(
  //   debounce(async (id, title, description) => {
  //       setIsSaving(true);
  //       await updateEvent({ id, title, description });
  //       // Toast feedback might be in updateEvent, or add here
  //       setIsSaving(false);
  //   }, 1000), // 1 second debounce
  //   [updateEvent]
  // );

  // Manual Save Handler
  const handleSave = async () => {
    if (!currentEvent || !eventId) {
      toast.error("Cannot save: Event data is missing.");
      return;
    }
    if (!localTitle.trim()) {
        toast.error("Event title cannot be empty.");
        return;
    }

    setIsSaving(true);
    setPageError(null);
    try {
      await updateEvent({
        id: eventId,
        title: localTitle,
        description: localDescription
      });
      // Success toast is likely handled within updateEvent context function
      // toast.success("Event details saved!"); // Or add here
    } catch (error) {
        // Error toast likely handled in context, but set page error too
        setPageError("Failed to save event details.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!currentEvent || !eventId) {
      toast.error("Cannot delete: Event data is missing.");
      return;
    }
    setIsDeleting(true);
    setPageError(null);
    try {
      await deleteEvent(eventId);
      // On successful deletion, navigate back to the dashboard
      toast.success(`Event "${localTitle || 'Untitled'}" deleted.`);
      navigate('/posts/events', { replace: true });
    } catch (error) {
        setPageError("Failed to delete event.");
        // Error toast handled in context
        setIsDeleting(false); // Stop deleting state on error
    }
     // No finally needed as navigation occurs on success
  };

  const handleGoBack = () => {
    navigate('/posts/events'); // Navigate back to the main event dashboard
  };

  // Check if details have changed from the original event in context
  const hasChanges = currentEvent && (currentEvent.title !== localTitle || currentEvent.description !== localDescription);

  // --- Render Loading State ---
  if (pageLoading || contextLoading) {
    return (
      <PageTransition>
        <div className="max-w-screen-lg mx-auto p-4 md:p-8">
          {/* Header Skeleton */}
          <div className="mb-8 flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <Skeleton className="h-9 w-9 rounded-md" />
                 <Skeleton className="h-7 w-48 rounded-md" />
             </div>
             <Skeleton className="h-9 w-24 rounded-md" />
           </div>
           {/* Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                 <Skeleton className="h-4 w-20 rounded-md" />
                 <Skeleton className="h-10 w-full rounded-md" />
               </div>
               <div className="space-y-2">
                 <Skeleton className="h-4 w-24 rounded-md" />
                 <Skeleton className="h-24 w-full rounded-md" />
               </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
                <Skeleton className="h-10 w-24 rounded-md" />
                 <Skeleton className="h-10 w-24 rounded-md" />
            </CardFooter>
          </Card>
        </div>
      </PageTransition>
    );
  }

  // --- Render Error State ---
  if (pageError) {
     return (
       <PageTransition>
         <div className="max-w-screen-lg mx-auto p-4 md:p-8">
            {/* Header with Back Button */}
             <header className="mb-8 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <Button variant="ghost" size="icon" onClick={handleGoBack} aria-label="Back to events">
                   <ArrowLeft size={18} />
                 </Button>
                 <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">Manage Event</h1>
               </div>
             </header>
             {/* Error Card */}
             <Card className="border-red-500 dark:border-red-600">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                    <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-600" />
                    <CardTitle className="text-red-600 dark:text-red-500">Error Loading Event</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-700 dark:text-gray-300">{pageError}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Please check the URL or try navigating back to the dashboard.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={handleGoBack}>Back to Events</Button>
                </CardFooter>
            </Card>
         </div>
       </PageTransition>
     );
  }

  // --- Render Main Content ---
  return (
    <PageTransition>
      <div className="max-w-screen-lg mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleGoBack} aria-label="Back to events">
              <ArrowLeft size={18} />
            </Button>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">
               Manage Event: <span className="font-normal truncate">{localTitle || '...'}</span>
            </h1>
          </div>
           <Button
             onClick={handleSave}
             disabled={!hasChanges || isSaving || isDeleting}
           >
             {isSaving ? (
                 <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Saving...
                 </>
             ) : (
                <> <Save size={16} className="mr-2" /> Save Changes</>
             )}
           </Button>
        </header>

        {/* Event Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Update the title and description for your event.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="event-title">Event Title</Label>
              <Input
                id="event-title"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="Enter event title"
                disabled={isSaving || isDeleting}
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-description">Event Description</Label>
              <Textarea
                id="event-description"
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                placeholder="Enter event description (optional)"
                rows={4}
                disabled={isSaving || isDeleting}
                 className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Delete Section */}
        <Card className="mt-8 border-red-300 dark:border-red-800/50">
          <CardHeader>
             <CardTitle className="text-red-600 dark:text-red-500">Delete Event</CardTitle>
             <CardDescription>
                Permanently delete this event and all associated forms and responses. This action cannot be undone.
             </CardDescription>
          </CardHeader>
          <CardFooter>
             <AlertDialog>
                 <AlertDialogTrigger asChild>
                     <Button variant="destructive" disabled={isSaving || isDeleting}>
                         {isDeleting ? 'Deleting...' : <><Trash2 size={16} className="mr-2" /> Delete Event</>}
                     </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
                     <AlertDialogHeader>
                     <AlertDialogTitle className="dark:text-white">Are you absolutely sure?</AlertDialogTitle>
                     <AlertDialogDescription className="dark:text-gray-400">
                         This action cannot be undone. This will permanently delete the event
                         "<span className="font-medium">{localTitle || 'Untitled Event'}</span>",
                         along with all its forms and responses.
                     </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                     <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">Cancel</AlertDialogCancel>
                     <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 dark:text-white">
                         Yes, delete event
                     </AlertDialogAction>
                     </AlertDialogFooter>
                 </AlertDialogContent>
             </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </PageTransition>
  );
};

export default ManageEventPage;
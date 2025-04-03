/* src/features/CreateEvent/pages/ManageEventPage.jsx */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEventManager } from '../context/EventManagerContext';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Edit, ClipboardList, Settings, Trash2 } from 'lucide-react'; // Import Icons
import PageTransition from '../components/PageTransition';

// Debounce function (copy from FormBuilder or import from utils if centralized)
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
    const { state, getEvent, updateEvent, deleteEvent, setCurrentEventId } = useEventManager(); // Add deleteEvent
    const { isLoading: contextLoading, error: contextError } = state;

    const [eventDetails, setEventDetails] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [pageLoading, setPageLoading] = useState(true);
    const [pageError, setPageError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Effect 1: Fetch or get event details
    useEffect(() => {
        setPageError(null);
        if (!eventId) {
            setPageError("Event ID is missing.");
            setPageLoading(false);
            return;
        }

        // Ensure context knows about this event if navigating directly
        setCurrentEventId(eventId);

        const fetchedEvent = getEvent(eventId);
        if (fetchedEvent) {
            setEventDetails(fetchedEvent);
            setTitle(fetchedEvent.title || '');
            setDescription(fetchedEvent.description || '');
            setPageLoading(false);
        } else if (!contextLoading) {
            // Event not found in state and context isn't loading anymore
            setPageError(`Event [${eventId}] not found.`);
            setPageLoading(false);
            toast.error(`Event [${eventId}] not found.`);
        } else {
            // Context is loading, wait for it
            setPageLoading(true);
        }

    }, [eventId, getEvent, contextLoading, setCurrentEventId]); // Depend on getEvent and contextLoading


    // Debounced update function
    const debouncedSave = useCallback(
        debounce(async (updatedDetails) => {
            if (!eventId || !eventDetails) return;
            setIsSaving(true);
            try {
                await updateEvent({ id: eventId, ...updatedDetails });
                // Optional: Show subtle save indicator instead of toast on every debounce
                 // toast.success("Changes auto-saved");
            } catch (error) {
                toast.error("Failed to auto-save changes.");
                console.error("Auto-save error:", error);
            } finally {
                setIsSaving(false);
            }
        }, 1500), // Adjust delay as needed (e.g., 1.5 seconds)
        [eventId, updateEvent, eventDetails] // Include eventDetails to ensure it's current
    );


    // Effect 2: Trigger debounce save on title/description change
    useEffect(() => {
        if (eventDetails && !pageLoading) {
            const currentDesc = eventDetails.description || '';
            if (title !== eventDetails.title || description !== currentDesc) {
                 debouncedSave({ title, description });
            }
        }
    }, [title, description, eventDetails, pageLoading, debouncedSave]);


    const handleGoBack = () => {
        navigate('/posts/events'); // Navigate back to the main event dashboard
    };

     const handleDeleteEvent = async () => {
         if (eventId) {
             // Confirmation is handled within deleteEvent context function
             await deleteEvent(eventId);
             // Navigate away after deletion (if successful)
             navigate('/posts/events', { replace: true }); // Go back to dashboard
         }
     };


    // --- UI Rendering ---

    if (pageLoading) {
        return (
             <PageTransition>
                 <div className="max-w-screen-lg mx-auto p-4 md:p-8">
                     <header className="mb-6 flex items-center gap-3">
                         <Skeleton className="h-9 w-9 rounded-md" />
                         <Skeleton className="h-7 w-1/3 rounded-md" />
                     </header>
                     <Card>
                         <CardHeader>
                             <Skeleton className="h-6 w-1/2 rounded-md mb-2" />
                             <Skeleton className="h-4 w-3/4 rounded-md" />
                         </CardHeader>
                         <CardContent className="space-y-4">
                             <Skeleton className="h-10 w-full rounded-md" />
                             <Skeleton className="h-24 w-full rounded-md" />
                             <Skeleton className="h-10 w-1/4 rounded-md" />
                         </CardContent>
                         <CardFooter className="flex justify-between">
                              <Skeleton className="h-10 w-24 rounded-md" />
                              <Skeleton className="h-10 w-24 rounded-md" />
                         </CardFooter>
                     </Card>
                 </div>
            </PageTransition>
         );
    }

    if (pageError) {
        return (
             <PageTransition>
                <div className="max-w-screen-lg mx-auto p-4 md:p-8">
                     <header className="mb-6 flex items-center gap-3">
                         <Button variant="ghost" size="icon" onClick={handleGoBack} aria-label="Back">
                            <ArrowLeft size={18} />
                        </Button>
                        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">Error</h1>
                    </header>
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{pageError}</span>
                    </div>
                </div>
            </PageTransition>
         );
    }

    if (!eventDetails) {
        // Should be covered by loading/error, but as a fallback
        return <PageTransition><div className="p-8">Event not loaded.</div></PageTransition>;
    }


    return (
        <PageTransition>
            <div className="max-w-screen-lg mx-auto p-4 md:p-8">
                <header className="mb-6 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" onClick={handleGoBack} aria-label="Back to Events">
                            <ArrowLeft size={18} />
                        </Button>
                        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white truncate">
                            Manage Event: <span className="font-normal">{eventDetails.title}</span>
                        </h1>
                     </div>
                     <div className="text-sm text-gray-500 dark:text-gray-400">
                         {isSaving ? 'Saving...' : 'Auto-saved'}
                     </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {/* Left Column: Edit Details */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Event Details</CardTitle>
                                <CardDescription>Update the title and description for your event.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Event Title
                                    </label>
                                    <Input
                                        id="eventTitle"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter event title"
                                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Event Description
                                    </label>
                                    <Textarea
                                        id="eventDescription"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Enter event description (optional)"
                                        rows={4}
                                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                {/* Add other editable fields here (e.g., dates, location) */}
                            </CardContent>
                             {/* Footer might not be needed if using auto-save */}
                            {/* <CardFooter>
                                <Button onClick={handleSaveChanges} disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </CardFooter> */}
                        </Card>
                    </div>

                    {/* Right Column: Actions & Links */}
                     <div className="md:col-span-1 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Actions</CardTitle>
                            </CardHeader>
                             <CardContent className="space-y-2">
                                <Link to={`/posts/events/${eventId}/forms`} className="w-full">
                                    <Button variant="outline" className="w-full justify-start gap-2 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700">
                                         <ClipboardList size={16} /> Manage Forms ({eventDetails.formCount ?? 0})
                                    </Button>
                                </Link>
                                {/* Add link to event settings if applicable */}
                                {/* <Button variant="outline" className="w-full justify-start gap-2 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700">
                                    <Settings size={16} /> Event Settings
                                </Button> */}
                                 {/* Add other actions like "View Public Page" */}
                            </CardContent>
                        </Card>

                         <Card className="border-red-500 dark:border-red-700">
                            <CardHeader>
                                <CardTitle className="text-red-600 dark:text-red-500">Danger Zone</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    variant="destructive"
                                    onClick={handleDeleteEvent}
                                    className="w-full justify-start gap-2"
                                >
                                     <Trash2 size={16} /> Delete Event
                                </Button>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                     Deleting an event will permanently remove it along with all its forms and responses. This action cannot be undone.
                                </p>
                            </CardContent>
                         </Card>
                     </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default ManageEventPage;
/* src/features/CreateEvent/pages/EventDashboard.jsx */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventManager } from '@/features/CreateEvent/context/EventManagerContext'; // We will rename FormContext later
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Plus, Settings, List } from 'lucide-react';
import PageTransition from '@/features/CreateEvent/components/PageTransition';
import { toast } from 'sonner'; // Import toast

const EventDashboard = () => {
  const navigate = useNavigate();
  const { state, createEvent } = useEventManager(); // Assuming fetchEvents is handled internally now
  const { events, isLoading, error, userId } = state; // Destructure state

  // Handle potential errors from context
  useEffect(() => {
    if (error) {
      toast.error(`Error fetching events: ${error}`);
    }
  }, [error]);

  const handleCreateNewEvent = async () => {
    if (!userId) {
      toast.error("Please log in to create an event.");
      return;
    }
    // Basic event creation, prompt user for details or use defaults
    const eventTitle = prompt("Enter event title:", "New Event");
    if (eventTitle) {
      const newEventData = await createEvent(eventTitle, "Event Description"); // Use the createEvent function
      if (newEventData && newEventData.id) {
        toast.success(`Event "${newEventData.title}" created!`);
        // Optional: navigate to the new event's specific management page or form builder
        // navigate(`/posts/events/${newEventData.id}/manage`); // Example
      } else {
         toast.error("Failed to create event.");
      }
    }
  };

  const handleManageEvent = (eventId) => {
    // Navigate to a specific event management page (to be created)
    // This page would show event details and options for forms
    navigate(`/posts/events/${eventId}/manage`); // Example route
    toast.info(`Navigating to manage event ${eventId}`); // Placeholder
  };

   const handleManageForms = (eventId) => {
    // Navigate to the form builder/dashboard specifically for this event
    navigate(`/posts/events/${eventId}/forms`); // Example route for event-specific form dashboard
    toast.info(`Navigating to manage forms for event ${eventId}`); // Placeholder
  };


  if (isLoading) {
    return <div className="p-8 text-center">Loading events...</div>;
  }


  return (
    <PageTransition>
      <div className="max-w-screen-xl mx-auto p-4 md:p-8">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            My Events Dashboard
          </h1>
          <Button onClick={handleCreateNewEvent} disabled={!userId}>
            <Plus size={18} className="mr-2" /> Create New Event
          </Button>
        </header>

        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{event.title || 'Untitled Event'}</CardTitle>
                  <CardDescription>
                     Created: {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : 'N/A'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-2 justify-between">
                   <Button variant="outline" size="sm" onClick={() => handleManageForms(event.id)}>
                      <List size={16} className="mr-1" /> Forms ({event.formCount || 0}) {/* Assuming formCount exists */}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleManageEvent(event.id)}>
                    <Settings size={16} className="mr-1" /> Manage Event
                  </Button>

                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              No events created yet. Click "Create New Event" to start.
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default EventDashboard;
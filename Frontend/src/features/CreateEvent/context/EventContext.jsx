/* Eventy/Frontend/src/features/CreateEvent/context/EventContext.jsx */
import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
// Firebase Imports
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    where,
    orderBy,
    writeBatch,
    increment,
    getDoc
} from 'firebase/firestore';
import { app, database } from '@/firebaseConfig';
import { toast } from 'sonner';

// --- Data Sanitization Utility ---
const sanitizeDataForFirestore = (data) => {
    if (data === undefined) return null;
    if (data === null || typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map(item => sanitizeDataForFirestore(item));
    const sanitizedObject = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'TimestampFieldValue') {
                sanitizedObject[key] = value;
            } else {
                sanitizedObject[key] = sanitizeDataForFirestore(value);
            }
        }
    } return sanitizedObject;
};
// ---------------------------------

// Create context (Renamed)
const EventContext = createContext(undefined);

// Initial state (Reflects Events)
const initialState = {
  events: [], // List of event summaries for the dashboard
  currentEvent: null, // Full data for the currently viewed/edited event (incl. formDefinition)
  responses: {}, // Cache responses, keyed by eventId
  isLoading: true,
  error: null,
  userId: null, // Logged-in user ID
};

// Reducer function (Actions renamed/adjusted for Events)
const eventReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER_ID':
      if (state.userId === action.payload) return state;
      // Reset everything on user change/logout, trigger loading if new user
      return { ...initialState, userId: action.payload, isLoading: !!action.payload };

    case 'SET_EVENTS': // Fetched list for dashboard
      if (JSON.stringify(state.events) === JSON.stringify(action.payload)) return { ...state, isLoading: false, error: null };
      return { ...state, events: action.payload, isLoading: false, error: null };

    case 'SET_CURRENT_EVENT': // Set the currently active/viewed event
      if (state.currentEvent?.id === action.payload?.id && JSON.stringify(state.currentEvent) === JSON.stringify(action.payload)) return { ...state, isLoading: false, error: null }; // No change needed, ensure loading is off
      const newResponses = state.currentEvent?.id === action.payload?.id ? state.responses : {}; // Keep responses only if same event
      return { ...state, currentEvent: action.payload, responses: newResponses, isLoading: false, error: null }; // Stop loading when current event is set/cleared

    case 'ADD_EVENT_SUCCESS': // New event created
      if (state.events.some(e => e.id === action.payload.id)) return state; // Avoid duplicates
      return { ...state, events: [...state.events, action.payload], isLoading: false, error: null }; // Don't automatically set currentEvent here, let navigation trigger that

    case 'UPDATE_EVENT_SUCCESS': { // Event (or its formDefinition) updated
        let eventUpdated = false;
        const updatedEvents = state.events.map(event => {
            if (event.id === action.payload.id) {
                const mergedEvent = { ...event, ...action.payload };
                if (JSON.stringify(event) !== JSON.stringify(mergedEvent)) { eventUpdated = true; return mergedEvent; }
            } return event;
        });
        if (!eventUpdated) return { ...state, isLoading: false, error: null };
        // Update currentEvent state only if it was the one being updated
        const updatedCurrentEvent = state.currentEvent?.id === action.payload.id
            ? { ...state.currentEvent, ...action.payload } // Merge changes into currentEvent
            : state.currentEvent;
        return { ...state, events: updatedEvents, currentEvent: updatedCurrentEvent, isLoading: false, error: null };
      }

    case 'DELETE_EVENT_SUCCESS': { // Event deleted
      const eventIdToDelete = action.payload;
      if (!state.events.some(e => e.id === eventIdToDelete)) return state;
      const newResponses = { ...state.responses }; delete newResponses[eventIdToDelete];
      return { ...state, events: state.events.filter(e => e.id !== eventIdToDelete), responses: newResponses, currentEvent: state.currentEvent?.id === eventIdToDelete ? null : state.currentEvent, isLoading: false, error: null };
     }

    case 'SET_RESPONSES': // Responses for a specific event fetched/cached
      if (JSON.stringify(state.responses[action.payload.eventId]) === JSON.stringify(action.payload.responses)) return { ...state, isLoading: false, error: null };
      return { ...state, responses: { ...state.responses, [action.payload.eventId]: action.payload.responses }, isLoading: false, error: null };

     case 'ADD_RESPONSE_SUCCESS': { // New response added for an event
        const { eventId, response } = action.payload;
        const existingResponses = state.responses[eventId] || [];
        const updatedResponses = [...existingResponses, response];
        // Update counts locally for immediate feedback (may get overwritten by Firestore listeners if implemented)
        let eventFound = false;
        const updatedEvents = state.events.map(e => { if (e.id === eventId) { eventFound = true; return { ...e, responseCount: (e.responseCount || 0) + 1 }; } return e; });
        const updatedCurrentEvent = state.currentEvent?.id === eventId ? { ...state.currentEvent, responseCount: (state.currentEvent.responseCount || 0) + 1 } : state.currentEvent;
        if (!eventFound && !state.currentEvent) console.warn(`ADD_RESPONSE_SUCCESS: Event ${eventId} not found.`);
        return { ...state, events: eventFound ? updatedEvents : state.events, responses: { ...state.responses, [eventId]: updatedResponses }, currentEvent: updatedCurrentEvent, isLoading: false, error: null };
     }
    case 'SET_LOADING':
      if (state.isLoading === action.payload) return state;
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
       if (state.error === action.payload) return { ...state, isLoading: false };
      return { ...state, error: action.payload, isLoading: false };

    default: return state;
  }
};

// Provider component (Renamed)
export const EventProvider = ({ children }) => {
  const [state, dispatch] = useReducer(eventReducer, initialState);
  const auth = getAuth(app);

  // Effect 1: Handle Auth State Changes
  useEffect(() => {
    if (!state.isLoading) dispatch({ type: 'SET_LOADING', payload: true });
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        const newUserId = user ? user.uid : null;
        dispatch({ type: 'SET_USER_ID', payload: newUserId }); // Reducer resets state if null
    });
    return () => unsubscribe();
  }, [auth]); // auth is stable

  // Effect 2: Fetch User's Events when User ID is valid
  useEffect(() => {
    if (!state.userId) {
        if(state.isLoading) dispatch({ type: 'SET_LOADING', payload: false });
        if (state.events.length > 0) dispatch({ type: 'SET_EVENTS', payload: [] });
        return;
    }
    const fetchEvents = async () => {
      if (!state.isLoading) dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Path: users/{userId}/createdEvents
        const eventsCollectionRef = collection(database, 'users', state.userId, 'createdEvents');
        // Fetch summary data - exclude large fields like formDefinition if possible for dashboard performance
        // Example: Add .select("eventName", "eventDate", "responseCount", "createdAt", "updatedAt") to the query if needed
        const q = query(eventsCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const eventsList = querySnapshot.docs.map(doc => ({
          id: doc.id, ...doc.data(),
           createdAt: doc.data().createdAt?.toDate?.().toISOString(),
           updatedAt: doc.data().updatedAt?.toDate?.().toISOString(),
           // Ensure formDefinition is excluded here if not needed for dashboard card
        }));
        dispatch({ type: 'SET_EVENTS', payload: eventsList }); // Sets loading false
      } catch (error) {
        console.error("Error fetching events: ", error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load events.' });
        toast.error("Failed to load events.");
      }
    };
    fetchEvents();
  }, [state.userId]); // Dependency: userId


  // --- Action Creators (Refactored for Events) ---

  const createEvent = useCallback(async (eventDetails) => {
    if (!state.userId) { toast.error("Login required."); return null; }
    dispatch({ type: 'SET_LOADING', payload: true });
    let newEventId = null; // To store the generated ID
    try {
      // Path: users/{userId}/createdEvents
      const userEventsCollectionRef = collection(database, 'users', state.userId, 'createdEvents');
      // Sanitize basic event details
      const sanitizedDetails = sanitizeDataForFirestore(eventDetails) || {};
      const eventData = {
        ...sanitizedDetails,
        formDefinition: { // Initialize with empty form structure
            title: sanitizedDetails.eventName || 'Registration Form', // Default title
            description: '',
            questions: [],
        },
        responseCount: 0,
        creatorId: state.userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(userEventsCollectionRef, eventData);
      newEventId = docRef.id; // Get the generated event ID

      // Create/Update top-level event doc: events/{eventId}
      const topLevelEventDocRef = doc(database, 'events', newEventId);
      await setDoc(topLevelEventDocRef, {
          eventName: eventData.eventName,
          eventDate: eventData.eventDate || null,
          description: eventData.description || '',
          creatorId: state.userId,
          createdAt: serverTimestamp(),
          responseCount: 0
        }, { merge: true })
          .catch(err => console.warn("Could not set top-level event doc:", err));

      // Update user event count: users/{userId}
      const userDocRef = doc(database, 'users', state.userId);
      await setDoc(userDocRef, { eventCount: increment(1) }, { merge: true })
          .catch(err => console.error("Could not update user event count:", err));

      // Fetch the created doc to return complete data
      const newDocSnap = await getDoc(docRef);
      const newEvent = {
          id: newDocSnap.id, ...newDocSnap.data(),
          createdAt: newDocSnap.data().createdAt?.toDate?.().toISOString(),
          updatedAt: newDocSnap.data().updatedAt?.toDate?.().toISOString(),
      };

      dispatch({ type: 'ADD_EVENT_SUCCESS', payload: newEvent }); // Updates state, sets loading false
      toast.success("Event created!");
      return newEvent;
    } catch (error) {
      console.error("Error creating event: ", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create event.' });
      toast.error("Failed to create event.");
      // Clean up top-level doc if user-doc creation failed? Optional advanced logic.
      // if (newEventId) await deleteDoc(doc(database, 'events', newEventId)).catch();
      return null;
    }
  }, [state.userId, dispatch]);

  // Function specifically to update the formDefinition within an event
  const updateEventFormDefinition = useCallback(async (eventId, formDefinitionUpdate) => {
      if (!state.userId || !eventId) { toast.error("Cannot update form: Missing user or event ID."); return; }
      // Path: users/{userId}/createdEvents/{eventId}
      const eventDocRef = doc(database, 'users', state.userId, 'createdEvents', eventId);
      try {
          const updateData = {
              // IMPORTANT: Sanitize the potentially large/nested formDefinition object
              formDefinition: sanitizeDataForFirestore(formDefinitionUpdate),
              updatedAt: serverTimestamp() // Update event timestamp
          };
          // DEBUG LOGGING
          console.log('Attempting to update event form:', eventId, 'with sanitized data:', JSON.stringify(updateData.formDefinition, null, 2));
          await updateDoc(eventDocRef, updateData);

          // Optimistic update for local state
          const updatedEventPayload = {
              id: eventId,
              formDefinition: formDefinitionUpdate, // Use original for local state if needed
              updatedAt: new Date().toISOString() // Simulate timestamp
          };
          dispatch({ type: 'UPDATE_EVENT_SUCCESS', payload: updatedEventPayload });
          // toast.info("Form changes saved."); // Feedback optional for frequent updates
      } catch (error) {
          console.error("Error updating event form definition:", error);
          dispatch({ type: 'SET_ERROR', payload: `Failed to save form. ${error.message}` });
          toast.error(`Failed to save form: ${error.code || error.message}`);
      }
  }, [state.userId, dispatch]);

  // Function to update general event details (name, date etc.) - NOT the form
  const updateEventDetails = useCallback(async (eventId, eventDetailsUpdate) => {
      if (!state.userId || !eventId) { toast.error("Cannot update event: Missing info."); return; }
      const eventDocRefUser = doc(database, 'users', state.userId, 'createdEvents', eventId);
      const eventDocRefTopLevel = doc(database, 'events', eventId);
      try {
          const updateData = {
              ...sanitizeDataForFirestore(eventDetailsUpdate),
              updatedAt: serverTimestamp()
          };
          // Don't allow overwriting formDefinition with this function
          delete updateData.formDefinition;
          delete updateData.responseCount; // Should only be updated via responses
          delete updateData.creatorId; // Cannot change creator
          delete updateData.createdAt; // Cannot change creation time

          if (Object.keys(updateData).length <= 1) return; // Only updatedAt field, nothing to update

          await updateDoc(eventDocRefUser, updateData);

          // Update relevant fields in top-level document
          const topLevelUpdateData = {};
          if(updateData.eventName) topLevelUpdateData.eventName = updateData.eventName;
          if(updateData.eventDate !== undefined) topLevelUpdateData.eventDate = updateData.eventDate; // Allow setting date to null
          if(updateData.description !== undefined) topLevelUpdateData.description = updateData.description; // Allow setting description to null/empty

          if (Object.keys(topLevelUpdateData).length > 0) {
              await updateDoc(eventDocRefTopLevel, topLevelUpdateData)
                  .catch(err => console.warn("Could not update top-level event details:", err));
          }

          // Update local state
          const updatedEventPayload = { id: eventId, ...eventDetailsUpdate, updatedAt: new Date().toISOString() };
          dispatch({ type: 'UPDATE_EVENT_SUCCESS', payload: updatedEventPayload });
          toast.info("Event details updated.");
      } catch (error) {
          console.error("Error updating event details:", error);
          dispatch({ type: 'SET_ERROR', payload: `Failed to update details. ${error.message}` });
          toast.error(`Failed to update details: ${error.code || error.message}`);
      }
  }, [state.userId, dispatch]);

  // Fetches and sets the CURRENT full event object (including form definition)
   const setCurrentEvent = useCallback(async (eventId) => {
       if (!state.userId) { dispatch({ type: 'SET_CURRENT_EVENT', payload: null }); return; }
       if (!eventId) { dispatch({ type: 'SET_CURRENT_EVENT', payload: null }); return; }
       // Avoid refetch if already current and seems loaded (adjust if always need fresh data)
       if (state.currentEvent?.id === eventId && state.currentEvent?.formDefinition) {
           if (!state.isLoading) dispatch({ type: 'SET_LOADING', payload: false }); // Ensure loading is off
           return;
       }

       dispatch({ type: 'SET_LOADING', payload: true });
        try {
            // Path: users/{userId}/createdEvents/{eventId}
            const eventDocRef = doc(database, 'users', state.userId, 'createdEvents', eventId);
            const docSnap = await getDoc(eventDocRef);
            if (docSnap.exists()) {
                 const eventData = {
                     id: docSnap.id, ...docSnap.data(),
                     createdAt: docSnap.data().createdAt?.toDate?.().toISOString(),
                     updatedAt: docSnap.data().updatedAt?.toDate?.().toISOString(),
                 };
                 dispatch({ type: 'SET_CURRENT_EVENT', payload: eventData }); // Sets loading false
            } else {
                 console.error(`Event ${eventId} not found for user ${state.userId}.`);
                 dispatch({ type: 'SET_ERROR', payload: 'Event not found.' });
                 toast.error("Event not found.");
                 dispatch({ type: 'SET_CURRENT_EVENT', payload: null }); // Sets loading false
            }
        } catch (error) {
             console.error("Error fetching current event: ", error);
             dispatch({ type: 'SET_ERROR', payload: 'Failed to load event details.' });
             toast.error("Failed to load event details.");
             // dispatch({ type: 'SET_CURRENT_EVENT', payload: null }); // Let error state handle it
        }
    }, [dispatch, state.userId, state.currentEvent]); // Depend on userId and currentEvent


  // Delete Event (Including Responses Subcollection)
  const deleteEvent = useCallback(async (eventId) => {
      if (!state.userId || !eventId) { toast.error("Cannot delete: Missing info."); return; }
       if (!window.confirm("Delete this event, its form, and ALL responses permanently?")) return;
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
          // 1. Delete Responses Subcollection (**Use Cloud Function in Production**)
          // Path: events/{eventId}/responses (Using NEW Path)
          const responsesRef = collection(database, 'events', eventId, 'responses');
          const responsesSnap = await getDocs(responsesRef);
          if (responsesSnap.size > 0) {
              const batch = writeBatch(database);
              responsesSnap.forEach((doc) => batch.delete(doc.ref));
              await batch.commit();
              console.log(`Deleted ${responsesSnap.size} responses for event ${eventId}`);
          }

          // 2. Delete User's event doc: users/{userId}/createdEvents/{eventId}
          const eventDocRefUser = doc(database, 'users', state.userId, 'createdEvents', eventId);
          await deleteDoc(eventDocRefUser);

          // 3. Delete Top-level event doc: events/{eventId}
           const eventDocRefTopLevel = doc(database, 'events', eventId);
           await deleteDoc(eventDocRefTopLevel).catch(err => console.warn("Could not delete top-level event doc:", err));

          // 4. Update user count: users/{userId}
           const userDocRef = doc(database, 'users', state.userId);
           await setDoc(userDocRef, { eventCount: increment(-1) }, { merge: true }) // Decrement eventCount
            .catch(err => console.error("Could not update user event count:", err));

          dispatch({ type: 'DELETE_EVENT_SUCCESS', payload: eventId }); // Updates state, sets loading false
          toast.success("Event deleted.");
      } catch (error) {
          console.error("Error deleting event: ", error);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to delete event.' });
          toast.error("Failed to delete event.");
      }
  }, [state.userId, dispatch]);

  // Submit Response for an Event's Form
  const submitEventResponse = useCallback(async (eventId, answers) => {
    if (!eventId) { toast.error("Missing Event ID."); return; }
    // Path: events/{eventId}/responses (Using NEW Path)
    const responsesRef = collection(database, 'events', eventId, 'responses');
    const sanitizedAnswers = sanitizeDataForFirestore(answers);
    const responseData = { answers: sanitizedAnswers, submittedAt: serverTimestamp() };
    try {
      const docRef = await addDoc(responsesRef, responseData);
      const newResponse = { ...responseData, id: docRef.id, submittedAt: new Date().toISOString() };

      // Update response count on the top-level 'events' document
       const eventDocRefTopLevel = doc(database, 'events', eventId);
       await updateDoc(eventDocRefTopLevel, { responseCount: increment(1) })
            .catch(err => console.warn(`Could not update response count for event ${eventId}:`, err));

       // Also update count on user's event doc (for consistency if needed)
        if(state.userId) { // Check if we know the user ID (creator)
            const eventDocRefUser = doc(database, 'users', state.userId, 'createdEvents', eventId);
             // Check if doc exists before updating? Optional, updateDoc fails gracefully but logs error
             await updateDoc(eventDocRefUser, { responseCount: increment(1) })
                 .catch(err => console.warn(`Could not update user-event response count for event ${eventId}:`, err));
        }

      dispatch({ type: 'ADD_RESPONSE_SUCCESS', payload: { eventId: eventId, response: newResponse } }); // Sets loading false
    } catch (error) {
      console.error("Error submitting response: ", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to submit.' });
      toast.error("Failed to submit response.");
    }
  }, [state.userId, dispatch]); // Added userId dependency

  // Fetch Responses for a specific Event
  const fetchEventResponses = useCallback(async (eventId) => {
      if (!eventId) return [];
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
          // Path: events/{eventId}/responses (Using NEW Path)
          const responsesRef = collection(database, 'events', eventId, 'responses');
          const q = query(responsesRef, orderBy('submittedAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const responsesList = querySnapshot.docs.map(doc => ({
              id: doc.id, ...doc.data(),
              submittedAt: doc.data().submittedAt?.toDate?.().toISOString(),
          }));
          dispatch({ type: 'SET_RESPONSES', payload: { eventId: eventId, responses: responsesList } }); // Sets loading false
          return responsesList;
      } catch (error) {
           console.error(`Error fetching responses for event ${eventId}: `, error);
           dispatch({ type: 'SET_ERROR', payload: 'Failed to load responses.' });
           toast.error("Failed to load responses.");
           return [];
      }
  }, [dispatch]);

   // Getters for local state
   const getEvent = useCallback((eventId) => state.events.find(event => event.id === eventId), [state.events]);
   const getCurrentEvent = useMemo(() => state.currentEvent, [state.currentEvent]);
   const getEventResponses = useCallback((eventId) => state.responses[eventId] || [], [state.responses]);

  // Context Value Memo
  const contextValue = useMemo(() => ({
    state, dispatch,
    createEvent,
    updateEventFormDefinition, // Use this for form changes within an event
    updateEventDetails, // Use this for non-form event details
    deleteEvent,
    setCurrentEvent, // Use this to load the full event object when needed
    getEvent, // Gets summary from state.events list
    getCurrentEvent, // Gets the currently loaded full event object
    submitEventResponse,
    fetchEventResponses,
    getEventResponses,
  }), [
      state, dispatch, createEvent, updateEventFormDefinition, updateEventDetails, deleteEvent, setCurrentEvent,
      getEvent, getCurrentEvent, submitEventResponse, fetchEventResponses, getEventResponses
  ]);

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
};

// Custom hook (Renamed)
export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};
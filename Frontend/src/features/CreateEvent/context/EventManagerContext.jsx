/* src/features/CreateEvent/context/EventManagerContext.jsx */
// ... (keep imports and utility functions as they were) ...
import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
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
  getDoc,
  deleteField // Keep if you need it, otherwise remove
} from 'firebase/firestore';
import { app, database } from '@/firebaseConfig';
import { toast } from 'sonner'; // Ensure Sonner is used for toasts

// --- Data Sanitization Utility ---
const sanitizeDataForFirestore = (data) => {
  if (data === undefined) return null;
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(item => sanitizeDataForFirestore(item));

  // Handle Firestore specific types if necessary (e.g., Timestamp, GeoPoint)
  // This example keeps serverTimestamp intact
  if (data.constructor && data.constructor.name === 'TimestampFieldValue') {
     return data;
  }

  const sanitizedObject = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      const sanitizedValue = sanitizeDataForFirestore(value);
      // Firestore cannot store 'undefined', so we convert to 'null'
      sanitizedObject[key] = sanitizedValue === undefined ? null : sanitizedValue;
    }
  }
  return sanitizedObject;
};
// --- End Sanitization ---

// Create context
const EventManagerContext = createContext(undefined);

// Initial state
const initialState = {
  events: [],
  currentEvent: null,
  currentEventForms: [],
  currentEventFormResponses: {},
  isLoading: true, // Start loading initially
  error: null,
  userId: null,
};

// Reducer function
const eventManagerReducer = (state, action) => {
   console.log("Reducer Action:", action.type, action.payload); // Log all actions
  // Simple function to prevent unnecessary state updates if data is identical
  const isStateChanged = (key, payload) => JSON.stringify(state[key]) !== JSON.stringify(payload);

  switch (action.type) {
    case 'SET_USER_ID':
      if (state.userId === action.payload) return state;
      console.log("Reducer: Setting userId =", action.payload);
      if (action.payload === null) return { ...initialState, userId: null, isLoading: false };
      return { ...initialState, userId: action.payload, isLoading: true }; // Reset and start loading for new user

    case 'SET_EVENTS':
      console.log("Reducer: Setting events =", action.payload?.length);
      // Check if content is actually different before updating
      if (JSON.stringify(state.events) === JSON.stringify(action.payload)) {
           console.log("Reducer: SET_EVENTS payload identical, skipping update.");
           return state.isLoading ? { ...state, isLoading: false } : state; // Ensure loading stops if needed
      }
      return { ...state, events: action.payload, isLoading: false, error: null };

    case 'SET_CURRENT_EVENT':
      console.log("Reducer: Setting currentEvent ID =", action.payload?.id);
      if (state.currentEvent?.id === action.payload?.id && !isStateChanged('currentEvent', action.payload)) {
        console.log("Reducer: SET_CURRENT_EVENT payload identical, skipping.");
        return state.isLoading ? { ...state, isLoading: false } : state;
      }
      return {
        ...state,
        currentEvent: action.payload,
        currentEventForms: action.payload?.id === state.currentEvent?.id ? state.currentEventForms : [], // Reset forms ONLY if event ID changes
        currentEventFormResponses: action.payload?.id === state.currentEvent?.id ? state.currentEventFormResponses: {}, // Reset responses ONLY if event ID changes
        isLoading: false, // Setting current event always means loading for *that* is done
        error: action.payload === null ? state.error : null // Keep existing error if payload is null (not found), clear otherwise
      };

    case 'SET_CURRENT_EVENT_FORMS':
      console.log(`Reducer: Setting forms for event ${action.payload.eventId}, count: ${action.payload.forms?.length}`);
      if (state.currentEvent?.id !== action.payload.eventId) {
         console.warn(`Reducer: SET_CURRENT_EVENT_FORMS ignored, eventId mismatch (${action.payload.eventId} vs ${state.currentEvent?.id})`);
         return state;
      }
       if (JSON.stringify(state.currentEventForms) === JSON.stringify(action.payload.forms)) {
           console.log("Reducer: SET_CURRENT_EVENT_FORMS payload identical, skipping update.");
           return state.isLoading ? { ...state, isLoading: false } : state; // Ensure loading stops
       }
      return { ...state, currentEventForms: action.payload.forms, isLoading: false, error: null };

    // --- Keep other action cases as they were in the previous version, adding console logs if helpful ---
    // Example for ADD_EVENT_SUCCESS:
    case 'ADD_EVENT_SUCCESS':
      console.log("Reducer: Adding event", action.payload.id);
      if (state.events.some(e => e.id === action.payload.id)) return state;
      return {
          ...state,
          events: [action.payload, ...state.events].sort((a, b) => (b.createdAt && a.createdAt) ? new Date(b.createdAt) - new Date(a.createdAt) : 0), // Add and re-sort safely
          isLoading: false, error: null
      };

    // Example for ADD_FORM_FOR_EVENT_SUCCESS:
    case 'ADD_FORM_FOR_EVENT_SUCCESS':
        console.log(`Reducer: Adding form ${action.payload.form.id} to event ${action.payload.eventId}`);
        if (state.currentEvent?.id !== action.payload.eventId) return state;
        if (state.currentEventForms.some(f => f.id === action.payload.form.id)) return state;
        return {
          ...state,
          currentEventForms: [...state.currentEventForms, action.payload.form].sort((a,b) => (b.createdAt && a.createdAt) ? new Date(b.createdAt) - new Date(a.createdAt) : 0), // Add and re-sort safely
          events: state.events.map(e => e.id === action.payload.eventId ? { ...e, formCount: (e.formCount || 0) + 1 } : e),
          isLoading: false, error: null
         };

    // --- Keep other action cases as they were ---

    case 'SET_LOADING':
      if (state.isLoading === action.payload) return state;
       console.log("Reducer: Setting loading =", action.payload);
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
       if (state.error === action.payload) return { ...state, isLoading: false };
       console.error("Reducer: Setting error =", action.payload); // Use console.error
       return { ...state, error: action.payload, isLoading: false };

    default:
      console.warn("Reducer: Unhandled action type:", action.type);
      return state;
  }
};

// Provider component
export const EventManagerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(eventManagerReducer, initialState);
  const auth = getAuth(app);

  // Effect 1: Handle Auth State Changes
  useEffect(() => {
    console.log("Auth Effect: Setting up listener.");
    if (!state.isLoading) dispatch({ type: 'SET_LOADING', payload: true });
    const unsubscribe = onAuthStateChanged(auth, (user) => {
       console.log("Auth Effect: Auth state changed, user ID:", user?.uid);
      dispatch({ type: 'SET_USER_ID', payload: user ? user.uid : null });
    });
    return () => {
       console.log("Auth Effect: Cleaning up listener.");
       unsubscribe();
    };
  }, [auth]); // Keep dependency only 'auth'

  // Effect 2: Fetch Events when User ID changes and is valid
  useEffect(() => {
    if (!state.userId) {
      console.log("Fetch Events Effect: No user ID, clearing state.");
      // Clear data if user logs out (Reducer handles this on SET_USER_ID: null)
      if (state.isLoading) dispatch({ type: 'SET_LOADING', payload: false }); // Stop loading if no user
      return;
    }

    const fetchEvents = async () => {
       console.log(`Workspace Events Effect: Fetching events for user ${state.userId}...`);
      // Only set loading if not already loading (e.g., from auth change)
      if (!state.isLoading) dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null }); // Clear previous errors on new fetch
      try {
        const eventsCollectionRef = collection(database, 'users', state.userId, 'CreatedEvents');
        const q = query(eventsCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const eventsList = querySnapshot.docs.map(doc => ({
          id: doc.id, ...doc.data(),
          // Safely convert timestamps
          createdAt: doc.data().createdAt?.toDate?.().toISOString() || null,
          updatedAt: doc.data().updatedAt?.toDate?.().toISOString() || null,
        }));
         console.log(`Workspace Events Effect: Fetched ${eventsList.length} events. IDs:`, eventsList.map(e=>e.id));
        dispatch({ type: 'SET_EVENTS', payload: eventsList });
      } catch (error) {
        console.error("Fetch Events Effect: Error fetching events: ", error);
        const errorMsg = `Failed to load events: ${error.code || error.message}`;
        dispatch({ type: 'SET_ERROR', payload: errorMsg });
        toast.error(errorMsg);
      }
      // Loading is set to false within the reducer for SET_EVENTS or SET_ERROR
    };
    fetchEvents();
  }, [state.userId]); // Dependency: userId


  // --- Action Creators ---

  // --- Event Actions (Keep implementations as before, add logs if needed) ---
  const createEvent = useCallback(async (title, description) => {
    // ... (previous implementation)
  }, [state.userId]);

  const updateEvent = useCallback(async (eventUpdate) => {
    // ... (previous implementation)
  }, [state.userId]);

  const deleteEvent = useCallback(async (eventId) => {
    // ... (previous implementation)
  }, [state.userId]);

  // New function to fetch forms specifically for an event
  const fetchFormsForEvent = useCallback(async (eventIdToFetch) => {
        if (!state.userId || !eventIdToFetch) {
             console.warn(`WorkspaceFormsForEvent: Aborted - missing userId (${state.userId}) or eventId (${eventIdToFetch})`);
             return;
        }
        // Avoid fetching if forms for this event are already loaded *and* context isn't loading
        if (state.currentEvent?.id === eventIdToFetch && state.currentEventForms.length > 0 && !state.isLoading) {
            console.log(`WorkspaceFormsForEvent: Forms for event ${eventIdToFetch} already loaded, skipping fetch.`);
            return;
        }
         console.log(`WorkspaceFormsForEvent: Fetching forms for event ${eventIdToFetch}...`);
         // Set loading only if not already loading (maybe related to event fetch)
         if (!state.isLoading) dispatch({ type: 'SET_LOADING', payload: true });
         dispatch({ type: 'SET_ERROR', payload: null }); // Clear errors for new fetch
        try {
            const formsCollectionRef = collection(database, 'events', eventIdToFetch, 'forms');
            const q = query(formsCollectionRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const formsList = querySnapshot.docs.map(doc => ({
                id: doc.id, ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.().toISOString() || null,
                updatedAt: doc.data().updatedAt?.toDate?.().toISOString() || null,
             }));
             console.log(`WorkspaceFormsForEvent: Fetched ${formsList.length} forms for event ${eventIdToFetch}.`);
             // Dispatch only if the event being fetched for is still the current target
             // This prevents race conditions if user navigates quickly
             if (state.currentEvent?.id === eventIdToFetch || !state.currentEvent) { // Allow if currentEvent isn't set yet
                 dispatch({ type: 'SET_CURRENT_EVENT_FORMS', payload: { eventId: eventIdToFetch, forms: formsList } });
             } else {
                  console.warn(`WorkspaceFormsForEvent: Fetched forms for ${eventIdToFetch}, but current event changed to ${state.currentEvent?.id}. Discarding results.`);
                  if (state.isLoading) dispatch({ type: 'SET_LOADING', payload: false }); // Stop loading if we discard results
             }
        } catch (error) {
             console.error(`WorkspaceFormsForEvent: Error fetching forms for event ${eventIdToFetch}: `, error);
             const errorMsg = `Failed to load forms: ${error.code || error.message}`;
             // Set error only if it relates to the currently targeted event
             if (state.currentEvent?.id === eventIdToFetch || !state.currentEvent) {
                 dispatch({ type: 'SET_ERROR', payload: errorMsg });
                 toast.error(errorMsg);
             } else {
                 if (state.isLoading) dispatch({ type: 'SET_LOADING', payload: false }); // Still need to stop loading
             }
        }
         // Loading is stopped in reducer on success/error dispatch for the relevant event
    }, [state.userId, state.currentEvent?.id, state.currentEventForms.length, state.isLoading]); // Added length dependency


    // --- Set Current Event ID (Handles finding event & triggering form fetch) ---
   const setCurrentEventId = useCallback((eventId) => {
       console.log(`setCurrentEventId called with: ${eventId}. Current state event: ${state.currentEvent?.id}, Events loaded: ${state.events.length}`);
       if (!eventId) {
           dispatch({ type: 'SET_CURRENT_EVENT', payload: null });
           return;
       }
        // If the requested event is already set, just ensure forms are fetched if needed
        if (state.currentEvent?.id === eventId) {
            console.log(`setCurrentEventId: Event ${eventId} is already current.`);
             // Check if forms are missing and not loading/errored
             if (!state.isLoading && !state.error && state.currentEventForms.length === 0) {
                 console.log(`setCurrentEventId: Triggering form fetch for already current event ${eventId}.`);
                 fetchFormsForEvent(eventId);
             }
            return;
        }

       // Find event in the *already fetched* list in the state
       const event = state.events.find(e => e.id === eventId);

       if (event) {
            console.log(`setCurrentEventId: Found event ${eventId} in state.events list. Setting as current.`);
            dispatch({ type: 'SET_CURRENT_EVENT', payload: event });
            console.log(`setCurrentEventId: Triggering form fetch for newly set event ${eventId}.`);
            fetchFormsForEvent(eventId); // Fetch forms for this newly set event
       } else {
            // Event not found in the list that *should* have been loaded by Effect 2
            console.warn(`setCurrentEventId: Event ${eventId} not found in state.events list (${state.events.length} events loaded). This might be a timing issue or the event doesn't exist/belong to user ${state.userId}.`);
            // Dispatch null and set error - the component should handle showing the error state
             const errorMsg = `Event ${eventId} not found.`;
             dispatch({ type: 'SET_ERROR', payload: errorMsg });
             dispatch({ type: 'SET_CURRENT_EVENT', payload: null });
             toast.error(errorMsg); // Show toast immediately
       }
   }, [state.events, state.currentEvent?.id, state.userId, state.isLoading, state.error, state.currentEventForms.length, fetchFormsForEvent]); // Added dependencies


  // --- Form Actions ---
  const createFormForEvent = useCallback(async (eventId, title, description) => {
    // ... (previous implementation with added logging if desired) ...
     console.log(`createFormForEvent: Attempting for event ${eventId}`);
     // ... rest of try/catch ...
      return newForm; // Ensure promise resolves with the form on success
  }, [state.userId]);

   const updateFormForEvent = useCallback(async (eventId, formUpdate) => {
    // ... (previous implementation with added logging if desired) ...
     console.log(`updateFormForEvent: Updating form ${formUpdate.id} in event ${eventId}`);
     // ... rest of try/catch ...
   }, [state.userId]);

   const deleteFormForEvent = useCallback(async (eventId, formId) => {
    // ... (previous implementation with added logging if desired) ...
     console.log(`deleteFormForEvent: Deleting form ${formId} from event ${eventId}`);
     // ... rest of try/catch ...
   }, [state.userId]);


   // --- Question Actions (Ensure context function names match FormBuilder calls) ---
   const addQuestionToForm = useCallback(async (eventId, formId, question) => {
       console.log(`addQuestionToForm: Adding question to form ${formId}`);
        if (!state.userId || !eventId || !formId || !question) return null;
        const form = state.currentEventForms.find(f => f.id === formId);
        if (!form) {
             console.error(`Cannot add question: Form ${formId} not found in current event state.`);
             toast.error("Form context error. Please refresh.");
             return null;
        }
        const newQuestion = { ...question, id: `q-${Date.now()}-${Math.random().toString(16).slice(2)}` };
        const sanitizedNewQuestion = sanitizeDataForFirestore(newQuestion);
        const updatedQuestions = [...(form.questions || []), sanitizedNewQuestion];
        try {
            await updateFormForEvent(eventId, { id: formId, questions: updatedQuestions });
            // Find the updated form in the potentially updated state to return it
            const updatedFormState = state.currentEventForms.find(f => f.id === formId);
            return updatedFormState || { ...form, questions: updatedQuestions }; // Return updated form data
        } catch (error) {
            console.error("Error adding question:", error);
            return null;
        }
   }, [state.userId, state.currentEventForms, updateFormForEvent]);

   // Renaming context functions to match FormBuilder expectations if needed
   const updateQuestion = useCallback(async (eventId, formId, question) => {
       console.log(`updateQuestion: Updating question ${question.id} in form ${formId}`);
       if (!state.userId || !eventId || !formId || !question?.id) return;
       const form = state.currentEventForms.find(f => f.id === formId);
       if (!form) {
            console.error(`Cannot update question: Form ${formId} not found.`);
             toast.error("Form context error. Please refresh.");
            return;
       }
       const sanitizedQuestion = sanitizeDataForFirestore(question);
       const updatedQuestions = (form.questions || []).map(q => q.id === sanitizedQuestion.id ? sanitizedQuestion : q);
       if (JSON.stringify(form.questions || []) !== JSON.stringify(updatedQuestions)) {
            await updateFormForEvent(eventId, { id: formId, questions: updatedQuestions });
       }
  }, [state.userId, state.currentEventForms, updateFormForEvent]);

  const deleteQuestion = useCallback(async (eventId, formId, questionId) => {
      console.log(`deleteQuestion: Deleting question ${questionId} from form ${formId}`);
       if (!state.userId || !eventId || !formId || !questionId) return;
       const form = state.currentEventForms.find(f => f.id === formId);
       if (!form) {
            console.error(`Cannot delete question: Form ${formId} not found.`);
             toast.error("Form context error. Please refresh.");
            return;
       }
       const updatedQuestions = (form.questions || []).filter(q => q.id !== questionId);
       if (updatedQuestions.length !== (form.questions || []).length) {
            await updateFormForEvent(eventId, { id: formId, questions: updatedQuestions });
       }
  }, [state.userId, state.currentEventForms, updateFormForEvent]);

  // --- Response Actions (Keep as is, add logs if needed) ---
  const submitResponse = useCallback(async (eventId, formId, answers) => {
      // ... (previous implementation)
  }, [auth, state.currentEvent?.id]);

  const fetchResponses = useCallback(async (eventId, formId) => {
      // ... (previous implementation)
  }, [state.currentEvent?.id, state.currentEventFormResponses]);


  // Context Value Memo (Ensure names match what FormBuilder uses, e.g., addQuestionToForm, updateQuestion, deleteQuestion)
  const contextValue = useMemo(() => ({
    state,
    createEvent, updateEvent, deleteEvent, setCurrentEventId,
    createFormForEvent, updateFormForEvent, deleteFormForEvent,
    // Ensure these match the function names defined above
    addQuestionToForm,
    updateQuestion, // Make sure this name matches the one defined above
    deleteQuestion, // Make sure this name matches the one defined above
    submitResponse, fetchResponses,
    getEvent: (eventId) => state.events.find(event => event.id === eventId),
    getCurrentEvent: () => state.currentEvent,
    getFormsForCurrentEvent: () => state.currentEventForms,
    getResponsesForForm: (formId) => state.currentEventFormResponses[formId] || [],
  }), [
    state, createEvent, updateEvent, deleteEvent, setCurrentEventId,
    createFormForEvent, updateFormForEvent, deleteFormForEvent,
    addQuestionToForm, updateQuestion, deleteQuestion, // Add the actual function names here
    submitResponse, fetchResponses
  ]);

  return (
    <EventManagerContext.Provider value={contextValue}>
      {children}
    </EventManagerContext.Provider>
  );
};

// Custom hook (keep as is)
export const useEventManager = () => {
  const context = useContext(EventManagerContext);
  if (!context) {
    throw new Error('useEventManager must be used within an EventManagerProvider');
  }
  return context;
};
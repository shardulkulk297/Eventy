/* src/features/CreateEvent/context/EventManagerContext.jsx */
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
  deleteField // Import deleteField for removing fields if needed
} from 'firebase/firestore';
import { app, database } from '@/firebaseConfig';
import { toast } from 'sonner';

// --- Data Sanitization Utility (Keep as is) ---
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
        const sanitizedValue = sanitizeDataForFirestore(value);
        sanitizedObject[key] = sanitizedValue;
      }
    }
  }
  return sanitizedObject;
};
// --- End Sanitization ---

// Create context (Renamed)
const EventManagerContext = createContext(undefined);

// Initial state (Updated for Events)
const initialState = {
  events: [], // Changed from forms to events
  currentEvent: null, // Changed from currentForm
  currentEventForms: [], // Forms for the currently viewed event
  currentEventFormResponses: {}, // Responses keyed by formId for the current event
  isLoading: true,
  error: null,
  userId: null,
};

// Reducer function (Updated for Events and Forms within Events)
const eventManagerReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER_ID':
      if (state.userId === action.payload) return state;
      if (action.payload === null) return { ...initialState, userId: null, isLoading: false };
      // Reset state related to previous user
      return { ...initialState, userId: action.payload, isLoading: true };

    case 'SET_EVENTS': // Renamed from SET_FORMS
       if (JSON.stringify(state.events) === JSON.stringify(action.payload))
            return { ...state, isLoading: false, error: null };
      return { ...state, events: action.payload, isLoading: false, error: null };

    case 'SET_CURRENT_EVENT_FORMS': // New: Set forms for the current event
        if (state.currentEvent?.id !== action.payload.eventId) return state; // Ensure forms match current event
        if (JSON.stringify(state.currentEventForms) === JSON.stringify(action.payload.forms))
            return { ...state, isLoading: false, error: null };
      return { ...state, currentEventForms: action.payload.forms, isLoading: false, error: null };

    case 'ADD_EVENT_SUCCESS': // Renamed from ADD_FORM_SUCCESS
      if (state.events.some(e => e.id === action.payload.id)) return state;
      // Optional: Set new event as current? Depends on desired UX.
      return { ...state, events: [...state.events, action.payload], isLoading: false, error: null };

    case 'UPDATE_EVENT_SUCCESS': { // Renamed from UPDATE_FORM_SUCCESS
      let eventUpdated = false;
      const updatedEvents = state.events.map(event => {
        if (event.id === action.payload.id) {
          // Basic check for changes, improve if needed (deep compare?)
          if (JSON.stringify(event) !== JSON.stringify({ ...event, ...action.payload })) {
            eventUpdated = true;
            return { ...event, ...action.payload };
          }
        }
        return event;
      });
      if (!eventUpdated) return { ...state, isLoading: false, error: null };
       // Update currentEvent if it matches
       const updatedCurrentEvent = state.currentEvent?.id === action.payload.id
            ? updatedEvents.find(e => e.id === action.payload.id)
            : state.currentEvent;
      return { ...state, events: updatedEvents, currentEvent: updatedCurrentEvent, isLoading: false, error: null };
    }

     case 'DELETE_EVENT_SUCCESS': { // Renamed from DELETE_FORM_SUCCESS
       const eventIdToDelete = action.payload;
       if (!state.events.some(event => event.id === eventIdToDelete)) return state;
      // Clear related forms/responses if the current event is deleted
       const newCurrentEventForms = state.currentEvent?.id === eventIdToDelete ? [] : state.currentEventForms;
       const newCurrentEventFormResponses = state.currentEvent?.id === eventIdToDelete ? {} : state.currentEventFormResponses;
      return {
        ...state,
        events: state.events.filter(event => event.id !== eventIdToDelete),
        currentEvent: state.currentEvent?.id === eventIdToDelete ? null : state.currentEvent,
        currentEventForms: newCurrentEventForms,
        currentEventFormResponses: newCurrentEventFormResponses,
        isLoading: false,
        error: null
      };
    }

    // --- Form Specific Actions (Scoped to currentEvent) ---
    case 'ADD_FORM_FOR_EVENT_SUCCESS':
        if (state.currentEvent?.id !== action.payload.eventId) return state; // Ignore if not current event
        if (state.currentEventForms.some(f => f.id === action.payload.form.id)) return state;
      return {
        ...state,
        currentEventForms: [...state.currentEventForms, action.payload.form],
        // Optional: Update event's formCount if tracked
        events: state.events.map(e => e.id === action.payload.eventId ? { ...e, formCount: (e.formCount || 0) + 1 } : e),
        isLoading: false, error: null
       };

    case 'UPDATE_FORM_FOR_EVENT_SUCCESS': {
        if (state.currentEvent?.id !== action.payload.eventId) return state;
        let formUpdated = false;
        const updatedForms = state.currentEventForms.map(form => {
            if (form.id === action.payload.form.id) {
                 if (JSON.stringify(form) !== JSON.stringify({ ...form, ...action.payload.form })) {
                    formUpdated = true;
                    return { ...form, ...action.payload.form };
                 }
            }
            return form;
        });
        if (!formUpdated) return { ...state, isLoading: false, error: null };
        return { ...state, currentEventForms: updatedForms, isLoading: false, error: null };
    }

    case 'DELETE_FORM_FOR_EVENT_SUCCESS': {
      if (state.currentEvent?.id !== action.payload.eventId) return state;
      const formIdToDelete = action.payload.formId;
      if (!state.currentEventForms.some(form => form.id === formIdToDelete)) return state;
      const newResponses = { ...state.currentEventFormResponses };
      delete newResponses[formIdToDelete]; // Remove responses for the deleted form
      return {
        ...state,
        currentEventForms: state.currentEventForms.filter(form => form.id !== formIdToDelete),
        currentEventFormResponses: newResponses,
        // Optional: Update event's formCount if tracked
         events: state.events.map(e => e.id === action.payload.eventId ? { ...e, formCount: Math.max(0, (e.formCount || 1) - 1) } : e),
        isLoading: false, error: null
      };
    }

    // --- Response Specific Actions (Scoped to currentEvent) ---
    case 'SET_CURRENT_EVENT_FORM_RESPONSES':
        if (state.currentEvent?.id !== action.payload.eventId) return state;
        if (JSON.stringify(state.currentEventFormResponses[action.payload.formId]) === JSON.stringify(action.payload.responses))
             return { ...state, isLoading: false, error: null };
      return {
        ...state,
        currentEventFormResponses: {
          ...state.currentEventFormResponses,
          [action.payload.formId]: action.payload.responses
        },
        isLoading: false, error: null
      };

    case 'ADD_RESPONSE_FOR_EVENT_SUCCESS': {
      const { eventId, formId, response } = action.payload;
      // Potentially update response count on the specific form if displayed
       const updatedForms = state.currentEventForms.map(f => {
            if (f.id === formId) {
                 return { ...f, responseCount: (f.responseCount || 0) + 1 };
            }
            return f;
       });
       // Update responses for the specific form
       const existingResponses = state.currentEventFormResponses[formId] || [];
       const updatedResponses = [...existingResponses, response];
      return {
        ...state,
         currentEventForms: updatedForms, // Update forms if count is shown
        currentEventFormResponses: {
          ...state.currentEventFormResponses,
          [formId]: updatedResponses
        },
        isLoading: false, error: null
      };
    }

    case 'SET_CURRENT_EVENT': // New action to set the current event context
      return {
        ...state,
        currentEvent: action.payload,
        currentEventForms: [], // Reset forms when event changes
        currentEventFormResponses: {} // Reset responses when event changes
       };

    case 'SET_LOADING':
      if (state.isLoading === action.payload) return state;
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      if (state.error === action.payload) return { ...state, isLoading: false };
      console.error("Context Error Set:", action.payload); // Log errors
      return { ...state, error: action.payload, isLoading: false };

    default:
      return state;
  }
};

// Provider component (Renamed)
export const EventManagerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(eventManagerReducer, initialState);
  const auth = getAuth(app);

  // Effect 1: Handle Auth State Changes (Mostly unchanged)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      dispatch({ type: 'SET_USER_ID', payload: user ? user.uid : null });
    });
    return () => unsubscribe();
  }, [auth]); // Keep auth dependency

  // Effect 2: Fetch Events when User ID is valid (Changed from fetchForms)
  useEffect(() => {
    if (!state.userId) {
      if (state.isLoading) dispatch({ type: 'SET_LOADING', payload: false });
      if (state.events.length > 0) dispatch({ type: 'SET_EVENTS', payload: [] });
      return;
    }

    const fetchEvents = async () => {
      if (!state.isLoading) dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Path: users/{userId}/CreatedEvents
        const eventsCollectionRef = collection(database, 'users', state.userId, 'CreatedEvents');
        const q = query(eventsCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const eventsList = querySnapshot.docs.map(doc => ({
          id: doc.id, ...doc.data(),
          // Convert Timestamps
          createdAt: doc.data().createdAt?.toDate?.().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate?.().toISOString(),
        }));
        dispatch({ type: 'SET_EVENTS', payload: eventsList });
      } catch (error) {
        console.error("Error fetching events: ", error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load events.' });
        toast.error("Failed to load your events.");
      } finally {
           // Ensure loading is set to false even if fetch fails or is empty
           if (state.isLoading) {
                dispatch({ type: 'SET_LOADING', payload: false });
           }
      }
    };
    fetchEvents();
  }, [state.userId]); // Dependency: userId

  // --- Action Creators (Refactored for Events and Forms) ---

  // --- Event Actions ---
  const createEvent = useCallback(async (title, description) => {
    if (!state.userId) { toast.error("Login required to create events."); return null; }
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
        // 1. Add to users/{userId}/CreatedEvents
        const userEventsCollectionRef = collection(database, 'users', state.userId, 'CreatedEvents');
        const eventDataUser = sanitizeDataForFirestore({
            title: title || 'Untitled Event',
            description: description || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            creatorId: state.userId,
            formCount: 0, // Initialize form count
            responseCount: 0 // Initialize overall response count? Or track per form?
        });
        const userEventDocRef = await addDoc(userEventsCollectionRef, eventDataUser);
        const newEventId = userEventDocRef.id;

        // 2. Add to top-level events/{eventId}
        const topLevelEventDocRef = doc(database, 'events', newEventId);
         const eventDataTopLevel = sanitizeDataForFirestore({
            title: title || 'Untitled Event',
            description: description || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            creatorId: state.userId,
            // Add other relevant public/shared event details here later
         });
        await setDoc(topLevelEventDocRef, eventDataTopLevel);

         // 3. (Optional but good practice) Update user's main doc count
         const userDocRef = doc(database, 'users', state.userId);
         await setDoc(userDocRef, { eventCount: increment(1) }, { merge: true })
           .catch(err => console.warn("Could not update user event count:", err));

        // 4. Fetch the newly created event data to add to state
        const newEventSnap = await getDoc(userEventDocRef); // Get from user's subcollection
        if (newEventSnap.exists()) {
            const newEvent = {
                id: newEventSnap.id,
                ...newEventSnap.data(),
                createdAt: newEventSnap.data().createdAt?.toDate?.().toISOString() || new Date().toISOString(),
                updatedAt: newEventSnap.data().updatedAt?.toDate?.().toISOString() || new Date().toISOString(),
            };
             dispatch({ type: 'ADD_EVENT_SUCCESS', payload: newEvent });
             toast.success("Event created!");
             return newEvent; // Return the created event data
        } else {
            throw new Error("Failed to fetch newly created event data.");
        }
    } catch (error) {
      console.error("Error creating event: ", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create event.' });
      toast.error("Failed to create event.");
      return null;
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.userId]); // dispatch removed as it's stable from useReducer

   const updateEvent = useCallback(async (eventUpdate) => {
       if (!state.userId || !eventUpdate?.id) {
            toast.error("Cannot update event: Missing information."); return;
       }
       const eventId = eventUpdate.id;
       dispatch({ type: 'SET_LOADING', payload: true });

       try {
           const updateData = { ...eventUpdate };
           delete updateData.id; // Don't save ID field within the document
           updateData.updatedAt = serverTimestamp(); // Always update timestamp
           const sanitizedUpdateData = sanitizeDataForFirestore(updateData);

           // 1. Update user's event document
           const userEventDocRef = doc(database, 'users', state.userId, 'CreatedEvents', eventId);
           await updateDoc(userEventDocRef, sanitizedUpdateData);

            // 2. Update top-level event document (only relevant fields like title/desc)
            const topLevelUpdateData = {};
            if (sanitizedUpdateData.title !== undefined) topLevelUpdateData.title = sanitizedUpdateData.title;
            if (sanitizedUpdateData.description !== undefined) topLevelUpdateData.description = sanitizedUpdateData.description;
            // Add other fields if they need sync
            if (Object.keys(topLevelUpdateData).length > 0) {
                topLevelUpdateData.updatedAt = serverTimestamp(); // Also update timestamp here
                const topLevelEventDocRef = doc(database, 'events', eventId);
                await updateDoc(topLevelEventDocRef, topLevelUpdateData)
                   .catch(err => console.warn("Could not update top-level event doc:", err));
            }

            // 3. Update local state
            dispatch({ type: 'UPDATE_EVENT_SUCCESS', payload: { ...eventUpdate, updatedAt: new Date().toISOString() } }); // Use client-side timestamp for immediate UI update
             toast.success("Event updated.");

       } catch (error) {
            console.error("Error updating event:", error);
            dispatch({ type: 'SET_ERROR', payload: `Failed to update event. ${error.message}` });
            toast.error(`Failed to save event changes: ${error.code || error.message}`);
       } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
       }
   }, [state.userId]);

   const deleteEvent = useCallback(async (eventId) => {
    if (!state.userId || !eventId) { toast.error("Cannot delete event: Missing info."); return; }
    if (!window.confirm(`Delete event and ALL associated forms and responses permanently? This cannot be undone.`)) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const batch = writeBatch(database);

      // --- Delete Steps ---
       // 1. Delete Forms & Responses within the event (Iterate through forms first)
       const formsCollectionRef = collection(database, 'events', eventId, 'forms');
       const formsSnapshot = await getDocs(formsCollectionRef);

       for (const formDoc of formsSnapshot.docs) {
            // Delete responses for this form
            const responsesCollectionRef = collection(database, 'events', eventId, 'forms', formDoc.id, 'responses');
            const responsesSnapshot = await getDocs(responsesCollectionRef);
            responsesSnapshot.forEach(responseDoc => batch.delete(responseDoc.ref));

             // Delete the form itself
            batch.delete(formDoc.ref);
       }

      // 2. Delete Top-level event document
      const topLevelEventDocRef = doc(database, 'events', eventId);
      batch.delete(topLevelEventDocRef);

      // 3. Delete User's event document
      const userEventDocRef = doc(database, 'users', state.userId, 'CreatedEvents', eventId);
      batch.delete(userEventDocRef);

       // 4. Decrement user's event count (optional)
       const userDocRef = doc(database, 'users', state.userId);
       batch.update(userDocRef, { eventCount: increment(-1) }); // Use update, requires eventCount to exist

      // Commit all deletions
      await batch.commit();

      // Update local state
      dispatch({ type: 'DELETE_EVENT_SUCCESS', payload: eventId });
      toast.success("Event and all related data deleted.");

    } catch (error) {
      console.error("Error deleting event: ", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete event.' });
      toast.error("Failed to delete event.");
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.userId]);


   // --- Form Actions (Scoped within an Event) ---

   const createFormForEvent = useCallback(async (eventId, title, description) => {
    if (!state.userId || !eventId) { toast.error("Event context missing."); return null; }
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Path: events/{eventId}/forms
      const formsCollectionRef = collection(database, 'events', eventId, 'forms');
      const formData = sanitizeDataForFirestore({
        title: title || 'Untitled Form',
        description: description || '',
        questions: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        creatorId: state.userId, // Keep creatorId if needed
        responseCount: 0,
        eventId: eventId // Store parent event ID
      });
      const docRef = await addDoc(formsCollectionRef, formData);

       // Increment formCount on the user's event document
       const userEventDocRef = doc(database, 'users', state.userId, 'CreatedEvents', eventId);
       await updateDoc(userEventDocRef, { formCount: increment(1), updatedAt: serverTimestamp() })
           .catch(err => console.warn("Could not update event form count:", err));

      // Fetch and dispatch
      const newDocSnap = await getDoc(docRef);
      const newForm = {
        id: newDocSnap.id, ...newDocSnap.data(),
        createdAt: newDocSnap.data().createdAt?.toDate?.().toISOString() || new Date().toISOString(),
        updatedAt: newDocSnap.data().updatedAt?.toDate?.().toISOString() || new Date().toISOString(),
      };
      dispatch({ type: 'ADD_FORM_FOR_EVENT_SUCCESS', payload: { eventId, form: newForm } });
      toast.success("Form created for event!");
      return newForm;
    } catch (error) {
      console.error("Error creating form for event: ", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create form.' });
      toast.error("Failed to create form.");
      return null;
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.userId]); // dispatch is stable

   const updateFormForEvent = useCallback(async (eventId, formUpdate) => {
    if (!state.userId || !eventId || !formUpdate?.id) {
        toast.error("Cannot update form: Missing information."); return;
    }
    const formId = formUpdate.id;
    // Path: events/{eventId}/forms/{formId}
    const formDocRef = doc(database, 'events', eventId, 'forms', formId);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const updateData = { ...formUpdate };
      delete updateData.id; // Don't save ID within the doc
      updateData.updatedAt = serverTimestamp();
      const sanitizedUpdateData = sanitizeDataForFirestore(updateData);

      console.log('Attempting to update form:', formId, 'in event:', eventId, 'with sanitized data:', JSON.stringify(sanitizedUpdateData, null, 2));
      await updateDoc(formDocRef, sanitizedUpdateData);

       // Also update the timestamp on the user's event document
       const userEventDocRef = doc(database, 'users', state.userId, 'CreatedEvents', eventId);
       await updateDoc(userEventDocRef, { updatedAt: serverTimestamp() })
           .catch(err => console.warn("Could not update event timestamp during form update:", err));


      // Update local state for the current event's forms
      dispatch({ type: 'UPDATE_FORM_FOR_EVENT_SUCCESS', payload: { eventId, form: { ...formUpdate, updatedAt: new Date().toISOString() } } });
      // No toast here by default, maybe add in component if needed
    } catch (error) {
      console.error("Error updating form:", error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to save form changes. ${error.message}` });
      toast.error(`Failed to save changes: ${error.code || error.message}`);
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.userId]);

   const deleteFormForEvent = useCallback(async (eventId, formId) => {
    if (!state.userId || !eventId || !formId) { toast.error("Cannot delete form: Missing info."); return; }
     if (!window.confirm(`Delete form and ALL its responses permanently?`)) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const batch = writeBatch(database);

      // 1. Delete Responses for this form
      // Path: events/{eventId}/forms/{formId}/responses
      const responsesCollectionRef = collection(database, 'events', eventId, 'forms', formId, 'responses');
      const responsesSnapshot = await getDocs(responsesCollectionRef);
      responsesSnapshot.forEach(doc => batch.delete(doc.ref));

      // 2. Delete the Form document itself
      // Path: events/{eventId}/forms/{formId}
      const formDocRef = doc(database, 'events', eventId, 'forms', formId);
      batch.delete(formDocRef);

       // 3. Decrement formCount on the user's event document
       const userEventDocRef = doc(database, 'users', state.userId, 'CreatedEvents', eventId);
       batch.update(userEventDocRef, { formCount: increment(-1), updatedAt: serverTimestamp() });

      // Commit batch
      await batch.commit();

      // Update local state
      dispatch({ type: 'DELETE_FORM_FOR_EVENT_SUCCESS', payload: { eventId, formId } });
      toast.success("Form deleted.");

    } catch (error) {
      console.error("Error deleting form: ", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete form.' });
      toast.error("Failed to delete form.");
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.userId]);


  // --- Question Actions (Now need eventId and formId) ---
   const addQuestionToForm = useCallback(async (eventId, formId, question) => {
        if (!state.userId || !eventId || !formId || !question) return;
        const form = state.currentEventForms.find(f => f.id === formId); // Find the form in current state
        if (!form) {
             console.error(`Cannot add question: Form ${formId} not found in current event state.`); return;
        }
        const newQuestion = { ...question, id: `q-${Date.now()}` };
        const sanitizedNewQuestion = sanitizeDataForFirestore(newQuestion);
        const updatedQuestions = [...(form.questions || []), sanitizedNewQuestion];
        // Use updateFormForEvent to save the changes
        await updateFormForEvent(eventId, { id: formId, questions: updatedQuestions });
   }, [state.userId, state.currentEventForms, updateFormForEvent]); // Ensure dependencies are correct


  const updateQuestionInForm = useCallback(async (eventId, formId, question) => {
       if (!state.userId || !eventId || !formId || !question?.id) return;
       const form = state.currentEventForms.find(f => f.id === formId);
       if (!form) {
            console.error(`Cannot update question: Form ${formId} not found.`); return;
       }
       const sanitizedQuestion = sanitizeDataForFirestore(question);
       const updatedQuestions = (form.questions || []).map(q => q.id === sanitizedQuestion.id ? sanitizedQuestion : q);
       if (JSON.stringify(form.questions || []) !== JSON.stringify(updatedQuestions)) {
            await updateFormForEvent(eventId, { id: formId, questions: updatedQuestions });
       }
  }, [state.userId, state.currentEventForms, updateFormForEvent]);

  const deleteQuestionFromForm = useCallback(async (eventId, formId, questionId) => {
       if (!state.userId || !eventId || !formId || !questionId) return;
       const form = state.currentEventForms.find(f => f.id === formId);
       if (!form) {
            console.error(`Cannot delete question: Form ${formId} not found.`); return;
       }
       const updatedQuestions = (form.questions || []).filter(q => q.id !== questionId);
       if (updatedQuestions.length !== (form.questions || []).length) {
            await updateFormForEvent(eventId, { id: formId, questions: updatedQuestions });
       }
  }, [state.userId, state.currentEventForms, updateFormForEvent]);


  // --- Response Actions ---
   const submitResponse = useCallback(async (eventId, formId, answers) => {
    if (!eventId || !formId) { toast.error("Missing Event or Form ID."); return; }
    // Path: events/{eventId}/forms/{formId}/responses
    const responsesRef = collection(database, 'events', eventId, 'forms', formId, 'responses');
    const sanitizedAnswers = sanitizeDataForFirestore(answers);
    const responseData = { answers: sanitizedAnswers, submittedAt: serverTimestamp(), eventId, formId };
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const docRef = await addDoc(responsesRef, responseData);
      const newResponse = { ...responseData, id: docRef.id, submittedAt: new Date().toISOString() };

       // Increment responseCount on the specific form document
       const formDocRef = doc(database, 'events', eventId, 'forms', formId);
       await updateDoc(formDocRef, { responseCount: increment(1), updatedAt: serverTimestamp() })
            .catch(err => console.warn(`Could not update form response count:`, err));

       // Optional: Increment overall event response count if needed (on user's event doc)
       // const userEventDocRef = doc(database, 'users', state.userId, 'CreatedEvents', eventId);
       // await updateDoc(userEventDocRef, { responseCount: increment(1), updatedAt: serverTimestamp() });

      // Update local state for the current event's responses
      dispatch({ type: 'ADD_RESPONSE_FOR_EVENT_SUCCESS', payload: { eventId, formId, response: newResponse } });
       toast.success("Response submitted!"); // Give user feedback
    } catch (error) {
      console.error("Error submitting response: ", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to submit response.' });
      toast.error("Failed to submit response.");
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []); // dispatch is stable

   const fetchResponses = useCallback(async (eventId, formId) => {
    if (!eventId || !formId) return [];
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Path: events/{eventId}/forms/{formId}/responses
      const responsesRef = collection(database, 'events', eventId, 'forms', formId, 'responses');
      const q = query(responsesRef, orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const responsesList = querySnapshot.docs.map(doc => ({
        id: doc.id, ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate?.().toISOString(),
      }));
      // Update local state for the current event's responses
      dispatch({ type: 'SET_CURRENT_EVENT_FORM_RESPONSES', payload: { eventId, formId, responses: responsesList } });
      return responsesList;
    } catch (error) {
      console.error(`Error fetching responses for form ${formId} in event ${eventId}: `, error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load responses.' });
      toast.error("Failed to load responses.");
      return [];
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

   // --- Getters and Setters ---
   const getEvent = useCallback((eventId) => state.events.find(event => event.id === eventId), [state.events]);
   const getFormsForEvent = useCallback((eventId) => {
       // If the requested eventId is the current one, return from optimized state
        if (state.currentEvent?.id === eventId) {
            return state.currentEventForms;
        }
        // Otherwise, potentially fetch or return empty/stale data (or trigger a fetch)
        console.warn(`getFormsForEvent called for non-current event (${eventId}). Consider fetching.`);
        return []; // Or fetchFormsForEvent(eventId);
   }, [state.currentEvent, state.currentEventForms]); // Added dependencies

    const getResponsesForForm = useCallback((formId) => {
        // Assumes responses are only stored in state for the *current* event
        return state.currentEventFormResponses[formId] || [];
   }, [state.currentEventFormResponses]);

   const setCurrentEventId = useCallback((eventId) => {
       const event = state.events.find(e => e.id === eventId);
       if (event) {
            dispatch({ type: 'SET_CURRENT_EVENT', payload: event });
            // Fetch forms for this newly set event
            fetchFormsForEvent(eventId); // Call the fetch function
       } else {
            dispatch({ type: 'SET_CURRENT_EVENT', payload: null });
            console.warn(`setCurrentEventId: Event ${eventId} not found in state.`);
       }
   }, [state.events]); // fetchFormsForEvent removed, called internally

   // New Fetch function for forms within an event
    const fetchFormsForEvent = useCallback(async (eventId) => {
        if (!eventId) return;
        // Avoid fetching if this is already the current event and forms are loaded
        // (Optional optimization, depends on how often you expect forms to change externally)
        // if (state.currentEvent?.id === eventId && state.currentEventForms.length > 0) {
        //    return;
        // }

        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            // Path: events/{eventId}/forms
            const formsCollectionRef = collection(database, 'events', eventId, 'forms');
            const q = query(formsCollectionRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const formsList = querySnapshot.docs.map(doc => ({
                id: doc.id, ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.().toISOString(),
                updatedAt: doc.data().updatedAt?.toDate?.().toISOString(),
             }));
             // Dispatch action to set these forms specifically for this event
            dispatch({ type: 'SET_CURRENT_EVENT_FORMS', payload: { eventId, forms: formsList } });
        } catch (error) {
             console.error(`Error fetching forms for event ${eventId}: `, error);
             dispatch({ type: 'SET_ERROR', payload: 'Failed to load forms for the event.' });
             toast.error("Failed to load forms for this event.");
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []); // dispatch removed


  // Context Value Memo (Updated with new/renamed functions)
  const contextValue = useMemo(() => ({
    state,
    dispatch, // Keep dispatch if components need it directly (less common now)
    // Event Actions
    createEvent,
    updateEvent,
    deleteEvent,
    getEvent,
    setCurrentEventId, // Use this to set the context for form/response actions
    // Form Actions (scoped to currentEvent implicitly or explicitly)
    createFormForEvent,
    fetchFormsForEvent, // Expose if needed directly
    updateFormForEvent,
    deleteFormForEvent,
    addQuestionToForm,
    updateQuestionInForm,
    deleteQuestionFromForm,
    getFormsForEvent, // Getter for forms of the current event
    // Response Actions (scoped to currentEvent implicitly or explicitly)
    submitResponse,
    fetchResponses, // Expose if needed directly
    getResponsesForForm, // Getter for responses of a specific form in the current event
  }), [
    state, dispatch, createEvent, updateEvent, deleteEvent, getEvent, setCurrentEventId,
    createFormForEvent, fetchFormsForEvent, updateFormForEvent, deleteFormForEvent,
    addQuestionToForm, updateQuestionInForm, deleteQuestionFromForm, getFormsForEvent,
    submitResponse, fetchResponses, getResponsesForForm
  ]);

  return (
    <EventManagerContext.Provider value={contextValue}>
      {children}
    </EventManagerContext.Provider>
  );
};

// Custom hook (Renamed)
export const useEventManager = () => {
  const context = useContext(EventManagerContext);
  if (!context) {
    throw new Error('useEventManager must be used within an EventManagerProvider');
  }
  return context;
};
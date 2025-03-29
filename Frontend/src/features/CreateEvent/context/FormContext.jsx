/* Eventy/Frontend/src/features/CreateEvent/context/FormContext.jsx */
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
// Recursively replace undefined values with null, suitable for Firestore
const sanitizeDataForFirestore = (data) => {
  if (data === undefined) {
    return null;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeDataForFirestore(item));
  }
  const sanitizedObject = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      // Keep serverTimestamp intact, otherwise sanitize
      if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'TimestampFieldValue') {
          sanitizedObject[key] = value; // Don't sanitize serverTimestamp itself
      } else {
          const sanitizedValue = sanitizeDataForFirestore(value);
          // Optionally remove null values too, but replacing undefined is usually enough
          // if (sanitizedValue !== null) {
             sanitizedObject[key] = sanitizedValue;
          // }
      }
    }
  }
  return sanitizedObject;
};
// ---------------------------------

// Create context
const FormContext = createContext(undefined);

// Initial state
const initialState = {
  forms: [],
  currentForm: null,
  responses: {},
  isLoading: true,
  error: null,
  userId: null,
};

// Reducer function (Robust checks added)
const formReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER_ID':
      if (state.userId === action.payload) return state;
      if (action.payload === null) return { ...initialState, userId: null, isLoading: false };
      return { ...state, userId: action.payload, isLoading: true, error: null, forms: [], currentForm: null, responses: {} };
    case 'SET_FORMS':
      if (JSON.stringify(state.forms) === JSON.stringify(action.payload)) return { ...state, isLoading: false, error: null };
      return { ...state, forms: action.payload, isLoading: false, error: null };
    case 'SET_CURRENT_FORM':
       if (state.currentForm?.id === action.payload?.id && JSON.stringify(state.currentForm) === JSON.stringify(action.payload)) return state;
       const newResponses = state.currentForm?.id === action.payload?.id ? state.responses : {};
      return { ...state, currentForm: action.payload, responses: newResponses };
    case 'ADD_FORM_SUCCESS':
      if (state.forms.some(f => f.id === action.payload.id)) return state;
      return { ...state, forms: [...state.forms, action.payload], currentForm: action.payload, isLoading: false, error: null };
    case 'UPDATE_FORM_SUCCESS': {
        let formUpdated = false;
        const updatedForms = state.forms.map(form => {
            if (form.id === action.payload.id) {
                if (JSON.stringify(form) !== JSON.stringify({ ...form, ...action.payload })) { formUpdated = true; return { ...form, ...action.payload }; }
            } return form;
        });
        if (!formUpdated) return { ...state, isLoading: false, error: null };
        const updatedCurrentForm = state.currentForm?.id === action.payload.id ? updatedForms.find(f => f.id === action.payload.id) : state.currentForm;
        return { ...state, forms: updatedForms, currentForm: updatedCurrentForm, isLoading: false, error: null };
      }
    case 'DELETE_FORM_SUCCESS': {
      const formIdToDelete = action.payload;
      if (!state.forms.some(form => form.id === formIdToDelete)) return state;
      const newResponses = { ...state.responses }; delete newResponses[formIdToDelete];
      return { ...state, forms: state.forms.filter(form => form.id !== formIdToDelete), responses: newResponses, currentForm: state.currentForm?.id === formIdToDelete ? null : state.currentForm, isLoading: false, error: null };
     }
    case 'SET_RESPONSES':
      if (JSON.stringify(state.responses[action.payload.formId]) === JSON.stringify(action.payload.responses)) return { ...state, isLoading: false, error: null };
      return { ...state, responses: { ...state.responses, [action.payload.formId]: action.payload.responses }, isLoading: false, error: null };
     case 'ADD_RESPONSE_SUCCESS': {
        const { formId, response } = action.payload;
        const existingResponses = state.responses[formId] || [];
        const updatedResponses = [...existingResponses, response];
        let formFound = false;
        const updatedForms = state.forms.map(f => { if (f.id === formId) { formFound = true; return { ...f, responseCount: (f.responseCount || 0) + 1 }; } return f; });
        if (!formFound) console.warn(`ADD_RESPONSE_SUCCESS: Form ${formId} not found.`);
        return { ...state, forms: formFound ? updatedForms : state.forms, responses: { ...state.responses, [formId]: updatedResponses }, currentForm: state.currentForm?.id === formId && formFound ? updatedForms.find(f => f.id === formId) : state.currentForm, isLoading: false, error: null };
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

// Provider component
export const FormProvider = ({ children }) => {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const auth = getAuth(app);

  // Effect 1: Handle Auth State Changes
  useEffect(() => {
    if (!state.isLoading) dispatch({ type: 'SET_LOADING', payload: true });
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        const newUserId = user ? user.uid : null;
        dispatch({ type: 'SET_USER_ID', payload: newUserId });
    });
    return () => unsubscribe();
  }, [auth]);

  // Effect 2: Fetch Forms when User ID is valid
  useEffect(() => {
    if (!state.userId) {
        if(state.isLoading) dispatch({ type: 'SET_LOADING', payload: false });
        if (state.forms.length > 0) dispatch({ type: 'SET_FORMS', payload: [] });
        return;
    }
    const fetchForms = async () => {
      if (!state.isLoading) dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const formsCollectionRef = collection(database, 'users', state.userId, 'forms');
        const q = query(formsCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const formsList = querySnapshot.docs.map(doc => ({
          id: doc.id, ...doc.data(),
           createdAt: doc.data().createdAt?.toDate?.().toISOString(),
           updatedAt: doc.data().updatedAt?.toDate?.().toISOString(),
        }));
        dispatch({ type: 'SET_FORMS', payload: formsList });
      } catch (error) {
        console.error("Error fetching forms: ", error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load forms.' });
        toast.error("Failed to load forms.");
      }
    };
    fetchForms();
  }, [state.userId]); // Dependency: userId


  // --- Action Creators ---

  const createForm = useCallback(async (title, description) => {
    if (!state.userId) { toast.error("Login required."); return null; }
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const formsCollectionRef = collection(database, 'users', state.userId, 'forms');
      const formData = { title, description, questions: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp(), creatorId: state.userId, responseCount: 0 };
      const docRef = await addDoc(formsCollectionRef, formData);

      const topLevelFormDocRef = doc(database, 'forms', docRef.id);
      await setDoc(topLevelFormDocRef, { creatorId: state.userId, title: title, createdAt: serverTimestamp(), responseCount: 0 }, { merge: true })
          .catch(err => console.warn("Could not set top-level form doc:", err));

      const userDocRef = doc(database, 'users', state.userId);
      await setDoc(userDocRef, { formCount: increment(1) }, { merge: true })
          .catch(err => console.error("Could not update user form count:", err));

      const newDocSnap = await getDoc(docRef);
      const newForm = {
          id: newDocSnap.id, ...newDocSnap.data(),
          createdAt: newDocSnap.data().createdAt?.toDate?.().toISOString() || new Date().toISOString(),
          updatedAt: newDocSnap.data().updatedAt?.toDate?.().toISOString() || new Date().toISOString(),
      };
      dispatch({ type: 'ADD_FORM_SUCCESS', payload: newForm });
      toast.success("Form created!");
      return newForm;
    } catch (error) {
      console.error("Error creating form: ", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create form.' });
      toast.error("Failed to create form.");
      return null;
    }
  }, [state.userId, dispatch]);

   const updateForm = useCallback(async (formUpdate) => {
        if (!state.userId || !formUpdate?.id) return;
        const formId = formUpdate.id;
        const formDocRef = doc(database, 'users', state.userId, 'forms', formId);
        try {
            const updateDataBase = { ...formUpdate };
            delete updateDataBase.id; // Don't save ID field
            updateDataBase.updatedAt = serverTimestamp(); // Always update timestamp

            // --- FIX: Sanitize data before sending ---
            const sanitizedUpdateData = sanitizeDataForFirestore(updateDataBase);
            // ------------------------------------------

            // --- DEBUG LOGGING ---
            console.log('Attempting to update form:', formId, 'with sanitized data:', JSON.stringify(sanitizedUpdateData, null, 2));
            // ---------------------

            await updateDoc(formDocRef, sanitizedUpdateData); // Use sanitized data

            if (sanitizedUpdateData.title) { // Update top-level title if changed
                 const topLevelFormDocRef = doc(database, 'forms', formId);
                 await updateDoc(topLevelFormDocRef, { title: sanitizedUpdateData.title })
                     .catch(err => console.warn("Could not update top-level title:", err));
            }
            dispatch({ type: 'UPDATE_FORM_SUCCESS', payload: { ...formUpdate, updatedAt: new Date().toISOString() } });
        } catch (error) {
            // Log the specific Firestore error
            console.error("Error updating form:", error); // Log the actual FirebaseError
            dispatch({ type: 'SET_ERROR', payload: `Failed to save changes. ${error.message}` }); // Include error message
            toast.error(`Failed to save changes: ${error.code || error.message}`);
        }
    }, [state.userId, dispatch]);

   const setCurrentForm = useCallback((formId) => {
        const form = state.forms.find(f => f.id === formId);
        dispatch({ type: 'SET_CURRENT_FORM', payload: form || null });
    }, [dispatch, state.forms]);

  const addQuestion = useCallback(async (question) => {
    if (!state.currentForm || !state.userId) return;
    const newQuestion = { ...question, id: `q-${Date.now()}` };
    // Ensure the new question object itself doesn't have undefined fields
    const sanitizedNewQuestion = sanitizeDataForFirestore(newQuestion);
    const updatedQuestions = [...state.currentForm.questions, sanitizedNewQuestion];
    await updateForm({ id: state.currentForm.id, questions: updatedQuestions });
  }, [state.currentForm, state.userId, updateForm]);

  const updateQuestion = useCallback(async (question) => {
      if (!state.currentForm || !state.userId || !question?.id) return;
      // Ensure the updated question object doesn't have undefined fields
      const sanitizedQuestion = sanitizeDataForFirestore(question);
      const updatedQuestions = state.currentForm.questions.map(q => q.id === sanitizedQuestion.id ? sanitizedQuestion : q);
      if (JSON.stringify(state.currentForm.questions) !== JSON.stringify(updatedQuestions)) {
        await updateForm({ id: state.currentForm.id, questions: updatedQuestions });
      }
  }, [state.currentForm, state.userId, updateForm]);

  const deleteQuestion = useCallback(async (questionId) => {
      if (!state.currentForm || !state.userId || !questionId) return;
      const updatedQuestions = state.currentForm.questions.filter(q => q.id !== questionId);
      if (updatedQuestions.length !== state.currentForm.questions.length) {
        await updateForm({ id: state.currentForm.id, questions: updatedQuestions });
      }
  }, [state.currentForm, state.userId, updateForm]);

  const deleteForm = useCallback(async (formId) => {
      if (!state.userId || !formId) { toast.error("Cannot delete: Missing info."); return; }
       if (!window.confirm("Delete form and ALL responses permanently?")) return;
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
          // Delete Responses: forms/{formId}/responses
          const responsesRef = collection(database, 'forms', formId, 'responses');
          const responsesSnap = await getDocs(responsesRef);
          if (responsesSnap.size > 0) {
              const batch = writeBatch(database);
              responsesSnap.forEach((doc) => batch.delete(doc.ref));
              await batch.commit();
          }
          // Delete User's form doc: users/{userId}/forms/{formId}
          const formDocRefUser = doc(database, 'users', state.userId, 'forms', formId);
          await deleteDoc(formDocRefUser);
          // Delete Top-level form doc: forms/{formId}
           const formDocRefTopLevel = doc(database, 'forms', formId);
           await deleteDoc(formDocRefTopLevel).catch(err => console.warn("Could not delete top-level doc:", err));
          // Update user count: users/{userId}
           const userDocRef = doc(database, 'users', state.userId);
           await setDoc(userDocRef, { formCount: increment(-1) }, { merge: true })
            .catch(err => console.error("Could not update count:", err));
          dispatch({ type: 'DELETE_FORM_SUCCESS', payload: formId });
          toast.success("Form deleted.");
      } catch (error) {
          console.error("Error deleting form: ", error);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to delete form.' });
          toast.error("Failed to delete form.");
      }
  }, [state.userId, dispatch]);

  const submitResponse = useCallback(async (formId, answers) => {
    if (!formId) { toast.error("Missing Form ID."); return; }
    // Path: forms/{formId}/responses
    const responsesRef = collection(database, 'forms', formId, 'responses');
    // Sanitize answers before submission
    const sanitizedAnswers = sanitizeDataForFirestore(answers);
    const responseData = { answers: sanitizedAnswers, submittedAt: serverTimestamp() };
    try {
      const docRef = await addDoc(responsesRef, responseData);
      const newResponse = { ...responseData, id: docRef.id, submittedAt: new Date().toISOString() };
      // Update top-level response count: forms/{formId}
       const formDocRefTopLevel = doc(database, 'forms', formId);
       await updateDoc(formDocRefTopLevel, { responseCount: increment(1) })
            .catch(err => console.warn(`Could not update response count:`, err));
      dispatch({ type: 'ADD_RESPONSE_SUCCESS', payload: { formId, response: newResponse } });
    } catch (error) {
      console.error("Error submitting response: ", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to submit.' });
      toast.error("Failed to submit response.");
    }
  }, [dispatch]);

  const fetchResponses = useCallback(async (formId) => {
      if (!formId) return [];
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
          // Path: forms/{formId}/responses
          const responsesRef = collection(database, 'forms', formId, 'responses');
          const q = query(responsesRef, orderBy('submittedAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const responsesList = querySnapshot.docs.map(doc => ({
              id: doc.id, ...doc.data(),
              submittedAt: doc.data().submittedAt?.toDate?.().toISOString(),
          }));
          dispatch({ type: 'SET_RESPONSES', payload: { formId, responses: responsesList } });
          return responsesList;
      } catch (error) {
           console.error(`Error fetching responses for ${formId}: `, error);
           dispatch({ type: 'SET_ERROR', payload: 'Failed to load responses.' });
           toast.error("Failed to load responses.");
           return [];
      }
  }, [dispatch]);

   const getForm = useCallback((formId) => state.forms.find(form => form.id === formId), [state.forms]);
   const getResponses = useCallback((formId) => state.responses[formId] || [], [state.responses]);

  // Context Value Memo
  const contextValue = useMemo(() => ({
    state, dispatch, createForm, updateForm, deleteForm, getForm, setCurrentForm,
    addQuestion, updateQuestion, deleteQuestion, submitResponse, fetchResponses, getResponses,
  }), [
      state, dispatch, createForm, updateForm, deleteForm, getForm, setCurrentForm,
      addQuestion, updateQuestion, deleteQuestion, submitResponse, fetchResponses, getResponses
  ]);

  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  );
};

// Custom hook
export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
};
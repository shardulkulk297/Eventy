/* Eventy/Frontend/src/features/CreateEvent/context/FormContext.jsx */
import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

// Create context
const FormContext = createContext(undefined);

// Example form (remains the same)
const exampleForm = {
  id: 'form-1',
  title: 'Example Feedback Form',
  description: 'Please provide your feedback on our service',
  questions: [
    { id: 'q1', type: 'short', title: 'What is your name?', required: true },
    { id: 'q2', type: 'paragraph', title: 'Please describe your experience', required: false },
    { id: 'q3', type: 'multiple_choice', title: 'Rating?', required: true, options: [ { id: 'opt1', value: 'Excellent' }, { id: 'opt2', value: 'Good' }, { id: 'opt3', value: 'Average' }, { id: 'opt4', value: 'Poor' } ] },
    { id: 'q4', type: 'checkbox', title: 'Features used?', required: false, options: [ { id: 'feat1', value: 'Support Chat' }, { id: 'feat2', value: 'Knowledge Base' }, { id: 'feat3', value: 'Email Support' } ] },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  responseCount: 0,
};

// Initial state (remains the same)
const initialState = {
  forms: [exampleForm],
  currentForm: null,
  responses: {},
  isLoading: false,
  error: null,
};

// Reducer function (remains the same)
const formReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FORMS':
      return { ...state, forms: action.payload };

    case 'SET_CURRENT_FORM':
      // Avoid unnecessary state update if the form is already the current one
      if (state.currentForm?.id === action.payload?.id) {
          return state;
      }
      return { ...state, currentForm: action.payload };

    case 'ADD_FORM':
      // Avoid adding if form with the same ID already exists
      if (state.forms.some(form => form.id === action.payload.id)) {
          return state;
      }
      return {
        ...state,
        forms: [...state.forms, action.payload],
        currentForm: action.payload
      };

    case 'UPDATE_FORM': {
       const formIndex = state.forms.findIndex(form => form.id === action.payload.id);
       if (formIndex === -1) return state; // Form not found

       const updatedForms = [...state.forms];
       updatedForms[formIndex] = { ...updatedForms[formIndex], ...action.payload, updatedAt: new Date().toISOString() }; // Merge and update timestamp

       // Only update currentForm if it's the one being changed
       const updatedCurrentForm = state.currentForm?.id === action.payload.id
         ? updatedForms[formIndex]
         : state.currentForm;

       // Avoid state update if nothing effectively changed (optional but good practice)
       if (JSON.stringify(state.forms[formIndex]) === JSON.stringify(updatedForms[formIndex]) && state.currentForm === updatedCurrentForm) {
           return state;
       }

      return {
        ...state,
        forms: updatedForms,
        currentForm: updatedCurrentForm
      };
    }

    case 'DELETE_FORM': {
      if (!state.forms.some(form => form.id === action.payload)) return state; // No change if form doesn't exist

      const newResponses = { ...state.responses };
      delete newResponses[action.payload];
      return {
        ...state,
        forms: state.forms.filter(form => form.id !== action.payload),
        responses: newResponses,
        currentForm: state.currentForm?.id === action.payload ? null : state.currentForm
      };
    }

    // --- Question Actions ---
    case 'ADD_QUESTION': {
        if (!state.currentForm || state.currentForm.id !== action.payload.formId) return state;
        const formIndex = state.forms.findIndex(f => f.id === action.payload.formId);
        if (formIndex === -1) return state;

        const updatedQuestions = [...state.forms[formIndex].questions, action.payload.question];
        const updatedForm = {
            ...state.forms[formIndex],
            questions: updatedQuestions,
            updatedAt: new Date().toISOString()
        };

        const updatedForms = [...state.forms];
        updatedForms[formIndex] = updatedForm;

        return {
            ...state,
            forms: updatedForms,
            currentForm: updatedForm, // Update current form reference
        };
    }

    case 'UPDATE_QUESTION': {
        if (!state.currentForm || state.currentForm.id !== action.payload.formId) return state;
        const formIndex = state.forms.findIndex(f => f.id === action.payload.formId);
        if (formIndex === -1) return state;

        const questionIndex = state.forms[formIndex].questions.findIndex(q => q.id === action.payload.question.id);
        if (questionIndex === -1) return state; // Question not found

        const updatedQuestions = [...state.forms[formIndex].questions];
        updatedQuestions[questionIndex] = action.payload.question;

        const updatedForm = {
            ...state.forms[formIndex],
            questions: updatedQuestions,
            updatedAt: new Date().toISOString()
        };

        const updatedForms = [...state.forms];
        updatedForms[formIndex] = updatedForm;

        return {
            ...state,
            forms: updatedForms,
            currentForm: updatedForm, // Update current form reference
        };
    }

    case 'DELETE_QUESTION': {
        if (!state.currentForm || state.currentForm.id !== action.payload.formId) return state;
        const formIndex = state.forms.findIndex(f => f.id === action.payload.formId);
        if (formIndex === -1) return state;

        const updatedQuestions = state.forms[formIndex].questions.filter(q => q.id !== action.payload.questionId);
        if (updatedQuestions.length === state.forms[formIndex].questions.length) return state; // No change

        const updatedForm = {
            ...state.forms[formIndex],
            questions: updatedQuestions,
            updatedAt: new Date().toISOString()
        };

        const updatedForms = [...state.forms];
        updatedForms[formIndex] = updatedForm;

        return {
            ...state,
            forms: updatedForms,
            currentForm: updatedForm, // Update current form reference
        };
    }

    // --- Response Actions ---
     case 'SET_RESPONSES':
         return { ...state, responses: { ...state.responses, [action.payload.formId]: action.payload.responses }};

    case 'ADD_RESPONSE': {
      const { formId, answers } = action.payload;
      const formIndex = state.forms.findIndex(form => form.id === formId);
      if (formIndex === -1) return state; // Form not found

      const newResponse = {
        id: `resp-${Date.now()}`,
        formId,
        answers,
        submittedAt: new Date().toISOString(),
      };

      const existingResponses = state.responses[formId] || [];
      const updatedResponsesForForm = [...existingResponses, newResponse];
      const allUpdatedResponses = { ...state.responses, [formId]: updatedResponsesForForm };

      const updatedForms = [...state.forms];
      const responseCount = (updatedForms[formIndex].responseCount || 0) + 1;
      updatedForms[formIndex] = { ...updatedForms[formIndex], responseCount };

      const updatedCurrentForm = state.currentForm?.id === formId
        ? updatedForms[formIndex]
        : state.currentForm;

      return {
        ...state,
        responses: allUpdatedResponses,
        forms: updatedForms,
        currentForm: updatedCurrentForm
      };
    }

    // Loading/Error actions remain the same
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };

    default:
      // --- FIX: Add explicit check for unknown action types ---
      console.warn(`FormProvider: Unknown action type "${action.type}"`);
      return state;
      // --- END FIX ---
  }
};

// Provider component
export const FormProvider = ({ children }) => {
  const [state, dispatch] = useReducer(formReducer, initialState);

  // --- Action creators wrapped in useCallback (dependencies checked) ---
  const createForm = useCallback((title, description) => {
    const newForm = {
      id: `form-${Date.now()}`, // Ensure unique ID
      title,
      description,
      questions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responseCount: 0,
    };
    dispatch({ type: 'ADD_FORM', payload: newForm });
    return newForm;
  }, [dispatch]); // dispatch is stable

  const updateForm = useCallback((formUpdate) => {
      if (!formUpdate || !formUpdate.id) {
          console.error("updateForm requires an object with an 'id'.");
          return;
      }
    // Add updatedAt timestamp automatically within the reducer now
    dispatch({ type: 'UPDATE_FORM', payload: formUpdate });
  }, [dispatch]);

  const deleteForm = useCallback((formId) => {
    dispatch({ type: 'DELETE_FORM', payload: formId });
  }, [dispatch]);

  // getForm doesn't dispatch, it just reads state. No useCallback needed if used directly in component scope.
  // But if passed down, useCallback prevents unnecessary re-renders of consumers.
  const getForm = useCallback((formId) => {
    return state.forms.find(form => form.id === formId);
  }, [state.forms]); // Depends on state.forms

  const setCurrentForm = useCallback((formId) => {
    const form = state.forms.find(f => f.id === formId);
    // Dispatch will handle checking if update is needed
    dispatch({ type: 'SET_CURRENT_FORM', payload: form || null });
  }, [dispatch, state.forms]); // Depends on state.forms

  const addQuestion = useCallback((question) => {
    // The reducer now checks for currentForm
    if (state.currentForm) {
      const newQuestion = { ...question, id: `q-${Date.now()}` };
      dispatch({
        type: 'ADD_QUESTION',
        payload: { formId: state.currentForm.id, question: newQuestion }
      });
    } else {
        console.error("addQuestion: No current form selected.");
    }
  }, [dispatch, state.currentForm]); // Depends on state.currentForm

  const updateQuestion = useCallback((question) => {
     if (state.currentForm) {
      dispatch({
        type: 'UPDATE_QUESTION',
        payload: { formId: state.currentForm.id, question }
      });
     } else {
         console.error("updateQuestion: No current form selected.");
     }
  }, [dispatch, state.currentForm]);

  const deleteQuestion = useCallback((questionId) => {
    if (state.currentForm) {
      dispatch({
        type: 'DELETE_QUESTION',
        payload: { formId: state.currentForm.id, questionId }
      });
    } else {
        console.error("deleteQuestion: No current form selected.");
    }
  }, [dispatch, state.currentForm]);

  const submitResponse = useCallback((formId, answers) => {
    dispatch({ type: 'ADD_RESPONSE', payload: { formId, answers } });
  }, [dispatch]);

  // getResponses also reads state. Use useCallback if passed down.
  const getResponses = useCallback((formId) => {
    return state.responses[formId] || [];
  }, [state.responses]); // Depends on state.responses

  // --- FIX: Stable context value ---
  // Only include stable functions (dispatch and memoized actions)
  // Consumers will get `state` directly via `useForm().state`
  const contextValue = useMemo(() => ({
    // state, // REMOVED state from here
    dispatch,
    // Memoized action creators
    createForm,
    updateForm,
    deleteForm,
    getForm,
    setCurrentForm,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    submitResponse,
    getResponses,
    // --- ADD state separately for direct access ---
    // This allows consumers to get state without the context value itself changing
    state,
  }), [
      // List ONLY stable dependencies here (dispatch + memoized functions)
      dispatch, createForm, updateForm, deleteForm, getForm, setCurrentForm,
      addQuestion, updateQuestion, deleteQuestion, submitResponse, getResponses,
      // --- ADD state here - useMemo will still run when state changes, BUT
      // the object reference passed to Provider only changes if one of the
      // STABLE functions changes (which they shouldn't) OR if state changes.
      // This is the standard pattern. The issue wasn't necessarily useMemo,
      // but components potentially over-reacting to the context value change.
      // By separating state access, components can be more selective.
      state
  ]);
  // --- END FIX ---

  // Line ~175
  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  );
};

// Custom hook for using the context (remains the same)
export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
};
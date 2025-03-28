/* Eventy/Frontend/src/features/CreateEvent/context/FormContext.jsx */
import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react'; // Added useCallback, useMemo

// Create context
const FormContext = createContext(undefined);

// Example form for testing (used as default)
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

// Initial state (now defaults to example form)
const initialState = {
  forms: [exampleForm], // Start with example form
  currentForm: null,
  responses: {},
  isLoading: false, // Keep if used by consumers
  error: null,      // Keep if used by consumers
};

// Reducer function (REMOVED localStorage calls)
const formReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FORMS':
      return { ...state, forms: action.payload };

    case 'SET_CURRENT_FORM':
      return { ...state, currentForm: action.payload };

    case 'ADD_FORM':
      return {
        ...state,
        forms: [...state.forms, action.payload],
        currentForm: action.payload // Set the new form as current
      };

    case 'UPDATE_FORM':
      return {
        ...state,
        forms: state.forms.map(form =>
          form.id === action.payload.id ? action.payload : form
        ),
        currentForm: state.currentForm?.id === action.payload.id
          ? action.payload
          : state.currentForm
      };

    case 'DELETE_FORM': {
      const newResponses = { ...state.responses };
      delete newResponses[action.payload]; // Remove associated responses from memory
      return {
        ...state,
        forms: state.forms.filter(form => form.id !== action.payload),
        responses: newResponses,
        currentForm: state.currentForm?.id === action.payload
          ? null
          : state.currentForm
      };
    }

    // --- Question Actions ---
    case 'ADD_QUESTION': {
        if (!state.currentForm || state.currentForm.id !== action.payload.formId) return state;
        const updatedFormWithNewQuestion = {
            ...state.currentForm,
            questions: [...state.currentForm.questions, action.payload.question],
            updatedAt: new Date().toISOString()
        };
        return {
            ...state,
            currentForm: updatedFormWithNewQuestion,
            forms: state.forms.map(form =>
                form.id === updatedFormWithNewQuestion.id ? updatedFormWithNewQuestion : form
            ),
        };
    }

    case 'UPDATE_QUESTION': {
        if (!state.currentForm || state.currentForm.id !== action.payload.formId) return state;
        const updatedFormWithUpdatedQuestion = {
            ...state.currentForm,
            questions: state.currentForm.questions.map(q =>
            q.id === action.payload.question.id ? action.payload.question : q
            ),
            updatedAt: new Date().toISOString()
        };
        return {
            ...state,
            currentForm: updatedFormWithUpdatedQuestion,
            forms: state.forms.map(form =>
                form.id === updatedFormWithUpdatedQuestion.id ? updatedFormWithUpdatedQuestion : form
            ),
        };
    }


    case 'DELETE_QUESTION': {
        if (!state.currentForm || state.currentForm.id !== action.payload.formId) return state;
        const updatedFormWithDeletedQuestion = {
            ...state.currentForm,
            questions: state.currentForm.questions.filter(q => q.id !== action.payload.questionId),
            updatedAt: new Date().toISOString()
        };
        return {
            ...state,
            currentForm: updatedFormWithDeletedQuestion,
            forms: state.forms.map(form =>
                form.id === updatedFormWithDeletedQuestion.id ? updatedFormWithDeletedQuestion : form
            ),
        };
    }

    // --- Response Actions ---
     case 'SET_RESPONSES':
         return { ...state, responses: { ...state.responses, [action.payload.formId]: action.payload.responses }};

    case 'ADD_RESPONSE': {
      const { formId, answers } = action.payload;
      const newResponse = {
        id: `resp-${Date.now()}`,
        formId,
        answers,
        submittedAt: new Date().toISOString(),
      };

      const existingResponses = state.responses[formId] || [];
      const updatedResponsesForForm = [...existingResponses, newResponse];

      const allUpdatedResponses = { ...state.responses, [formId]: updatedResponsesForForm };

      let responseCount = 0;
      const updatedForms = state.forms.map(form => {
        if (form.id === formId) {
            responseCount = (form.responseCount || 0) + 1;
          return { ...form, responseCount };
        }
        return form;
      });

      const updatedCurrentForm = state.currentForm?.id === formId
        ? { ...state.currentForm, responseCount }
        : state.currentForm;

      return {
        ...state,
        responses: allUpdatedResponses,
        forms: updatedForms,
        currentForm: updatedCurrentForm
      };
    }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    default:
      return state;
  }
};

// Provider component
export const FormProvider = ({ children }) => {
  // Initialize state directly, no localStorage
  const [state, dispatch] = useReducer(formReducer, initialState);

  // --- Stabilize action functions with useCallback ---
  const createForm = useCallback((title, description) => {
    const newForm = {
      id: `form-${Date.now()}`,
      title,
      description,
      questions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responseCount: 0,
    };
    dispatch({ type: 'ADD_FORM', payload: newForm });
    return newForm; // Return the created form object
  }, [dispatch]); // dispatch is stable

  const updateForm = useCallback((formUpdate) => {
        const formIdToUpdate = formUpdate?.id || state.currentForm?.id;
        if (!formIdToUpdate) {
            console.error("updateForm cannot determine which form to update."); return;
        }
        const existingForm = state.forms.find(f => f.id === formIdToUpdate);
        if (!existingForm) {
             console.error(`updateForm could not find form with ID: ${formIdToUpdate}`); return;
        }
        const updatedData = {
             ...existingForm, ...formUpdate, id: formIdToUpdate,
             updatedAt: new Date().toISOString()
         };
        dispatch({ type: 'UPDATE_FORM', payload: updatedData });
  }, [dispatch, state.currentForm, state.forms]); // dependencies updated

  const deleteForm = useCallback((formId) => {
    dispatch({ type: 'DELETE_FORM', payload: formId });
  }, [dispatch]);

  const getForm = useCallback((formId) => {
    return state.forms.find(form => form.id === formId);
  }, [state.forms]);

  const setCurrentForm = useCallback((formId) => {
    const form = state.forms.find(f => f.id === formId);
    dispatch({ type: 'SET_CURRENT_FORM', payload: form || null });
  }, [dispatch, state.forms]);

  const addQuestion = useCallback((question) => {
    if (!state.currentForm) return;
    const newQuestion = { ...question, id: `q-${Date.now()}` };
    dispatch({
      type: 'ADD_QUESTION',
      payload: { formId: state.currentForm.id, question: newQuestion }
    });
  }, [dispatch, state.currentForm]);

  const updateQuestion = useCallback((question) => {
    if (!state.currentForm) return;
    dispatch({
      type: 'UPDATE_QUESTION',
      payload: { formId: state.currentForm.id, question }
    });
  }, [dispatch, state.currentForm]);

  const deleteQuestion = useCallback((questionId) => {
    if (!state.currentForm) return;
    dispatch({
      type: 'DELETE_QUESTION',
      payload: { formId: state.currentForm.id, questionId }
    });
  }, [dispatch, state.currentForm]);

  const submitResponse = useCallback((formId, answers) => {
    const payload = { formId, answers };
    dispatch({ type: 'ADD_RESPONSE', payload: payload });
  }, [dispatch]);

  const getResponses = useCallback((formId) => {
    return state.responses[formId] || [];
  }, [state.responses]);

  // --- Memoize the context value ---
  const contextValue = useMemo(() => ({
    state,
    dispatch,
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
  }), [
      state, dispatch, createForm, updateForm, deleteForm, getForm,
      setCurrentForm, addQuestion, updateQuestion, deleteQuestion,
      submitResponse, getResponses
  ]);

  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  );
};

// Custom hook for using the context
export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
};
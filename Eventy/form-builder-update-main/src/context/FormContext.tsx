import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

// Types for our form data
export interface Option {
  id: string;
  value: string;
}

export interface Question {
  id: string;
  type: 'short' | 'paragraph' | 'multiple_choice' | 'checkbox' | 'dropdown' | 'date' | 'time' | 'file';
  title: string;
  required: boolean;
  options?: Option[];
  description?: string;
}

export interface Form {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  responseCount: number;
}

export interface Response {
  id: string;
  formId: string;
  answers: {
    questionId: string;
    value: string | string[];
  }[];
  submittedAt: string;
}

// State interface
interface FormState {
  forms: Form[];
  currentForm: Form | null;
  responses: Record<string, Response[]>;
  isLoading: boolean;
  error: string | null;
}

// Action types
type FormAction =
  | { type: 'SET_FORMS'; payload: Form[] }
  | { type: 'SET_CURRENT_FORM'; payload: Form }
  | { type: 'ADD_FORM'; payload: Form }
  | { type: 'UPDATE_FORM'; payload: Form }
  | { type: 'DELETE_FORM'; payload: string }
  | { type: 'ADD_QUESTION'; payload: { formId: string; question: Question } }
  | { type: 'UPDATE_QUESTION'; payload: { formId: string; question: Question } }
  | { type: 'DELETE_QUESTION'; payload: { formId: string; questionId: string } }
  | { type: 'SET_RESPONSES'; payload: { formId: string; responses: Response[] } }
  | { type: 'ADD_RESPONSE'; payload: Response }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Initial state
const initialState: FormState = {
  forms: [],
  currentForm: null,
  responses: {},
  isLoading: false,
  error: null,
};

// Example form for testing
const exampleForm: Form = {
  id: 'form-1',
  title: 'Example Feedback Form',
  description: 'Please provide your feedback on our service',
  questions: [
    {
      id: 'q1',
      type: 'short',
      title: 'What is your name?',
      required: true,
    },
    {
      id: 'q2',
      type: 'paragraph',
      title: 'Please describe your experience with our service',
      required: false,
    },
    {
      id: 'q3',
      type: 'multiple_choice',
      title: 'How would you rate our service?',
      required: true,
      options: [
        { id: 'opt1', value: 'Excellent' },
        { id: 'opt2', value: 'Good' },
        { id: 'opt3', value: 'Average' },
        { id: 'opt4', value: 'Poor' },
      ],
    },
    {
      id: 'q4',
      type: 'checkbox',
      title: 'Which features did you use?',
      required: false,
      options: [
        { id: 'feat1', value: 'Support Chat' },
        { id: 'feat2', value: 'Knowledge Base' },
        { id: 'feat3', value: 'Email Support' },
        { id: 'feat4', value: 'Phone Support' },
      ],
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  responseCount: 0,
};

// Create initial state with example form
const initialStateWithExample: FormState = {
  ...initialState,
  forms: [exampleForm],
};

// Reducer function
const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FORMS':
      return { ...state, forms: action.payload };
    
    case 'SET_CURRENT_FORM':
      return { ...state, currentForm: action.payload };
    
    case 'ADD_FORM':
      return { 
        ...state, 
        forms: [...state.forms, action.payload],
        currentForm: action.payload 
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
    
    case 'DELETE_FORM':
      return {
        ...state,
        forms: state.forms.filter(form => form.id !== action.payload),
        currentForm: state.currentForm?.id === action.payload 
          ? null 
          : state.currentForm
      };
    
    case 'ADD_QUESTION':
      if (state.currentForm?.id !== action.payload.formId) return state;
      
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
        )
      };
    
    case 'UPDATE_QUESTION':
      if (state.currentForm?.id !== action.payload.formId) return state;
      
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
        )
      };
    
    case 'DELETE_QUESTION':
      if (state.currentForm?.id !== action.payload.formId) return state;
      
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
        )
      };
    
    case 'SET_RESPONSES':
      return {
        ...state,
        responses: {
          ...state.responses,
          [action.payload.formId]: action.payload.responses
        }
      };
    
    case 'ADD_RESPONSE': {
      const formId = action.payload.formId;
      const existingResponses = state.responses[formId] || [];
      const updatedResponses = [...existingResponses, action.payload];
      
      // Update response count in the form
      const updatedForms = state.forms.map(form => {
        if (form.id === formId) {
          return {
            ...form,
            responseCount: form.responseCount + 1
          };
        }
        return form;
      });
      
      // Update current form if it's the one being responded to
      const updatedCurrentForm = state.currentForm?.id === formId
        ? {
            ...state.currentForm,
            responseCount: state.currentForm.responseCount + 1
          }
        : state.currentForm;
      
      return {
        ...state,
        responses: {
          ...state.responses,
          [formId]: updatedResponses
        },
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

// Create context
interface FormContextType {
  state: FormState;
  dispatch: React.Dispatch<FormAction>;
  createForm: (title: string, description: string) => Form;
  updateForm: (form: Partial<Form>) => void;
  deleteForm: (formId: string) => void;
  getForm: (formId: string) => Form | undefined;
  setCurrentForm: (formId: string) => void;
  addQuestion: (question: Omit<Question, 'id'>) => void;
  updateQuestion: (question: Question) => void;
  deleteQuestion: (questionId: string) => void;
  submitResponse: (formId: string, answers: { questionId: string; value: string | string[] }[]) => void;
  getResponses: (formId: string) => Response[];
}

const FormContext = createContext<FormContextType | undefined>(undefined);

// Provider component
interface FormProviderProps {
  children: ReactNode;
}

export const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(formReducer, initialStateWithExample);
  
  // Load data from localStorage on initial render
  useEffect(() => {
    const storedForms = localStorage.getItem('forms');
    const storedResponses = localStorage.getItem('responses');
    
    if (storedForms) {
      try {
        const parsedForms = JSON.parse(storedForms);
        dispatch({ type: 'SET_FORMS', payload: parsedForms });
      } catch (error) {
        console.error('Error parsing stored forms:', error);
      }
    }
    
    if (storedResponses) {
      try {
        const parsedResponses = JSON.parse(storedResponses);
        Object.entries(parsedResponses).forEach(([formId, responses]) => {
          dispatch({ 
            type: 'SET_RESPONSES', 
            payload: { formId, responses: responses as Response[] } 
          });
        });
      } catch (error) {
        console.error('Error parsing stored responses:', error);
      }
    }
  }, []);
  
  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('forms', JSON.stringify(state.forms));
    localStorage.setItem('responses', JSON.stringify(state.responses));
  }, [state.forms, state.responses]);
  
  // Helper functions
  const createForm = (title: string, description: string): Form => {
    const newForm: Form = {
      id: `form-${Date.now()}`,
      title,
      description,
      questions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responseCount: 0,
    };
    
    dispatch({ type: 'ADD_FORM', payload: newForm });
    return newForm;
  };
  
  const updateForm = (formUpdate: Partial<Form>) => {
    if (!state.currentForm) return;
    
    const updatedForm: Form = {
      ...state.currentForm,
      ...formUpdate,
      updatedAt: new Date().toISOString()
    };
    
    dispatch({ type: 'UPDATE_FORM', payload: updatedForm });
  };
  
  const deleteForm = (formId: string) => {
    dispatch({ type: 'DELETE_FORM', payload: formId });
  };
  
  const getForm = (formId: string) => {
    return state.forms.find(form => form.id === formId);
  };
  
  const setCurrentForm = (formId: string) => {
    const form = getForm(formId);
    if (form) {
      dispatch({ type: 'SET_CURRENT_FORM', payload: form });
    }
  };
  
  const addQuestion = (question: Omit<Question, 'id'>) => {
    if (!state.currentForm) return;
    
    const newQuestion: Question = {
      ...question,
      id: `q-${Date.now()}`,
    };
    
    dispatch({ 
      type: 'ADD_QUESTION', 
      payload: { formId: state.currentForm.id, question: newQuestion } 
    });
  };
  
  const updateQuestion = (question: Question) => {
    if (!state.currentForm) return;
    
    dispatch({ 
      type: 'UPDATE_QUESTION', 
      payload: { formId: state.currentForm.id, question } 
    });
  };
  
  const deleteQuestion = (questionId: string) => {
    if (!state.currentForm) return;
    
    dispatch({ 
      type: 'DELETE_QUESTION', 
      payload: { formId: state.currentForm.id, questionId } 
    });
  };
  
  const submitResponse = (formId: string, answers: { questionId: string; value: string | string[] }[]) => {
    const newResponse: Response = {
      id: `resp-${Date.now()}`,
      formId,
      answers,
      submittedAt: new Date().toISOString(),
    };
    
    dispatch({ type: 'ADD_RESPONSE', payload: newResponse });
    return newResponse;
  };
  
  const getResponses = (formId: string) => {
    return state.responses[formId] || [];
  };
  
  return (
    <FormContext.Provider value={{ 
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
    }}>
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

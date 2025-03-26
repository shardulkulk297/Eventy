import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from './PageTransition';
import { Button } from '@/components/ui/button';
import { QuestionCard, AddQuestionButton } from './QuestionTypes';
import { useForm } from '@/context/FormContext';
import { Eye, ArrowLeft, Settings, Palette } from 'lucide-react';
import { toast } from 'sonner';
import ThemeSelector from './ThemeSelector';
import SettingsDialog from './SettingsDialog';

const FormBuilder = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { state, createForm, getForm, setCurrentForm, updateForm, addQuestion } = useForm();
  
  const [formTitle, setFormTitle] = useState('Untitled Form');
  const [formDescription, setFormDescription] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  useEffect(() => {
    if (formId === 'new') {
      try {
        const newForm = createForm('Untitled Form', '');
        if (newForm && newForm.id) {
          navigate(`/builder/${newForm.id}`, { replace: true });
        } else {
          toast.error("Failed to create new form");
        }
      } catch (error) {
        toast.error("Error creating new form");
      }
    } else if (formId) {
      const existingForm = getForm(formId);
      if (existingForm) {
        setCurrentForm(formId);
        setFormTitle(existingForm.title);
        setFormDescription(existingForm.description);
        
        if (existingForm.questions.length > 0) {
          setSelectedQuestionId(existingForm.questions[0].id);
        }
      } else {
        toast.error("Form not found");
        navigate('/');
      }
    }
  }, [formId]);
  
  useEffect(() => {
    if (state.currentForm && (formTitle !== state.currentForm.title || formDescription !== state.currentForm.description)) {
      updateForm({ title: formTitle, description: formDescription });
    }
  }, [formTitle, formDescription]);
  
  const handleAddQuestion = (type) => {
    const newQuestion = {
      type,
      title: 'Question',
      required: false,
      options: (type === 'multiple_choice' || type === 'checkbox' || type === 'dropdown') 
        ? [{ id: `opt-${Date.now()}`, value: 'Option 1' }] 
        : undefined
    };
    
    addQuestion(newQuestion);
  };
  
  if (!state.currentForm) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-form-dark-gray">Loading form...</div>
      </div>
    );
  }
  
  return (
    <PageTransition className="min-h-screen bg-form-light-gray pb-16">
      <header className="bg-white border-b border-form-card-border sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft size={18} />
            </Button>
            <div className="flex flex-col">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="text-lg font-medium focus:outline-none border-b-2 border-transparent focus:border-form-accent-blue"
                placeholder="Form title"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setThemeDialogOpen(true)}>
              <Palette size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSettingsDialogOpen(true)}>
              <Settings size={18} />
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/preview/${state.currentForm?.id}`)}>
              <Eye size={18} className="mr-2" />
              Preview
            </Button>
          </div>
        </div>
      </header>
      
      <div className="max-w-screen-md mx-auto pt-8 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-form-card-border shadow-subtle p-6 mb-6"
        >
          <div className="border-l-4 border-form-accent-blue pl-4">
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full text-2xl font-medium focus:outline-none border-b-2 border-transparent focus:border-form-accent-blue mb-2"
              placeholder="Form title"
            />
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full resize-none text-form-dark-gray focus:outline-none border-b-2 border-transparent focus:border-form-accent-blue"
              placeholder="Form description"
              rows={2}
            />
          </div>
        </motion.div>
        
        <div className="space-y-4">
          {state.currentForm.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              isSelected={selectedQuestionId === question.id}
              onSelect={() => setSelectedQuestionId(question.id)}
            />
          ))}
          <AddQuestionButton onSelectType={handleAddQuestion} />
        </div>
      </div>
      
      <ThemeSelector open={themeDialogOpen} onOpenChange={setThemeDialogOpen} />
      <SettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} />
    </PageTransition>
  );
};

export default FormBuilder;

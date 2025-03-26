
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageTransition from './PageTransition';
import Button from './Button';
import { useForm } from '@/context/FormContext';
import { ArrowLeft, Download, ChevronDown, ChevronUp, ExternalLink, FileText, Image } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '../ui/skeleton';

const FormResponses = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { getForm, getResponses } = useForm();
  
  const [form, setForm] = useState(undefined);
  const [responses, setResponses] = useState([]);
  const [expandedResponseId, setExpandedResponseId] = useState(null);
  
  useEffect(() => {
    if (formId) {
      const currentForm = getForm(formId);
      if (currentForm) {
        setForm(currentForm);
        setResponses(getResponses(formId));
      } else {
        navigate('/');
      }
    }
  }, [formId]);
  
  const toggleResponseExpansion = (responseId) => {
    setExpandedResponseId(expandedResponseId === responseId ? null : responseId);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const findQuestionById = (questionId) => {
    return form?.questions.find(q => q.id === questionId);
  };
  
  const exportResponsesToCSV = () => {
    if (!form || responses.length === 0) return;
    
    const headers = ['Timestamp', ...form.questions.map(q => q.title)];
    
    const rows = responses.map(response => {
      const row = [formatDate(response.submittedAt)];
      
      form.questions.forEach(question => {
        const answer = response.answers.find(a => a.questionId === question.id);
        if (answer) {
          if (Array.isArray(answer.value)) {
            row.push(answer.value.join(', '));
          } else {
            row.push(answer.value);
          }
        } else {
          row.push('');
        }
      });
      
      return row;
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${form.title} - Responses.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const isImageFile = (filename) => {
    return /\.(jpeg|jpg|gif|png|webp|bmp)$/i.test(filename);
  };
  
  if (!form) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-form-dark-gray">Loading responses...</div>
      </div>
    );
  }
  
  return (
    <PageTransition className="min-h-screen bg-form-light-gray pb-16">
      <header className="bg-white border-b border-form-card-border sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              leftIcon={<ArrowLeft size={18} />}
            />
            
            <div className="flex flex-col">
              <span className="text-lg font-medium">Responses: {form.title}</span>
              <span className="text-sm text-form-dark-gray">{responses.length} responses</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary"
              leftIcon={<ExternalLink size={18} />}
              onClick={() => navigate(`/preview/${form.id}`)}
            >
              View form
            </Button>
            <Button 
              onClick={exportResponsesToCSV}
              leftIcon={<Download size={18} />}
              disabled={responses.length === 0}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </header>
      
      <div className="max-w-screen-lg mx-auto pt-8 px-4">
        {responses.length === 0 ? (
          <div className="bg-white rounded-lg border border-form-card-border shadow-subtle p-8 text-center">
            <h2 className="text-xl font-medium mb-2">No responses yet</h2>
            <p className="text-form-dark-gray mb-6">Once users submit the form, responses will appear here.</p>
            <Button 
              variant="secondary"
              onClick={() => navigate(`/preview/${form.id}`)}
            >
              View form
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {responses.map((response) => (
              <motion.div
                key={response.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-form-card-border shadow-subtle overflow-hidden"
              >
                <div 
                  className="p-4 border-b border-form-card-border flex justify-between items-center cursor-pointer"
                  onClick={() => toggleResponseExpansion(response.id)}
                >
                  <div>
                    <span className="font-medium">Response submitted at: </span>
                    <span>{formatDate(response.submittedAt)}</span>
                  </div>
                  
                  <button className="p-1 rounded-full hover:bg-form-light-gray">
                    {expandedResponseId === response.id ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                </div>
                
                {expandedResponseId === response.id && (
                  <div className="p-4">
                    <dl className="space-y-4">
                      {response.answers.map((answer) => {
                        const question = findQuestionById(answer.questionId);
                        if (!question) return null;
                        
                        return (
                          <div key={answer.questionId} className="grid grid-cols-[1fr,2fr] gap-4">
                            <dt className="font-medium">{question.title}</dt>
                            <dd>
                              {Array.isArray(answer.value) ? (
                                <ul className="list-disc list-inside">
                                  {answer.value.map((val, i) => (
                                    <li key={i}>{val}</li>
                                  ))}
                                </ul>
                              ) : question.type === 'file' ? (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <FileText size={16} className="text-form-dark-gray" />
                                    <span>{answer.value}</span>
                                  </div>
                                  
                                  {isImageFile(answer.value) ? (
                                    <div className="mt-2 border rounded-md overflow-hidden max-w-xs">
                                      {answer.fileData ? (
                                        <img 
                                          src={answer.fileData} 
                                          alt="File preview" 
                                          className="w-full h-auto"
                                        />
                                      ) : (
                                        <div className="p-4 text-center text-form-dark-gray">
                                          <Image size={24} className="mx-auto mb-2" />
                                          <p className="text-sm">Preview not available</p>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="mt-2 p-2 border rounded-md text-form-dark-gray text-sm">
                                      Non-image file
                                    </div>
                                  )}
                                </div>
                              ) : (
                                answer.value || <span className="text-form-dark-gray italic">No answer</span>
                              )}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default FormResponses;

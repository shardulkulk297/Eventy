
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FormProvider } from '@/context/FormContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';

// Import pages
import Dashboard from '@/pages/Dashboard';
import Builder from '@/pages/Builder';
import Preview from '@/pages/Preview';
import Responses from '@/pages/Responses';
import NotFound from '@/pages/NotFound';

import './App.css';

function App() {
  return (
    <FormProvider>
      <ThemeProvider>
        <Router>
          <Toaster position="top-right" />
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/builder/:formId" element={<Builder />} />
              <Route path="/preview/:formId" element={<Preview />} />
              <Route path="/responses/:formId" element={<Responses />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </Router>
      </ThemeProvider>
    </FormProvider>
  );
}

export default App;

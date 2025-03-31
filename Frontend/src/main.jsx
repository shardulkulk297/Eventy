/* src/main.jsx */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './features/CreateEvent/context/ThemeContext';
// --- FIX: Import the renamed EventManagerProvider ---
import { EventManagerProvider } from './features/CreateEvent/context/EventManagerContext';
// --- END FIX ---

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider> {/* ThemeProvider can wrap EventManagerProvider */}
         {/* --- FIX: Use the renamed EventManagerProvider --- */}
        <EventManagerProvider>
          <App />
        </EventManagerProvider>
         {/* --- END FIX --- */}
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
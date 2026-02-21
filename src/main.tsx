import { StrictMode } from 'react';
import { createRoot } from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { initializeMonitoring } from './services/monitoring';
import config from './config';
import ErrorBoundary from './components/Errors/ErrorBoundary';
import { TooltipProvider } from './components/ui/tooltip';
import GraphqlProvider from './providers/graphql/GraphqlProvider';
import GraphqlClient from './api/graphql/GraphQlClient';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './app';
import reportWebVitals from './reportWebVitals';
// import './styles/scss/main.scss';
import "./styles/css/index.css";
import { Toaster } from './components/ui/toaster';
import { Toaster as Sonner } from './components/ui/sonner';

initializeMonitoring();
const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GraphqlProvider client={GraphqlClient}>
      <QueryClientProvider client={queryClient}>
        <Helmet titleTemplate={`${config.title} | %s `} defaultTitle={`${config.title}`} />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </GraphqlProvider>
  </StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

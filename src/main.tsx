import { StrictMode } from 'react';
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { initializeMonitoring } from './services/monitoring';
import config from './config';
import ErrorBoundary from './components/Errors/ErrorBoundary';
import GraphqlProvider from './providers/graphql/GraphqlProvider';
import GraphqlClient from './api/graphql/GraphQlClient';
import App from './app';
import reportWebVitals from './reportWebVitals';
// import './styles/scss/main.scss';
import "./styles/css/index.css";

initializeMonitoring();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GraphqlProvider client={GraphqlClient}>
      <Helmet titleTemplate={`${config.title} | %s `} defaultTitle={`${config.title}`} />
      <ErrorBoundary>
        <Router>
          <App />
        </Router>
      </ErrorBoundary>
    </GraphqlProvider>
  </StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

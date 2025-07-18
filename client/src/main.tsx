import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import AppRouter from "./AppRouter";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { queryClient } from "./lib/queryClient";

// Initialize Sentry for error tracking
initSentry();

// Inject a dummy auth token to simulate a logged-in state
localStorage.setItem('authToken', 'demo-token-12345');

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  </StrictMode>
);

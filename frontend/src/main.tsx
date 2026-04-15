// frontend/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "@/app/styles/index.css";
import App from "@/app";

import { ThemeProvider } from "@/shared/providers/ThemeProvider";
import { Toaster } from "sonner";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <App />
      <Toaster
        richColors
        closeButton
        position="top-center"
        className="toaster-group"
        toastOptions={{
          classNames: {
            toast: "z-[10050]",
          },
        }}
      />
    </ThemeProvider>
  </StrictMode>,
)

import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./experience/Experience";
import "./experience/experience.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<div className="boot">Opening MUSE SIMLAB…</div>}>
      <App />
    </Suspense>
  </React.StrictMode>,
);

import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.js";
import "./catalog/register.js";
import "./index.css";
import { attachGlobalErrorHandlers } from "./state/global-errors.js";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("root element missing");
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
attachGlobalErrorHandlers();

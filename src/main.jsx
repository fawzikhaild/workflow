
import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
} from "react-router-dom";

import {
  Provider,
} from "react-redux";

import { store } from "./store/store";

import AuthSync from "@/features/auth/AuthSync";

import App from "./App";

import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AuthSync>
          <App />
        </AuthSync>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

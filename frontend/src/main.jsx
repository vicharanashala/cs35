import React from "react";
import ReactDOM from "react-dom/client";
import {
  createRouter,
  RouterProvider,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";

import "./index.css";

import HomePage from "./pages/HomePage";
import QueuePage from "./pages/QueuePage";
import QuestionPage from "./pages/QuestionPage";
import AdminPage from "./pages/AdminPage";

const rootRoute = createRootRoute();

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const queueRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/queue",
  component: QueuePage,
});

const questionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/question/$id",
  component: QuestionPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  queueRoute,
  questionRoute,
  adminRoute,
]);

const router = createRouter({
  routeTree,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
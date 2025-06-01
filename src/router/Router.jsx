// src/router/Router.jsx
import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
// import AppLayout from "../layouts/AppLayout";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import Register from "../pages/Register";
import ChatPage from "../pages/ChatPage";
import ProtectedRoute from "../components/ProtectedRoute";

function RootLayout() {
  return (
    <>
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <Register /> },

      // everything under here requires login
      {
        element: <ProtectedRoute />,
        children: [{ path: "chat", element: <ChatPage /> }],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}

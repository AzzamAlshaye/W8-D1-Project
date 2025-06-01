// src/router/Router.jsx
import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
// import AppLayout from "../layouts/AppLayout";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import Register from "../pages/Register";
// import ChatPage from "../pages/ChatPage";

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
    children: [{ index: true, element: <HomePage /> }],
  },

  { path: "login", element: <LoginPage /> },
  { path: "register", element: <Register /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}

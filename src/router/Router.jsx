// src/router/Router.jsx
import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
import HomePage from "../pages/HomePage";
import LoginPage from "../Auth/LoginPage";
import Register from "../Auth/Register";
import VideoPage from "../pages/VideoPage";
import LikedVideos from "../pages/video-page/LikeVideos";

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
      { path: "/watch/:videoId", element: <VideoPage /> },
      { path: "/liked", element: <LikedVideos /> },
    ],
  },

  { path: "login", element: <LoginPage /> },
  { path: "register", element: <Register /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}

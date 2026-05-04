/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import AppLayout from "./components/layout/AppLayout";
import Home from "./pages/Home";
import Members from "./pages/Members";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import { useStore } from "./store";
import { dbService } from "./services/db";

export default function App() {
  const initialize = useStore((state) => state.initialize);
  const currentUser = useStore((state) => state.currentUser);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Heartbeat interval to keep user online
  useEffect(() => {
    if (!currentUser?.id) return;

    // Send heartbeat immediately on mount/login
    dbService.sendHeartbeat().catch(console.error);

    const interval = setInterval(() => {
      dbService.sendHeartbeat().catch(console.error);
    }, 30000); // Every 30 seconds

    // Add beforeunload listener to mark offline when closing tab
    const handleBeforeUnload = () => {
      const session = localStorage.getItem("app_session");
      if (session) {
        const { token } = JSON.parse(session);
        if (token) {
           fetch("/api/users/offline", {
             method: "POST",
             keepalive: true,
             headers: {
                "Authorization": `Bearer ${token}`
             }
           }).catch(console.error);
        }
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentUser?.id]);

  return (
    <Router>
      <Toaster
        position="top-center"
        expand={false}
        richColors
        theme="light"
        toastOptions={{
          style: {
            fontFamily: "var(--font-sans)",
            borderRadius: "var(--radius-md)",
            border: "1px solid #e2e8f0",
            boxShadow: "none",
            fontSize: "var(--text-sm)",
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="members" element={<Members />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:userId" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

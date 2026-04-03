"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setExiting(true), 2700);
    const removeTimer = setTimeout(onDismiss, 3000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onDismiss]);

  const bgColor = type === "success" ? "bg-green-800/90" : "bg-red-800/90";

  return (
    <div
      className={`fixed bottom-6 left-4 right-4 z-50 px-4 py-3 rounded-lg text-sm text-white ${bgColor} ${
        exiting ? "toast-exit" : "toast-enter"
      }`}
    >
      {message}
    </div>
  );
}

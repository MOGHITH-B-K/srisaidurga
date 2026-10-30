"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "global-error-reset",
          error: {
            message: error?.message,
            stack: error?.stack,
            digest: error?.digest,
            name: error?.name,
          },
          timestamp: Date.now(),
        },
        "*"
      );
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full text-center space-y-4 p-6 bg-neutral-800 rounded-lg border border-neutral-700 shadow-xl">
          <h2 className="text-xl font-bold text-red-400">Something went wrong</h2>
          <p className="text-sm text-neutral-300">
            {error?.message || "An unexpected error occurred."}
          </p>
          {error?.digest && (
            <p className="text-xs text-neutral-500 font-mono">Digest: {error.digest}</p>
          )}
          <button
            onClick={() => reset()}
            className="mt-4 px-4 py-2 bg-neutral-100 text-neutral-900 hover:bg-white font-medium rounded text-sm transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

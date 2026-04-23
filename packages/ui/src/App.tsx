import { QueryClientProvider } from "@tanstack/react-query";
import { SessionRoot } from "./SessionRoot.js";
import { SessionClosed } from "./pages/SessionClosed.js";
import { queryClient } from "./state/query-client.js";
import { useSessionStore } from "./state/session-store.js";
import { useSessionWebSocket } from "./state/use-ws.js";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Root />
    </QueryClientProvider>
  );
}

function Root() {
  useSessionWebSocket();
  const sessionEnded = useSessionStore((s) => s.sessionEnded);
  const onClosedRoute = typeof window !== "undefined" && window.location.pathname === "/closed";
  if (onClosedRoute || sessionEnded) return <SessionClosed />;
  return <SessionRoot />;
}

import { QueryClientProvider } from "@tanstack/react-query";
import { SessionRoot } from "./SessionRoot.js";
import { queryClient } from "./state/query-client.js";
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
  return <SessionRoot />;
}

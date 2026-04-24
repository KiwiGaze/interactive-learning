import { Button } from "../components/ui/button.js";

export function SessionClosed() {
  return (
    <main className="grid min-h-screen place-items-center p-8 text-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Session ended</h1>
        <p className="text-sm text-muted-foreground">You can close this tab.</p>
        <Button type="button" disabled variant="outline">
          Export session
        </Button>
      </div>
    </main>
  );
}

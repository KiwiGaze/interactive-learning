export function SessionClosed() {
  return (
    <main className="grid min-h-screen place-items-center p-8 text-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Session ended</h1>
        <p className="text-sm text-slate-500">
          You can close this tab. Phase 2 will let you export this session.
        </p>
        <button
          type="button"
          disabled
          className="mt-4 cursor-not-allowed rounded border border-slate-300 px-3 py-1 text-sm opacity-50"
        >
          Export session (Phase 2)
        </button>
      </div>
    </main>
  );
}

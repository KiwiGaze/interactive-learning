import { Component, type ReactNode } from "react";
import { sendUserEvent } from "../state/use-ws.js";

interface Props {
  slotId: string;
  slotVersion: number;
  fallback: (err: Error) => ReactNode;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class SlotErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error): void {
    sendUserEvent(
      "component.render_error",
      { id: this.props.slotId, version: this.props.slotVersion },
      { message: error.message, stack: error.stack },
    );
  }

  override render(): ReactNode {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
  }
}

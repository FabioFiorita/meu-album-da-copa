import { TriangleAlertIcon } from "lucide-react";
import { Component, Fragment, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /**
   * Optional inline fallback. When provided, it renders INSTEAD of the
   * full-screen error UI, receiving a `reset` callback that clears the error and
   * remounts the children. Used to scope a failure (e.g. a bad compare code) to a
   * small region instead of white-screening the whole app.
   */
  fallback?: (reset: () => void) => ReactNode;
};

type State = {
  hasError: boolean;
  resetKey: number;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    resetKey: 0,
  };

  static getDerivedStateFromError(): Pick<State, "hasError"> {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary capturou um erro:", error, info);
    }
  }

  handleReset = () => {
    // Limpa o erro e remonta a árvore (nova key) para que uma falha
    // transitória se recupere sem recarregar a página inteira.
    this.setState((prev) => ({
      hasError: false,
      resetKey: prev.resetKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.handleReset);
      }
      return (
        <div className="flex min-h-[100svh] w-full flex-col items-center justify-center bg-[var(--app-bg)] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] text-[var(--app-text)]">
          <div className="flex w-full max-w-[24rem] flex-col items-center gap-5 rounded-[1.35rem] border-2 border-[var(--app-border)] bg-[var(--app-card)] p-6 text-center shadow-[0_14px_36px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-gold)]">
              <TriangleAlertIcon className="size-7" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-[20px] font-black leading-tight tracking-normal">
                Algo deu errado
              </h1>
              <p className="text-[13px] font-semibold leading-relaxed text-[var(--app-muted-text)]">
                Tivemos um problema ao carregar esta parte do álbum. Tente de
                novo — suas figurinhas continuam salvas.
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="h-11 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-button-muted)] text-sm font-black text-[var(--app-gold)] transition-colors hover:bg-[var(--app-button-muted-hover)] hover:text-[var(--app-gold-strong)]"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return (
      <Fragment key={this.state.resetKey}>{this.props.children}</Fragment>
    );
  }
}

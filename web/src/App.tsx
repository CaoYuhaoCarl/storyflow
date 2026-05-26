import { OutputPanel } from "./components/output-panel";
import { PipelinePanel } from "./components/pipeline-panel";
import { RunControl } from "./components/run-control";
import { useRun } from "./hooks/useRun";

export function App() {
  const { state, start, cancel, reset } = useRun();

  return (
    <div className="grid h-full grid-rows-[44px_1fr] bg-[var(--color-window)]">
      {/* Translucent titlebar (macOS-style) */}
      <header
        className="relative flex items-center justify-between px-4"
        style={{
          background: "var(--color-titlebar)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom: "0.5px solid var(--color-hairline)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-gradient-to-b from-[#1a1a1c] to-[#000] text-white shadow-sm">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
              <path d="M12 2L2 7v10c0 5.5 4 8 10 8s10-2.5 10-8V7L12 2zm0 2.18L20 8l-8 3.82L4 8l8-3.82zM4 9.74l7 3.34v8.86c-4.6-.32-7-2.45-7-6.94V9.74zm9 12.2v-8.86l7-3.34v6.94c0 4.49-2.4 6.62-7 6.94z"/>
            </svg>
          </div>
          <span className="text-[13.5px] font-semibold tracking-tight text-[var(--color-fg)]">
            LearnMate
          </span>
          <span className="text-[12.5px] text-[var(--color-fg-tertiary)]">English Coach</span>
        </div>

        <a
          href="https://google.github.io/adk-docs/"
          target="_blank"
          rel="noreferrer"
          className="text-[11.5px] text-[var(--color-fg-tertiary)] transition hover:text-[var(--color-fg-secondary)]"
        >
          Powered by Google ADK
        </a>
      </header>

      {/* Content area */}
      <main className="grid min-h-0 grid-cols-[300px_1fr]">
        <aside
          className="flex min-h-0 flex-col gap-5 overflow-y-auto px-4 py-5"
          style={{
            background: "var(--color-sidebar)",
            backdropFilter: "saturate(180%) blur(24px)",
            WebkitBackdropFilter: "saturate(180%) blur(24px)",
            borderRight: "0.5px solid var(--color-hairline)",
          }}
        >
          <RunControl run={state} onStart={start} onCancel={cancel} onReset={reset} />
          <PipelinePanel run={state} />
        </aside>

        <section className="min-h-0 p-4">
          <OutputPanel run={state} />
        </section>
      </main>
    </div>
  );
}

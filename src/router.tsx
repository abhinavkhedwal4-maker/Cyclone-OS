import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-bg text-fg">
      <p className="font-display text-4xl font-semibold text-accent">404</p>
      <p className="text-sm text-muted">Page not found</p>
      <a href="/" className="font-display text-xs tracking-widest text-accent uppercase hover:opacity-70">
        ← Back home
      </a>
    </main>
  );
}

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: NotFound,
  });
}

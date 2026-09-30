import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/cyclone/dashboard";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

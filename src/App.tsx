import { useEffect, useState } from "react";
import { PlanList } from "./components/PlanList";
import { WeeklyGrid } from "./components/WeeklyGrid";
import { PrintView } from "./components/PrintView";

function getRoute(): string {
  return window.location.hash.replace(/^#/, "") || "/";
}

export default function App() {
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    const onChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const planMatch = route.match(/^\/plan\/([^/]+)$/);
  const printMatch = route.match(/^\/print\/([^/]+)$/);

  if (planMatch) return <WeeklyGrid planId={planMatch[1]} />;
  if (printMatch) return <PrintView planId={printMatch[1]} />;
  return <PlanList />;
}

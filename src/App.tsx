import { useEffect, useState } from "react";
import { Home } from "./components/Home";
import { ReviewSession } from "./components/ReviewSession";
import { WordList } from "./components/WordList";
import { Settings } from "./components/Settings";

function getRoute(): string {
  return window.location.hash.replace(/^#/, "") || "/";
}

export default function App() {
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (route.startsWith("/review")) return <ReviewSession />;
  if (route.startsWith("/words")) return <WordList />;
  if (route.startsWith("/settings")) return <Settings />;
  return <Home />;
}

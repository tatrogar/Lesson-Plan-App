const GIST_FILE = "spanish-lesson-state.json";
const GIST_DESCRIPTION = "Spanish Lesson app sync state";
const API_BASE = "https://api.github.com";

type GistFile = { content?: string };
type Gist = { id: string; files?: Record<string, GistFile> };

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function verifyToken(token: string): Promise<string> {
  const res = await fetch(`${API_BASE}/user`, { headers: authHeaders(token) });
  if (!res.ok) {
    if (res.status === 401)
      throw new Error("Token rejected. Check it has 'gist' scope.");
    throw new Error(`GitHub error ${res.status}`);
  }
  const data = await res.json();
  return data.login as string;
}

export async function findOrCreateGist(token: string): Promise<string> {
  const list = await fetch(`${API_BASE}/gists?per_page=100`, {
    headers: authHeaders(token),
  });
  if (!list.ok) throw new Error(`List gists failed (${list.status})`);
  const gists: Gist[] = await list.json();
  const existing = gists.find((g) => g.files && GIST_FILE in g.files);
  if (existing) return existing.id;

  const created = await fetch(`${API_BASE}/gists`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: { [GIST_FILE]: { content: "{}" } },
    }),
  });
  if (!created.ok) throw new Error(`Create gist failed (${created.status})`);
  const data = await created.json();
  return data.id as string;
}

export async function pushGist(
  token: string,
  gistId: string,
  content: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/gists/${gistId}`, {
    method: "PATCH",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      files: { [GIST_FILE]: { content } },
    }),
  });
  if (!res.ok) throw new Error(`Push failed (${res.status})`);
}

export async function pullGist(
  token: string,
  gistId: string,
): Promise<string> {
  const res = await fetch(`${API_BASE}/gists/${gistId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Pull failed (${res.status})`);
  const data = await res.json();
  const content = data.files?.[GIST_FILE]?.content;
  if (typeof content !== "string") throw new Error("Gist file missing");
  return content;
}

export function gistUrl(gistId: string, login?: string): string {
  return login
    ? `https://gist.github.com/${login}/${gistId}`
    : `https://gist.github.com/${gistId}`;
}

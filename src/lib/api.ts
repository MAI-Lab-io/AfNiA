import { supabase } from "./supabaseClient";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8001";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function apiGet<T>(path: string): Promise<T> {
  const headers = await authHeaders();
  const r = await fetch(`${BACKEND_URL}${path}`, { headers });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function apiPostJson<T>(path: string, body: any): Promise<T> {
  const headers = await authHeaders();
  const r = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function apiPostForm<T>(path: string, form: FormData): Promise<T> {
  const headers = await authHeaders();
  const r = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

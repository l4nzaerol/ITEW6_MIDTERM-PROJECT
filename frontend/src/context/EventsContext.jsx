import { createContext, useContext, useEffect, useMemo, useState } from "react";
import data from "../data/mockData";

const EventsContext = createContext(null);
const ENV_API_URL = import.meta.env.VITE_API_URL || "";
const EVENTS_STORAGE_KEY = "ccs_events_data_v1";

function normalizeEvent(e) {
  return {
    id: Number(e?.id) || Date.now(),
    name: String(e?.name || "").trim(),
    type: String(e?.type || "").trim() || "Academic",
    date: String(e?.date || "").trim(), // YYYY-MM-DD
  };
}

function readInitialEvents() {
  return (data.events || []).map(normalizeEvent);
}

function getApiCandidates() {
  const host =
    typeof window !== "undefined" && window.location?.hostname
      ? window.location.hostname
      : "localhost";
  const envBase = String(ENV_API_URL || "").trim().replace(/\/+$/, "");
  const envApiBase = envBase && !envBase.endsWith("/api") ? `${envBase}/api` : envBase;
  return Array.from(
    new Set(
      [
        envBase,
        envApiBase,
        `http://${host}:3001`,
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        `http://${host}:8000`,
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        `http://${host}:8000/api`,
        "http://localhost:8000/api",
        "http://127.0.0.1:8000/api",
      ].filter(Boolean)
    )
  );
}

function readLocalEvents() {
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.map(normalizeEvent) : [];
  } catch {
    return [];
  }
}

function writeLocalEvents(list) {
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(Array.isArray(list) ? list : []));
}

export function EventsProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [apiBase, setApiBase] = useState(() => getApiCandidates()[0]);
  const [isOffline, setIsOffline] = useState(false);

  const requestWithFallback = async (path, options) => {
    const candidates = [apiBase, ...getApiCandidates()].filter((v, i, a) => v && a.indexOf(v) === i);
    let lastNetworkError = null;
    let lastHttpResponse = null;
    const cleanPath = String(path || "").startsWith("/") ? String(path) : `/${String(path || "")}`;
    const pathVariants = cleanPath.startsWith("/api/")
      ? [cleanPath, cleanPath.replace(/^\/api/, "")]
      : [cleanPath, `/api${cleanPath}`];
    for (const base of candidates) {
      const cleanBase = String(base || "").replace(/\/+$/, "");
      const variants = cleanBase.endsWith("/api")
        ? [cleanBase, cleanBase.slice(0, -4)]
        : [cleanBase, `${cleanBase}/api`];

      for (const variant of variants) {
        for (const p of pathVariants) {
          try {
            const res = await fetch(`${variant}${p}`, options);
            const shouldTryNext = res.status >= 500 || res.status === 404 || res.status === 405;
            if (shouldTryNext) {
              lastHttpResponse = res;
              continue;
            }
            setApiBase(variant);
            return res;
          } catch (e) {
            lastNetworkError = e;
          }
        }
      }
    }
    if (lastHttpResponse) {
      return lastHttpResponse;
    }
    throw new Error(
      `Cannot reach API server.${lastNetworkError instanceof Error ? ` (${lastNetworkError.message})` : ""}`
    );
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await requestWithFallback("/events");
        if (!res.ok) throw new Error("Failed to load events");
        const list = await res.json();
        if (Array.isArray(list) && list.length) {
          const normalized = list.map(normalizeEvent);
          setEvents(normalized);
          writeLocalEvents(normalized);
          setIsOffline(false);
          return;
        }
        const defaults = readInitialEvents();
        await requestWithFallback("/bootstrap/frontend-dummy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events: defaults }),
        });
        const refresh = await requestWithFallback("/events");
        if (!refresh.ok) throw new Error("Failed to load events");
        const rows = await refresh.json();
        const normalized = Array.isArray(rows) ? rows.map(normalizeEvent) : [];
        setEvents(normalized);
        writeLocalEvents(normalized);
        setIsOffline(false);
      } catch {
        const local = readLocalEvents();
        const fallback = local.length ? local : readInitialEvents();
        setEvents(fallback);
        writeLocalEvents(fallback);
        setIsOffline(true);
      }
    };
    load();
  }, []);

  const api = useMemo(() => {
    const refresh = async () => {
      if (isOffline) {
        setEvents(readLocalEvents());
        return;
      }
      try {
        const res = await requestWithFallback("/events");
        if (!res.ok) throw new Error("Failed to load events");
        const rows = await res.json();
        const normalized = Array.isArray(rows) ? rows.map(normalizeEvent) : [];
        setEvents(normalized);
        writeLocalEvents(normalized);
      } catch {
        setIsOffline(true);
        setEvents(readLocalEvents());
      }
    };

    const addEvent = async (payload) => {
      if (isOffline) {
        const local = readLocalEvents();
        const maxId = local.reduce((acc, e) => Math.max(acc, Number(e?.id) || 0), 0);
        const next = normalizeEvent({ ...payload, id: maxId + 1 });
        const updated = [next, ...local];
        setEvents(updated);
        writeLocalEvents(updated);
        return;
      }
      try {
        const res = await requestWithFallback("/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          let message = "Failed to add event";
          try {
            const body = await res.json();
            if (body?.message) message = body.message;
          } catch {
            // ignore
          }
          throw new Error(message);
        }
        await refresh();
      } catch {
        setIsOffline(true);
        await addEvent(payload);
      }
    };

    const updateEvent = async (id, updates) => {
      if (isOffline) {
        const local = readLocalEvents();
        const updated = local.map((e) =>
          String(e.id) === String(id) ? normalizeEvent({ ...e, ...updates, id }) : e
        );
        setEvents(updated);
        writeLocalEvents(updated);
        return;
      }
      try {
        const res = await requestWithFallback(`/events/${encodeURIComponent(String(id))}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!res.ok) {
          let message = "Failed to update event";
          try {
            const body = await res.json();
            if (body?.message) message = body.message;
          } catch {
            // ignore
          }
          throw new Error(message);
        }
        await refresh();
      } catch {
        setIsOffline(true);
        await updateEvent(id, updates);
      }
    };

    const deleteEvent = async (id) => {
      if (isOffline) {
        const local = readLocalEvents();
        const updated = local.filter((e) => String(e.id) !== String(id));
        setEvents(updated);
        writeLocalEvents(updated);
        return;
      }
      try {
        const res = await requestWithFallback(`/events/${encodeURIComponent(String(id))}`, {
          method: "DELETE",
        });
        if (!res.ok && res.status !== 204) {
          let message = "Failed to delete event";
          try {
            const body = await res.json();
            if (body?.message) message = body.message;
          } catch {
            // ignore
          }
          throw new Error(message);
        }
        await refresh();
      } catch {
        setIsOffline(true);
        await deleteEvent(id);
      }
    };

    const resetEvents = async () => {
      // Keep reset as functional fallback when backend is unreachable.
      const defaults = (data.events || []).map(normalizeEvent);
      setEvents(defaults);
      writeLocalEvents(defaults);
    };

    return { events, addEvent, updateEvent, deleteEvent, resetEvents, refresh, apiUrl: apiBase, isOffline };
  }, [events, apiBase, isOffline]);

  return <EventsContext.Provider value={api}>{children}</EventsContext.Provider>;
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEvents must be used within EventsProvider");
  return ctx;
}


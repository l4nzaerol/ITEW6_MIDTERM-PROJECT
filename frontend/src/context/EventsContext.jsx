import { createContext, useContext, useEffect, useMemo, useState } from "react";
import data from "../data/mockData";

const EventsContext = createContext(null);
const ENV_API_URL = import.meta.env.VITE_API_URL || "";

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
  return Array.from(
    new Set(
      [ENV_API_URL, `http://${host}:3001`, "http://localhost:3001", "http://127.0.0.1:3001"].filter(Boolean)
    )
  );
}

export function EventsProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [apiBase, setApiBase] = useState(() => getApiCandidates()[0]);

  const requestWithFallback = async (path, options) => {
    const candidates = [apiBase, ...getApiCandidates()].filter((v, i, a) => v && a.indexOf(v) === i);
    let lastNetworkError = null;
    for (const base of candidates) {
      try {
        const res = await fetch(`${base}${path}`, options);
        setApiBase(base);
        return res;
      } catch (e) {
        lastNetworkError = e;
      }
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
          setEvents(list.map(normalizeEvent));
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
        setEvents(Array.isArray(rows) ? rows.map(normalizeEvent) : []);
      } catch {
        setEvents(readInitialEvents());
      }
    };
    load();
  }, []);

  const api = useMemo(() => {
    const refresh = async () => {
      const res = await requestWithFallback("/events");
      if (!res.ok) throw new Error("Failed to load events");
      const rows = await res.json();
      setEvents(Array.isArray(rows) ? rows.map(normalizeEvent) : []);
    };

    const addEvent = async (payload) => {
      const res = await requestWithFallback("/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add event");
      await refresh();
    };

    const updateEvent = async (id, updates) => {
      const res = await requestWithFallback(`/events/${encodeURIComponent(String(id))}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update event");
      await refresh();
    };

    const deleteEvent = async (id) => {
      const res = await requestWithFallback(`/events/${encodeURIComponent(String(id))}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete event");
      await refresh();
    };

    const resetEvents = async () => {
      // Keep reset as functional fallback when backend is unreachable.
      setEvents((data.events || []).map(normalizeEvent));
    };

    return { events, addEvent, updateEvent, deleteEvent, resetEvents, refresh, apiUrl: apiBase };
  }, [events, apiBase]);

  return <EventsContext.Provider value={api}>{children}</EventsContext.Provider>;
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEvents must be used within EventsProvider");
  return ctx;
}


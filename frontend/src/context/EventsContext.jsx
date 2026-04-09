import { createContext, useContext, useEffect, useMemo, useState } from "react";
import data from "../data/mockData";

const EventsContext = createContext(null);

const STORAGE_KEY = "ccs_events_v1";

function normalizeEvent(e) {
  return {
    id: Number(e?.id) || Date.now(),
    name: String(e?.name || "").trim(),
    type: String(e?.type || "").trim() || "Academic",
    date: String(e?.date || "").trim(), // YYYY-MM-DD
  };
}

function readInitialEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normalizeEvent);
    }
  } catch {
    // ignore
  }
  return (data.events || []).map(normalizeEvent);
}

export function EventsProvider({ children }) {
  const [events, setEvents] = useState(() => readInitialEvents());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // ignore
    }
  }, [events]);

  const api = useMemo(() => {
    const addEvent = (payload) => {
      const e = normalizeEvent(payload);
      setEvents((prev) => [{ ...e, id: Date.now() }, ...prev]);
    };

    const updateEvent = (id, updates) => {
      setEvents((prev) =>
        prev.map((e) => (String(e.id) === String(id) ? normalizeEvent({ ...e, ...updates, id: e.id }) : e))
      );
    };

    const deleteEvent = (id) => {
      setEvents((prev) => prev.filter((e) => String(e.id) !== String(id)));
    };

    const resetEvents = () => {
      setEvents((data.events || []).map(normalizeEvent));
    };

    return { events, addEvent, updateEvent, deleteEvent, resetEvents };
  }, [events]);

  return <EventsContext.Provider value={api}>{children}</EventsContext.Provider>;
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEvents must be used within EventsProvider");
  return ctx;
}


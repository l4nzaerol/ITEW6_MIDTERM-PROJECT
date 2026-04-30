import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { useMemo, useState } from "react";
import { useEvents } from "../context/EventsContext";

function Events() {
  const { events, addEvent, updateEvent, deleteEvent, resetEvents } = useEvents();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", type: "Academic", date: "" });

  const sorted = useMemo(() => {
    return (events || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events]);

  const openAdd = () => {
    setForm({ name: "", type: "Academic", date: "" });
    setShowAdd(true);
  };

  const openEdit = (ev) => {
    setForm({ name: ev?.name || "", type: ev?.type || "Academic", date: ev?.date || "" });
    setEditing(ev);
  };

  const closeModal = () => {
    setShowAdd(false);
    setEditing(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = { name: form.name, type: form.type, date: form.date };
    try {
      if (editing?.id) await updateEvent(editing.id, payload);
      else await addEvent(payload);
      closeModal();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save event");
    }
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <div className="studentsTopRow">
          <div className="studentsHeader">
            <h1 className="pageTitle">Events</h1>
            <p className="mutedText">
              Manage events shown on the Dashboard’s Upcoming Events panel.
            </p>
          </div>

          <div className="studentsToolbar">
            <button type="button" className="chip addPrimaryBtn" onClick={openAdd}>
              + Add Event
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => {
                const ok = window.confirm("Reset events to default mock data?");
                if (ok) resetEvents();
              }}
            >
              Reset to defaults
            </button>
          </div>
        </div>

        <div className="dashPanel">
          <div className="dashPanelHeader">
            <h3>All Events</h3>
            <span className="dashBadge">{sorted.length} total</span>
          </div>

          <div className="tableShell">
            <table className="dataTable" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((ev) => (
                  <tr key={ev.id}>
                    <td>{ev.date || "-"}</td>
                    <td className="strong">{ev.name}</td>
                    <td>{ev.type}</td>
                    <td className="right">
                      <div className="rowActions">
                        <button type="button" className="chip" onClick={() => openEdit(ev)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="chip dangerChip"
                          onClick={() => {
                            const ok = window.confirm("Delete this event?");
                            if (!ok) return;
                            deleteEvent(ev.id).catch((e) => {
                              alert(e instanceof Error ? e.message : "Failed to delete event");
                            });
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={4} className="emptyCell">
                      No events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        title={editing ? "Edit Event" : "Add Event"}
        isOpen={showAdd || Boolean(editing)}
        onClose={closeModal}
      >
        <form className="modalForm" onSubmit={onSubmit}>
          <div className="modalFormSection">
            <div className="formGrid">
              <label className="span2">
                <span>Event name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </label>
              <label>
                <span>Type</span>
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="Academic">Academic</option>
                  <option value="Sports">Sports</option>
                  <option value="Community">Community</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label>
                <span>Date</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
              </label>
            </div>
          </div>

          <div className="modalActions">
            <button type="submit" className="primaryBtn">
              Save
            </button>
            <button type="button" className="chip" onClick={closeModal}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Events;
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import data from "../data/mockData";

function Events() {
  const curricular = data.events.filter((e) => e.type === "Academic");
  const extraCurricular = data.events.filter((e) => e.type !== "Academic");

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <Topbar />

        <h1 className="pageTitle">Events</h1>

        <div className="dashboardGrid">
          <div className="infoCard">
            <h3>Curricular Events</h3>
            {curricular.map((event) => (
              <div className="eventCard" key={event.id}>
                <h3>{event.name}</h3>
                <p>Type: {event.type}</p>
              </div>
            ))}
          </div>

          <div className="infoCard">
            <h3>Extra-curricular Events</h3>
            {extraCurricular.map((event) => (
              <div className="eventCard" key={event.id}>
                <h3>{event.name}</h3>
                <p>Type: {event.type}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Events;
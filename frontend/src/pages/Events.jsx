import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import data from "../data/mockData";

function Events(){

  return(

    <div className="layout">

      <Sidebar/>

      <div className="content">

        <Topbar/>

        <h1 className="pageTitle">Events</h1>

        {data.events.map((event)=>(
          <div className="eventCard" key={event.id}>

            <h3>{event.name}</h3>
            <p>Type: {event.type}</p>

          </div>
        ))}

      </div>

    </div>

  );

}

export default Events;
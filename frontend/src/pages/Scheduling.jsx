import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function Scheduling(){

  return(

    <div className="layout">

      <Sidebar/>

      <div className="content">

        <Topbar/>

        <h1 className="pageTitle">Scheduling</h1>

        <div className="scheduleGrid">

          <div className="scheduleCard">
            <h3>Courses</h3>
            <p>Manage available courses.</p>
          </div>

          <div className="scheduleCard">
            <h3>Sections</h3>
            <p>Assign students to sections.</p>
          </div>

          <div className="scheduleCard">
            <h3>Rooms & Labs</h3>
            <p>Assign laboratories and rooms.</p>
          </div>

          <div className="scheduleCard">
            <h3>Faculty</h3>
            <p>Assign faculty to schedules.</p>
          </div>

        </div>

      </div>

    </div>

  );

}

export default Scheduling;
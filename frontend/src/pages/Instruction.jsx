import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function Instruction(){

  return(

    <div className="layout">

      <Sidebar/>

      <div className="content">

        <Topbar/>

        <h1 className="pageTitle">Instruction</h1>

        <div className="cards">

          <div className="card largeCard">
            <h3>Curriculum</h3>
            <p>Manage program curriculum and course structures.</p>
          </div>

          <div className="card largeCard">
            <h3>Syllabus</h3>
            <p>Upload and manage syllabus for each subject.</p>
          </div>

          <div className="card largeCard">
            <h3>Lessons</h3>
            <p>Organize lessons and instructional materials.</p>
          </div>

        </div>

      </div>

    </div>

  );

}

export default Instruction;
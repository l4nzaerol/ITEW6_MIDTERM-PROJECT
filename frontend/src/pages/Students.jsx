import Sidebar from "../components/Sidebar";
import data from "../data/mockData";

function Students(){

  return(

    <div className="layout">

      <Sidebar/>

      <div className="content">

        <h1>Students</h1>

        {data.students.map((s)=>(
          <div className="studentCard" key={s.id}>

            <h3>{s.name}</h3>
            <p>Year: {s.year}</p>
            <p>Skills: {s.skills.join(", ")}</p>
            <p>Affiliation: {s.affiliations.join(", ")}</p>

          </div>
        ))}

      </div>

    </div>
  );
}

export default Students;
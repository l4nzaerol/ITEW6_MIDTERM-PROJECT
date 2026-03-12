import Sidebar from "../components/Sidebar";
import data from "../data/mockData";

function Faculty(){

  return(

    <div className="layout">

      <Sidebar/>

      <div className="content">

        <h1>Faculty</h1>

        {data.faculty.map((f)=>(
          <div key={f.id} className="card">

            <h3>{f.name}</h3>
            <p>Specialization: {f.specialization}</p>

          </div>
        ))}

      </div>

    </div>
  );
}

export default Faculty;
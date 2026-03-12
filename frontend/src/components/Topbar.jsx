import { useState } from "react";
import data from "../data/mockData";

function Topbar(){

  const [query,setQuery] = useState("");

  const results = data.students.filter((s)=>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.skills.join(" ").toLowerCase().includes(query.toLowerCase()) ||
    s.affiliations.join(" ").toLowerCase().includes(query.toLowerCase())
  );

  return(

    <div className="topbar">

      <input
        className="searchBar"
        placeholder="Search students, skills, affiliations..."
        onChange={(e)=>setQuery(e.target.value)}
      />

      {query && (
        <div className="searchResults">
          {results.map((s)=>(
            <div key={s.id} className="resultItem">
              <strong>{s.name}</strong>
              <p>{s.skills.join(", ")}</p>
            </div>
          ))}
        </div>
      )}

    </div>

  );

}

export default Topbar;
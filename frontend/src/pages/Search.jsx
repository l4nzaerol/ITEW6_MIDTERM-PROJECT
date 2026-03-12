import { useState } from "react";
import data from "../data/mockData";

function Search(){

  const [query,setQuery] = useState("");

  const results = data.students.filter((s)=>
    s.skills.join(" ").toLowerCase().includes(query.toLowerCase())
  );

  return(

    <div>

      <h1>Comprehensive Search</h1>

      <input
        placeholder="Search skills (ex: basketball, programming)"
        onChange={(e)=>setQuery(e.target.value)}
      />

      {results.map((s)=>(
        <div key={s.id}>
          <h3>{s.name}</h3>
          <p>{s.skills.join(", ")}</p>
        </div>
      ))}

    </div>

  );
}

export default Search;

import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { API } from "../services/api";
import StudentCard from "../components/StudentCard";

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q");
  const [data, setData] = useState([]);

  useEffect(() => {
    API.search(q).then(r => setData(r.data || []));
  }, [q]);

  if (!data.length) return <div className="p-6">No result found</div>;

  return (
    <div className="p-6 grid md:grid-cols-3 gap-4">
      {data.map(s => <StudentCard key={s.rollno} s={s} />)}
    </div>
  );
}

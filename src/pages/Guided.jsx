
import { useEffect, useState } from "react";
import { API } from "../services/api";
import StudentCard from "../components/StudentCard";

export default function Guided() {
  const [years, setYears] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [year, setYear] = useState("");
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");

  useEffect(() => { API.years().then(r => setYears(r.data)); }, []);
  useEffect(() => { if (year) API.colleges(year).then(r => setColleges(r.data)); }, [year]);
  useEffect(() => { if (college) API.courses(year, college).then(r => setCourses(r.data)); }, [college]);
  useEffect(() => {
    if (course) API.students({ year, college, course, page: 1, page_size: 20 })
      .then(r => setStudents(r.data.items || []));
  }, [course]);

  return (
    <div className="p-6 space-y-4">
      <select onChange={e => setYear(e.target.value)} className="border p-2">
        <option>Select Year</option>
        {years.map(y => <option key={y}>{y}</option>)}
      </select>

      {colleges.length > 0 &&
        <select onChange={e => setCollege(e.target.value)} className="border p-2">
          <option>Select College</option>
          {colleges.map(c => <option key={c}>{c}</option>)}
        </select>
      }

      {courses.length > 0 &&
        <select onChange={e => setCourse(e.target.value)} className="border p-2">
          <option>Select Course</option>
          {courses.map(c => <option key={c}>{c}</option>)}
        </select>
      }

      <div className="grid md:grid-cols-3 gap-4">
        {students.map(s => <StudentCard key={s.rollno} s={s} />)}
      </div>
    </div>
  );
}

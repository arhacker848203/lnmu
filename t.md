import { useState, useEffect, useCallback, useRef } from "react";
import SearchBar from "../components/SearchBar";
import StudentCard from "../components/StudentCard";
import Modal from "../components/Modal";
import StudentReport from "../components/StudentReport";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import { API } from "../services/api";

const PAGE_SIZE = 20; // Define page size

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchCurrentPage, setSearchCurrentPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(0);
  const [activeTab, setActiveTab] = useState("direct"); // \'direct\' or \'guided\'
  const [loading, setLoading] = useState(false);

  // Guided Search States
  const [years, setYears] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [subjects, setSubjects] = useState([]); // Renamed from majors to subjects
  const [guidedYear, setGuidedYear] = useState("");
  const [guidedCollege, setGuidedCollege] = useState("");
  const [guidedSubject, setGuidedSubject] = useState(""); // Renamed from guidedMajor
  const [guidedStudents, setGuidedStudents] = useState([]);
  const [guidedCurrentPage, setGuidedCurrentPage] = useState(1);
  const [guidedTotalPages, setGuidedTotalPages] = useState(0);

  // Student Profile States
  const [selectedStudentRoll, setSelectedStudentRoll] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  // Caching for search results
  const searchCache = useRef({});
  const guidedSearchCache = useRef({});

  // Effect for direct search
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchQuery) {
        const cacheKey = `${searchQuery}-${searchCurrentPage}`;
        if (searchCache.current[cacheKey]) {
          setSearchResults(searchCache.current[cacheKey].items);
          setSearchTotalPages(searchCache.current[cacheKey].totalPages);
          return;
        }

        setLoading(true);
        setActiveTab("direct");
        setSelectedStudentRoll(null);
        try {
          const r = await API.search(searchQuery, searchCurrentPage, PAGE_SIZE);
          // Handle response flexibly: check for items array or direct array
          let newResults = [];
          if (Array.isArray(r.data)) {
            newResults = r.data;
          } else if (r.data && Array.isArray(r.data.items)) {
            newResults = r.data.items;
          } else {
             // Fallback: try to get data from response directly if structure is unknown
             console.warn("Unexpected response structure for search:", r.data);
          }

          const newTotalPages = (r.data && r.data.total_items) ? Math.ceil(r.data.total_items / PAGE_SIZE) : 1;

          setSearchResults(newResults);
          setSearchTotalPages(newTotalPages);
          searchCache.current[cacheKey] = { items: newResults, totalPages: newTotalPages };
        } catch (error) {
          console.error("Error fetching search results:", error);
          setSearchResults([]);
          setSearchTotalPages(0);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
        setSearchTotalPages(0);
      }
    };
    fetchSearchResults();
  }, [searchQuery, searchCurrentPage]);

  // Effects for guided search
  useEffect(() => { API.years().then(r => setYears(r.data)); }, []);
  useEffect(() => {
    const fetchColleges = async () => {
      if (guidedYear) {
        setLoading(true);
        try {
          const r = await API.colleges(guidedYear);
          setColleges(r.data);
        } catch (error) {
          console.error("Error fetching colleges:", error);
          setColleges([]);
        } finally {
          setLoading(false);
        }
        setGuidedCollege("");
        setGuidedSubject("");
        setGuidedStudents([]);
        setGuidedCurrentPage(1); // Reset page on year change
        setGuidedTotalPages(0);
        guidedSearchCache.current = {}; // Clear guided search cache on year change
      } else {
        setColleges([]);
        setSubjects([]);
        setGuidedStudents([]);
        setGuidedTotalPages(0);
        guidedSearchCache.current = {};
      }
    };
    fetchColleges();
  }, [guidedYear]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (guidedCollege) {
        setLoading(true);
        try {
          const r = await API.courses(guidedYear, guidedCollege);
          setSubjects(r.data);
        } catch (error) {
          console.error("Error fetching subjects:", error);
          setSubjects([]);
        } finally {
          setLoading(false);
        }
        // setGuidedSubject(""); // Removed: Do not reset subject when colleges change
        setGuidedStudents([]);
        setGuidedCurrentPage(1); // Reset page on college change
        setGuidedTotalPages(0);
        guidedSearchCache.current = {}; // Clear guided search cache on college change
      } else {
        setSubjects([]);
        setGuidedSubject(""); // Only clear subject if college is cleared
        setGuidedStudents([]);
        setGuidedTotalPages(0);
        guidedSearchCache.current = {};
      }
    };
    fetchSubjects();
  }, [guidedCollege, guidedYear]);

  useEffect(() => {
    const fetchGuidedStudents = async () => {
      if (guidedYear && guidedCollege && guidedSubject) { // Ensure all filters are selected before fetching
        const cacheKey = `${guidedYear}-${guidedCollege}-${guidedSubject}-${guidedCurrentPage}`;
        if (guidedSearchCache.current[cacheKey]) {
          setGuidedStudents(guidedSearchCache.current[cacheKey].items);
          setGuidedTotalPages(guidedSearchCache.current[cacheKey].totalPages);
          return;
        }

        setLoading(true);
        try {
          const r = await API.students({ year: guidedYear, college: guidedCollege, subject: guidedSubject, page: guidedCurrentPage, page_size: PAGE_SIZE });
          const newStudents = r.data.items || [];
          const newTotalPages = Math.ceil(r.data.total_items / PAGE_SIZE);
          setGuidedStudents(newStudents);
          setGuidedTotalPages(newTotalPages);
          guidedSearchCache.current[cacheKey] = { items: newStudents, totalPages: newTotalPages };
        } catch (error) {
          console.error("Error fetching guided students:", error);
          setGuidedStudents([]);
          setGuidedTotalPages(0);
        } finally {
          setLoading(false);
        }
      } else {
        setGuidedStudents([]);
        setGuidedTotalPages(0);
      }
    };
    fetchGuidedStudents();
  }, [guidedSubject, guidedCollege, guidedYear, guidedCurrentPage]);

  // Effect for fetching selected student details
  useEffect(() => {
    const fetchSelectedStudent = async () => {
      if (selectedStudentRoll) {
        setLoading(true);
        try {
          const res = await API.student(selectedStudentRoll);
          setSelectedStudent(res.data);
          setShowStudentModal(true);
        } catch (error) {
          console.error("Error fetching student details:", error);
          setSelectedStudent(null);
        } finally {
          setLoading(false);
        }
      } else {
        setSelectedStudent(null);
        setShowStudentModal(false);
      }
    };
    fetchSelectedStudent();
  }, [selectedStudentRoll]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setSearchCurrentPage(1); // Reset to first page on new search
    setActiveTab("direct");
    setSelectedStudentRoll(null);
    searchCache.current = {}; // Clear direct search cache on new search
    guidedSearchCache.current = {}; // Clear guided search cache as well
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery("");
    setSearchResults([]);
    setSearchCurrentPage(1);
    setSearchTotalPages(0);
    setGuidedYear(""); // Clear guided search states as well
    setGuidedCollege("");
    setGuidedSubject("");
    setGuidedStudents([]);
    setGuidedCurrentPage(1);
    setGuidedTotalPages(0);
    setSelectedStudentRoll(null);
    searchCache.current = {}; // Clear all caches on tab change
    guidedSearchCache.current = {};
  };

  const handleViewProfile = useCallback((roll) => {
    setSelectedStudentRoll(roll);
  }, []);

  const closeStudentModal = () => {
    setSelectedStudentRoll(null);
    setSelectedStudent(null);
    setShowStudentModal(false);
  };

  // Pagination Handlers
  const handlePrevPage = (type) => {
    if (type === "direct" && searchCurrentPage > 1) {
      setSearchCurrentPage(prev => prev - 1);
    } else if (type === "guided" && guidedCurrentPage > 1) {
      setGuidedCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = (type) => {
    if (type === "direct" && searchCurrentPage < searchTotalPages) {
      setSearchCurrentPage(prev => prev + 1);
    } else if (type === "guided" && guidedCurrentPage < guidedTotalPages) {
      setGuidedCurrentPage(prev => prev + 1);
    }
  };

  // ===== JPG DOWNLOAD =====
  const downloadJPG = async () => {
    if (!selectedStudent) return alert("Student data not available for download.");
    const node = document.getElementById("report-area");
    if (!node) return alert("Report not ready");

    const dataUrl = await htmlToImage.toJpeg(node, {
      quality: 1,
      pixelRatio: 3,
      backgroundColor: "#ffffff",
      foreignObjectRendering: true
    });

    const link = document.createElement("a");
    link.download = `${selectedStudent.rollno}_report.jpg`;
    link.href = dataUrl;
    link.click();
  };

  // ===== PDF DOWNLOAD (A4) =====
  const downloadPDF = async () => {
    if (!selectedStudent) return alert("Student data not available for download.");
    const node = document.getElementById("report-area");
    if (!node) return alert("Report not ready");

    const dataUrl = await htmlToImage.toPng(node, {
      pixelRatio: 3,
      backgroundColor: "#ffffff",
      foreignObjectRendering: true
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(dataUrl);

    const pdfWidth = 210; // A4 width (mm)
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${selectedStudent.rollno}_report.pdf`);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 text-gray-800 font-sans">
      <header className="bg-white shadow-md p-4 flex items-center justify-center">
        <h1 className="text-3xl font-extrabold text-blue-800 tracking-tight">LNMU Student Portal</h1>
      </header>

      <main className="container mx-auto p-6 mt-8">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-6 border-b border-gray-200">
            <button
              className={`px-6 py-3 text-lg font-semibold ${activeTab === "direct" ? "text-blue-700 border-b-2 border-blue-700" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => handleTabChange("direct")}
            >
              Direct Search
            </button>
            <button
              className={`ml-4 px-6 py-3 text-lg font-semibold ${activeTab === "guided" ? "text-blue-700 border-b-2 border-blue-700" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => handleTabChange("guided")}
            >
              Advanced Search
            </button>
          </div>

          {activeTab === "direct" && (
            <div className="space-y-6">
              <SearchBar onSearch={handleSearch} />
              {searchQuery && !loading && searchResults.length === 0 && (
                <div className="text-center text-gray-600">No result found for "{searchQuery}"</div>
              )}
            </div>
          )}

          {activeTab === "guided" && (
            <div className="space-y-4">
              <select onChange={e => setGuidedYear(e.target.value)} className="border p-3 rounded-md w-full focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>

              {guidedYear && colleges.length > 0 &&
                <select onChange={e => setGuidedCollege(e.target.value)} className="border p-3 rounded-md w-full focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select College</option>
                  {colleges.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              }

              {guidedCollege && subjects.length > 0 && // Changed majors to subjects
                <select onChange={e => setGuidedSubject(e.target.value)} className="border p-3 rounded-md w-full focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select Subject</option> {/* Changed Major to Subject */}
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)} {/* Changed majors to subjects */}
                </select>
              }
              {guidedSubject && !loading && guidedStudents.length === 0 && (
                <div className="text-center text-gray-600">No result found for selected criteria</div>
              )}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="mt-8">
          {(activeTab === "direct" && searchResults.length > 0) && (
            <>
              <div className="grid md:grid-cols-3 gap-6">
                {searchResults.map(s => <StudentCard key={s.rollno} s={s} onViewProfile={handleViewProfile} />)}
              </div>
              {searchTotalPages > 1 && (
                <div className="flex justify-center mt-6 space-x-4">
                  <button
                    onClick={() => handlePrevPage("direct")}
                    disabled={searchCurrentPage === 1}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-gray-700 text-lg">Page {searchCurrentPage} of {searchTotalPages}</span>
                  <button
                    onClick={() => handleNextPage("direct")}
                    disabled={searchCurrentPage === searchTotalPages}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {(activeTab === "guided" && guidedStudents.length > 0) && (
            <>
              <div className="grid md:grid-cols-3 gap-6">
                {guidedStudents.map(s => <StudentCard key={s.rollno} s={s} onViewProfile={handleViewProfile} />)}
              </div>
              {guidedTotalPages > 1 && (
                <div className="flex justify-center mt-6 space-x-4">
                  <button
                    onClick={() => handlePrevPage("guided")}
                    disabled={guidedCurrentPage === 1}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-gray-700 text-lg">Page {guidedCurrentPage} of {guidedTotalPages}</span>
                  <button
                    onClick={() => handleNextPage("guided")}
                    disabled={guidedCurrentPage === guidedTotalPages}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Loading Overlay */}
      <Modal open={loading} isLoader={true} />

      {/* Student Profile Modal */}
      {showStudentModal && selectedStudent && (
        <Modal open={showStudentModal} onClose={closeStudentModal}>
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center mb-4">
              <img
                src={selectedStudent.FULL_PHOTO_URL}
                className="w-32 h-36 border-2 border-blue-400 object-cover rounded-md shadow-md"
                alt={`${selectedStudent.cname} photo`}
              />
              <h2 className="text-2xl font-bold text-blue-800 mt-4">{selectedStudent.cname}</h2>
              <p className="text-gray-600">Roll: {selectedStudent.rollno}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div><b>College:</b> {selectedStudent.allotedcollege}</div>
              <div><b>Honours:</b> {selectedStudent.allotedhonours}</div>
              <div><b>Father Name:</b> {selectedStudent.fname}</div>
              <div><b>Mother Name:</b> {selectedStudent.mname}</div>
              <div><b>Date of Birth:</b> {selectedStudent.dob}</div>
              <div><b>Gender:</b> {selectedStudent.gender}</div>
              <div><b>Category:</b> {selectedStudent.category}</div>
              <div><b>Aadhaar:</b> XXXX-XXXX-{selectedStudent.adhaar?.slice(-4)}</div>
              <div><b>Mobile:</b> {selectedStudent.mobile}</div>
              <div><b>Email:</b> {selectedStudent.email}</div>
              <div className="sm:col-span-2"><b>Address:</b> {selectedStudent.cadd}</div>
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-semibold text-blue-700 mb-3">Academic Report</h3>
              <StudentReport s={selectedStudent} />
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={downloadJPG}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-md shadow-lg transition duration-300"
              >
                Download JPG
              </button>

              <button
                onClick={downloadPDF}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-md shadow-lg transition duration-300"
              >
                Download PDF
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import SearchBar from "../components/SearchBar";
import StudentCard from "../components/StudentCard";
import Modal from "../components/Modal";
import StudentReport from "../components/StudentReport";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import { API } from "../services/api";

const PAGE_SIZE = 20; // Define page size

export default function Home({ onLogout }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchCurrentPage, setSearchCurrentPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(0);
  const [activeTab, setActiveTab] = useState("direct"); // 'direct' or 'guided'
  const [loading, setLoading] = useState(false);

  // Guided Search States
  const [years, setYears] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [guidedYear, setGuidedYear] = useState("");
  const [guidedCollege, setGuidedCollege] = useState("");
  const [guidedSubject, setGuidedSubject] = useState("");
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
             console.warn("Unexpected response structure for search:", r.data);
          }

          const totalItems = (r.data && r.data.total_items) ? r.data.total_items : newResults.length;
          const newTotalPages = Math.ceil(totalItems / PAGE_SIZE);

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
        setGuidedCurrentPage(1);
        setGuidedTotalPages(0);
        guidedSearchCache.current = {};
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
        setGuidedStudents([]);
        setGuidedCurrentPage(1);
        setGuidedTotalPages(0);
        guidedSearchCache.current = {};
      } else {
        setSubjects([]);
        setGuidedSubject("");
        setGuidedStudents([]);
        setGuidedTotalPages(0);
        guidedSearchCache.current = {};
      }
    };
    fetchSubjects();
  }, [guidedCollege, guidedYear]);

  useEffect(() => {
    const fetchGuidedStudents = async () => {
      if (guidedYear && guidedCollege && guidedSubject) {
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
    setSearchCurrentPage(1);
    setActiveTab("direct");
    setSelectedStudentRoll(null);
    searchCache.current = {};
    guidedSearchCache.current = {};
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery("");
    setSearchResults([]);
    setSearchCurrentPage(1);
    setSearchTotalPages(0);
    setGuidedYear("");
    setGuidedCollege("");
    setGuidedSubject("");
    setGuidedStudents([]);
    setGuidedCurrentPage(1);
    setGuidedTotalPages(0);
    setSelectedStudentRoll(null);
    searchCache.current = {};
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
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="bg-gray-800 border-b border-blue-600 p-4 flex flex-col sm:flex-row items-center justify-between shadow-lg px-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-400 tracking-tight mb-2 sm:mb-0">LNMU Student Portal</h1>
        <button
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base"
        >
          Logout
        </button>
      </header>

      <main className="container mx-auto px-4 py-6 mt-4 sm:mt-8">
        <div className="bg-gray-800 rounded-xl shadow-2xl border border-blue-900 p-4 sm:p-8 max-w-2xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex flex-col sm:flex-row justify-center mb-6 border-b border-gray-700">
            <button
              className={`px-4 py-2 sm:px-6 sm:py-3 text-base sm:text-lg font-semibold transition-colors duration-300 ${activeTab === "direct" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400 hover:text-blue-300"}`}
              onClick={() => handleTabChange("direct")}
            >
              Direct Search
            </button>
            <button
              className={`mt-2 sm:mt-0 sm:ml-4 px-4 py-2 sm:px-6 sm:py-3 text-base sm:text-lg font-semibold transition-colors duration-300 ${activeTab === "guided" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400 hover:text-blue-300"}`}
              onClick={() => handleTabChange("guided")}
            >
              Advanced Search
            </button>
          </div>

          {activeTab === "direct" && (
            <div className="space-y-6">
              <SearchBar onSearch={handleSearch} />
              {searchQuery && !loading && searchResults.length === 0 && (
                <div className="text-center text-gray-400">No result found for "{searchQuery}"</div>
              )}
            </div>
          )}

          {activeTab === "guided" && (
            <div className="space-y-4">
              <select onChange={e => setGuidedYear(e.target.value)} className="bg-gray-700 text-white border border-gray-600 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                <option value="">Select Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>

              {guidedYear && colleges.length > 0 &&
                <select onChange={e => setGuidedCollege(e.target.value)} className="bg-gray-700 text-white border border-gray-600 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option value="">Select College</option>
                  {colleges.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              }

              {guidedCollege && subjects.length > 0 &&
                <select onChange={e => setGuidedSubject(e.target.value)} className="bg-gray-700 text-white border border-gray-600 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              }
              {guidedSubject && !loading && guidedStudents.length === 0 && (
                <div className="text-center text-gray-400">No result found for selected criteria</div>
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
              {searchResults.length > 0 && (
                <div className="flex justify-center mt-6 space-x-4">
                  <button
                    onClick={() => handlePrevPage("direct")}
                    disabled={searchCurrentPage === 1}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-blue-300 text-lg font-medium py-2">Page {searchCurrentPage} of {searchTotalPages}</span>
                  <button
                    onClick={() => handleNextPage("direct")}
                    disabled={searchCurrentPage === searchTotalPages}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-blue-300 text-lg font-medium py-2">Page {guidedCurrentPage} of {guidedTotalPages}</span>
                  <button
                    onClick={() => handleNextPage("guided")}
                    disabled={guidedCurrentPage === guidedTotalPages}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
          <div className="p-4 sm:p-6 space-y-4 min-w-0 bg-gray-800 text-gray-100 rounded-lg">
            <div className="flex flex-col items-center mb-4">
              <img
                src={selectedStudent.FULL_PHOTO_URL}
                className="w-32 h-36 border-2 border-blue-500 object-cover rounded-md shadow-lg"
                alt={`${selectedStudent.cname} photo`}
              />
              <h2 className="text-2xl font-bold text-blue-400 mt-4">{selectedStudent.cname}</h2>
              <p className="text-gray-400">Roll: {selectedStudent.rollno}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="text-gray-300"><b className="text-blue-400">College:</b> {selectedStudent.allotedcollege}</div>
              <div className="text-gray-300"><b className="text-blue-400">Honours:</b> {selectedStudent.allotedhonours}</div>
              <div className="text-gray-300"><b className="text-blue-400">Father Name:</b> {selectedStudent.fname}</div>
              <div className="text-gray-300"><b className="text-blue-400">Mother Name:</b> {selectedStudent.mname}</div>
              <div className="text-gray-300"><b className="text-blue-400">Date of Birth:</b> {selectedStudent.dob}</div>
              <div className="text-gray-300"><b className="text-blue-400">Gender:</b> {selectedStudent.gender}</div>
              <div className="text-gray-300"><b className="text-blue-400">Category:</b> {selectedStudent.category}</div>
              <div className="text-gray-300"><b className="text-blue-400">Aadhaar:</b> XXXX-XXXX-{selectedStudent.adhaar?.slice(-4)}</div>
              <div className="text-gray-300"><b className="text-blue-400">Mobile:</b> {selectedStudent.mobile}</div>
              <div className="text-gray-300"><b className="text-blue-400">Email:</b> {selectedStudent.email}</div>
              <div className="sm:col-span-2 text-gray-300"><b className="text-blue-400">Address:</b> {selectedStudent.cadd}</div>
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-semibold text-blue-400 mb-3">Academic Report</h3>
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

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { API } from "../services/api";
import Modal from "../components/Modal";
import StudentReport from "../components/StudentReport";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";

export default function Student() {
  const { roll } = useParams();
  const [student, setStudent] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    API.student(roll).then(res => setStudent(res.data));
  }, [roll]);

  // ===== JPG DOWNLOAD =====
  const downloadJPG = async () => {
    const node = document.getElementById("report-area");
    if (!node) return alert("Report not ready");

    const dataUrl = await htmlToImage.toJpeg(node, {
      quality: 1,
      pixelRatio: 3,
      backgroundColor: "#ffffff",
      // Required for rendering external images like QR code
      foreignObjectRendering: true
    });

    const link = document.createElement("a");
    link.download = `${roll}_report.jpg`;
    link.href = dataUrl;
    link.click();
  };

  // ===== PDF DOWNLOAD (A4) =====
  const downloadPDF = async () => {
    const node = document.getElementById("report-area");
    if (!node) return alert("Report not ready");

    const dataUrl = await htmlToImage.toPng(node, {
      pixelRatio: 3,
      backgroundColor: "#ffffff",
      // Required for rendering external images like QR code
      foreignObjectRendering: true
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(dataUrl);

    const pdfWidth = 210; // A4 width (mm)
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${roll}_report.pdf`);
  };

  if (!student) return <div className="p-6">Loading profile…</div>;

  return (
    <div className="p-6 space-y-3">
      <img
        src={student.FULL_PHOTO_URL}
        className="w-32 h-36 border object-cover"
      />

      <h2 className="text-xl font-bold">{student.cname}</h2>
      <p><b>Roll:</b> {student.rollno}</p>
      <p><b>College:</b> {student.allotedcollege}</p>
      <p><b>Honours:</b> {student.major}</p>

      <button
        onClick={() => setOpen(true)}
        className="bg-blue-700 text-white px-4 py-2 rounded"
      >
        Preview Report
      </button>

      {/* ===== PREVIEW MODAL ===== */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <StudentReport s={student} />

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={downloadJPG}
            className="bg-green-600 text-white px-5 py-2 rounded"
          >
            Download JPG
          </button>

          <button
            onClick={downloadPDF}
            className="bg-red-600 text-white px-5 py-2 rounded"
          >
            Download PDF
          </button>
        </div>
      </Modal>
    </div>
  );
}

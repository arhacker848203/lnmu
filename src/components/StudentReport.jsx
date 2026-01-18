export default function StudentReport({ s }) {
  return (
    <div
      id="report-area"
      className="w-[900px] min-w-[900px] bg-white border border-gray-300 text-[13px] text-gray-900 font-sans shadow-lg overflow-hidden mx-auto"
    >
      {/* HEADER */}
      <div className="bg-blue-800 text-white px-6 py-4 flex items-center gap-4">
        <img src="/logo.png" className="h-12 filter brightness-150" alt="University Logo" />
        <div>
          <h1 className="text-lg font-bold">LALIT NARAYAN MITHILA UNIVERSITY</h1>
          <p className="text-xs tracking-wide text-blue-200">STUDENT REPORT CARD (2023–2026)</p>
        </div>
      </div>

      {/* PROFILE */}
      <div className="grid grid-cols-1 md:grid-cols-[120px_minmax(0,2fr)_120px] gap-4 p-6 items-start bg-gray-50">
        <img
          src={`/images${s.FULL_PHOTO_URL.replace("https://lnmuniversity.com", "")}`}
          crossOrigin="anonymous"
          className="w-28 h-32 border-2 border-blue-400 object-cover mx-auto rounded-md shadow-sm"
          alt={`${s.cname} photo`}
        />

        <div className="flex flex-col gap-y-1 flex-grow">
          <Info label="Name" value={s.cname} />
          <Info label="Father Name" value={s.fname} />
          <Info label="Mother Name" value={s.mname} />
          <Info label="Date of Birth" value={s.dob} />
          <Info label="Gender" value={s.gender} />
          <Info label="Category" value={s.category} />
          <Info label="Aadhaar" value={s.adhaar} />
          <Info label="Mobile" value={s.mobile} />
          <Info label="Email" value={s.email} />
          <Info label="Address" value={s.cadd} />
        </div>

        <img
          src={`/qrcode/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(JSON.stringify({
            name: s.cname,
            fatherName: s.fname,
            motherName: s.mname,
            dob: s.dob,
            gender: s.gender,
            category: s.category,
            aadhaar: s.adhaar,
            mobile: s.mobile,
            email: s.email,
            address: s.cadd,
            rollNo: s.rollno,
            registrationNo: s.regno,
            college: s.allotedcollege,
            honours: s.major,
            stream: s.stream,
            admissionDate: s.admdate,
            twelfthBoard: s.iboard,
            twelfthYear: s.iyear,
            twelfthMarks: s.iobt,
            twelfthPercentage: s.iprcnt,
          }))}`}
          crossOrigin="anonymous"
          className="border mx-auto rounded-md shadow-sm"
          alt="QR Code"
        />
      </div>

      {/* ADMISSION DETAILS */}
      <Section title="Admission Details">
        <Info label="Roll No" value={s.rollno} />
        <Info label="Registration No" value={s.regno} />
        <Info label="College" value={s.allotedcollege} />
        <Info label="Honours" value={s.major} />
        <Info label="Stream" value={s.stream} />
        <Info label="Admission Date" value={s.appdt} />
      </Section>

      {/* EDUCATION */}
      <div className="px-6 pb-6 bg-gray-50">
        <h2 className="bg-blue-700 text-white px-4 py-2 text-sm font-semibold rounded-t-md">
          Educational Qualification
        </h2>

        <table className="w-full border border-gray-300 text-center text-xs">
          <thead className="bg-blue-100">
            <tr>
              <th className="border border-gray-300 p-2">Class</th>
              <th className="border border-gray-300 p-2">Board</th>
              <th className="border border-gray-300 p-2">Year</th>
              <th className="border border-gray-300 p-2">Marks</th>
              <th className="border border-gray-300 p-2">Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2">12th</td>
              <td className="border border-gray-300 p-2">{s.iboard}</td>
              <td className="border border-gray-300 p-2">{s.iyear}</td>
              <td className="border border-gray-300 p-2">{s.intobtmarks}</td>
              <td className="border border-gray-300 p-2">{s.intpercnt}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SIGNATURE */}
      <div className="text-center py-6 bg-gray-50 border-t border-gray-200">
        <img
          src={`/images${s.FULL_SIGN_URL.replace("https://lnmuniversity.com", "")}`}
          crossOrigin="anonymous"
          className="mx-auto h-14 border-2 border-blue-400 rounded-md shadow-sm"
          alt="Student Signature"
        />
        <p className="text-xs mt-2 text-gray-700">Student Signature</p>
      </div>
    </div>
  );
}

const Info = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-gray-600 font-semibold">{label}:</span>
    <span className="font-medium text-gray-800 break-words">{value || "—"}</span>
  </div>
);

const Section = ({ title, children }) => (
  <div className="px-6 pb-4 bg-gray-50">
    <h2 className="bg-blue-700 text-white px-4 py-2 text-sm font-semibold rounded-t-md">
      {title}
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-gray-300 p-4 rounded-b-md">
      {children}
    </div>
  </div>
);

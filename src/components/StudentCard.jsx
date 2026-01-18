
export default function StudentCard({ s, onViewProfile }) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center w-full">
      <img
        src={s.FULL_PHOTO_URL}
        className="w-24 h-28 sm:w-28 sm:h-32 mx-auto rounded-md border-2 border-blue-300 object-cover mb-3"
        alt={`${s.cname} photo`}
      />
      <h3 className="text-base sm:text-lg font-bold text-blue-800 truncate w-full px-2">{s.cname}</h3>
      <p className="text-sm text-gray-600 mb-3">{s.rollno}</p>
      <button
        onClick={() => onViewProfile(s.rollno)}
        className="mt-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow-md transition duration-300"
      >
        View Profile
      </button>
    </div>
  );
}

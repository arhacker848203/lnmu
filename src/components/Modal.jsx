
export default function Modal({ open, onClose, children, isLoader = false }) {
  if (!open) return null;
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isLoader ? "bg-black/40 backdrop-blur-lg" : "bg-black/50"}`}
      aria-modal="true"
      role="dialog"
    >
      <div className={`relative rounded-lg shadow-lg w-full ${isLoader ? "bg-transparent max-w-none" : "bg-white max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"}`}>
        {!isLoader && (
          <button
            className="absolute top-2 right-2 text-xl text-gray-500 hover:text-gray-800 z-10 p-2"
            onClick={onClose}
          >
            ✕
          </button>
        )}
        {isLoader ? (
          <div className="flex flex-col items-center justify-center p-8 bg-white/30 backdrop-blur-xl rounded-lg">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-500"></div>
            <p className="mt-4 text-blue-700 font-extrabold text-2xl">Loading...</p>
          </div>
        ) : (
          <div className="p-4 overflow-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

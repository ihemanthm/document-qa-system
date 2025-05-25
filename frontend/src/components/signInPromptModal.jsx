export default function SignInPromptModal({ open, onClose }) {
    if (!open) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-md shadow-md w-[300px] text-center">
          <h2 className="text-lg font-semibold mb-4">Authentication Required</h2>
          <p className="mb-6 text-sm text-gray-600">Please sign in with Google to continue.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
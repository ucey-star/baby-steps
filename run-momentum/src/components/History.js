import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function History() {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchHistory = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setHistory(userDoc.data().history || []);
        }
      }
    };
    fetchHistory();
  }, [user]);

  // Helper function to format seconds into minutes
  const formatDuration = (minutes) => {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  };
  
  
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <header className="bg-blue-600 text-white py-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center px-4">
          <h1 className="text-2xl font-bold">Run History</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-white text-blue-600 px-4 py-1 rounded-lg hover:bg-gray-200 transition duration-300"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* No History Message */}
        {history.length === 0 ? (
          <div className="text-center mt-12">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              No Run History Yet
            </h2>
            <p className="text-gray-600">
              Complete your first run to see it here!
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Your Run History
            </h2>

            {/* Run History List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history
                .slice() // Clone to avoid mutation
                .sort((a, b) => b.date.seconds - a.date.seconds) // Sort by most recent
                .map((run, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300"
                  >
                    <h3 className="text-xl font-semibold text-blue-600 mb-2">
                      {new Date(run.date.seconds * 1000).toLocaleDateString()}
                    </h3>
                    <p className="text-gray-700">
                      You ran for{" "}
                      <span className="text-green-600 font-bold">
                        {formatDuration(run.duration)}
                      </span>
                      .
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default History;

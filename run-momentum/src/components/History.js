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
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setHistory(userDoc.data().history || []);
        }
      } catch (error) {
        console.error("Error fetching history:", error.message);
      }
    };
    fetchHistory();
  }, [user]);

  // Helper function to format duration
  const formatDuration = (minutes) => {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  };

  return (
    <div className="bg-gradient-to-b from-white to-gray-100 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-md py-4">
        <div className="container mx-auto flex justify-between items-center px-4">
          <h1 className="text-3xl font-extrabold text-gray-800">
            Your Run History
          </h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-colors duration-300"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {history.length === 0 ? (
          <div className="text-center mt-20">
            <h2 className="text-4xl font-semibold text-gray-700 mb-4">
              No Run History Yet
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Complete your first run to see it here!
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-green-500 text-white px-8 py-3 rounded-full text-lg font-bold hover:bg-green-600 transition-colors duration-300"
            >
              Set Your First Goal
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-4xl font-bold text-gray-800 mb-12 text-center">
              Your Run History
            </h2>

            {/* Run History List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {history
                .slice()
                .sort((a, b) => b.date.seconds - a.date.seconds)
                .map((run, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
                  >
                    <h3 className="text-2xl font-semibold text-blue-600 mb-2">
                      {new Date(run.date.seconds * 1000).toLocaleDateString()}
                    </h3>
                    <p className="text-gray-700 text-lg">
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

      {/* Footer */}
      <footer className="bg-white py-6 mt-12">
        <div className="container mx-auto text-center text-gray-600">
          © {new Date().getFullYear()} Baby Steps. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default History;
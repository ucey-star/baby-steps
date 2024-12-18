// src/components/History.js
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

  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl">Run History</h1>
        <button onClick={() => navigate("/dashboard")} className="text-blue-500">
          Back to Dashboard
        </button>
      </header>
      {history.length === 0 ? (
        <p>No run history yet.</p>
      ) : (
        <ul>
          {history.map((run, index) => (
            <li key={index} className="mb-2">
              <strong>{new Date(run.date.seconds * 1000).toLocaleDateString()}:</strong> Ran for {run.duration} seconds
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default History;

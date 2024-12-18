import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { Timestamp } from "firebase/firestore"; // Import Timestamp
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [currentGoal, setCurrentGoal] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [incrementAmount, setIncrementAmount] = useState("");
  const [hasRunToday, setHasRunToday] = useState(false);
  const navigate = useNavigate();

  const user = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCurrentGoal(data.currentGoal);
          const today = new Date().toDateString();
          if (data.lastRun) {
            const lastRun = data.lastRun.toDate().toDateString();
            setHasRunToday(lastRun === today);
          }
        } else {
          await setDoc(doc(db, "users", user.uid), {
            currentGoal: "",
            history: [],
            lastRun: null,
          });
        }
      }
    };
    fetchData();
  }, [user]);

  const handleSetGoal = async (e) => {
    e.preventDefault();
    if (newGoal.trim() === "") return;

    await updateDoc(doc(db, "users", user.uid), {
      currentGoal: newGoal,
      lastRun: null,
    });
    setCurrentGoal(newGoal);
    setNewGoal("");
  };

  const handleConfirmRun = async () => {
    if (!currentGoal) return;
  
    const runDuration = parseInt(currentGoal); // Duration in minutes
  
    // Manually create a timestamp using Firestore's Timestamp
    const runData = {
      date: Timestamp.now(), // Correct way to set timestamp
      duration: runDuration,
    };
  
    try {
      await updateDoc(doc(db, "users", user.uid), {
        history: arrayUnion(runData), // Add the object with Timestamp.now()
        lastRun: Timestamp.now(), // Update 'lastRun' with the same timestamp
      });
  
      setHasRunToday(true);
    } catch (error) {
      console.error("Error confirming today's run:", error.message);
    }
  };
  

  const handleIncrement = async () => {
    const incrementValue = parseInt(incrementAmount);
    if (isNaN(incrementValue) || incrementValue <= 0) return;

    const newGoal = parseInt(currentGoal) + incrementValue;

    await updateDoc(doc(db, "users", user.uid), {
      currentGoal: newGoal.toString(),
    });

    setCurrentGoal(newGoal.toString());
    setIncrementAmount("");
  };

  const handleSignOut = () => {
    signOut(auth);
    navigate("/signin");
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <header className="bg-blue-600 text-white py-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center px-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="bg-white text-blue-600 px-4 py-1 rounded-lg hover:bg-gray-200"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome, {user?.email || "User"}!
          </h2>
          <p className="text-gray-600">
            Let’s keep pushing your goals, one step at a time.
          </p>
        </div>

        {/* Goal Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {!currentGoal ? (
            <form onSubmit={handleSetGoal} className="flex flex-col items-center">
              <h3 className="text-2xl font-semibold mb-4 text-gray-800">
                Set Your Initial Running Goal
              </h3>
              <input
                type="number"
                placeholder="Run for (minutes)"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                required
                className="p-2 border rounded w-full mb-4 focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition duration-300"
              >
                Set Goal
              </button>
            </form>
          ) : (
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                Today's Goal:{" "}
                <span className="text-blue-600">{currentGoal} minutes</span>
              </h3>
              {!hasRunToday ? (
                <button
                  onClick={handleConfirmRun}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                >
                  Confirm Today's Run
                </button>
              ) : (
                <div className="mt-4">
                  <p className="text-gray-600 mb-4">Great job! Want to increase your goal?</p>
                  <div className="flex justify-center items-center gap-4">
                    <input
                      type="number"
                      placeholder="Increment by (minutes)"
                      value={incrementAmount}
                      onChange={(e) => setIncrementAmount(e.target.value)}
                      className="p-2 border rounded w-40 focus:ring-2 focus:ring-green-600"
                    />
                    <button
                      onClick={handleIncrement}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
                    >
                      Increment Goal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* View History Button */}
        <div className="text-center">
          <button
            onClick={() => navigate("/history")}
            className="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition duration-300"
          >
            View Run History
          </button>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;

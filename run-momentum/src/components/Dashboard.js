import React, { useEffect, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
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
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(""); // State for AI-generated feedback
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

  const handleGenerateFeedback = async () => {
    setIsLoading(true);
    try {
      const functions = getFunctions();
      const generateFeedback = httpsCallable(functions, "generateFeedback");
      const idToken = await user.getIdToken();

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const history = userDoc.data()?.history || [];
      console.log("History:", history);

      const result = await generateFeedback({ history, token: idToken });
      setFeedback(result.data.feedback); // Display feedback
    } catch (error) {
      console.error("Error generating feedback:", error.message);
      setFeedback("Failed to generate feedback. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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

        <div className="text-center mt-6">
          <button
            onClick={handleGenerateFeedback}
            className={`px-8 py-3 rounded-full font-bold text-lg transition-transform duration-300 ${
              isLoading
                ? "bg-gradient-to-r from-gray-400 to-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:scale-105 shadow-lg"
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="animate-pulse">Generating Feedback...</span>
            ) : (
              "Get Feedback"
            )}
          </button>

          {feedback && (
            <div className="mt-6 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-6 rounded-lg shadow-xl">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">Your Feedback</h3>
              <p className="text-gray-700 leading-relaxed">{feedback}</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default Dashboard;

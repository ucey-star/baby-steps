import React, { useEffect, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
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
  const [streak, setStreak] = useState(0);
  const [hasRunToday, setHasRunToday] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const navigate = useNavigate();

  const user = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setCurrentGoal(data.currentGoal);
          setStreak(data.streak || 0);

          const today = new Date().toDateString();
          if (data.lastRun) {
            const lastRun = data.lastRun.toDate().toDateString();
            setHasRunToday(lastRun === today);
          }
        } else {
          await setDoc(userRef, {
            currentGoal: "",
            history: [],
            lastRun: null,
            streak: 0,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error.message);
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

      const result = await generateFeedback({ history, token: idToken });
      setFeedback(result.data.feedback);
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

    try {
      await updateDoc(doc(db, "users", user.uid), {
        currentGoal: newGoal,
        lastRun: null,
      });
      setCurrentGoal(newGoal);
      setNewGoal("");
    } catch (error) {
      console.error("Error setting new goal:", error.message);
    }
  };

  const handleConfirmRun = async () => {
    if (!currentGoal) return;

    const runDuration = parseInt(currentGoal);

    const runData = {
      date: Timestamp.now(),
      duration: runDuration,
    };

    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const data = userDoc.data();

      const lastRunDate = data.lastRun?.toDate();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const newStreak =
        lastRunDate?.toDateString() === yesterday.toDateString()
          ? (data.streak || 0) + 1
          : 1;

      await updateDoc(userRef, {
        history: arrayUnion(runData),
        lastRun: Timestamp.now(),
        streak: newStreak,
      });

      setHasRunToday(true);
      setStreak(newStreak);
    } catch (error) {
      console.error("Error confirming today's run:", error.message);
    }
  };

  const handleIncrement = async () => {
    const incrementValue = parseInt(incrementAmount);
    if (isNaN(incrementValue) || incrementValue <= 0) return;

    const newGoalValue = parseInt(currentGoal) + incrementValue;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        currentGoal: newGoalValue.toString(),
      });
      setCurrentGoal(newGoalValue.toString());
      setIncrementAmount("");
    } catch (error) {
      console.error("Error incrementing goal:", error.message);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
    navigate("/signin");
  };

  return (
    <div className="bg-gradient-to-b from-white to-gray-100 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-md py-4">
        <div className="container mx-auto flex justify-between items-center px-4">
          <h1 className="text-3xl font-extrabold text-gray-800">
            Baby Steps Dashboard
          </h1>
          <button
            onClick={handleSignOut}
            className="bg-red-500 text-white px-5 py-2 rounded-full hover:bg-red-600 transition-colors duration-300"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <section className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-800 mb-4">
            Welcome, {user?.email || "User"}!
          </h2>
          <p className="text-xl text-gray-600">
            Empowering your journey, one step at a time.
          </p>
        </section>

        {/* Streak & Badge Section */}
        <section className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Streak Card */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-3xl font-semibold text-gray-800 mb-6">
              Your Current Streak
            </h3>
            <div className="flex items-center justify-center mb-4">
              <span className="text-7xl font-bold text-blue-600 mr-2">
                {streak}
              </span>
              <span className="text-2xl text-gray-700">days</span>
            </div>
            {streak === 1 && (
              <div className="text-center">
                <div className="inline-block bg-yellow-400 text-white px-6 py-3 rounded-full shadow-md mb-2">
                  🏅 First Step Badge Earned!
                </div>
                <p className="text-gray-600">
                  Congratulations on starting your journey!
                </p>
              </div>
            )}
          </div>

          {/* Feedback Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-3xl font-semibold text-gray-800 mb-6">
                Personalized Feedback
              </h3>
              <p className="text-gray-600 mb-6">
                Get insights and tips based on your running history.
              </p>
            </div>
            <button
              onClick={handleGenerateFeedback}
              className={`w-full py-3 rounded-full text-white font-bold text-lg transition-transform duration-300 ${
                isLoading
                  ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:scale-105 shadow-lg"
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="animate-pulse">Generating Feedback...</span>
              ) : (
                "Get Feedback"
              )}
            </button>
          </div>
        </section>

        {/* Feedback Display */}
        {feedback && (
          <section className="mb-12">
            <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-8 rounded-xl shadow-xl">
              <h3 className="text-3xl font-semibold text-gray-800 mb-4">
                Your Feedback
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                {feedback}
              </p>
            </div>
          </section>
        )}

        {/* Goal Section */}
        <section className="bg-white rounded-xl shadow-lg p-8 mb-12">
          {!currentGoal ? (
            <form
              onSubmit={handleSetGoal}
              className="flex flex-col items-center"
            >
              <h3 className="text-3xl font-semibold text-gray-800 mb-6">
                Set Your Initial Running Goal
              </h3>
              <input
                type="number"
                placeholder="Run for (minutes)"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                required
                className="p-4 border rounded-full w-full mb-6 focus:ring-4 focus:ring-blue-200 text-center text-xl"
              />
              <button
                type="submit"
                className="bg-green-500 text-white px-8 py-3 rounded-full text-lg font-bold hover:bg-green-600 transition-colors duration-300"
              >
                Set Goal
              </button>
            </form>
          ) : (
            <div className="text-center">
              <h3 className="text-3xl font-semibold text-gray-800 mb-6">
                Today's Goal:{" "}
                <span className="text-blue-600">{currentGoal} minutes</span>
              </h3>
              {!hasRunToday ? (
                <button
                  onClick={handleConfirmRun}
                  className="bg-blue-500 text-white px-8 py-3 rounded-full text-lg font-bold hover:bg-blue-600 transition-colors duration-300"
                >
                  Confirm Today's Run
                </button>
              ) : (
                <div className="mt-8">
                  <p className="text-gray-600 text-lg mb-6">
                    Fantastic work! Ready to challenge yourself further?
                  </p>
                  <div className="flex justify-center items-center gap-4">
                    <input
                      type="number"
                      placeholder="Increase by (minutes)"
                      value={incrementAmount}
                      onChange={(e) => setIncrementAmount(e.target.value)}
                      className="p-4 border rounded-full w-48 focus:ring-4 focus:ring-green-200 text-center text-xl"
                    />
                    <button
                      onClick={handleIncrement}
                      className="bg-green-500 text-white px-6 py-3 rounded-full text-lg font-bold hover:bg-green-600 transition-colors duration-300"
                    >
                      Increment Goal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <section className="flex flex-col md:flex-row justify-center items-center gap-6">
          <button
            onClick={() => navigate("/history")}
            className="bg-gray-800 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-900 transition-colors duration-300"
          >
            View Run History
          </button>
          <button
            onClick={() =>
              window.location.href =
                "mailto:support@babysteps.com?subject=Support Request&body=Hi Support Team,"
            }
            className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-blue-700 transition-colors duration-300"
          >
            Message
          </button>
        </section>
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

export default Dashboard;
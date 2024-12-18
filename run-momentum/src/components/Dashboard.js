// src/components/Dashboard.js
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
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
  const [userRunData, setUserRunData] = useState(null);
  const [lastRunDate, setLastRunDate] = useState(null);
  const [hasRunToday, setHasRunToday] = useState(false);
  const navigate = useNavigate();

  const user = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRunData(data);
          setCurrentGoal(data.currentGoal);
          setLastRunDate(data.lastRun?.toDate());

          // Check if user has run today
          const today = new Date();
          if (data.lastRun) {
            const lastRun = data.lastRun.toDate();
            setHasRunToday(
              lastRun.toDateString() === today.toDateString()
            );
          }
        } else {
          // Initialize user data
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

    const runDuration = parseInt(currentGoal); // In seconds
    const runDate = new Date();

    await updateDoc(doc(db, "users", user.uid), {
      history: arrayUnion({
        date: serverTimestamp(),
        duration: runDuration,
      }),
      lastRun: serverTimestamp(),
    });

    setHasRunToday(true);
  };

  const handleIncrement = async () => {
    // Example: Increment by 10 seconds
    const incrementAmount = 10;
    const newGoal = parseInt(currentGoal) + incrementAmount;

    await updateDoc(doc(db, "users", user.uid), {
      currentGoal: newGoal.toString(),
    });

    setCurrentGoal(newGoal.toString());
  };

  const handleSignOut = () => {
    signOut(auth);
    navigate("/signin");
  };

  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl">Dashboard</h1>
        <button onClick={handleSignOut} className="text-red-500">
          Sign Out
        </button>
      </header>

      {!currentGoal ? (
        <form onSubmit={handleSetGoal} className="flex flex-col w-80">
          <h2 className="text-xl mb-2">Set Your Initial Running Goal</h2>
          <input
            type="number"
            placeholder="Run for (seconds)"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            required
            className="p-2 mb-2 border"
          />
          <button type="submit" className="p-2 bg-green-500 text-white">
            Set Goal
          </button>
        </form>
      ) : (
        <div>
          <h2 className="text-xl mb-2">
            Today's Goal: {currentGoal} seconds
          </h2>

          {!hasRunToday ? (
            <button
              onClick={handleConfirmRun}
              className="p-2 bg-blue-500 text-white"
            >
              Confirm Today's Run
            </button>
          ) : (
            <div className="mt-4">
              <p className="mb-2">Great job! Ready to increase your goal?</p>
              <button
                onClick={handleIncrement}
                className="p-2 bg-green-500 text-white"
              >
                Increment Goal by 10 Seconds
              </button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => navigate("/history")}
        className="mt-4 p-2 bg-gray-500 text-white"
      >
        View History
      </button>
    </div>
  );
}

export default Dashboard;

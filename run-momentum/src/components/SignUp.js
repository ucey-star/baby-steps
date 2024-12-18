// src/components/SignUp.js
import React, { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-2xl mb-4">Sign Up</h2>
      <form onSubmit={handleSignUp} className="flex flex-col w-80">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="p-2 mb-2 border"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="p-2 mb-2 border"
        />
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" className="p-2 bg-blue-500 text-white">
          Sign Up
        </button>
      </form>
      <p className="mt-4">
        Already have an account? <Link to="/signin" className="text-blue-500">Sign In</Link>
      </p>
    </div>
  );
}

export default SignUp;

import React from "react";
import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <header className="bg-blue-600 text-white py-4">
        <div className="container mx-auto flex justify-between items-center px-4">
          <h1 className="text-3xl font-bold">Baby Steps</h1>
          <nav>
            <Link to="/signin" className="mr-4 hover:underline">
              Sign In
            </Link>
            <Link to="/signup" className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-200">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between container mx-auto px-4 py-20">
        <div className="md:w-1/2">
          <h2 className="text-5xl font-bold mb-6 text-gray-800">
            Start Your Journey, One Step at a Time
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Baby Steps helps you take the first step towards building healthy habits with small, achievable goals.
          </p>
          <Link
            to="/signup"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Get Started
          </Link>
        </div>
        <div className="md:w-1/2 mt-10 md:mt-0">
          <img
            src="/running.jpg" 
            alt="Running"
            className="rounded-lg shadow-lg w-full"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-gray-800 mb-12">Why Baby Steps?</h3>
          <div className="flex flex-wrap justify-center gap-8">
            <FeatureCard
              title="Small, Achievable Goals"
              description="Set the smallest goals, like running for 30 seconds, and build your momentum step by step."
              icon="⏳"
            />
            <FeatureCard
              title="Track Your Progress"
              description="Track your history and see how far you've come with simple progress tracking."
              icon="📊"
            />
            <FeatureCard
              title="Daily Motivation"
              description="Receive reminders to stay consistent and keep improving every single day."
              icon="🔔"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-600 text-white py-4">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} Baby Steps. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon }) {
  return (
    <div className="w-64 p-6 bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition duration-300">
      <div className="text-5xl mb-4">{icon}</div>
      <h4 className="text-xl font-bold text-gray-800 mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default LandingPage;

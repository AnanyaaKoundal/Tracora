// app/page.tsx
"use client";

import Footer from "@/components/Footer/Footer";
import Navbar from "@/components/Navbar/LandingPageNavbar";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main>
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 bg-gray-100">
        <h1 className="text-5xl font-bold mb-6">
          Simplify Your Bug Tracking
        </h1>
        <p className="text-lg text-gray-600 mb-6 max-w-xl">
          Tracora helps development teams to report, track, and resolve bugs efficiently.
        </p>
        <Link href="/signup">
          <button className="px-6 py-3 bg-indigo-600 text-white text-lg rounded hover:bg-indigo-700">
            Get Started
          </button>
        </Link>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-8">
        <h2 className="text-3xl font-bold mb-4">About Tracora</h2>
        <p className="text-gray-700 max-w-3xl">
          Tracora is a modern bug tracking platform designed for fast-moving software teams.
          With intuitive interfaces and powerful features, it lets you manage your entire bug lifecycle in one place.
        </p>
      </section>

      {/* Details Section */}
      <section id="details" className="py-16 px-8 bg-gray-50">
        <h2 className="text-3xl font-bold mb-4">Details</h2>
        <ul className="list-disc ml-6 text-gray-700">
          <li>Project & Feature-based Bug Tracking</li>
          <li>Role-based Access Control</li>
          <li>Real-time Notifications</li>
          <li>Comment System & Attachments</li>
        </ul>
      </section>

      {/* Use Section */}
      <section id="use" className="py-16 px-8">
        <h2 className="text-3xl font-bold mb-4">How to Use</h2>
        <p className="text-gray-700 max-w-3xl">
          Sign up → Create projects → Add features → Report bugs → Assign & Track progress → Collaborate & Resolve.
        </p>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 px-8 bg-gray-100">
        <h2 className="text-3xl font-bold mb-4">Contact</h2>
        <p className="text-gray-700 max-w-3xl">
          Have questions? Reach out to us at <a className="text-indigo-600" href="mailto:support@tracora.com">support@tracora.com</a>
        </p>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}

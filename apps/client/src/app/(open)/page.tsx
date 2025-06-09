// app/page.tsx
"use client";

import Footer from "@/components/Footer/Footer";
import CrawlingBugs from "@/components/LandingPage/CrawlingBugs";
import HeroSection from "@/components/LandingPage/HeroSection";
import Navbar from "@/components/LandingPage/Navbar";
import Waves from "@/components/LandingPage/Waves";
import Link from "next/link";

export default function LandingPage() {
    return (
        <main>
            <div className="relative overflow-hidden bg-white ">

                {/* Animated Waves */}
                <Waves />

                {/* Navbar */}
                <Navbar />

                {/* Hero Section */}
                <HeroSection />

                <CrawlingBugs />
            </div>

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

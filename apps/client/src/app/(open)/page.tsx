"use client";

import Footer from "@/components/Footer/Footer";
import HeroSection from "@/components/LandingPage/HeroSection";
import Navbar from "@/components/LandingPage/Navbar";
import Features from "@/components/LandingPage/Features";
import HowItWorks from "@/components/LandingPage/HowItWorks";
import DashboardPreview from "@/components/LandingPage/DashboardPreview";
import StatsSection from "@/components/LandingPage/StatsSection";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <Features />
      <DashboardPreview />
      <HowItWorks />
      <Footer />
    </main>
  );
}

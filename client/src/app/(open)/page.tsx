"use client";

import Footer from "@/components/Footer/Footer";
import HeroSection from "@/components/LandingPage/HeroSection";
import Navbar from "@/components/LandingPage/Navbar";
import Features from "@/components/LandingPage/Features";
import HowItWorks from "@/components/LandingPage/HowItWorks";
import DashboardPreview from "@/components/LandingPage/DashboardPreview";
import BenefitsSection from "@/components/LandingPage/BenefitsSection";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Navbar />
      <HeroSection />
      <BenefitsSection />
      <Features />
      <DashboardPreview />
      <HowItWorks />
      <Footer />
    </main>
  );
}

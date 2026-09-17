import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import IntroSection from '../components/IntroSection';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import MultilingualSection from '../components/MultilingualSection';
import TrackingPreview from '../components/TrackingPreview';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-gov-100 selection:text-gov-900">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <IntroSection />
        <HowItWorks />
        <Features />
        <MultilingualSection />
        <TrackingPreview />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}


import React from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import DoorGame from '@/components/DoorGame';
import DrunkDaveSection from '@/components/DrunkDaveSection';
import CSSDrawingsSection from '@/components/CSSDrawingsSection';
import TumetSection from '@/components/HobbiesSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-secondary">
      <Header />
      
      <main>
        <HeroSection />
        <DoorGame />
        <CSSDrawingsSection />
        <DrunkDaveSection />
        <TumetSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;

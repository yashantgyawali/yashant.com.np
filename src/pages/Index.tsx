
import React from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import DoorGame from '@/components/DoorGame';
import DrunkDaveSection from '@/components/DrunkDaveSection';
import CSSDrawingsSection from '@/components/CSSDrawingsSection';
import TumetSection from '@/components/HobbiesSection';
import Footer from '@/components/Footer';
import PacmanEasterEgg from '@/components/PacmanEasterEgg';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <HeroSection />
        <DoorGame />
        <DrunkDaveSection />
        <CSSDrawingsSection />
        <TumetSection />
      </main>
      
      <Footer />
      <PacmanEasterEgg />
    </div>
  );
};

export default Index;

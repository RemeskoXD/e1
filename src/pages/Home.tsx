import React from 'react';
import Hero from '../components/Hero';
import Benefits from '../components/Benefits';
import Categories from '../components/Categories';
import FeaturedProducts from '../components/FeaturedProducts';
import HowItWorks from '../components/HowItWorks';

export default function Home() {
  return (
    <div className="flex-grow">
      <Hero />
      <Benefits />
      <Categories />
      <HowItWorks />
      <FeaturedProducts />
    </div>
  );
}

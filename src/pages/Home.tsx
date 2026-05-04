import React from 'react';
import Hero from '../components/Hero';
import Benefits from '../components/Benefits';
import Categories from '../components/Categories';
import FeaturedProducts from '../components/FeaturedProducts';
import HowItWorks from '../components/HowItWorks';
import { Helmet } from 'react-helmet-async';

export default function Home() {
  return (
    <div className="flex-grow">
      <Helmet>
        <title>Qapi.cz - Spolehlivý obchod se sítěmi</title>
        <meta name="description" content="Na Qapi.cz najdete kvalitní sítě proti hmyzu a rolety s možností konfigurace na míru." />
      </Helmet>
      <Hero />
      <Benefits />
      <Categories />
      <HowItWorks />
      <FeaturedProducts />
    </div>
  );
}

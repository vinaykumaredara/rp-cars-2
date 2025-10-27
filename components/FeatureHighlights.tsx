
import React from 'react';
import { FEATURES_DATA } from '../constants';
import type { Feature } from '../types';

const FeatureCard: React.FC<{ feature: Feature }> = ({ feature }) => (
    <div className="bg-white p-6 rounded-lg shadow-md text-center transform hover:scale-105 transition-transform duration-300">
        <div className="inline-block p-4 bg-indigo-100 rounded-full mb-4">
            <feature.icon className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
        <p className="text-gray-600">{feature.description}</p>
    </div>
);

const FeatureHighlights: React.FC = () => {
  return (
    <section id="features" className="py-16 lg:py-24 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">Why Choose RP Cars?</h2>
          <p className="text-lg text-gray-600 mt-2">We provide a premium experience with every booking.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES_DATA.map(feature => (
                <FeatureCard key={feature.title} feature={feature} />
            ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureHighlights;
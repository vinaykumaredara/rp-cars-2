import React from 'react';
import { STATS_DATA } from '../constants';
import type { Stat } from '../types';

const StatCard: React.FC<{ stat: Stat }> = ({ stat }) => (
    <div className="text-center">
        <p className="text-4xl lg:text-5xl font-bold text-primary">{stat.value}</p>
        <p className="text-lg text-gray-600 mt-2">{stat.label}</p>
    </div>
);

const Statistics: React.FC = () => {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS_DATA.map(stat => (
                <StatCard key={stat.label} stat={stat} />
            ))}
        </div>
      </div>
    </section>
  );
};

export default Statistics;
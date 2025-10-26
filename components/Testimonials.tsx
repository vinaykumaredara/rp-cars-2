
import React from 'react';
import { TESTIMONIALS_DATA } from '../constants';
import type { Testimonial } from '../types';

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => (
    <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col h-full">
        <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-primary-blue text-white flex items-center justify-center font-bold text-xl mr-4">
                {testimonial.initials}
            </div>
            <div>
                <p className="font-bold text-neutral-charcoal">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.location}</p>
            </div>
        </div>
        <p className="text-gray-600 italic flex-grow">"{testimonial.quote}"</p>
    </div>
);

const Testimonials: React.FC = () => {
  return (
    <section className="py-16 lg:py-24 bg-neutral-lightgrey">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-charcoal">What Our Customers Say</h2>
          <p className="text-lg text-gray-600 mt-2">Real stories from our satisfied clients.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TESTIMONIALS_DATA.map(testimonial => (
                <TestimonialCard key={testimonial.name} testimonial={testimonial} />
            ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

import React from 'react';

const CTA: React.FC = () => {
  return (
    <section className="bg-primary text-white">
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Experience Premium?</h2>
        <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
          Don't wait any longer. Find the perfect car for your next adventure and enjoy the best car service in town.
        </p>
        <div className="flex justify-center space-x-4">
          <a href="#cars" className="px-8 py-3 rounded-lg bg-white text-primary font-semibold hover:bg-gray-100 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
            Start Your Journey
          </a>
          <a href="#features" className="px-8 py-3 rounded-lg bg-transparent border-2 border-white text-white font-semibold hover:bg-white hover:text-primary transition-all duration-300">
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTA;
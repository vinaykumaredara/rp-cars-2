import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 pt-16 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
              Premium Car Experience
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Discover our fleet of high-quality cars for a seamless and comfortable journey. Unmatched service, available 24/7.
            </p>
            <div className="flex justify-center lg:justify-start space-x-4">
              <a href="#cars" className="px-8 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Browse Cars
              </a>
            </div>
          </div>
          <div>
            <img src="https://picsum.photos/600/400?random=hero" alt="Luxury car" className="rounded-lg shadow-2xl w-full h-auto object-cover"/>
          </div>
        </div>
        <div className="mt-16 bg-muted p-6 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center">
                    <span className="text-lg font-semibold text-foreground">Trusted Platform</span>
                    <span className="text-sm text-gray-500">Secure & Reliable</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-lg font-semibold text-foreground">24/7 Support</span>
                    <span className="text-sm text-gray-500">Always here to help</span>
                </div>
                <div className="flex flex-col items-center">
                    <div className="flex items-center">
                        <span className="text-lg font-semibold text-foreground mr-2">4.9 Rating</span>
                        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    </div>
                     <span className="text-sm text-gray-500">Based on customer reviews</span>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(Hero);
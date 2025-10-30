import React from 'react';

const CarCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col animate-pulse">
      {/* Image Placeholder */}
      <div className="w-full h-56 bg-gray-300"></div>

      <div className="p-6 flex-grow flex flex-col">
        {/* Title Placeholder */}
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
        
        {/* Specs Placeholder */}
        <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-600 mb-4 border-t border-b border-gray-100 py-4">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="h-4 bg-gray-300 rounded w-12"></div>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="h-4 bg-gray-300 rounded w-16"></div>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="h-4 bg-gray-300 rounded w-20"></div>
          </div>
        </div>
        
        {/* Price and Button Placeholder */}
        <div className="mt-auto flex justify-between items-center">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="h-10 bg-primary/50 rounded-lg w-1/4"></div>
        </div>
      </div>
    </div>
  );
};

export default CarCardSkeleton;

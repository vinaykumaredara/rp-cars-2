
import React from 'react';

interface AdminCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status?: React.ReactNode;
  onClick?: () => void;
}

const AdminCard: React.FC<AdminCardProps> = ({ icon, title, description, status, onClick }) => {
  const cardClasses = `bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-300 flex flex-col ${onClick ? 'cursor-pointer' : ''}`;
  
  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="flex items-center mb-4">
        {icon}
        <h3 className="text-xl font-bold text-foreground ml-4">{title}</h3>
      </div>
      <p className="text-gray-600 flex-grow mb-4">{description}</p>
      {status && (
        <div className="text-sm text-gray-500 mt-auto pt-4 border-t border-gray-100">
          {status}
        </div>
      )}
    </div>
  );
};

export default AdminCard;
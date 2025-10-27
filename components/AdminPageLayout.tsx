import React from 'react';

interface AdminPageLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode; 
}

const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({ title, subtitle, children, headerAction }) => {
  const handleBack = () => {
    window.location.hash = '#/admin';
  };

  return (
    <div className="bg-muted min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <button 
            onClick={handleBack} 
            className="text-primary hover:underline mb-4 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            Back to Dashboard
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{title}</h1>
              <p className="text-gray-500">{subtitle}</p>
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        </header>

        <main>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminPageLayout;

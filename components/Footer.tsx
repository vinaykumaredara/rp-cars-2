import React, { useCallback } from 'react';

const Footer: React.FC = () => {
  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute('href');
    if (!targetId || targetId === '#') return; // Ignore empty or top-of-page links

    const element = document.querySelector(targetId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      // The history.pushState call has been removed to prevent SecurityErrors in sandboxed environments.
    } else {
      window.location.hash = targetId;
    }
  }, []);

  return (
    <footer id="contact" className="bg-foreground text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Brand & Social */}
          <div>
            <h3 className="text-2xl font-bold mb-4">RP CARS</h3>
            <p className="text-gray-400 mb-4">Your premium car experience starts here. Quality, comfort, and reliability guaranteed.</p>
            {/* Social Icons would go here */}
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#cars" onClick={handleSmoothScroll} className="text-gray-400 hover:text-white transition-colors">Browse Cars</a></li>
              <li><a href="#features" onClick={handleSmoothScroll} className="text-gray-400 hover:text-white transition-colors">Features</a></li>
              <li><a href="#testimonials" onClick={handleSmoothScroll} className="text-gray-400 hover:text-white transition-colors">Testimonials</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQs</a></li>
            </ul>
          </div>

          {/* Column 3: Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Self-Drive Cars</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Airport Transfers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Corporate Bookings</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Wedding Cars</a></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start"><span className="mr-2 mt-1">📍</span><span>123 Road, Hyderabad, Telangana, India</span></li>
              <li className="flex items-start"><span className="mr-2 mt-1">📧</span><span>contact@rpcars.info</span></li>
              <li className="flex items-start"><span className="mr-2 mt-1">📞</span><span>+91 8897072640</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 mt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} RP Cars. All Rights Reserved.</p>
          <div className="mt-2">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <span className="mx-2">|</span>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <span className="mx-2">|</span>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
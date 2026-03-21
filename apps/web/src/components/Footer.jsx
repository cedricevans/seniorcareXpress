import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-200 pt-20 pb-10 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <img 
              src="https://horizons-cdn.hostinger.com/0f92c1a5-75e3-4878-84c5-4c29eda99ea0/6cf179a531307fd05365d487c05a8a26.png" 
              alt="SeniorCare Xpress Logo" 
              className="h-14 w-auto object-contain brightness-0 invert"
            />
            <p className="text-slate-400 leading-relaxed max-w-xs">
              Providing compassionate, professional senior care with modern technology to keep families connected and informed.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-300 hover:bg-secondary hover:text-secondary-foreground transition-all duration-300">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-300 hover:bg-secondary hover:text-secondary-foreground transition-all duration-300">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-300 hover:bg-secondary hover:text-secondary-foreground transition-all duration-300">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-heading font-semibold text-white text-xl mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li><Link to="/" className="text-slate-400 hover:text-secondary transition-colors">Home</Link></li>
              <li><Link to="/services" className="text-slate-400 hover:text-secondary transition-colors">Services</Link></li>
              <li><Link to="/about" className="text-slate-400 hover:text-secondary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-secondary transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-heading font-semibold text-white text-xl mb-6">Portal Access</h3>
            <ul className="space-y-4">
              <li><Link to="/login" className="text-secondary font-medium hover:text-white transition-colors flex items-center gap-2">
                Care Portal Login <span className="text-lg">→</span>
              </Link></li>
              <li><span className="text-slate-400">Family Dashboard</span></li>
              <li><span className="text-slate-400">Caregiver Portal</span></li>
              <li><span className="text-slate-400">Admin Access</span></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-white text-xl mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-400">
                <MapPin className="h-5 w-5 mt-0.5 shrink-0 text-secondary" />
                <span>123 Care Avenue, Suite 100<br/>Wellness City, ST 12345</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Phone className="h-5 w-5 shrink-0 text-secondary" />
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Mail className="h-5 w-5 shrink-0 text-secondary" />
                <span>hello@seniorcarexpress.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} SeniorCare Xpress. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
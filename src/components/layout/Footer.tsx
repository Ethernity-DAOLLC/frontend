import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import logo from '@/assets/images/logo.svg';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-8 px-4 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg p-1.5 flex items-center justify-center">
                <img 
                  src={logo} 
                  alt="Ethernity DAO Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold">Ethernity</span>
            </div>
            <p className="text-gray-400 text-sm">
              Secure your financial future with blockchain-powered retirement savings.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-yellow-400 transition text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/calculator" className="text-gray-400 hover:text-yellow-400 transition text-sm">
                  Calculator
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-400 hover:text-yellow-400 transition text-sm">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-yellow-400 transition text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Connect With Us</h3>
            <div className="flex gap-4 mb-4">
              <a
                href="https://github.com/ethernity-dao"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-green-600 transition"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
              <a
                href="https://twitter.com/ethernity_dao"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-green-600 transition"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-green-600 transition"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="mailto:contact@ethernity.io"
                className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-green-600 transition"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
            </div>
            <p className="text-gray-400 text-sm">
              contact@ethernity.io
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 my-6"></div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm text-center md:text-left">
            &copy; {currentYear} Ethernity DAO Foundation - All Rights Reserved
          </p>

          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link
              to="/privacy"
              className="text-yellow-400 hover:text-yellow-300 transition text-sm"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link
              to="/terms"
              className="text-yellow-400 hover:text-yellow-300 transition text-sm"
            >
              Terms of Service
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link
              to="/disclaimer"
              className="text-yellow-400 hover:text-yellow-300 transition text-sm"
            >
              Disclaimer
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Built on Arbitrum Sepolia • Secured by Blockchain Technology
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
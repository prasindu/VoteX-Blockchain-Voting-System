import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const linkClasses = (path) =>
    `hover:text-yellow-300 transition duration-300 ${
      location.pathname === path ? 'text-yellow-300 font-semibold' : ''
    }`;

  return (
    <nav className="bg-blue-600 text-white shadow-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-wide">MyApp</div>

        {/* Hamburger Menu */}
        <div className="md:hidden">
          <button onClick={toggleMenu} className="focus:outline-none transition duration-300">
            {isOpen ? <FaTimes size={26} /> : <FaBars size={26} />}
          </button>
        </div>

        {/* Desktop Links */}
        <ul className="hidden md:flex space-x-8 text-lg items-center">
          <li><Link to="/" className={linkClasses('/')}>Home</Link></li>
          <li><Link to="/admin" className={linkClasses('/admin')}>Admin</Link></li>
          <li><Link to="/vote" className={linkClasses('/vote')}>Vote</Link></li>
          <li><Link to="/results" className={linkClasses('/results')}>Results</Link></li>
          <li><Link to="/chatbot" className={linkClasses('/chatbot')}>Chatbot</Link></li>
        </ul>
      </div>

      {/* Mobile Menu with Slide Down Animation */}
      <div
        className={`md:hidden bg-blue-600 transition-all duration-300 overflow-hidden ${
          isOpen ? 'max-h-60 py-4' : 'max-h-0'
        }`}
      >
        <ul className="flex flex-col space-y-4 px-6 text-lg">
          <li><Link to="/" className={linkClasses('/')} onClick={toggleMenu}>Home</Link></li>
          <li><Link to="/admin" className={linkClasses('/admin')} onClick={toggleMenu}>Admin</Link></li>
          <li><Link to="/vote" className={linkClasses('/vote')} onClick={toggleMenu}>Vote</Link></li>
          <li><Link to="/results" className={linkClasses('/results')} onClick={toggleMenu}>Results</Link></li>
          <li><Link to="/chatbot" className={linkClasses('/chatbot')} onClick={toggleMenu}>Chatbot</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

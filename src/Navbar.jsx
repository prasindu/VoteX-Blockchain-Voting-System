import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaCheck, FaChartBar, FaUserShield, FaHome, FaRocket } from 'react-icons/fa';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHover, setActiveHover] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navItems = [
    { path: '/', label: 'Home', icon: FaHome },
    { path: '/admin', label: 'Election', icon: FaUserShield },
    { path: '/vote', label: 'Vote', icon: FaCheck },
    { path: '/results', label: 'Results', icon: FaChartBar }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Glassmorphism Navigation */}
      <nav className={`fixed w-full z-50  transition-all duration-500 ${
        scrolled 
          ? 'bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-xl' 
          : 'bg-white/20 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex justify-between items-center">
            
            {/* Animated Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <FaRocket className="text-3xl text-white transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-20 blur-md transition-all duration-300"></div>
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent tracking-wider">
                VoteX
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative group px-6 py-3 rounded-2xl transition-all duration-300"
                    onMouseEnter={() => setActiveHover(item.path)}
                    onMouseLeave={() => setActiveHover(null)}
                  >
                    <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-yellow-400/30 to-orange-500/30 shadow-lg shadow-yellow-400/20'
                        : activeHover === item.path
                        ? 'bg-white/20 shadow-lg shadow-white/10'
                        : 'bg-transparent'
                    }`}></div>
                    
                    <div className="relative flex items-center space-x-2">
                      <Icon className={`text-lg transition-all duration-300 ${
                        isActive(item.path) || activeHover === item.path
                          ? 'text-yellow-300 transform scale-110'
                          : 'text-white/80'
                      }`} />
                      <span className={`font-semibold transition-all duration-300 ${
                        isActive(item.path)
                          ? 'text-yellow-300'
                          : activeHover === item.path
                          ? 'text-white'
                          : 'text-white/90'
                      }`}>
                        {item.label}
                      </span>
                    </div>

                    {/* Active indicator */}
                    {isActive(item.path) && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden relative w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group transition-all duration-300 hover:bg-white/30"
            >
              <div className="relative">
                {isOpen ? (
                  <FaTimes className="text-white text-xl transform rotate-0 group-hover:rotate-90 transition-all duration-300" />
                ) : (
                  <FaBars className="text-white text-xl group-hover:scale-110 transition-all duration-300" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu with Advanced Animations */}
        <div className={`md:hidden overflow-hidden transition-all duration-500 ease-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-gradient-to-br from-indigo-900/95 via-purple-900/95 to-pink-900/95 backdrop-blur-xl border-t border-white/10">
            <div className="px-6 py-6 space-y-2">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={toggleMenu}
                    className="group relative block w-full text-left"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/30'
                        : 'hover:bg-white/10 border border-transparent'
                    }`}>
                      <div className={`p-2 rounded-xl transition-all duration-300 ${
                        isActive(item.path)
                          ? 'bg-yellow-400/20 text-yellow-300'
                          : 'bg-white/10 text-white/70 group-hover:text-white group-hover:bg-white/20'
                      }`}>
                        <Icon className="text-lg" />
                      </div>
                      <span className={`font-semibold text-lg transition-all duration-300 ${
                        isActive(item.path)
                          ? 'text-yellow-300'
                          : 'text-white/90 group-hover:text-white'
                      }`}>
                        {item.label}
                      </span>
                      {isActive(item.path) && (
                        <div className="ml-auto w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Floating Navigation Dots */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 hidden xl:block">
        <div className="flex flex-col space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="group relative"
              title={item.label}
            >
              <div className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                isActive(item.path)
                  ? 'bg-yellow-400 border-yellow-400 shadow-lg shadow-yellow-400/50'
                  : 'bg-transparent border-white/40 hover:border-white hover:bg-white/20'
              }`}></div>
              <div className="absolute right-6 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-black/80 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Background Particle Effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/10 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          ></div>
        ))}
      </div>
    </>
  );
};

export default Navbar;
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Preloader from '../src/Preloader';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Vote from './pages/Vote';
import Results from './pages/Results';
import Chatbot from './pages/Chatbot';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000); // 3 seconds
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Preloader />;
  }

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/vote" element={<Vote />} />
        <Route path="/results" element={<Results />} />
        <Route path="/chatbot" element={<Chatbot />} />

      </Routes>
    </Router>
  );
}

export default App;

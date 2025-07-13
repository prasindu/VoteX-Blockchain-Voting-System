import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useElectionStore from '../../store/useElectionStore';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, BarChart3, PieChart as PieChartIcon, Users, Trophy, ArrowLeft, Eye, Calendar, Award, TrendingUp, Filter, Search, Share, Star, Minimize2, Maximize2 } from 'lucide-react'; // Added Minimize2, Maximize2 for chat minimize
import { getIPFSURL } from '../ipfs';
import * as XLSX from 'xlsx';


function Results() {
  const {
    contract,
    walletAddress: account,
    connectWallet,
  } = useElectionStore();

  const navigate = useNavigate();

  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showElectionView, setShowElectionView] = useState(false);
  const [chartType, setChartType] = useState('bar');
  const [searchTerm, setSearchTerm] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [electionSummary, setElectionSummary] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Your existing color palette
  const COLORS = [
    '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
    '#10B981', '#06B6D4', '#84CC16', '#F97316', '#6B7280'
  ];

  const GRADIENT_COLORS = [
    'from-indigo-500 to-purple-600',
    'from-purple-500 to-pink-600',
    'from-pink-500 to-rose-600',
    'from-red-500 to-orange-600',
    'from-amber-500 to-yellow-600',
    'from-emerald-500 to-green-600',
    'from-cyan-500 to-blue-600',
    'from-lime-500 to-green-600',
    'from-orange-500 to-red-600',
    'from-gray-500 to-slate-600'
  ];

  useEffect(() => {
    connectWallet();
  }, []);

  useEffect(() => {
    fetchElections();
  }, [contract, account]);

  // Helper function to safely get total votes with proper error handling
  const getSafeVoteCount = async (electionId, hasAccess, canViewResults) => {
    if (!hasAccess || !canViewResults) {
      return 0; // Return 0 if no access instead of making the call
    }
    
    try {
      const totalVotes = await contract.getTotalVotes(electionId);
      return Number(totalVotes);
    } catch (error) {
      console.log(`Cannot access vote count for election ${electionId}:`, error.reason || error.message);
      return 0; // Return 0 instead of throwing error
    }
  };

  // Helper function to check user access with better error handling
  const checkUserAccess = async (electionId, electionInfo) => {
    if (!account) return false;
    
    try {
      // Check if user is creator
      if (electionInfo.creator.toLowerCase() === account.toLowerCase()) {
        return true;
      }
      
      // Check if user has voted (only if election allows it)
      try {
        const hasVoted = await contract.hasVoterVoted(electionId, account);
        if (hasVoted) return true;
      } catch (voteError) {
        console.log(`Cannot check voting status for election ${electionId}:`, voteError.reason || voteError.message);
      }
      
      // For public elections, allow access if results are available
      const currentTime = Math.floor(Date.now() / 1000);
      const canViewResults = currentTime > electionInfo.endTime || electionInfo.ended;
      
      return electionInfo.isPublic && canViewResults;
      
    } catch (error) {
      console.log(`Access check failed for election ${electionId}:`, error.reason || error.message);
      return false;
    }
  };



  const fetchElections = async () => {
    if (!contract) return;
    setLoading(true);
    setMessage('');
    
    try {
      const count = Number(await contract.electionCount());
      const list = [];

      for (let i = 0; i < count; i++) {
        try {
          const electionInfo = await contract.getElectionInfo(i);
          const currentTime = Math.floor(Date.now() / 1000);
          const canViewResults = currentTime > electionInfo.endTime || electionInfo.ended;
          
          // Check user access with improved error handling
          const hasAccess = await checkUserAccess(i, electionInfo);
          
          // Only proceed if user has access and can view results
          let totalVotes = 0;
          if (hasAccess && canViewResults) {
            totalVotes = await getSafeVoteCount(i, hasAccess, canViewResults);
          }
          
          // Only add elections where user has access and can view results
          if (hasAccess && canViewResults) {
            list.push({
              id: i,
              name: electionInfo.name,
              imageHash: electionInfo.imageHash,
              startTime: Number(electionInfo.startTime),
              endTime: Number(electionInfo.endTime),
              isPublic: electionInfo.isPublic,
              creator: electionInfo.creator,
              ended: electionInfo.ended,
              candidateCount: Number(electionInfo.candidateCount),
              canViewResults,
              hasAccess,
              totalVotes,
              category: "General" // Default category
            });
          }
        } catch (electionError) {
          console.log(`Error processing election ${i}:`, electionError.reason || electionError.message);
          // Continue to next election instead of failing completely
        }
      }

      setElections(list);
      
      if (list.length === 0) {
        setMessage('No elections available for viewing. You may need to vote in an election or wait for results to be published.');
      }
      
    } catch (err) {
      console.error('Error fetching elections:', err);
      setMessage('❌ Error fetching elections. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

   const fetchElectionResults = async (election) => {
  if (!contract || !election) return;

  setLoading(true);
  setMessage('');
  
  try {
    // ... existing access checks ...

    const resultsData = await contract.getElectionResults(election.id);
    const totalVotes = await contract.getTotalVotes(election.id);
    
    // Get voter participation data
    const participation = await contract.getVoterParticipation(election.id);
    
    // Get detailed voter status if private election
    let voterDetails = [];
    if (participation.isPublic) {
      // For public elections, we can only show who actually voted
      voterDetails = participation.actualVoters.map(address => ({
        address,
        hasVoted: true,
        isEligible: true
      }));
    } else {
      // For private elections, show all allowed voters and their status
      const voterStatus = await contract.getVoterStatus(
        election.id, 
        participation.allowedVoters
      );
      
      voterDetails = participation.allowedVoters.map((address, index) => ({
        address,
        hasVoted: voterStatus.hasVotedStatus[index],
        isEligible: voterStatus.isEligible[index]
      }));
    }

    const processedResults = {
      electionInfo: election,
      candidates: resultsData[0].map((name, index) => ({
        name,
        imageHash: resultsData[1][index],
        voteCount: Number(resultsData[2][index]),
        percentage: Number(totalVotes) > 0 ? 
          ((Number(resultsData[2][index]) / Number(totalVotes)) * 100).toFixed(1) : 0,
        index
      })),
      totalVotes: Number(totalVotes),
      timestamp: new Date().toISOString(),
      voterParticipation: {
        totalEligibleVoters: participation.isPublic ? 0 : Number(participation.totalEligibleVoters), // Changed to Number()
        votesCast: Number(participation.votesCast), // Changed to Number()
        isPublic: participation.isPublic,
        voterDetails
      }
    };

    // Sort candidates by vote count (descending)
    processedResults.candidates.sort((a, b) => b.voteCount - a.voteCount);
    
    setResults(processedResults);
    
  } catch (err) {
    console.error('Error fetching election results:', err);
    setMessage(`❌ Error fetching results for ${election.name}. It might be a private election or results are not finalized.`);
  } finally {
    setLoading(false);
  }
};
// Helper function to format wallet address
const formatAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Helper function to check if address is current user
const isCurrentUser = (address) => {
  return account && address && address.toLowerCase() === account.toLowerCase();
};

  const handleElectionClick = async (election) => {
    setSelectedElection(election);
    setShowElectionView(true);
    setMessage('');
    setResults(null);
    await fetchElectionResults(election);
  };

  const goBackToElections = () => {
    setShowElectionView(false);
    setSelectedElection(null);
    setResults(null);
    setMessage('');
  };

  const exportToExcel = () => {
    if (!results) return;

    const worksheetData = [
      ['Election Results Report'],
      [''],
      ['Election Name:', results.electionInfo.name],
      ['Election ID:', results.electionInfo.id],
      ['Total Votes:', results.totalVotes],
      ['Generated On:', new Date().toLocaleString()],
      [''],
      ['Rank', 'Candidate Name', 'Vote Count', 'Percentage', 'Image Hash']
    ];

    results.candidates.forEach((candidate, index) => {
      worksheetData.push([
        index + 1,
        candidate.name,
        candidate.voteCount,
        `${candidate.percentage}%`,
        candidate.imageHash
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

    // Style the header
    worksheet['A1'].s = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: 'center' }
    };

    XLSX.writeFile(workbook, `election_results_${results.electionInfo.id}_${Date.now()}.xlsx`);
  };

  const shareResults = () => {
    if (navigator.share && results) {
      navigator.share({
        title: `${results.electionInfo.name} - Results`,
        text: `Check out the results for ${results.electionInfo.name}`,
        url: window.location.href
      });
    } else {
        // Fallback for browsers that do not support navigator.share
        alert("Web Share API is not supported in this browser. Please copy the URL manually.");
        // Optionally, copy URL to clipboard:
        // navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleStartChat = async () => {
    if (!results) return;

    const summary = results.candidates.map(
      (c, idx) => `${idx + 1}. ${c.name} - ${c.voteCount} votes (${c.percentage}%)`
    ).join('\n');

    const introMessage = `Hello! I'm your Election Results Assistant. Here's a quick summary:\n\n${summary}\n\nHow can I help you analyze these results?`;
    setElectionSummary(introMessage); // Store initial context for future questions

    setChatMessages([]); // Clear previous chat
    setChatOpen(true);
    setIsBotTyping(true); // Show typing animation immediately

    try {
      const res = await fetch('https://chatbot-production-255f.up.railway.app/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: introMessage })
      });

      const data = await res.json();
      setChatMessages([
        { sender: 'bot', text: data.reply }
      ]);
      playBotSound(); // Play sound when bot responds
    } catch (err) {
      console.error('Chat start error:', err);
      setChatMessages([{ sender: 'bot', text: '❌ Failed to connect to Election Assistant. Please try again later.' }]);
    } finally {
      setIsBotTyping(false); // Hide typing animation
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { sender: 'user', text: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsBotTyping(true); // Show typing animation

    try {
      // Combine original summary with chat history for context
      const fullContext = chatMessages
        .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
        .join('\n');
      
      const res = await fetch('https://chatbot-production-255f.up.railway.app/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${electionSummary}\n\nChat History:\n${fullContext}\n\nUser Question: ${userMessage.text}`,
        }),
      });

      const data = await res.json();
      setChatMessages((prev) => [...prev, { sender: 'bot', text: data.reply }]);
      playBotSound(); // Play sound when bot responds
    } catch (err) {
      console.error('Chat send error:', err);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '❌ AI failed to respond. Please try again later.' },
      ]);
    } finally {
      setIsBotTyping(false); // Hide typing animation
    }
  };


  const filteredElections = elections.filter(election => 
    election.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (election) => {
    if (election.ended) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-md">
          <div className="w-2 h-2 bg-green-300 rounded-full mr-2"></div>
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md">
        <div className="w-2 h-2 bg-orange-300 rounded-full mr-2 animate-pulse"></div>
        Live
      </span>
    );
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getWinner = () => {
    if (!results || results.candidates.length === 0) return null;
    const winner = results.candidates[0];
    const hasMultipleWinners = results.candidates.filter(c => c.voteCount === winner.voteCount).length > 1;
    return { ...winner, isTie: hasMultipleWinners };
  };

  const getChartData = () => {
    if (!results) return [];
    return results.candidates.map((candidate, index) => ({
      ...candidate,
      fill: COLORS[index % COLORS.length]
    }));
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border-0 rounded-xl shadow-2xl text-gray-800">
          <p className="font-bold mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p className="text-purple-600 font-semibold">Votes: {data.voteCount.toLocaleString()}</p>
            <p className="text-emerald-600 font-semibold">Percentage: {data.percentage}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950 to-zinc-950 text-white flex items-center justify-center">
        <motion.div
          className="text-center bg-white/5 backdrop-blur-md p-10 rounded-3xl shadow-xl border border-purple-500/20"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Trophy className="w-20 h-20 text-purple-400 mx-auto mb-6 drop-shadow-lg" />
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Welcome to Election Results
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-sm mx-auto">
            Connect your wallet to access secure and transparent blockchain election results.
          </p>
          <button 
            onClick={connectWallet}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold text-lg
                       hover:from-purple-700 hover:to-blue-700 transition transform hover:scale-105 shadow-lg
                       active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            Connect Wallet
          </button>
        </motion.div>
      </div>
    );
  }

  const playBotSound = () => {
    const audio = document.getElementById('bot-sound');
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => {
        console.warn("Sound couldn't be played automatically:", e);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-blue-950 to-zinc-950 text-white relative overflow-hidden">
      {/* Animated background elements - More dynamic colors */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-60 -left-60 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      </div>

      <div className="relative z-10 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Error/Message Display */}
          {message && (
            <motion.div
              className={`mb-6 p-4 rounded-xl shadow-lg border ${
                message.includes('❌') ? 'bg-red-500/20 border-red-500/30 text-red-200' :
                message.includes('⏰') ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200' :
                message.includes('🔒') ? 'bg-blue-500/20 border-blue-500/30 text-blue-200' :
                'bg-gray-700/30 border-gray-600/30 text-gray-200'
              }`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-center font-medium">{message}</p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {!showElectionView ? (
              // Enhanced Elections List View
              <motion.div
                key="elections-list"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30, transition: { duration: 0.4 } }}
                className="space-y-10"
              >
                {/* Hero Header */}
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 mt-10 tracking-tight leading-tight">
                      Decentralized Election Results
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
                      Transparency meets technology. Explore real-time, tamper-proof election outcomes powered by blockchain.
                    </p>
                  </motion.div>
                </div>

                {/* Search Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl"
                >
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 w-6 h-6" />
                    <input
                      type="text"
                      placeholder="Search elections by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 
                                 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                    />
                  </div>
                </motion.div>

                {/* Elections Grid */}
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-pink-600 rounded-full animate-spin animation-delay-2000"></div>
                      <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">Loading</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredElections.map((election, index) => (
                      <motion.div
                        key={election.id}
                        className="group relative bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 shadow-xl
                                   hover:border-purple-500/40 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.08 + 0.4, duration: 0.5 }}
                        whileHover={{ y: -8, scale: 1.03, transition: { duration: 0.2 } }}
                        onClick={() => handleElectionClick(election)}
                      >
                        {/* Card Header Image - Now showing actual election image */}
                        <div className="h-48 relative overflow-hidden ">
                          {election.imageHash ? (
                            <img
                              src={getIPFSURL(election.imageHash)}
                              alt={election.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                // Dynamic SVG placeholder with random background color
                                const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
                                e.target.src = `data:image/svg+xml,${encodeURIComponent(`
                                  <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="200" height="200" fill="${randomColor}"/>
                                    <text x="100" y="100" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="28" font-weight="bold" fill="#ffffff">
                                      ${election.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </text>
                                  </svg>
                                `)}`;
                                e.target.onerror = null; // Prevent infinite loop if SVG also fails
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-700 to-blue-800 flex items-center justify-center">
                              <div className="text-center">
                                <Trophy className="w-16 h-16 text-white/70 mx-auto mb-3 drop-shadow-md" />
                                <p className="text-white text-lg font-bold">
                                  {election.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
                          
                          {/* Floating Status Badge */}
                          <div className="absolute top-4 right-4 z-20">
                            {getStatusBadge(election)}
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-6 space-y-4">
                          <div>
                            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                              {election.name}
                            </h3>
                            <p className="text-sm text-gray-400 font-medium">
                              {election.category} Election
                            </p>
                          </div>

                          {/* Stats Grid - Now showing actual vote count */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                              <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-300">Total Votes</p>
                              <p className="font-bold text-white text-lg">{election.totalVotes.toLocaleString()}</p>
                            </div>
                            <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                              <Award className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-300">Candidates</p>
                              <p className="font-bold text-white text-lg">{election.candidateCount}</p>
                            </div>
                          </div>

                          {/* Election Details */}
                          <div className="space-y-2 text-sm text-gray-300">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 flex items-center"><FileText className="w-4 h-4 mr-2" /> Type:</span>
                              <span className="text-white font-medium">
                                {election.isPublic ? 'Public' : 'Private'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 flex items-center"><Calendar className="w-4 h-4 mr-2" /> Ended:</span>
                              <span className="text-white font-medium">
                                {formatTime(election.endTime)}
                              </span>
                            </div>
                          </div>

                          {/* View Button */}
                          <button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center group-hover:scale-[1.02] shadow-lg">
                            <Eye className="w-5 h-5 mr-3" />
                            View Results
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {filteredElections.length === 0 && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center py-20 bg-white/5 backdrop-blur-md rounded-2xl p-10 border border-white/10 shadow-xl"
                  >
                    <div className="max-w-md mx-auto">
                      <Trophy className="w-20 h-20 text-gray-600 mx-auto mb-6 drop-shadow-md" />
                      <h3 className="text-3xl font-bold text-gray-300 mb-4">No Elections Found</h3>
                      <p className="text-gray-400 text-lg">
                        {searchTerm ? 
                          'No elections match your search. Try adjusting your search criteria or check back later for new election results.' :
                          'No election results are currently available for you to view. Participate in an election or wait for results to be published.'
                        }
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              // Enhanced Results Detail View
              <motion.div
                key="results-detail"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50, transition: { duration: 0.4 } }}
                className="space-y-10"
              >
                {/* Header with Navigation */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-12 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={goBackToElections}
                      className="flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all border border-white/20 shadow-md hover:shadow-lg"
                    >
                      <ArrowLeft className="w-5 h-5 mr-3" />
                      <span className="font-semibold text-lg">Back to Elections</span>
                    </button>
                    <div>
                      <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
                        {selectedElection?.name}
                      </h1>
                      <p className="text-purple-300 text-lg font-medium">
                        {selectedElection?.category} Election Results Overview
                      </p>
                    </div>
                  </div>
                  
                  {results && (
                    <div className="flex items-center gap-4">
                      <button
                        onClick={shareResults}
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg font-semibold"
                      >
                        <Share className="w-5 h-5 mr-3" />
                        Share
                      </button>
                      <button
                        onClick={exportToExcel}
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg font-semibold"
                      >
                        <Download className="w-5 h-5 mr-3" />
                        Export
                      </button>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-20 ">
                    <div className="text-center">
                      <div className="relative mb-4">
                        <div className="w-20 h-20 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                      </div>
                      <p className="text-gray-300 text-lg">Loading detailed results...</p>
                    </div>
                  </div>
                ) : results ? (
                  <div className="space-y-10">
                    {/* Winner Announcement */}
                    {(() => {
                      const winner = getWinner();
                      return winner && (
                        <motion.div
                          className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-3xl p-10 text-center text-black overflow-hidden shadow-2xl border-2 border-yellow-200"
                          initial={{ scale: 0.8, opacity: 0, y: 50 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                          <div className="absolute inset-0 bg-black/10"></div>
                          <div className="relative z-10 flex flex-col items-center">
                            <motion.div
                              initial={{ y: -30, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.5, duration: 0.6 }}
                            >
                              <Trophy className="w-20 h-20 mx-auto mb-5 text-yellow-800 drop-shadow-lg" />
                              <h2 className="text-4xl md:text-5xl font-extrabold mb-3 leading-tight">
                                {winner.isTie ? '🤝 It\'s a Tie!' : '🏆 Winner Declared!'}
                              </h2>
                              <p className="text-3xl font-bold mb-3">{winner.name}</p>
                              <p className="text-2xl font-semibold">
                                {winner.voteCount.toLocaleString()} votes ({winner.percentage}%)
                              </p>
                            </motion.div>
                          </div>
                        </motion.div>
                      );
                    })()}

                    {/* Enhanced Stats Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {[
                        { icon: Users, label: 'Total Votes', value: results.totalVotes.toLocaleString(), color: 'text-blue-400' },
                        { icon: Award, label: 'Candidates', value: results.candidates.length, color: 'text-purple-400' },
                        { icon: TrendingUp, label: 'Highest %', value: `${results.candidates[0]?.percentage}%`, color: 'text-green-400' },
                        { icon: Star, label: 'Turnout', value: results.voterParticipation.totalEligibleVoters > 0 
                            ? `${Math.round((results.voterParticipation.votesCast / results.voterParticipation.totalEligibleVoters) * 100)}%` 
                            : 'N/A', color: 'text-yellow-400' }
                      ].map((stat, index) => (
                        <motion.div
                          key={stat.label}
                          className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20 shadow-xl hover:border-purple-500/40 transition-all duration-300"
                          initial={{ y: 30, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                          whileHover={{ y: -5, scale: 1.02 }}
                        >
                          <stat.icon className={`w-10 h-10 mx-auto mb-4 ${stat.color} drop-shadow-md`} />
                          <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
                          <p className="text-md text-gray-300">{stat.label}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Enhanced Chart Controls */}
                    <div className="flex justify-center">
                      <div className="flex bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20 shadow-lg">
                        {[
                          { type: 'bar', icon: BarChart3, label: 'Bar Chart' },
                          { type: 'pie', icon: PieChartIcon, label: 'Pie Chart' }
                        ].map(({ type, icon: Icon, label }) => (
                          <button
                            key={type}
                            onClick={() => setChartType(type)}
                            className={`flex items-center px-8 py-4 rounded-lg transition-all duration-300 text-lg font-semibold ${
                              chartType === type
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl transform scale-105'
                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <Icon className="w-5 h-5 mr-3" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Enhanced Charts */}
                    <motion.div
                      className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                      <h3 className="text-3xl font-bold text-white mb-8 text-center bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text">
                        Vote Distribution
                      </h3>
                      
                      {chartType === 'bar' ? (
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="4 4" stroke="#ffffff20" />
                            <XAxis 
                              dataKey="name" 
                              stroke="#ffffff80"
                              fontSize={14}
                              angle={-30}
                              textAnchor="end"
                              height={80}
                              tick={{ fill: '#E0E0E0' }} // Lighter tick labels
                            />
                            <YAxis 
                              stroke="#ffffff80" 
                              tick={{ fill: '#E0E0E0' }} // Lighter tick labels
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <Bar 
                              dataKey="voteCount" 
                              name="Vote Count"
                              radius={[10, 10, 0, 0]}
                            >
                               {getChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height={450}>
                          <PieChart>
                            <Pie
                              data={getChartData()}
                              cx="50%"
                              cy="50%"
                              outerRadius={150}
                              innerRadius={80}
                              dataKey="voteCount"
                              label={({ name, percentage }) => `${name} ${percentage}%`}
                              labelLine={true}
                              paddingAngle={5}
                              cornerRadius={5}
                            >
                              {getChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0b0b0b" strokeWidth={2} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </motion.div>

                    {/* Enhanced Results Table */}
                    <motion.div
                      className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl"
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                    >
                      <h3 className="text-3xl font-bold mb-8 text-white text-center bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text">
                        Candidate Standings
                      </h3>
                      
                      <div className="overflow-x-auto rounded-xl border border-white/10">
                        <table className="w-full text-left">
                          <thead className="bg-white/5 border-b border-white/20">
                            <tr>
                              <th className="py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Rank</th>
                              <th className="py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Candidate</th>
                              <th className="py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Votes</th>
                              <th className="py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Percentage</th>
                              <th className="py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Progress</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.candidates.map((candidate, index) => (
                              <motion.tr
                                key={candidate.index}
                                className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                                initial={{ x: -30, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.7 + index * 0.08, duration: 0.5 }}
                              >
                                <td className="py-6 px-6">
                                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold shadow-md ${
                                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' :
                                    index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-black' :
                                    index === 2 ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white' :
                                    'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                                  }`}>
                                    {index + 1}
                                  </div>
                                </td>
                                <td className="py-6 px-6">
                                  <div className="flex items-center space-x-4">
                                    {candidate.imageHash ? (
                                      <img
                                        src={getIPFSURL(candidate.imageHash)}
                                        alt={candidate.name}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-lg"
                                        onError={(e) => {
                                          const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
                                          e.target.src = `data:image/svg+xml,${encodeURIComponent(`
                                            <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                                              <rect width="100" height="100" rx="50" fill="${randomColor}"/>
                                              <text x="50" y="50" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="40" font-weight="bold" fill="#fff">
                                                ${candidate.name.charAt(0).toUpperCase()}
                                              </text>
                                            </svg>
                                          `)}`;
                                          e.target.onerror = null;
                                        }}
                                      />
                                    ) : (
                                      <div className={`w-16 h-16 rounded-full border-2 border-white/20 shadow-lg bg-gradient-to-r ${GRADIENT_COLORS[index % GRADIENT_COLORS.length]} flex items-center justify-center`}>
                                        <span className="text-white font-bold text-2xl">
                                          {candidate.name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-bold text-white text-xl">{candidate.name}</p>
                                      <p className="text-gray-300 text-sm">Candidate #{candidate.index + 1}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-6 px-6">
                                  <p className="font-bold text-white text-xl">
                                    {candidate.voteCount.toLocaleString()}
                                  </p>
                                </td>
                                <td className="py-6 px-6">
                                  <div className="flex items-center space-x-3">
                                    <span className="font-bold text-white text-xl">
                                      {candidate.percentage}%
                                    </span>
                                    <div className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                                      index === 0 ? 'bg-emerald-500/30 text-emerald-300' :
                                      'bg-gray-600/30 text-gray-300'
                                    }`}>
                                      {index === 0 ? 'Leading' : 'Following'}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-6 px-6">
                                  <div className="w-36">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs text-gray-400">Progress</span>
                                      <span className="text-sm text-gray-300">{candidate.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden shadow-inner">
                                      <motion.div
                                        className={`h-full rounded-full bg-gradient-to-r ${GRADIENT_COLORS[index % GRADIENT_COLORS.length]}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${candidate.percentage}%` }}
                                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.8 + index * 0.1 }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>

                    
                    {/* Voter Participation Section */}
                    <motion.div
                      className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl"
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                    >
                      <h3 className="text-3xl font-bold mb-8 text-white text-center bg-gradient-to-r from-pink-300 to-red-300 bg-clip-text">
                        Voter Participation
                      </h3>
                      
                      {/* Participation Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10 shadow-lg">
                          <Users className="w-10 h-10 text-purple-400 mx-auto mb-4" />
                          <div className="text-4xl font-extrabold text-white mb-2">
                            {results.electionInfo.isPublic ? '∞' : results.voterParticipation.totalEligibleVoters}
                          </div>
                          <p className="text-sm text-gray-300">Total Eligible Voters</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10 shadow-lg">
                          <Trophy className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                          <div className="text-4xl font-extrabold text-white mb-2">
                            {results.voterParticipation.votesCast}
                          </div>
                          <p className="text-sm text-gray-300">Votes Cast</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10 shadow-lg">
                          <TrendingUp className="w-10 h-10 text-green-400 mx-auto mb-4" />
                          <div className="text-4xl font-extrabold text-white mb-2">
                            {results.voterParticipation.totalEligibleVoters > 0 
                              ? `${Math.round((results.voterParticipation.votesCast / results.voterParticipation.totalEligibleVoters) * 100)}%` 
                              : 'N/A'}
                          </div>
                          <p className="text-sm text-gray-300">Participation Rate</p>
                        </div>
                      </div>

                      {/* Voter List Table */}
                      <div className="overflow-x-auto rounded-xl border border-white/10">
                        <table className="w-full text-left">
                          <thead className="bg-white/5 border-b border-white/20">
                            <tr>
                              <th className="py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">#</th>
                              <th className="py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Wallet Address</th>
                              <th className="py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Status</th>
                              {!results.electionInfo.isPublic && (
                                <th className="py-4 px-6 text-gray-300 font-semibold text-sm uppercase tracking-wider">Eligible</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {results.voterParticipation.voterDetails.map((voter, index) => (
                              <motion.tr
                                key={voter.address}
                                className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                                initial={{ x: -30, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
                              >
                                <td className="py-4 px-6 text-gray-300 font-medium">{index + 1}</td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3 shadow-md">
                                      <span className="text-sm font-bold text-white">
                                        {voter.address.substring(2, 4).toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-medium text-white text-md">
                                        {formatAddress(voter.address)}
                                      </p>
                                      {isCurrentUser(voter.address) && (
                                        <span className="text-xs bg-blue-500/30 text-blue-300 px-2.5 py-0.5 rounded-full mt-1 inline-block font-semibold">
                                          You
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
                                    voter.hasVoted 
                                      ? 'bg-emerald-500/30 text-emerald-300' 
                                      : 'bg-red-500/30 text-red-300'
                                  }`}>
                                    {voter.hasVoted ? 'Voted' : 'Not Voted'}
                                  </span>
                                </td>
                                {!results.electionInfo.isPublic && (
                                  <td className="py-4 px-6">
                                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
                                      voter.isEligible 
                                        ? 'bg-purple-500/30 text-purple-300' 
                                        : 'bg-gray-600/30 text-gray-300'
                                    }`}>
                                      {voter.isEligible ? 'Eligible' : 'Not Eligible'}
                                    </span>
                                  </td>
                                )}
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination would go here if needed */}
                    </motion.div>
                    
                    {/* Action Buttons */}
                    <motion.div
                      className="flex flex-col sm:flex-row gap-6 justify-center items-center py-4"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2, duration: 0.6 }}
                    >
                      <button
                        onClick={exportToExcel}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl active:scale-95"
                      >
                        <Download className="w-6 h-6 mr-3" />
                        Download Full Report
                      </button>
                      
                      <button
                        onClick={shareResults}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl active:scale-95"
                      >
                        <Share className="w-6 h-6 mr-3" />
                        Share Results
                      </button>

                      <button
                        onClick={() => handleStartChat()}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-fuchsia-700 to-indigo-800 hover:from-fuchsia-800 hover:to-indigo-900 text-white rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl active:scale-95"
                      >
                        🤖 Chat with AI Assistant
                      </button>

                    </motion.div>

                    {/* Footer Note */}
                    <motion.div
                      className="text-center text-gray-400 text-sm mt-8 pb-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.4, duration: 0.6 }}
                    >
                      <p className="font-medium">
                        Results verified on blockchain • Generated on {new Date().toLocaleDateString()}
                      </p>
                      <p className="mt-2 text-gray-500 text-xs">
                        This election was conducted using secure blockchain technology to ensure transparency and immutability of every vote.
                      </p>
                    </motion.div>
                  </div>
                ) : (
                  <motion.div
                    className="text-center py-20 bg-white/5 backdrop-blur-md rounded-2xl p-10 border border-white/10 shadow-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="max-w-md mx-auto">
                      <Trophy className="w-20 h-20 text-gray-600 mx-auto mb-6 drop-shadow-md" />
                      <h3 className="text-3xl font-bold text-gray-300 mb-4">No Results Available</h3>
                      <p className="text-gray-400 text-lg">
                        Detailed results for this election are not yet available or you don't have sufficient permissions to view them.
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {chatOpen && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`fixed bottom-6 right-6 w-[420px] ${
              isMinimized ? 'h-[70px]' : 'h-[600px]'
            } flex flex-col rounded-3xl shadow-3xl z-50 overflow-hidden transition-all duration-300 ease-in-out
            bg-gradient-to-br from-indigo-900 to-purple-950 border border-purple-700/30`}
          >
            {/* Header with gradient */}
            <div 
              className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-700 to-purple-800 text-white cursor-pointer shadow-lg"
              onClick={() => isMinimized && setIsMinimized(false)}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center text-2xl font-bold drop-shadow-lg">
                    🤖
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-indigo-700 animate-pulse-slow"></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Election Assistant</h3>
                  <p className="text-sm text-purple-200">
                    {isBotTyping ? (
                        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-purple-300 animate-pulse mr-1"></span>Typing...</span>
                    ) : (
                        'Online'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(!isMinimized);
                  }}
                  className="p-2 rounded-full text-white/80 hover:bg-white/20 transition-colors"
                  title={isMinimized ? 'Maximize' : 'Minimize'}
                >
                  {isMinimized ? (
                    <Maximize2 className="w-5 h-5" />
                  ) : (
                    <Minimize2 className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatOpen(false);
                    setChatMessages([]); // Clear messages on close
                  }}
                  className="p-2 rounded-full text-white/80 hover:bg-red-500/30 transition-colors"
                  title="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages container with subtle pattern */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-900/50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2IiBoZWlnaHQ9IjYiPgo8cmVjdCB3aWR0aD0iNiIgaGVpZ2h0PSI2IiBmaWxsPSIjMDAwMDAwIiBvcGFjaXR5PSIwLjA1Ij48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMNiA2TTYgMEwwIDYiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDgiIHN0cm9rZS13aWR0aD0iMSI+PC9wYXRoPgo8L3N2Zz4=')]">
                  {chatMessages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="text-center p-8 rounded-2xl bg-gradient-to-br from-indigo-800/40 to-purple-800/40 backdrop-blur-sm border border-purple-700/30 shadow-xl"
                    >
                      <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white text-4xl shadow-lg">
                        💬
                      </div>
                      <h4 className="font-bold text-white text-xl mb-3">Ask Me Anything!</h4>
                      <p className="text-sm text-purple-200 leading-relaxed">
                        I can analyze trends, compare candidates, explain voting patterns, and provide insights into these election results.
                      </p>
                    </motion.div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: msg.sender === 'user' ? 30 : -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-lg ${
                            msg.sender === 'user'
                              ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-br-none'
                              : 'bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100 border border-gray-700 rounded-bl-none'
                          }`}
                        >
                          {msg.sender === 'bot' && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center text-xs">
                                🤖
                              </div>
                              <span className="text-xs font-semibold text-purple-300">Election Bot</span>
                            </div>
                          )}
                          <div className="whitespace-pre-wrap">
                            {msg.text.split('\n').map((paragraph, i) => (
                              <p key={i} className="mb-1 last:mb-0">
                                {paragraph}
                              </p>
                            ))}
                          </div>
                          <div className={`mt-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                            <span className="text-xs text-purple-200 opacity-70">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                  {isBotTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-md">🤖</span>
                      </div>
                      <div className="bg-gray-800 rounded-2xl p-4 shadow-md">
                        <div className="flex space-x-2">
                          <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Input area with suggestions */}
                <div className="p-5 border-t border-purple-700/30 bg-gradient-to-t from-purple-900/80 to-indigo-900/80 backdrop-blur-sm shadow-inner">
                  {/* Quick suggestion chips */}
                  {chatMessages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-wrap gap-2 mb-4"
                    >
                      {[
                        "Who won the election?",
                        "Show voting statistics.",
                        "Explain the results.",
                        "Compare top candidates."
                      ].map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setChatInput(suggestion);
                            document.getElementById('chat-input')?.focus();
                          }}
                          className="text-xs px-3.5 py-1.5 rounded-full bg-purple-700/60 hover:bg-purple-600/80 text-purple-100 transition shadow-sm font-medium"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </motion.div>
                  )}
                  
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        id="chat-input"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                        className="w-full px-5 py-3 rounded-xl bg-gray-800/70 border border-gray-700 focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 text-white placeholder-gray-400 text-base outline-none transition shadow-inner"
                        placeholder="Ask about the election results..."
                      />
                      <button
                        onClick={() => {
                          if (chatInput.trim()) {
                            handleSendChat();
                          }
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-purple-300 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={handleSendChat}
                      disabled={!chatInput.trim()}
                      className={`p-4 rounded-xl flex items-center justify-center ${
                        chatInput.trim()
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      } transition-all`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}
      <audio id="bot-sound" src="/happy-pop-3-185288.mp3" preload="auto"></audio>
    </div>
  );
}

export default Results;
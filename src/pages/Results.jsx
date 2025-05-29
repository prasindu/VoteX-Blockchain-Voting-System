import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useElectionStore from '../../store/useElectionStore';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, BarChart3, PieChart as PieChartIcon, Users, Trophy, ArrowLeft, Eye, Calendar, Award, TrendingUp, Filter, Search, Share, Star } from 'lucide-react';
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

  const [totalVoters, setTotalVoters] = useState(0);
  const [votesCast, setVotesCast] = useState(0);
  const [voters, setVoters] = useState([]); // Initialize as empty array






  // Enhanced color palette with gradients
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
        totalEligibleVoters: participation.isPublic ? 0 : participation.totalEligibleVoters.toNumber(),
        votesCast: participation.votesCast.toNumber(),
        isPublic: participation.isPublic,
        voterDetails
      }
    };

    // Sort candidates by vote count (descending)
    processedResults.candidates.sort((a, b) => b.voteCount - a.voteCount);
    
    setResults(processedResults);
    
  } catch (err) {
    // ... existing error handling ...
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
  return address && account && address.toLowerCase() === account.toLowerCase();
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
    }
  };

  const handleStartChat = async () => {
    if (!results) return;

    const summary = results.candidates.map(
      (c, idx) => `${idx + 1}. ${c.name} - ${c.voteCount} votes (${c.percentage}%)`
    ).join('\n');

    const introMessage = `Here are the election results:\n\n${summary}`;
    setElectionSummary(introMessage);

    try {
      const res = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: introMessage })
      });

      const data = await res.json();
      setChatMessages([
        { sender: 'bot', text: data.reply }
      ]);
      setChatOpen(true);
    } catch (err) {
      console.error('Chat start error:', err);
      setChatMessages([{ sender: 'bot', text: '❌ Failed to start chatbot. Please try again later.' }]);
      setChatOpen(true);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { sender: 'user', text: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsBotTyping(true); // ✅ Show typing animation

    try {
      const res = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${electionSummary}\n\nUser Question: ${chatInput}`,
        }),
      });

      const data = await res.json();

      setChatMessages((prev) => [...prev, { sender: 'bot', text: data.reply }]);
    } catch (err) {
      console.error('Chat send error:', err);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '❌ AI failed to respond. Please try again later.' },
      ]);
    } finally {
      setIsBotTyping(false); // ✅ Hide typing animation
    }
  };




  const filteredElections = elections.filter(election => 
    election.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (election) => {
    if (election.ended) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800">
        <div className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse"></div>
        In Progress
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
        <div className="bg-white/95 backdrop-blur-sm p-4 border-0 rounded-xl shadow-2xl">
          <p className="font-bold text-gray-800 mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600 font-semibold">Votes: {data.voteCount.toLocaleString()}</p>
            <p className="text-emerald-600 font-semibold">Percentage: {data.percentage}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2 className="text-3xl font-bold mb-4">Please connect your wallet to view results</h2>
          <button 
            onClick={connectWallet}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition"
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
        // Optional: handle autoplay restrictions on some browsers
        console.warn("Sound couldn't be played automatically:", e);
      });
    }
  };






  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-800 to-black text-white ">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-zinc-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-zinc-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-zinc-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Error Message Display */}
          {message && (
            <motion.div
              className={`mb-6 p-4 rounded-xl ${
                message.includes('❌') ? 'bg-red-500/20 border border-red-500/30 text-red-200' :
                message.includes('⏰') ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-200' :
                message.includes('🔒') ? 'bg-blue-500/20 border border-blue-500/30 text-blue-200' :
                'bg-gray-500/20 border border-gray-500/30 text-gray-200'
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-center font-medium">{message}</p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {!showElectionView ? (
              // Enhanced Elections List View
              <motion.div
                key="elections-list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Hero Header */}
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 mt-10">
                      Election Results
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                      Explore transparent, secure election results powered by blockchain technology
                    </p>
                  </motion.div>
                </div>

                {/* Search Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search elections..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </motion.div>

                {/* Elections Grid */}
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-pink-600 rounded-full animate-spin animate-reverse"></div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredElections.map((election, index) => (
                      <motion.div
                        key={election.id}
                        className="group relative bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        onClick={() => handleElectionClick(election)}
                      >
                        {/* Card Header Image - Now showing actual election image */}
                        <div className="h-48 relative overflow-hidden ">
                          {election.imageHash ? (
                            <img
                              src={getIPFSURL(election.imageHash)}
                              alt={election.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = `data:image/svg+xml,${encodeURIComponent(`
                                  <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="200" height="200" fill="#4f46e5"/>
                                    <text x="100" y="100" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="20" fill="#ffffff">
                                      ${election.name}
                                    </text>
                                  </svg>
                                `)}`;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                              <div className="text-center">
                                <Trophy className="w-12 h-12 text-white/80 mx-auto mb-2" />
                                <p className="text-white/90 font-semibold">{election.name}</p>
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20"></div>
                          
                          {/* Floating Status Badge */}
                          <div className="absolute top-4 right-4">
                            {getStatusBadge(election)}
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-6 space-y-4">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                              {election.name}
                            </h3>
                            <p className="text-sm text-purple-300 font-medium">
                              {election.category} Election
                            </p>
                          </div>

                          {/* Stats Grid - Now showing actual vote count */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-white/5 rounded-lg">
                              <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                              <p className="text-sm text-gray-300">Total Votes</p>
                              <p className="font-bold text-white">{election.totalVotes.toLocaleString()}</p>
                            </div>
                            <div className="text-center p-3 bg-white/5 rounded-lg">
                              <Award className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                              <p className="text-sm text-gray-300">Candidates</p>
                              <p className="font-bold text-white">{election.candidateCount}</p>
                            </div>
                          </div>

                          {/* Election Details */}
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Type:</span>
                              <span className="text-white font-medium">
                                {election.isPublic ? 'Public' : 'Private'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Ended:</span>
                              <span className="text-white font-medium">
                                {formatTime(election.endTime)}
                              </span>
                            </div>
                          </div>

                          {/* View Button */}
                          <button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center group-hover:scale-105">
                            <Eye className="w-4 h-4 mr-2" />
                            View Results
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {filteredElections.length === 0 && !loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                  >
                    <div className="max-w-md mx-auto">
                      <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-gray-300 mb-2">No Elections Found</h3>
                      <p className="text-gray-400">
                        {searchTerm ? 
                          'Try adjusting your search criteria or check back later for new election results.' :
                          'No elections available for viewing. You may need to vote in an election or create one to see results here.'
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Header with Navigation */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-12">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={goBackToElections}
                      className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all border border-white/20"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </button>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-white">
                        {selectedElection?.name}
                      </h1>
                      <p className="text-purple-300 font-medium">
                        {selectedElection?.category} Election Results
                      </p>
                    </div>
                  </div>
                  
                  {results && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={shareResults}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </button>
                      <button
                        onClick={exportToExcel}
                        className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </button>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-20 ">
                    <div className="text-center">
                      <div className="relative mb-4">
                        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                      </div>
                      <p className="text-gray-300">Loading detailed results...</p>
                    </div>
                  </div>
                ) : results ? (
                  <div className="space-y-8">
                    {/* Winner Announcement */}
                    {(() => {
                      const winner = getWinner();
                      return winner && (
                        <motion.div
                          className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-8 text-center text-black overflow-hidden"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.6 }}
                        >
                          <div className="absolute inset-0 bg-black/10"></div>
                          <div className="relative z-10">
                            <motion.div
                              initial={{ y: -20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.3 }}
                            >
                              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-800" />
                              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                                {winner.isTie ? '🤝 It\'s a Tie!' : '🏆 Winner Declared!'}
                              </h2>
                              <p className="text-2xl font-bold mb-2">{winner.name}</p>
                              <p className="text-xl">
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
                        { icon: Star, label: 'Turnout', value: '85.3%', color: 'text-yellow-400' }
                      ].map((stat, index) => (
                        <motion.div
                          key={stat.label}
                          className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20 hover:border-white/40 transition-all"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ y: -2 }}
                        >
                          <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.color}`} />
                          <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                          <p className="text-sm text-gray-300">{stat.label}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Enhanced Chart Controls */}
                    <div className="flex justify-center">
                      <div className="flex bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/20">
                        {[
                          { type: 'bar', icon: BarChart3, label: 'Bar Chart' },
                          { type: 'pie', icon: PieChartIcon, label: 'Pie Chart' }
                        ].map(({ type, icon: Icon, label }) => (
                          <button
                            key={type}
                            onClick={() => setChartType(type)}
                            className={`flex items-center px-6 py-3 rounded-lg transition-all ${
                              chartType === type
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Enhanced Charts */}
                    <motion.div
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h3 className="text-xl font-bold text-white mb-6 text-center">
                        Vote Distribution
                      </h3>
                      
                      {chartType === 'bar' ? (
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={getChartData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                            <XAxis 
                              dataKey="name" 
                              stroke="#ffffff"
                              fontSize={12}
                              angle={-45}
                              textAnchor="end"
                              height={100}
                            />
                            <YAxis stroke="#ffffff" />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                              dataKey="voteCount" 
                              name="Vote Count"
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height={400}>
                          <PieChart>
                            <Pie
                              data={getChartData()}
                              cx="50%"
                              cy="50%"
                              outerRadius={140}
                              innerRadius={60}
                              dataKey="voteCount"
                              label={({ name, percentage }) => `${name}: ${percentage}%`}
                              labelLine={false}
                            >
                              {getChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </motion.div>

                    {/* Enhanced Results Table */}
                    <motion.div
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <h3 className="text-2xl font-bold mb-6 text-white text-center">
                        Detailed Results
                      </h3>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/20">
                              <th className="text-left py-4 px-6 text-gray-300 font-semibold">Rank</th>
                              <th className="text-left py-4 px-6 text-gray-300 font-semibold">Candidate</th>
                              <th className="text-left py-4 px-6 text-gray-300 font-semibold">Votes</th>
                              <th className="text-left py-4 px-6 text-gray-300 font-semibold">Percentage</th>
                              <th className="text-left py-4 px-6 text-gray-300 font-semibold">Progress</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.candidates.map((candidate, index) => (
                              <motion.tr
                                key={candidate.index}
                                className="border-b border-white/10 hover:bg-white/5 transition-colors"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.7 + index * 0.1 }}
                              >
                                <td className="py-6 px-6">
                                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' :
                                    index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-black' :
                                    index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white' :
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
                                        className="w-12 h-12 rounded-full object-cover"
                                        onError={(e) => {
                                          e.target.src = `data:image/svg+xml,${encodeURIComponent(`
                                            <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                                              <rect width="100" height="100" rx="50" fill="#${Math.floor(Math.random()*16777215).toString(16)}"/>
                                              <text x="50" y="50" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="40" fill="#fff">
                                                ${candidate.name.charAt(0).toUpperCase()}
                                              </text>
                                            </svg>
                                          `)}`;
                                        }}
                                      />
                                    ) : (
                                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${GRADIENT_COLORS[index % GRADIENT_COLORS.length]} flex items-center justify-center`}>
                                        <span className="text-white font-bold text-lg">
                                          {candidate.name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-bold text-white text-lg">{candidate.name}</p>
                                      <p className="text-gray-300 text-sm">Candidate #{candidate.index + 1}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-6 px-6">
                                  <p className="font-bold text-white text-lg">
                                    {candidate.voteCount.toLocaleString()}
                                  </p>
                                </td>
                                <td className="py-6 px-6">
                                  <div className="flex items-center space-x-3">
                                    <span className="font-bold text-white text-lg">
                                      {candidate.percentage}%
                                    </span>
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      index === 0 ? 'bg-green-100 text-green-800' :
                                      'bg-gray-100 text-gray-600'
                                    }`}>
                                      {index === 0 ? 'Leading' : 'Following'}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-6 px-6">
                                  <div className="w-32">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-gray-400">Progress</span>
                                      <span className="text-xs text-gray-300">{candidate.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                      <motion.div
                                        className={`h-full rounded-full bg-gradient-to-r ${GRADIENT_COLORS[index % GRADIENT_COLORS.length]}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${candidate.percentage}%` }}
                                        transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
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
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h3 className="text-2xl font-bold mb-6 text-white text-center">
                        Voter Participation
                      </h3>
                      
                      {/* Participation Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white/5 rounded-xl p-6 text-center border border-white/10">
                          <div className="text-4xl font-bold text-purple-400 mb-2">
                            {results.electionInfo.isPublic ? '∞' : results.voterParticipation.totalEligibleVoters}
                          </div>
                          <p className="text-sm text-gray-300">Total Eligible Voters</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-6 text-center border border-white/10">
                          <div className="text-4xl font-bold text-blue-400 mb-2">
                            {results.voterParticipation.votesCast}
                          </div>
                          <p className="text-sm text-gray-300">Votes Cast</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-6 text-center border border-white/10">
                          <div className="text-4xl font-bold text-green-400 mb-2">
                            {results.voterParticipation.totalEligibleVoters > 0 
                              ? `${Math.round((results.voterParticipation.votesCast / results.voterParticipation.totalEligibleVoters) * 100)}%` 
                              : 'N/A'}
                          </div>
                          <p className="text-sm text-gray-300">Participation Rate</p>
                        </div>
                      </div>

                      {/* Voter List Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/20">
                              <th className="text-left py-4 px-6 text-gray-300 font-semibold">#</th>
                              <th className="text-left py-4 px-6 text-gray-300 font-semibold">Wallet Address</th>
                              <th className="text-left py-4 px-6 text-gray-300 font-semibold">Status</th>
                              {!results.electionInfo.isPublic && (
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">Eligible</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {results.voterParticipation.voterDetails.map((voter, index) => (
                              <motion.tr
                                key={voter.address}
                                className="border-b border-white/10 hover:bg-white/5 transition-colors"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5 + index * 0.05 }}
                              >
                                <td className="py-4 px-6 text-gray-300">{index + 1}</td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                                      <span className="text-xs font-bold">
                                        {voter.address.substring(2, 4).toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-medium text-white">
                                        {`${voter.address.substring(0, 6)}...${voter.address.substring(38)}`}
                                      </p>
                                      {voter.address.toLowerCase() === account.toLowerCase() && (
                                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                                          You
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                    voter.hasVoted 
                                      ? 'bg-green-500/20 text-green-400' 
                                      : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {voter.hasVoted ? 'Voted' : 'Not Voted'}
                                  </span>
                                </td>
                                {!results.electionInfo.isPublic && (
                                  <td className="py-4 px-6">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                      voter.isEligible 
                                        ? 'bg-blue-500/20 text-blue-400' 
                                        : 'bg-gray-500/20 text-gray-400'
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
                      className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                    >
                      <button
                        onClick={exportToExcel}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Download Full Report
                      </button>
                      
                      <button
                        onClick={shareResults}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
                      >
                        <Share className="w-5 h-5 mr-2" />
                        Share Results
                      </button>

                      <button
                        onClick={() => handleStartChat()}
                        className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-900 to-purple-500 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
                      >
                        🤖 Chat Bot
                      </button>

                    </motion.div>

                    {/* Footer Note */}
                    <motion.div
                      className="text-center text-gray-400 text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.4 }}
                    >
                      <p>
                        Results verified on blockchain • Generated on {new Date().toLocaleDateString()}
                      </p>
                      <p className="mt-1">
                        This election was conducted using secure blockchain technology to ensure transparency and immutability.
                      </p>
                    </motion.div>
                  </div>
                ) : (
                  <motion.div
                    className="text-center py-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="max-w-md mx-auto">
                      <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-gray-300 mb-2">No Results Available</h3>
                      <p className="text-gray-400">
                        Results for this election are not yet available or you don't have permission to view them.
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
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className={`fixed bottom-6 right-6 w-[400px] ${
      isMinimized ? 'h-[60px]' : 'h-[550px]'
    } flex flex-col rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-300 bg-gradient-to-b from-purple-900 to-indigo-900 border border-purple-500/20`}
  >
    {/* Header with gradient */}
    <div 
      className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-700 to-indigo-700"
      onClick={() => isMinimized && setIsMinimized(false)}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-indigo-700"></div>
        </div>
        <div>
          <h3 className="font-bold text-white">Election Assistant</h3>
          <p className="text-xs text-purple-200">
            {isBotTyping ? 'Typing...' : 'Online'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(!isMinimized);
          }}
          className="p-1 rounded-full hover:bg-white/10 transition"
          title={isMinimized ? 'Maximize' : 'Minimize'}
        >
          {isMinimized ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3" y2="6"></line>
              <line x1="3" y1="12" x2="3" y2="12"></line>
              <line x1="3" y1="18" x2="3" y2="18"></line>
            </svg>
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setChatOpen(false);
          }}
          className="p-1 rounded-full hover:bg-white/10 transition"
          title="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    {!isMinimized && (
      <>
        {/* Messages container with subtle pattern */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2IiBoZWlnaHQ9IjYiPgo8cmVjdCB3aWR0aD0iNiIgaGVpZ2h0PSI2IiBmaWxsPSIjMDAwMDAwIiBvcGFjaXR5PSIwLjAzIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMNiA2TTYgMEwwIDYiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDYiIHN0cm9rZS13aWR0aD0iMSI+PC9wYXRoPgo8L3N2Zz4=')]">
          {chatMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-800/30 to-indigo-800/30 backdrop-blur-sm border border-purple-500/20"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h4 className="font-bold text-white mb-2">Election Results Assistant</h4>
              <p className="text-sm text-purple-200">
                Ask me anything about these election results. I can analyze trends, compare candidates, and explain the voting patterns.
              </p>
            </motion.div>
          ) : (
            chatMessages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                      : 'bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100 border border-gray-700'
                  } shadow-md`}
                >
                  {msg.sender === 'bot' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center text-xs">
                        🤖
                      </div>
                      <span className="text-xs font-semibold text-purple-300">Election Bot</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm">
                    {msg.text.split('\n').map((paragraph, i) => (
                      <p key={i} className="mb-2 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {msg.sender === 'user' && (
                    <div className="text-right mt-1">
                      <span className="text-xs text-purple-200 opacity-70">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
          {isBotTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 flex items-center justify-center flex-shrink-0">
                <span className="text-sm">🤖</span>
              </div>
              <div className="bg-gray-800 rounded-2xl p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input area with suggestions */}
        <div className="p-4 border-t border-purple-500/20 bg-gradient-to-b from-purple-900/80 to-indigo-900/80 backdrop-blur-sm">
          {/* Quick suggestion chips */}
          {chatMessages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-2 mb-3"
            >
              {[
                "Who won the election?",
                "Show voting statistics",
                "Explain the results",
                "Compare top candidates"
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setChatInput(suggestion);
                    document.getElementById('chat-input')?.focus();
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-purple-700/50 hover:bg-purple-600/70 text-purple-100 transition"
                >
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                id="chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                className="w-full px-4 py-3 rounded-xl bg-gray-800/70 border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 text-white placeholder-gray-400 text-sm outline-none transition"
                placeholder="Ask about the election results..."
              />
              <button
                onClick={() => {
                  if (chatInput.trim()) {
                    handleSendChat();
                  }
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-purple-300 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <button
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
              className={`p-3 rounded-xl flex items-center justify-center ${
                chatInput.trim()
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              } transition`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </>
    )}
  </motion.div>
)}
      <audio id="bot-sound" src="/happy-pop-3-185288.mp3" preload="auto"></audio>


    </div>
  );
}

export default Results;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useElectionStore from '../../store/useElectionStore';
import { motion, AnimatePresence } from 'framer-motion';
import { getIPFSURL } from '../ipfs';

function Vote() {
  const {
    contract,
    walletAddress: account,
    connectWallet,
  } = useElectionStore();

  const navigate = useNavigate();

  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [voters, setVoters] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [userVoteChoice, setUserVoteChoice] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [remainingTime, setRemainingTime] = useState(null);
  const [showElectionView, setShowElectionView] = useState(false);
  const [currentElectionId, setCurrentElectionId] = useState(null);

  useEffect(() => {
    connectWallet();
  }, []);

  useEffect(() => {
    const fetchElections = async () => {
      if (!contract) return;
      setLoading(true);
      try {
        const count = Number(await contract.electionCount());
        const list = [];

        for (let i = 0; i < count; i++) {
          const electionInfo = await contract.getElectionInfo(i);
          const isActive = await contract.isElectionActive(i);
          const canUserVote = account ? await contract.canVote(i, account) : false;
          
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
            isActive,
            canVote: canUserVote
          });
        }

        setElections(list);
      } catch (err) {
        console.error('Error fetching elections:', err);
        setMessage('Error fetching elections. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, [contract, account]);

  const fetchElectionDetails = async (election) => {
    if (!contract || !election) return;

    setLoading(true);
    try {
      // Get candidates
      const cands = await contract.getCandidates(election.id);
      const candidatesData = cands[0].map((name, index) => ({
        name,
        imageHash: cands[1][index],
        index,
        voteCount: 0
      }));
      setCandidates(candidatesData);

      // Check if user has voted
      const voted = await contract.hasVoterVoted(election.id, account);
      setHasVoted(voted);

      // Get user's vote choice if they voted
      if (voted) {
        try {
          const choice = await contract.getVoterChoice(election.id, account);
          setUserVoteChoice({
            candidateIndex: Number(choice.candidateIndex),
            candidateName: choice.candidateName
          });
        } catch (err) {
          console.log('Could not fetch vote choice:', err);
        }
      }

      // Try to get total votes and results
      try {
        const total = await contract.getTotalVotes(election.id);
        setTotalVotes(Number(total));

        const results = await contract.getElectionResults(election.id);
        const updatedCandidates = candidatesData.map((candidate, index) => ({
          ...candidate,
          voteCount: Number(results.voteCounts[index])
        }));
        setCandidates(updatedCandidates);
      } catch (err) {
        console.log('Cannot access vote counts:', err);
        setTotalVotes(0);
      }

      // Fetch voters list
      await fetchVoters(election);

      // Calculate remaining time
      const currentTime = Math.floor(Date.now() / 1000);
      const timeLeft = election.endTime - currentTime;
      setRemainingTime(timeLeft > 0 ? timeLeft : 0);

    } catch (err) {
      console.error('Error fetching election details:', err);
      setMessage('Error fetching election details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVoters = async (election) => {
    if (!contract || !election) return;

    setLoadingVoters(true);
    try {
      if (election.isPublic) {
        setVoters([{
          address: 'PUBLIC_ELECTION',
          hasVoted: null,
          voteChoice: null,
          isPublic: true
        }]);
      } else {
        setVoters([{
          address: 'PRIVATE_ELECTION',
          hasVoted: null,
          voteChoice: null,
          isPrivate: true,
          note: 'Voter list restricted for private elections'
        }]);
      }
    } catch (err) {
      console.error('Error fetching voters:', err);
      setVoters([]);
    } finally {
      setLoadingVoters(false);
    }
  };

  const handleElectionClick = async (election) => {
    setSelectedElection(election);
    setCurrentElectionId(election.id);
    setShowElectionView(true);
    setMessage('');
    setSelectedCandidate('');
    setVoters([]);
    setCandidates([]);
    setUserVoteChoice(null);

    await fetchElectionDetails(election);
  };

  const voteHandler = async () => {
    if (!selectedCandidate && selectedCandidate !== 0) return;

    try {
      setLoading(true);
      await contract.vote(selectedElection.id, selectedCandidate);
      setHasVoted(true);
      setMessage('Vote submitted successfully!');
      
      await fetchElectionDetails(selectedElection);
      
      setTimeout(() => {
        navigate('/results');
      }, 3000);
    } catch (err) {
      console.error(err);
      setMessage('Vote failed. You may have already voted or the election is not active.');
    } finally {
      setLoading(false);
    }
  };

  const goBackToElections = () => {
    setShowElectionView(false);
    setSelectedElection(null);
    setMessage('');
  };

  const getStatusBadge = (election) => {
    const currentTime = Math.floor(Date.now() / 1000);

    if (election.ended) {
      return <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-red-600/30 text-red-300 border border-red-500/50">Ended</span>;
    } else if (currentTime < election.startTime) {
      return <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-blue-600/30 text-blue-300 border border-blue-500/50">Upcoming</span>;
    } else if (election.isActive) {
      return <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-emerald-600/30 text-emerald-300 border border-emerald-500/50">Active</span>;
    } else {
      return <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-gray-600/30 text-gray-300 border border-gray-500/50">Inactive</span>;
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getVotePercentage = (voteCount) => {
    if (totalVotes === 0) return 0;
    return ((voteCount / totalVotes) * 100).toFixed(1);
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-black flex items-center justify-center p-4 font-sans">
        <motion.div
          className="text-center bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-xl rounded-3xl p-10 border border-purple-700/50 shadow-2xl shadow-purple-900/50"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="text-7xl mb-6 animate-pulse">🔗</div>
          <h2 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
            Wallet Connection Required
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Connect your decentralized wallet to explore and participate in elections.
          </p>
          <button 
            onClick={connectWallet}
            className="relative px-10 py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white rounded-full font-bold text-lg hover:from-fuchsia-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-70 group"
          >
            <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white blur-sm"></span>
            <span className="relative z-10">Connect Wallet</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-black text-white font-sans relative overflow-hidden">
      {/* Subtle animated background with more vibrant blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-br from-fuchsia-400 to-violet-500 rounded-full opacity-40 animate-pulse"
            animate={{
              x: [0, Math.random() * window.innerWidth - window.innerWidth / 2],
              y: [0, Math.random() * window.innerHeight - window.innerHeight / 2],
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
        {/* Larger, more colorful pulsating blobs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-700 to-fuchsia-700 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-emerald-600 to-cyan-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-700 to-pink-700 rounded-full mix-blend-screen filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20 z-10">
        <AnimatePresence mode="wait">
          {!showElectionView ? (
            // Elections List View
            <motion.div
              key="elections-list"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="text-center mb-16 pt-8">
                <motion.div
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.7 }}
                  className="text-7xl mb-5"
                >
                  🌐
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent mb-5 leading-tight">
                  Decentralized Elections
                </h1>
                <p className="text-xl text-white/70 max-w-2xl mx-auto">
                  Explore and participate in transparent, secure, and verifiable on-chain elections.
                </p>
              </div>

              {loading && (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white/40 border-t-purple-400 border-r-fuchsia-400"></div>
                  <p className="mt-6 text-white/70 text-lg">Casting votes from the blockchain...</p>
                </div>
              )}

              {elections.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                  {elections.map((election, index) => (
                    <motion.div
                      key={election.id}
                      className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-3xl overflow-hidden cursor-pointer border border-gray-700/50 hover:border-purple-500/70 transition-all duration-400 shadow-xl hover:shadow-purple-900/50"
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15, duration: 0.5 }}
                      onClick={() => handleElectionClick(election)}
                      whileHover={{ scale: 1.03, zIndex: 10, boxShadow: "0 15px 30px rgba(128, 0, 128, 0.4)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="h-56 relative overflow-hidden">
                        {election.imageHash ? (
                          <img
                            src={getIPFSURL(election.imageHash)}
                            alt={election.name}
                            className="w-full h-full object-cover opacity-80"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-800/70 to-purple-800/70 text-white/60">
                          <div className="text-center">
                            <div className="text-5xl mb-2">✨</div>
                            <span className="text-base">No Image Provided</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-7">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-2xl font-bold text-white line-clamp-2 leading-tight">{election.name}</h3>
                          {getStatusBadge(election)}
                        </div>
                        
                        <div className="space-y-4 text-base">
                          <div className="flex justify-between text-white/60">
                            <span>Election ID:</span>
                            <span className="font-mono text-purple-300">#{election.id}</span>
                          </div>
                          <div className="flex justify-between text-white/60">
                            <span>Candidates:</span>
                            <span className="font-semibold text-white">{election.candidateCount}</span>
                          </div>
                          <div className="flex justify-between text-white/60">
                            <span>Type:</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${election.isPublic ? 'bg-emerald-600/30 text-emerald-300' : 'bg-blue-600/30 text-blue-300'}`}>
                              {election.isPublic ? 'Public' : 'Private'}
                            </span>
                          </div>
                          <div className="text-white/60 pt-2 border-t border-gray-700/50">
                            <div className="mb-1 text-sm"><strong className="text-white">Starts:</strong> {formatTime(election.startTime)}</div>
                            <div className="text-sm"><strong className="text-white">Ends:</strong> {formatTime(election.endTime)}</div>
                          </div>
                          {election.canVote && (
                            <div className="flex items-center text-emerald-400 font-medium text-base pt-3 border-t border-gray-700/50">
                              <span className="mr-3 text-2xl">🌟</span>
                              <span>Eligible to Cast Vote</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {elections.length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="text-center py-24 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-3xl border border-gray-700/50 shadow-xl"
                >
                  <div className="text-7xl mb-6">✨</div>
                  <h3 className="text-3xl font-bold text-white mb-3">No Elections Found!</h3>
                  <p className="text-white/70 text-lg max-w-md mx-auto">
                    It looks like there are no active elections at the moment. Check back later or create one!
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            // Election Detail View
            <motion.div
              key="election-detail"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between mb-10 pt-4">
                <button
                  onClick={goBackToElections}
                  className="flex items-center px-8 py-3 bg-gradient-to-r from-gray-700/50 to-gray-800/50 backdrop-blur-lg rounded-full text-white hover:from-gray-600/50 hover:to-gray-700/50 transition-colors duration-300 border border-gray-600/50 hover:border-blue-500/70 shadow-lg"
                >
                  <span className="mr-3 text-xl">←</span>
                  <span className="font-semibold text-lg">Back to All Elections</span>
                </button>
                <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-center flex-1 mx-4">
                  {selectedElection?.name}
                </h1>
                <div className="w-64 hidden md:block"></div> {/* Spacer to balance title */}
              </div>

              {loading ? (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white/40 border-t-purple-400 border-r-fuchsia-400"></div>
                  <p className="mt-6 text-white/70 text-lg">Fetching election data from the blockchain...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* Election Info */}
                  <div className="lg:col-span-1 space-y-8">
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-xl shadow-gray-900/50">
                      <h2 className="text-3xl font-bold mb-6 text-white bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                        Election Overview
                      </h2>
                      
                      {selectedElection?.imageHash && (
                        <div className="mb-6 rounded-2xl overflow-hidden shadow-lg border border-gray-700/50">
                          <img
                            src={getIPFSURL(selectedElection.imageHash)}
                            alt={selectedElection.name}
                            className="w-full h-56 object-cover opacity-90"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      <div className="space-y-5 text-base">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-700/50">
                          <span className="text-white/70">Status:</span>
                          {getStatusBadge(selectedElection)}
                        </div>
                        <div className="flex justify-between text-white/70 pb-2 border-b border-gray-700/50">
                          <span>Election ID:</span>
                          <span className="font-mono text-purple-300 font-semibold">#{selectedElection?.id}</span>
                        </div>
                        <div className="flex justify-between text-white/70 pb-2 border-b border-gray-700/50">
                          <span>Type:</span>
                          <span className={`px-4 py-1 rounded-full text-sm font-semibold ${selectedElection?.isPublic ? 'bg-emerald-600/30 text-emerald-300' : 'bg-blue-600/30 text-blue-300'}`}>
                            {selectedElection?.isPublic ? 'Public' : 'Private'}
                          </span>
                        </div>
                        <div className="text-white/70 pb-2 border-b border-gray-700/50">
                          <div className="mb-2 text-sm"><strong className="text-white">Creator:</strong></div>
                          <div className="font-mono text-xs text-white break-all bg-gray-700/30 rounded-lg p-2">{selectedElection?.creator}</div>
                        </div>
                        {totalVotes > 0 && (
                          <div className="flex justify-between text-white/70 pb-2 border-b border-gray-700/50">
                            <span>Total Votes Cast:</span>
                            <span className="font-bold text-white text-xl">{totalVotes}</span>
                          </div>
                        )}
                        {remainingTime !== null && (
                          <div className={`p-4 rounded-xl font-bold text-center ${remainingTime > 0 ? 'bg-gradient-to-r from-orange-600/30 to-red-600/30 text-orange-300 border border-orange-500/50' : 'bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 text-emerald-300 border border-emerald-500/50'}`}>
                            {remainingTime > 0 
                              ? `⏳ Voting Ends In: ${formatDuration(remainingTime)}`
                              : '✅ Voting Period Has Concluded!'
                            }
                          </div>
                        )}
                        {hasVoted && userVoteChoice && (
                          <div className="p-4 bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 rounded-xl border border-emerald-500/50 text-center">
                            <div className="text-emerald-300 font-bold text-lg flex items-center justify-center">
                              <span className="mr-3 text-3xl">🎉</span> You Voted For: <span className="ml-2 text-white">{userVoteChoice.candidateName}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Voters Section */}
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-xl shadow-gray-900/50">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold text-white bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">
                          Voter Eligibility
                        </h2>
                        {loadingVoters && (
                          <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/40 border-t-blue-400"></div>
                        )}
                      </div>
                      
                      {voters.length > 0 ? (
                        <div className="space-y-4">
                          {voters.map((voter, index) => (
                            <div key={index} className="p-5 bg-gray-700/30 rounded-2xl border border-gray-600/50 shadow-inner">
                              {voter.isPublic ? (
                                <div className="text-center">
                                  <div className="text-4xl mb-3">🌍</div>
                                  <p className="text-white/80 text-base font-semibold">
                                    This is a <span className="text-emerald-400">Public Election</span>. Anyone can participate!
                                  </p>
                                </div>
                              ) : voter.isPrivate ? (
                                <div className="text-center">
                                  <div className="text-4xl mb-3">🔒</div>
                                  <p className="text-white/80 text-base font-semibold">
                                    This is a <span className="text-blue-400">Private Election</span>. Voter list is restricted for privacy.
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-white/80 text-sm font-mono break-all mb-2">
                                    Address: <span className="text-purple-300">{voter.address}</span>
                                  </p>
                                  <p className={`text-sm mt-1 font-semibold ${voter.hasVoted ? 'text-emerald-400' : 'text-orange-400'}`}>
                                    {voter.hasVoted ? '✅ Has Cast Vote' : '⏳ Pending Vote'}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/60 text-base text-center py-4">No specific voter information available for this election type.</p>
                      )}
                    </div>
                  </div>

                  {/* Candidates and Voting */}
                  <div className="lg:col-span-2">
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-xl shadow-gray-900/50">
                      <h2 className="text-3xl font-bold mb-8 text-white bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                        {hasVoted ? 'Election Outcomes & Results' : 'Choose Your Candidate'}
                      </h2>

                      {candidates.length > 0 ? (
                        <div className="space-y-6">
                          {candidates.map((candidate, index) => (
                            <motion.div
                              key={index}
                              className={`relative border-2 rounded-2xl p-7 transition-all duration-300 cursor-pointer 
                                  ${hasVoted
                                      ? userVoteChoice?.candidateIndex === index
                                          ? 'border-emerald-500 bg-emerald-700/20 shadow-lg shadow-emerald-900/30'
                                          : 'border-gray-700/50 bg-gray-700/30'
                                      : selectedCandidate === index
                                          ? 'border-fuchsia-500 bg-fuchsia-700/20 shadow-lg shadow-fuchsia-900/30'
                                          : 'border-gray-700/50 bg-gray-800/30 hover:border-blue-500/70 hover:bg-gray-700/40'
                                  }`}
                              onClick={() => !hasVoted && selectedElection?.canVote && remainingTime > 0 && setSelectedCandidate(index)}
                              whileHover={!hasVoted ? { scale: 1.015, boxShadow: "0 10px 15px -3px rgba(124, 58, 237, 0.3), 0 4px 6px -2px rgba(124, 58, 237, 0.1)" } : {}}
                              whileTap={!hasVoted ? { scale: 0.99 } : {}}
                            >
                              <div className="flex items-center space-x-6">
                                <div className="flex-shrink-0">
                                  {candidate.imageHash ? (
                                    <img
                                      src={getIPFSURL(candidate.imageHash)}
                                      alt={candidate.name}
                                      className="w-20 h-20 object-cover rounded-full border-4 border-gray-700/50 shadow-md"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-extrabold text-3xl border-4 border-gray-700/50 shadow-md">
                                    {candidate.name.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                
                                <div className="flex-1">
                                  <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{candidate.name}</h3>
                                  {totalVotes > 0 && (
                                    <div className="space-y-2 pt-2 border-t border-gray-700/50 mt-2">
                                      <div className="flex justify-between text-base text-white/70">
                                        <span className="font-semibold">{candidate.voteCount} Votes</span>
                                        <span className="font-bold text-lg text-purple-300">{getVotePercentage(candidate.voteCount)}%</span>
                                      </div>
                                      <div className="w-full bg-gray-700 rounded-full h-3">
                                        <motion.div
                                          className="bg-gradient-to-r from-blue-500 to-fuchsia-500 h-3 rounded-full"
                                          initial={{ width: 0 }}
                                          animate={{ width: `${getVotePercentage(candidate.voteCount)}%` }}
                                          transition={{ duration: 1.2, delay: index * 0.15, ease: "easeOut" }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-shrink-0 text-4xl">
                                  {!hasVoted && selectedCandidate === index && (
                                    <div className="text-fuchsia-400 transform scale-125 transition-transform duration-200 animate-pulse">✨</div>
                                  )}
                                  {hasVoted && userVoteChoice?.candidateIndex === index && (
                                    <div className="text-emerald-400 transform scale-125 transition-transform duration-200 animate-bounce">🏆</div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="text-5xl mb-6">🤔</div>
                          <p className="text-white/60 text-lg">No candidates found for this election. Please check back later.</p>
                        </div>
                      )}

                      {/* Voting Button */}
                      {!hasVoted && selectedElection?.canVote && remainingTime > 0 && (
                        <div className="mt-10 text-center">
                          <motion.button
                            onClick={voteHandler}
                            disabled={selectedCandidate === '' || loading}
                            className={`px-14 py-5 rounded-full font-bold text-xl transition-all duration-300 relative group
                            ${selectedCandidate === '' || loading
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 shadow-xl shadow-emerald-900/50 hover:shadow-2xl hover:shadow-emerald-900/70'
                            }`}
                            whileHover={selectedCandidate !== '' && !loading ? { scale: 1.05 } : {}}
                            whileTap={selectedCandidate !== '' && !loading ? { scale: 0.95 } : {}}
                          >
                            {loading ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/50 border-t-white mr-3"></div>
                                Submitting Vote...
                              </div>
                            ) : (
                              <>
                                <span className="relative z-10">🗳️ Cast Your Vote!</span>
                                <span className="absolute inset-0 rounded-full bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      )}

                      {hasVoted && (
                        <div className="mt-10 text-center">
                          <motion.button
                            onClick={() => navigate('/results')}
                            className="px-14 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold text-xl shadow-xl shadow-blue-900/50 hover:shadow-2xl hover:shadow-blue-900/70 relative group"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <span className="relative z-10">📊 View Complete Results</span>
                            <span className="absolute inset-0 rounded-full bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                          </motion.button>
                        </div>
                      )}

                      {message && (
                        <motion.div
                          className="mt-8 text-center"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.5 }}
                        >
                          <div className={`inline-block px-8 py-4 rounded-xl font-medium text-lg relative
                            ${message.includes('successfully') || message.includes('Success')
                                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-900/30'
                                : message.includes('Error') || message.includes('failed')
                                ? 'bg-red-600/30 text-red-300 border border-red-500/50 shadow-lg shadow-red-900/30'
                                : 'bg-blue-600/30 text-blue-300 border border-blue-500/50 shadow-lg shadow-blue-900/30'
                            }`}>
                            <span className="relative z-10">{message}</span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Vote;
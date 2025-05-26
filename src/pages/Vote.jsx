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
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">Ended</span>;
    } else if (currentTime < election.startTime) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">Upcoming</span>;
    } else if (election.isActive) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Active</span>;
    } else {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">Inactive</span>;
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <motion.div
          className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-3xl font-bold text-white mb-4">Wallet Connection Required</h2>
          <p className="text-white/80 mb-6">Connect your wallet to participate in voting</p>
          <button 
            onClick={connectWallet}
            className="px-8 py-3 bg-white text-indigo-900 rounded-xl font-semibold hover:bg-white/90 transition-colors duration-200 shadow-lg"
          >
            Connect Wallet
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      {/* Subtle animated background */}
     <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
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
        ))
       
        }
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!showElectionView ? (
            // Elections List View
            <motion.div
              key="elections-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-12 pt-8">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-6xl mb-4"
                >
                  🗳️
                </motion.div>
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                  Elections
                </h1>
                <p className="text-xl text-white/70">Choose an election to participate in</p>
              </div>

              {loading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
                  <p className="mt-4 text-white/70">Loading elections...</p>
                </div>
              )}

              {elections.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {elections.map((election, index) => (
                    <motion.div
                      key={election.id}
                      className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden cursor-pointer hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/40"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleElectionClick(election)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="h-48 relative overflow-hidden">
                        {election.imageHash ? (
                          <img
                            src={getIPFSURL(election.imageHash)}
                            alt={election.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/50 to-purple-500/50">
                          <div className="text-center">
                            <div className="text-4xl mb-2">📊</div>
                            <span className="text-sm text-white/80">Election Image</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold text-white line-clamp-2">{election.name}</h3>
                          {getStatusBadge(election)}
                        </div>
                        
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between text-white/70">
                            <span>Election ID:</span>
                            <span className="font-mono">#{election.id}</span>
                          </div>
                          <div className="flex justify-between text-white/70">
                            <span>Candidates:</span>
                            <span>{election.candidateCount}</span>
                          </div>
                          <div className="flex justify-between text-white/70">
                            <span>Type:</span>
                            <span className={`px-2 py-1 rounded text-xs ${election.isPublic ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}`}>
                              {election.isPublic ? 'Public' : 'Private'}
                            </span>
                          </div>
                          <div className="text-white/70">
                            <div className="mb-1">Start: {formatTime(election.startTime)}</div>
                            <div>End: {formatTime(election.endTime)}</div>
                          </div>
                          {election.canVote && (
                            <div className="flex items-center text-green-400 font-medium">
                              <span className="mr-2">✅</span>
                              <span>Eligible to vote</span>
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-2xl font-bold text-white mb-2">No Elections Available</h3>
                  <p className="text-white/70">There are currently no elections to participate in.</p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            // Election Detail View
            <motion.div
              key="election-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-8 pt-4">
                <button
                  onClick={goBackToElections}
                  className="flex items-center px-6 py-3 bg-white/10 backdrop-blur-lg rounded-xl text-white hover:bg-white/20 transition-colors duration-200 border border-white/20"
                >
                  <span className="mr-2">←</span>
                  Back to Elections
                </button>
                <h1 className="text-3xl font-bold text-center text-white">{selectedElection?.name}</h1>
                <div className="w-32"></div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
                  <p className="mt-4 text-white/70">Loading election details...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Election Info */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                      <h2 className="text-xl font-bold mb-4 text-white">Election Details</h2>
                      
                      {selectedElection?.imageHash && (
                        <div className="mb-4">
                          <img
                            src={getIPFSURL(selectedElection.imageHash)}
                            alt={selectedElection.name}
                            className="w-full h-48 object-cover rounded-xl"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Status:</span>
                          {getStatusBadge(selectedElection)}
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Election ID:</span>
                          <span className="font-mono text-white">#{selectedElection?.id}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Type:</span>
                          <span className={`px-2 py-1 rounded text-xs ${selectedElection?.isPublic ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}`}>
                            {selectedElection?.isPublic ? 'Public' : 'Private'}
                          </span>
                        </div>
                        <div className="text-white/70">
                          <div className="mb-1">Creator:</div>
                          <div className="font-mono text-xs text-white break-all">{selectedElection?.creator}</div>
                        </div>
                        {totalVotes > 0 && (
                          <div className="flex justify-between text-white/70">
                            <span>Total Votes:</span>
                            <span className="font-bold text-white">{totalVotes}</span>
                          </div>
                        )}
                        {remainingTime !== null && (
                          <div className={`p-3 rounded-xl ${remainingTime > 0 ? 'bg-orange-500/20 text-orange-300' : 'bg-green-500/20 text-green-300'}`}>
                            {remainingTime > 0 
                              ? `⏳ Time Remaining: ${formatDuration(remainingTime)}`
                              : '✅ Voting has ended'
                            }
                          </div>
                        )}
                        {hasVoted && userVoteChoice && (
                          <div className="p-3 bg-green-500/20 rounded-xl">
                            <div className="text-green-300 font-medium">
                              ✅ You voted for: {userVoteChoice.candidateName}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Voters Section */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">Voter Information</h2>
                        {loadingVoters && (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                        )}
                      </div>
                      
                      {voters.length > 0 ? (
                        <div className="space-y-3">
                          {voters.map((voter, index) => (
                            <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/10">
                              {voter.isPublic ? (
                                <div className="text-center">
                                  <div className="text-2xl mb-2">🌍</div>
                                  <p className="text-white/80 text-sm">
                                    This is a public election. Anyone can participate.
                                  </p>
                                </div>
                              ) : voter.isPrivate ? (
                                <div className="text-center">
                                  <div className="text-2xl mb-2">🔒</div>
                                  <p className="text-white/80 text-sm">
                                    This is a private election. Voter list is restricted.
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-white/80 text-sm font-mono break-all">
                                    {voter.address}
                                  </p>
                                  <p className={`text-xs mt-1 ${voter.hasVoted ? 'text-green-400' : 'text-white/60'}`}>
                                    {voter.hasVoted ? '✅ Voted' : '⏳ Not voted'}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/60 text-sm text-center">No voter information available</p>
                      )}
                    </div>
                  </div>

                  {/* Candidates and Voting */}
                  <div className="lg:col-span-2">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                      <h2 className="text-2xl font-bold mb-6 text-white">
                        {hasVoted ? 'Election Results' : 'Select a Candidate'}
                      </h2>

                      {candidates.length > 0 ? (
                        <div className="space-y-4">
                          {candidates.map((candidate, index) => (
                            <motion.div
                              key={index}
                              className={`border-2 rounded-xl p-6 transition-all cursor-pointer ${
                                hasVoted
                                  ? userVoteChoice?.candidateIndex === index
                                    ? 'border-green-400 bg-green-500/10'
                                    : 'border-white/20 bg-white/5'
                                  : selectedCandidate === index
                                    ? 'border-blue-400 bg-blue-500/10'
                                    : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                              }`}
                              onClick={() => !hasVoted && selectedElection?.canVote && remainingTime > 0 && setSelectedCandidate(index)}
                              whileHover={!hasVoted ? { scale: 1.01 } : {}}
                              whileTap={!hasVoted ? { scale: 0.99 } : {}}
                            >
                              <div className="flex items-center space-x-6">
                                <div className="flex-shrink-0">
                                  {candidate.imageHash ? (
                                    <img
                                      src={getIPFSURL(candidate.imageHash)}
                                      alt={candidate.name}
                                      className="w-16 h-16 object-cover rounded-full border-2 border-white/20"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-white/20">
                                    {candidate.name.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                
                                <div className="flex-1">
                                  <h3 className="text-xl font-semibold text-white mb-2">{candidate.name}</h3>
                                  {totalVotes > 0 && (
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm text-white/70">
                                        <span>{candidate.voteCount} votes</span>
                                        <span>{getVotePercentage(candidate.voteCount)}%</span>
                                      </div>
                                      <div className="w-full bg-white/20 rounded-full h-3">
                                        <motion.div
                                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                                          initial={{ width: 0 }}
                                          animate={{ width: `${getVotePercentage(candidate.voteCount)}%` }}
                                          transition={{ duration: 1, delay: index * 0.1 }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-shrink-0">
                                  {!hasVoted && selectedCandidate === index && (
                                    <div className="text-blue-400 font-semibold text-lg">✓</div>
                                  )}
                                  {hasVoted && userVoteChoice?.candidateIndex === index && (
                                    <div className="text-green-400 font-semibold text-lg">✅</div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-4">👥</div>
                          <p className="text-white/60">Loading candidates...</p>
                        </div>
                      )}

                      {/* Voting Button */}
                      {!hasVoted && selectedElection?.canVote && remainingTime > 0 && (
                        <div className="mt-8 text-center">
                          <motion.button
                            onClick={voteHandler}
                            disabled={selectedCandidate === '' || loading}
                            className={`px-12 py-4 rounded-xl font-semibold text-lg transition-all ${
                              selectedCandidate === '' || loading
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg'
                            }`}
                            whileHover={selectedCandidate !== '' && !loading ? { scale: 1.05 } : {}}
                            whileTap={selectedCandidate !== '' && !loading ? { scale: 0.95 } : {}}
                          >
                            {loading ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2"></div>
                                Submitting Vote...
                              </div>
                            ) : (
                              <>🗳️ Submit Vote</>
                            )}
                          </motion.button>
                        </div>
                      )}

                      {hasVoted && (
                        <div className="mt-8 text-center">
                          <motion.button
                            onClick={() => navigate('/results')}
                            className="px-12 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all font-semibold text-lg shadow-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            📊 View Full Results
                          </motion.button>
                        </div>
                      )}

                      {message && (
                        <motion.div
                          className="mt-6 text-center"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <div className={`inline-block px-6 py-3 rounded-xl font-medium ${
                            message.includes('successfully') || message.includes('Success')
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : message.includes('Error') || message.includes('failed')
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {message}
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
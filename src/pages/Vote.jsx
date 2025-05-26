import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useElectionStore from '../../store/useElectionStore';
import { motion, AnimatePresence } from 'framer-motion';
import { getIPFSURL } from '../ipfs'; // Assuming this is the correct path

function Vote() {
  const {
    contract,
    walletAddress: account,
    connectWallet,
    electionId, // We'll use local state instead of this if setElectionId isn't a function
    // setElectionId, // Commented out as it's causing the error
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
  // Adding local election ID state as a fallback
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
        setMessage('❌ Error fetching elections');
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
        voteCount: 0 // Will be populated if results are available
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

      // Try to get total votes and results (if authorized)
      try {
        const total = await contract.getTotalVotes(election.id);
        setTotalVotes(Number(total));

        // If we can see total votes, try to get detailed results
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
      setMessage('❌ Error fetching election details');
    } finally {
      setLoading(false);
    }
  };

  const fetchVoters = async (election) => {
    if (!contract || !election) return;

    setLoadingVoters(true);
    try {
      const votersList = [];

      if (election.isPublic) {
        // For public elections, we need to track voters through events or other means
        // Since we can't enumerate all possible addresses, we'll show a message
        setVoters([{
          address: 'PUBLIC_ELECTION',
          hasVoted: null,
          voteChoice: null,
          isPublic: true
        }]);
      } else {
        // For private elections, get the allowed voters list
        const electionData = await contract.elections(election.id);
        
        // This approach depends on your contract having a way to get allowed voters
        // Since the contract doesn't expose allowedVoters array directly, 
        // we'll need to use events or modify the contract
        
        // For now, let's try to get voters through events or alternative method
        try {
          // Alternative: Check if we can get voter info through iteration
          // This is not efficient for large voter lists
          setVoters([{
            address: 'PRIVATE_ELECTION',
            hasVoted: null,
            voteChoice: null,
            isPrivate: true,
            note: 'Voter list not accessible through current contract interface'
          }]);
        } catch (err) {
          console.log('Could not fetch voters list:', err);
          setVoters([]);
        }
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
    // Use our local state instead of the store function
    setCurrentElectionId(election.id);
    // Only try to use setElectionId if it's a function
    // try {
    //   if (typeof setElectionId === 'function') {
    //     setElectionId(election.id);
    //   }
    // } catch (error) {
    //   console.warn('setElectionId is not available:', error);
    // }
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
      setMessage('✅ Vote submitted successfully!');
      
      // Refresh election details to update vote counts
      await fetchElectionDetails(selectedElection);
      
      // Optionally navigate to results after a delay
      setTimeout(() => {
        navigate('/results');
      }, 3000);
    } catch (err) {
      console.error(err);
      setMessage('❌ Vote failed. You may have already voted or the election is not active.');
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
      return <span className="px-3 py-1 bg-gray-500 text-white rounded-full text-sm">Ended</span>;
    } else if (currentTime < election.startTime) {
      return <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm">Upcoming</span>;
    } else if (election.isActive) {
      return <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm">Active</span>;
    } else {
      return <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm">Inactive</span>;
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
      <div className="min-h-screen bg-gradient-to-r from-blue-600 to-indigo-800 text-white flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2 className="text-3xl font-bold mb-4">Please connect your wallet to vote</h2>
          <button 
            onClick={connectWallet}
            className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Connect Wallet
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white px-4 py-8">
      {/* Animated background particles */}
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
        ))}
      </div>
      <div className="max-w-7xl mx-auto mt-12">
        <AnimatePresence mode="wait">
          {!showElectionView ? (
            // Elections List View
            <motion.div
              key="elections-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="text-xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-center mb-12 text-transparent mb-4 mt-10">🗳️ Available Elections</h1>

              {loading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <p className="mt-2">Loading elections...</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 ">
                {elections.map((election, index) => (
                  <motion.div
                    key={election.id}
                    className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl shadow-xl overflow-hidden cursor-pointer hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleElectionClick(election)}
                  >
                    <div className="h-48 group relative bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer ">
                      {election.imageHash ? (
                        <img
                          src={getIPFSURL(election.imageHash)}
                          alt={election.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = `data:image/svg+xml,${encodeURIComponent(`
                              <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                                <rect width="200" height="200" fill="#f0f0f0"/>
                                <text x="100" y="100" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="16" fill="#666">
                                  No Image
                                </text>
                              </svg>
                            `)}`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center  text-gray-600">
                          <span className="text-lg">No Image</span>
                        </div>
                      )}
                    </div>

                    <div className="p-6 ">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-black line-clamp-2">{election.name}</h3>
                        {getStatusBadge(election)}
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><span className="font-semibold">ID:</span> {election.id}</p>
                        <p><span className="font-semibold">Candidates:</span> {election.candidateCount}</p>
                        <p><span className="font-semibold">Type:</span> {election.isPublic ? 'Public' : 'Private'}</p>
                        <p><span className="font-semibold">Start:</span> {formatTime(election.startTime)}</p>
                        <p><span className="font-semibold">End:</span> {formatTime(election.endTime)}</p>
                        {election.canVote && (
                          <p className="text-green-600 font-semibold">✅ You can vote</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {elections.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-300">No elections available</p>
                </div>
              )}
            </motion.div>
          ) : (
            // Election Detail View
            <motion.div
              key="election-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={goBackToElections}
                  className="flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-lg text-black hover:bg-opacity-30 transition"
                >
                  ← Back to Elections
                </button>
                <h1 className="text-3xl font-bold text-center">{selectedElection?.name}</h1>
                <div className="w-32"></div> {/* Spacer for centering */}
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <p className="mt-2">Loading election details...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Election Info */}
                  <div className="lg:col-span-1">
                    <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 mb-6">
                      <h2 className="text-xl font-bold mb-4 text-black">Election Details</h2>
                      
                      {selectedElection?.imageHash && (
                        <img
                          src={getIPFSURL(selectedElection.imageHash)}
                          alt={selectedElection.name}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                      
                      <div className="space-y-3 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span className="font-semibold">Status:</span>
                          {getStatusBadge(selectedElection)}
                        </div>
                        <p><span className="font-semibold">ID:</span> {selectedElection?.id}</p>
                        <p><span className="font-semibold">Type:</span> {selectedElection?.isPublic ? 'Public' : 'Private'}</p>
                        <p><span className="font-semibold">Creator:</span> {selectedElection?.creator}</p>
                        {totalVotes > 0 && (
                          <p><span className="font-semibold">Total Votes:</span> {totalVotes}</p>
                        )}
                        {remainingTime !== null && (
                          <p className={`font-semibold ${remainingTime > 0 ? 'text-orange-300' : 'text-green-300'}`}>
                            {remainingTime > 0 
                              ? `⏳ Time Remaining: ${formatDuration(remainingTime)}`
                              : '✅ Voting has ended'
                            }
                          </p>
                        )}
                        {hasVoted && userVoteChoice && (
                          <div className="mt-4 p-3 bg-green-100 rounded-lg">
                            <p className="text-green-800 font-semibold">
                              ✅ You voted for: {userVoteChoice.candidateName}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Voters Section */}
                    <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-black">Voter Information</h2>
                        {loadingVoters && (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        )}
                      </div>
                      
                      {voters.length > 0 ? (
                        <div className="space-y-3">
                          {voters.map((voter, index) => (
                            <div key={index} className="p-3 bg-white bg-opacity-20 rounded-lg">
                              {voter.isPublic ? (
                                <p className="text-gray-700 text-sm">
                                  📢 This is a public election. Anyone can vote.
                                </p>
                              ) : voter.isPrivate ? (
                                <p className="text-gray-700 text-sm">
                                  🔒 This is a private election. Voter list not publicly accessible.
                                </p>
                              ) : (
                                <div>
                                  <p className="text-gray-700 text-sm font-mono">
                                    {voter.address}
                                  </p>
                                  <p className={`text-xs ${voter.hasVoted ? 'text-green-600' : 'text-gray-500'}`}>
                                    {voter.hasVoted ? '✅ Voted' : '⏳ Not voted'}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-300 text-sm">No voter information available</p>
                      )}
                    </div>
                  </div>

                  {/* Candidates and Voting */}
                  <div className="lg:col-span-2">
                    <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6">
                      <h2 className="text-xl font-bold mb-6 text-black">
                        {hasVoted ? 'Election Results' : 'Select a Candidate'}
                      </h2>

                      {candidates.length > 0 ? (
                        <div className="space-y-4">
                          {candidates.map((candidate, index) => (
                            <motion.div
                              key={index}
                              className={`border-2 rounded-lg p-4 transition-all ${
                                hasVoted
                                  ? userVoteChoice?.candidateIndex === index
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-300'
                                  : selectedCandidate === index
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400 cursor-pointer'
                              }`}
                              onClick={() => !hasVoted && selectedElection?.canVote && remainingTime > 0 && setSelectedCandidate(index)}
                              whileHover={!hasVoted ? { scale: 1.02 } : {}}
                            >
                              <div className="flex items-center space-x-4">
                                {candidate.imageHash && (
                                  <img
                                    src={getIPFSURL(candidate.imageHash)}
                                    alt={candidate.name}
                                    className="w-16 h-16 object-cover rounded-full"
                                    onError={(e) => {
                                      e.target.src = `data:image/svg+xml,${encodeURIComponent(`
                                        <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
                                          <circle cx="32" cy="32" r="32" fill="#f0f0f0"/>
                                          <text x="32" y="32" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="12" fill="#666">
                                            ${candidate.name.charAt(0)}
                                          </text>
                                        </svg>
                                      `)}`;
                                    }}
                                  />
                                )}
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-800">{candidate.name}</h3>
                                  {totalVotes > 0 && (
                                    <div className="mt-2">
                                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>{candidate.voteCount} votes</span>
                                        <span>{getVotePercentage(candidate.voteCount)}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${getVotePercentage(candidate.voteCount)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {!hasVoted && selectedCandidate === index && (
                                  <div className="text-blue-600 font-semibold">✓ Selected</div>
                                )}
                                {hasVoted && userVoteChoice?.candidateIndex === index && (
                                  <div className="text-green-600 font-semibold">✅ Your Vote</div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-300">Loading candidates...</p>
                      )}

                      {/* Voting Button */}
                      {!hasVoted && selectedElection?.canVote && remainingTime > 0 && (
                        <div className="mt-8 text-center">
                          <button
                            onClick={voteHandler}
                            disabled={selectedCandidate === '' || loading}
                            className={`px-8 py-3 rounded-lg font-semibold transition ${
                              selectedCandidate === '' || loading
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {loading ? 'Submitting Vote...' : '🗳️ Submit Vote'}
                          </button>
                        </div>
                      )}

                      {hasVoted && (
                        <div className="mt-8 text-center">
                          <button
                            onClick={() => navigate('/results')}
                            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          >
                            View Full Results
                          </button>
                        </div>
                      )}

                      {message && (
                        <motion.div
                          className="mt-6 text-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <p className="text-lg font-medium text-white">{message}</p>
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
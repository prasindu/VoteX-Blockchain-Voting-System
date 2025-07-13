import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useElectionStore from '../../store/useElectionStore';
import { useNavigate } from 'react-router-dom';
import { Upload, Calendar, Users, Vote, Image, Wallet, LogOut } from 'lucide-react';
import { uploadToIPFS, getIPFSURL } from '../ipfs'; // Assuming this is the correct path

function Admin() {
  const navigate = useNavigate();

  // Get all needed values and functions from the store
  const {
    // Wallet state
    isConnected,
    walletAddress,
    contract,
    error,
    isLoading,
    
    // Form state
    electionName,
    electionImage,
    startTime,
    endTime,
    isPublic,
    allowedVoters,
    candidateInputs,
    
    // Actions
    connectWallet,
    disconnectWallet,
    createElection,
    
    // Form setters
    setElectionName,
    setElectionImage,
    setStartTime,
    setEndTime,
    setIsPublic,
    setAllowedVoters,
    setError,
    
    // Candidate management
    addCandidate,
    removeCandidate,
    updateCandidate,
    setCandidateInputs,
    
    // Other
    resetForm
  } = useElectionStore();

  // Local state for upload progress
  const [uploadProgress, setUploadProgress] = useState({});
  const [electionImagePreview, setElectionImagePreview] = useState('');

  // Initialize the store on mount
  useEffect(() => {
    useElectionStore.getState().initialize?.();
  }, []);

  // Set election image preview when electionImage changes
  useEffect(() => {
    if (electionImage) {
      setElectionImagePreview(getIPFSURL(electionImage));
    } else {
      setElectionImagePreview('');
    }
  }, [electionImage]);

  const handleImageUpload = async (file, isElection = false, candidateIndex = null) => {
    if (!file) return;
    
    try {
      const uploadKey = isElection ? 'election' : `candidate-${candidateIndex}`;
      setUploadProgress(prev => ({ ...prev, [uploadKey]: true }));

      // Upload to IPFS
      const ipfsHash = await uploadToIPFS(file);
      
      if (isElection) {
        setElectionImage(ipfsHash);
      } else if (candidateIndex !== null) {
        updateCandidate(candidateIndex, 'image', ipfsHash);
      }

      setUploadProgress(prev => ({ ...prev, [uploadKey]: false }));
    } catch (err) {
      console.error('IPFS upload error:', err);
      setError('Failed to upload image to IPFS');
      setUploadProgress(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleCreateElection = async () => {
    try {
      if (!isConnected) {
        setError('Please connect your wallet');
        return;
      }
      
      if (!contract) {
        setError('Contract not loaded');
        return;
      }

      if (!electionName || !startTime || !endTime || candidateInputs.length === 0) {
        setError('All fields are required');
        return;
      }

      // Check if all candidates have names
      if (candidateInputs.some(c => !c.name.trim())) {
        setError('All candidates need names');
        return;
      }

      const success = await createElection();
      
      if (success) {
        // Reset local state as well
        setElectionImagePreview('');
        setUploadProgress({});
        navigate('/vote');
      }
    } catch (err) {
      console.error('Election creation error:', err);
      setError(err.reason || err.message || 'Election creation failed');
    }
  };

  // Format wallet address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Get candidate image preview URL
  const getCandidateImagePreview = (candidate) => {
    return candidate.image ? getIPFSURL(candidate.image) : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-gray-950 to-indigo-950 p-6">
         <div className="fixed inset-0 overflow-hidden pointer-events-none">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-purple-300 rounded-full opacity-10" 
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
              
            </div>
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-blue-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-500/30 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 to-indigo-900 p-8"> {/* Vibrant purple-to-indigo gradient */}
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <Vote className="w-16 h-16 mx-auto mb-4 text-purple-200" /> {/* Icon color */}
                <h2 className="text-4xl font-bold text-white mb-2">Create Election</h2>
                <p className="text-indigo-200">Set up a new democratic voting process</p> {/* Subtitle color */}
              </div>
              
              {/* Wallet Status */}
              {isConnected && (
                <div className="flex items-center space-x-4 bg-gradient-to-r from-indigo-800 to-blue-900 rounded-xl p-4"> {/* Complementary dark gradient */}
                  <div className="text-right">
                    <p className="text-white text-sm">Connected Wallet</p>
                    <p className="text-purple-200 font-mono text-sm">{formatAddress(walletAddress)}</p> {/* Wallet address color */}
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="p-2 text-purple-200 hover:bg-white/20 rounded-lg transition-colors duration-300"
                    title="Disconnect Wallet"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            {!isConnected && (
              <motion.button
                onClick={connectWallet}
                disabled={isLoading}
                className={`w-full py-4 text-white rounded-xl mb-6 font-semibold text-lg transition-all duration-300 shadow-lg flex items-center justify-center ${
                  isLoading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 shadow-blue-500/30' // Vibrant gradient with shadow
                }`}
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5 mr-2" />
                    Connect Wallet
                  </>
                )}
              </motion.button>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-xl mb-6"
              >
                {error}
              </motion.div>
            )}

            {isConnected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                {/* Election Details */}
                <div className="bg-blue-900/20 rounded-2xl p-6 border border-blue-700/30"> {/* Translucent blue background with blue border */}
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-purple-300" /> {/* Icon color */}
                    Election Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-2"> {/* Label color */}
                        Election Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter election name"
                        value={electionName}
                        onChange={(e) => setElectionName(e.target.value)}
                        className="w-full px-4 py-3 bg-blue-900/30 border border-blue-700/40 rounded-xl text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        Election Image
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e.target.files[0], true)}
                          className="hidden"
                          id="election-image"
                          disabled={uploadProgress.election}
                        />
                        <label
                          htmlFor="election-image"
                          className={`flex items-center px-4 py-3 border border-blue-700/40 rounded-xl text-white cursor-pointer transition-all duration-300 ${
                            uploadProgress.election
                              ? 'bg-gray-600 cursor-not-allowed'
                              : 'bg-blue-800/30 hover:bg-blue-700/50' // Translucent blue button
                          }`}
                        >
                          {uploadProgress.election ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Image className="w-4 h-4 mr-2 text-purple-300" /> {/* Icon color */}
                              Upload Image
                            </>
                          )}
                        </label>
                        {electionImagePreview && (
                          <img
                            src={electionImagePreview}
                            alt="Preview"
                            className="w-12 h-12 rounded-lg object-cover border border-purple-500/50" // Border for image preview
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-4 py-3 bg-blue-900/30 border border-blue-700/40 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-4 py-3 bg-blue-900/30 border border-blue-700/40 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center text-white">
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={() => setIsPublic(!isPublic)}
                        className="mr-3 w-4 h-4 rounded border-purple-400 text-purple-500 focus:ring-purple-400" // Checkbox styling
                      />
                      <span className="text-sm font-medium">Public Election (anyone can vote)</span>
                    </label>
                  </div>
                </div>

                {/* Allowed Voters */}
                {!isPublic && (
                  <div className="bg-blue-900/20 rounded-2xl p-6 border border-blue-700/30">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-purple-300" />
                      Allowed Voters
                    </h3>
                    <textarea
                      placeholder="Enter wallet addresses (one per line)&#10;0x1234...&#10;0x5678..."
                      value={allowedVoters}
                      onChange={(e) => setAllowedVoters(e.target.value)}
                      rows="4"
                      className="w-full px-4 py-3 bg-blue-900/30 border border-blue-700/40 rounded-xl text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
                    />
                  </div>
                )}

                {/* Candidates */}
                <div className="bg-blue-900/20 rounded-2xl p-6 border border-blue-700/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white flex items-center">
                      <Users className="w-5 h-5 mr-2 text-purple-300" />
                      Candidates
                    </h3>
                    <button
                      onClick={addCandidate}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg transition-colors duration-300 text-sm font-medium shadow-md" // Distinct "add" button
                    >
                      + Add Candidate
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {candidateInputs.map((candidate, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-4 p-4 bg-blue-800/30 rounded-xl border border-blue-700/30" // Candidate item styling
                      >
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder={`Candidate ${index + 1} name`}
                            value={candidate.name}
                            onChange={(e) => updateCandidate(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 bg-blue-900/30 border border-blue-700/40 rounded-lg text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e.target.files[0], false, index)}
                            className="hidden"
                            id={`candidate-image-${index}`}
                            disabled={uploadProgress[`candidate-${index}`]}
                          />
                          <label
                            htmlFor={`candidate-image-${index}`}
                            className={`flex items-center px-3 py-2 border border-blue-700/40 rounded-lg text-white cursor-pointer transition-all duration-300 text-sm ${
                              uploadProgress[`candidate-${index}`]
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-blue-800/30 hover:bg-blue-700/50'
                            }`}
                          >
                            {uploadProgress[`candidate-${index}`] ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-1 text-purple-300" />
                                Image
                              </>
                            )}
                          </label>
                          {getCandidateImagePreview(candidate) && (
                            <img
                              src={getCandidateImagePreview(candidate)}
                              alt={`${candidate.name} preview`}
                              className="w-8 h-8 rounded-lg object-cover border border-purple-500/50"
                            />
                          )}
                        </div>
                        
                        {candidateInputs.length > 1 && (
                          <button
                            onClick={() => removeCandidate(index)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300 text-sm shadow-md" // Red for remove
                          >
                            Remove
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Create Button */}
                <motion.button
                  onClick={handleCreateElection}
                  disabled={isLoading || Object.values(uploadProgress).some(Boolean)}
                  className={`w-full py-4 font-bold text-white rounded-xl text-lg transition-all duration-300 ${
                    isLoading || Object.values(uploadProgress).some(Boolean)
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 shadow-lg shadow-purple-500/30 hover:shadow-xl' // Stronger main button gradient and shadow
                  }`}
                  whileHover={!isLoading && !Object.values(uploadProgress).some(Boolean) ? { scale: 1.02 } : {}}
                  whileTap={!isLoading && !Object.values(uploadProgress).some(Boolean) ? { scale: 0.98 } : {}}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Election...
                    </span>
                  ) : Object.values(uploadProgress).some(Boolean) ? (
                    'Uploading Images...'
                  ) : (
                    'Create Election'
                  )}
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Admin;
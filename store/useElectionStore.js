import { create } from 'zustand';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x8EdaB382912bA976e07F3EbBA41C9aE42f45207d';

// Your updated ABI (add the new functions)
const ELECTION_ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "electionId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "name",
				"type": "string"
			}
		],
		"name": "ElectionCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "electionId",
				"type": "uint256"
			}
		],
		"name": "ElectionEnded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "electionId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "voter",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "candidateIndex",
				"type": "uint256"
			}
		],
		"name": "VoteCasted",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "admin",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_electionId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_voter",
				"type": "address"
			}
		],
		"name": "canVote",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_electionIpfsHash",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_startTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_endTime",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "_isPublic",
				"type": "bool"
			},
			{
				"internalType": "address[]",
				"name": "_allowedVoters",
				"type": "address[]"
			},
			{
				"internalType": "string[]",
				"name": "_candidateNames",
				"type": "string[]"
			},
			{
				"internalType": "string[]",
				"name": "_candidateIpfsHashes",
				"type": "string[]"
			}
		],
		"name": "createElection",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "electionCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "elections",
		"outputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "electionIpfsHash",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "startTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "endTime",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isPublic",
				"type": "bool"
			},
			{
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "ended",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "totalEligibleVoters",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_electionId",
				"type": "uint256"
			}
		],
		"name": "endElection",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_electionId",
				"type": "uint256"
			}
		],
		"name": "getCandidates",
		"outputs": [
			{
				"internalType": "string[]",
				"name": "names",
				"type": "string[]"
			},
			{
				"internalType": "string[]",
				"name": "imageHashes",
				"type": "string[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getElectionCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_electionId",
				"type": "uint256"
			}
		],
		"name": "getElectionInfo",
		"outputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "imageHash",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "startTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "endTime",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isPublic",
				"type": "bool"
			},
			{
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "ended",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "candidateCount",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_electionId",
				"type": "uint256"
			}
		],
		"name": "getElectionResults",
		"outputs": [
			{
				"internalType": "string[]",
				"name": "candidateNames",
				"type": "string[]"
			},
			{
				"internalType": "string[]",
				"name": "candidateImages",
				"type": "string[]"
			},
			{
				"internalType": "uint256[]",
				"name": "voteCounts",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_electionId",
				"type": "uint256"
			}
		],
		"name": "getTotalVotes",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "totalVotes",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_electionId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_voter",
				"type": "address"
			}
		],
		"name": "getVoterChoice",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "candidateIndex",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "candidateName",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_electionId",
				"type": "uint256"
			}
		],
		"name": "getVoterParticipation",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "totalEligibleVoters",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "votesCast",
				"type": "uint256"
			},
			{
				"internalType": "address[]",
				"name": "allowedVoters",
				"type": "address[]"
			},
			{
				"internalType": "address[]",
				"name": "actualVoters",
				"type": "address[]"
			},
			{
				"internalType": "bool",
				"name": "isPublic",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_electionId",
				"type": "uint256"
			},
			{
				"internalType": "address[]",
				"name": "voterAddresses",
				"type": "address[]"
			}
		],
		"name": "getVoterStatus",
		"outputs": [
			{
				"internalType": "bool[]",
				"name": "hasVotedStatus",
				"type": "bool[]"
			},
			{
				"internalType": "uint256[]",
				"name": "voteChoices",
				"type": "uint256[]"
			},
			{
				"internalType": "bool[]",
				"name": "isEligible",
				"type": "bool[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_electionId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_voter",
				"type": "address"
			}
		],
		"name": "hasVoterVoted",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "isAllowedVoter",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_electionId",
				"type": "uint256"
			}
		],
		"name": "isElectionActive",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_electionId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_candidateIndex",
				"type": "uint256"
			}
		],
		"name": "vote",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

const useElectionStore = create((set, get) => ({
  // State
  provider: null,
  signer: null,
  walletAddress: '',
  isConnected: false,
  contract: null,
  isLoading: false,
  error: '',
  isCorrectNetwork: false,

  // Form State
  electionName: '',
  electionImage: '',
  startTime: '',
  endTime: '',
  isPublic: false,
  allowedVoters: '',
  candidateInputs: [{ name: '', image: '' }],

  // Actions
  connectWallet: async () => {
    try {
      set({ isLoading: true, error: '' });

      if (!window.ethereum) {
        throw new Error('Please install MetaMask');
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Initialize provider (ethers v5)
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      // Check network (optional - you can remove this if not needed)
      const network = await provider.getNetwork();
      console.log('Connected to network:', network);

      // Initialize contract
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ELECTION_ABI, signer);

      set({
        provider,
        signer,
        walletAddress: address,
        contract,
        isConnected: true,
        isLoading: false,
        isCorrectNetwork: true
      });

    } catch (err) {
      console.error('Connection error:', err);
      set({ 
        error: err.message || 'Failed to connect wallet',
        isLoading: false 
      });
    }
  },

  // Disconnect wallet
  disconnectWallet: () => {
    set({
      provider: null,
      signer: null,
      walletAddress: '',
      isConnected: false,
      contract: null,
      isCorrectNetwork: false
    });
  },

  // New function to get voter participation data
  getVoterParticipation: async (electionId) => {
    try {
      const { contract } = get();
      if (!contract) throw new Error('Contract not initialized');

      const participation = await contract.getVoterParticipation(electionId);
      
      return {
        totalEligibleVoters: participation.totalEligibleVoters.toNumber(),
        votesCast: participation.votesCast.toNumber(),
        allowedVoters: participation.allowedVoters,
        actualVoters: participation.actualVoters,
        isPublic: participation.isPublic
      };
    } catch (err) {
      console.error('Error fetching voter participation:', err);
      throw err;
    }
  },

  // New function to get voter status details
  getVoterStatus: async (electionId, voterAddresses) => {
    try {
      const { contract } = get();
      if (!contract) throw new Error('Contract not initialized');

      const status = await contract.getVoterStatus(electionId, voterAddresses);
      
      return {
        hasVotedStatus: status.hasVotedStatus,
        voteChoices: status.voteChoices.map(choice => choice.toNumber()),
        isEligible: status.isEligible
      };
    } catch (err) {
      console.error('Error fetching voter status:', err);
      throw err;
    }
  },

  // New function to get complete voter data for results page
  getCompleteVoterData: async (electionId) => {
    try {
      const { contract } = get();
      if (!contract) throw new Error('Contract not initialized');

      // Get participation data
      const participation = await get().getVoterParticipation(electionId);
      
      let voterDetails = [];
      
      if (participation.isPublic) {
        // For public elections, we can only show who actually voted
        voterDetails = participation.actualVoters.map((address, index) => ({
          address,
          hasVoted: true,
          status: 'Voted',
          index: index + 1
        }));
      } else {
        // For private elections, show all allowed voters and their status
        const voterStatus = await get().getVoterStatus(electionId, participation.allowedVoters);
        
        voterDetails = participation.allowedVoters.map((address, index) => ({
          address,
          hasVoted: voterStatus.hasVotedStatus[index],
          status: voterStatus.hasVotedStatus[index] ? 'Voted' : 'Not Voted',
          index: index + 1,
          isEligible: voterStatus.isEligible[index]
        }));
      }

      return {
        totalEligibleVoters: participation.isPublic ? 'Unlimited (Public)' : participation.totalEligibleVoters,
        votesCast: participation.votesCast,
        isPublic: participation.isPublic,
        voterDetails
      };
    } catch (err) {
      console.error('Error fetching complete voter data:', err);
      throw err;
    }
  },

  createElection: async () => {
    try {
      const { contract, electionName, electionImage, startTime, endTime, isPublic, allowedVoters, candidateInputs } = get();

      // Enhanced validation
      if (!contract) throw new Error('Contract not initialized');
      if (!electionName?.trim()) throw new Error('Election name is required');
      if (!startTime) throw new Error('Start time is required');
      if (!endTime) throw new Error('End time is required');
      if (!candidateInputs?.length) throw new Error('At least one candidate is required');
      
      // Filter out empty candidates and validate
      const validCandidates = candidateInputs.filter(c => c.name?.trim());
      if (validCandidates.length === 0) throw new Error('At least one candidate with a name is required');
      if (validCandidates.some(c => c.name.trim().length > 100)) throw new Error('Candidate names must be under 100 characters');

      set({ isLoading: true, error: '' });

      // Convert dates with better validation
      const now = Math.floor(Date.now() / 1000);
      const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);
      
      if (isNaN(startTimestamp) || isNaN(endTimestamp)) {
        throw new Error('Invalid date format');
      }
      
      // FIXED: More lenient time validation - allow 30 seconds buffer instead of 60
      if (startTimestamp <= now + 30) {
        throw new Error(`Start time must be in the future. Current time: ${new Date(now * 1000).toLocaleString()}, Start time: ${new Date(startTimestamp * 1000).toLocaleString()}`);
      }
      
      if (endTimestamp <= startTimestamp + 300) { // Must be at least 5 minutes long
        throw new Error('Election must run for at least 5 minutes');
      }

      // Process voters with enhanced validation
      let voters = [];
      if (!isPublic) {
        const voterAddresses = allowedVoters
          .split('\n')
          .map(v => v.trim())
          .filter(v => v);
        
        if (voterAddresses.length === 0) {
          throw new Error('Private elections need at least one voter address');
        }
        
        if (voterAddresses.length > 100) {
          throw new Error('Maximum 100 voters allowed for private elections');
        }

        for (const addr of voterAddresses) {
          if (!ethers.utils.isAddress(addr)) {
            throw new Error(`Invalid wallet address: ${addr}`);
          }
          if (!voters.includes(addr.toLowerCase())) {
            voters.push(addr); // Keep original case
          }
        }
      }

      // Prepare candidate data
      const candidateNames = validCandidates.map(c => c.name.trim());
      const candidateImages = validCandidates.map(c => c.image?.trim() || '');

      // Check for duplicate candidate names
      const nameSet = new Set(candidateNames.map(n => n.toLowerCase()));
      if (nameSet.size !== candidateNames.length) {
        throw new Error('Candidate names must be unique');
      }

      console.log('Creating election with:', {
        name: electionName.trim(),
        image: electionImage?.trim() || '',
        startTime: startTimestamp,
        endTime: endTimestamp,
        isPublic,
        voters: voters.length,
        candidates: candidateNames.length,
        currentTime: now,
        timeBuffer: startTimestamp - now
      });

      // Estimate gas first
      let gasEstimate;
      try {
        gasEstimate = await contract.estimateGas.createElection(
          electionName.trim(),
          electionImage?.trim() || '',
          startTimestamp,
          endTimestamp,
          isPublic,
          voters,
          candidateNames,
          candidateImages
        );
        console.log('Gas estimate:', gasEstimate.toString());
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        throw new Error(`Transaction simulation failed: ${gasError.reason || gasError.message}`);
      }

      // Send transaction with proper gas settings
      const tx = await contract.createElection(
        electionName.trim(),
        electionImage?.trim() || '',
        startTimestamp,
        endTimestamp,
        isPublic,
        voters,
        candidateNames,
        candidateImages,
        {
          gasLimit: gasEstimate.mul(120).div(100), // 20% buffer
          // Remove manual gas price to let wallet handle it
        }
      );

      console.log('Transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      // FIXED: Reset form on success - corrected typo
      set({
        electionName: '',
        electionImage: '',
        startTime: '',
        endTime: '',
        isPublic: false,
        allowedVoters: '',
        candidateInputs: [{ name: '', image: '' }], // Fixed: was "candidateInputts"
        isLoading: false,
        error: ''
      });

      return true;
    } catch (err) {
      console.error('Election creation error:', err);
      
      let errorMessage = 'Election creation failed';
      
      // Better error handling
      if (err.reason) {
        errorMessage = err.reason;
      } else if (err.message) {
        if (err.message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected by user';
        } else if (err.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas';
        } else if (err.message.includes('gas')) {
          errorMessage = 'Gas estimation failed - check your inputs';
        } else {
          errorMessage = err.message;
        }
      }
      
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      return false;
    }
  },

  // Form setters
  setElectionName: (val) => set({ electionName: val }),
  setElectionImage: (val) => set({ electionImage: val }),
  setStartTime: (val) => set({ startTime: val }),
  setEndTime: (val) => set({ endTime: val }),
  setIsPublic: (val) => set({ isPublic: val }),
  setAllowedVoters: (val) => set({ allowedVoters: val }),
  setError: (msg) => set({ error: msg }),
  setIsLoading: (val) => set({ isLoading: val }),

  // Candidate management
  addCandidate: () => set(state => ({
    candidateInputs: [...state.candidateInputs, { name: '', image: '' }]
  })),
  removeCandidate: (index) => set(state => ({
    candidateInputs: state.candidateInputs.filter((_, i) => i !== index)
  })),
  updateCandidate: (index, field, value) => set(state => {
    const newInputs = [...state.candidateInputs];
    newInputs[index][field] = value;
    return { candidateInputs: newInputs };
  }),
  setCandidateInputs: (inputs) => set({ candidateInputs: inputs }),

  // Reset form
  resetForm: () => set({
    electionName: '',
    electionImage: '',
    startTime: '',
    endTime: '',
    isPublic: false,
    allowedVoters: '',
    candidateInputs: [{ name: '', image: '' }],
    error: ''
  }),

  // Initialize store (if needed)
  initialize: () => {
    // Check if wallet was previously connected
    if (window.ethereum && window.ethereum.selectedAddress) {
      get().connectWallet();
    }
  },

  // Helper function to get current time for debugging
  getCurrentTime: () => {
    const now = Math.floor(Date.now() / 1000);
    return {
      timestamp: now,
      readable: new Date(now * 1000).toLocaleString()
    };
  }
}));

export default useElectionStore;
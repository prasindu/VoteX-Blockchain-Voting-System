import { create } from 'zustand';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0xCcFEB176D51C3974eaAf41621C8276A6eE2d9099';

// You need to add your actual ABI here - this is just a placeholder
const ELECTION_ABI = [
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
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
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

  createElection: async () => {
    try {
      const { contract, electionName, electionImage, startTime, endTime, isPublic, allowedVoters, candidateInputs } = get();

      // Validation
      if (!electionName) throw new Error('Election name is required');
      if (candidateInputs.some(c => !c.name.trim())) throw new Error('All candidates need names');

      set({ isLoading: true, error: '' });

      // Convert dates
      const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);
      if (startTimestamp >= endTimestamp) throw new Error('End time must be after start time');

      // Validate voters
      const voters = isPublic ? [] : allowedVoters.split('\n')
        .map(v => v.trim())
        .filter(v => {
          if (!v) return false;
          if (!ethers.utils.isAddress(v)) throw new Error(`Invalid address: ${v}`);
          return true;
        });

      // Prepare candidates
      const candidateNames = candidateInputs.map(c => c.name.trim());
      const candidateImages = candidateInputs.map(c => c.image || '');

      // Send transaction
      const tx = await contract.createElection(
        electionName,
        electionImage || '',
        startTimestamp,
        endTimestamp,
        isPublic,
        voters,
        candidateNames,
        candidateImages,
		{
          gasLimit: 500000, // Set a manual gas limit
        }
      );

      await tx.wait();
      
      // Reset form
      set({
        electionName: '',
        electionImage: '',
        startTime: '',
        endTime: '',
        isPublic: false,
        allowedVoters: '',
        candidateInputs: [{ name: '', image: '' }],
        isLoading: false
      });

      return true;
    } catch (err) {
      set({ 
        error: err.reason || err.message || 'Transaction failed',
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
  }
}));

export default useElectionStore;
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    address public admin;
    uint public electionCount;
    
    struct Candidate {
        string name;
        string ipfsHash; // IPFS hash of candidate image
        uint voteCount;
    }
    
    struct Election {
        string name;
        string electionIpfsHash; // IPFS hash of election image
        uint startTime;
        uint endTime;
        bool isPublic;
        address creator;
        address[] allowedVoters;
        Candidate[] candidates;
        mapping(address => bool) hasVoted;
        mapping(address => uint) voterChoice;
        bool ended;
    }
    
    mapping(uint => Election) public elections;
    mapping(uint => mapping(address => bool)) public isAllowedVoter;
    
    event ElectionCreated(uint indexed electionId, address indexed creator, string name);
    event VoteCasted(uint indexed electionId, address indexed voter, uint candidateIndex);
    event ElectionEnded(uint indexed electionId);
    
    modifier onlyElectionCreator(uint _electionId) {
        require(elections[_electionId].creator == msg.sender, "Only election creator");
        _;
    }
    
    modifier onlyAuthorizedViewer(uint _electionId) {
        Election storage e = elections[_electionId];
        require(
            msg.sender == e.creator || isAllowedVoter[_electionId][msg.sender] || 
            (e.isPublic && e.hasVoted[msg.sender]),
            "Not authorized"
        );
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    function createElection(
        string memory _name,
        string memory _electionIpfsHash,
        uint _startTime,
        uint _endTime,
        bool _isPublic,
        address[] memory _allowedVoters,
        string[] memory _candidateNames,
        string[] memory _candidateIpfsHashes
    ) public {
        require(_startTime > block.timestamp, "Start time must be in future");
        require(_endTime > _startTime, "End time must be after start");
        require(_candidateNames.length > 0, "Need at least one candidate");
        require(_candidateNames.length <= 20, "Max 20 candidates");
        require(_candidateNames.length == _candidateIpfsHashes.length, "Mismatched input");
        require(_isPublic || _allowedVoters.length <= 100, "Max 100 voters for private");
        
        uint currentElectionId = electionCount++;
        Election storage e = elections[currentElectionId];
        
        e.name = _name;
        e.electionIpfsHash = _electionIpfsHash;
        e.startTime = _startTime;
        e.endTime = _endTime;
        e.isPublic = _isPublic;
        e.creator = msg.sender;
        e.allowedVoters = _allowedVoters;
        
        for (uint i = 0; i < _candidateNames.length; i++) {
            e.candidates.push(Candidate({
                name: _candidateNames[i],
                ipfsHash: _candidateIpfsHashes[i],
                voteCount: 0
            }));
        }
        
        if (!_isPublic) {
            for (uint i = 0; i < _allowedVoters.length; i++) {
                isAllowedVoter[currentElectionId][_allowedVoters[i]] = true;
            }
        }
        
        emit ElectionCreated(currentElectionId, msg.sender, _name);
    }
    
    function vote(uint _electionId, uint _candidateIndex) public {
        Election storage e = elections[_electionId];
        
        require(block.timestamp >= e.startTime && block.timestamp <= e.endTime, "Election not active");
        require(_candidateIndex < e.candidates.length, "Invalid candidate");
        require(!e.hasVoted[msg.sender], "Already voted");
        
        if (!e.isPublic) {
            require(isAllowedVoter[_electionId][msg.sender], "Not allowed to vote");
        }
        
        e.hasVoted[msg.sender] = true;
        e.voterChoice[msg.sender] = _candidateIndex;
        e.candidates[_candidateIndex].voteCount++;
        
        emit VoteCasted(_electionId, msg.sender, _candidateIndex);
    }
    
    function endElection(uint _electionId) public onlyElectionCreator(_electionId) {
        Election storage e = elections[_electionId];
        require(block.timestamp > e.endTime, "Election period not ended yet");
        require(!e.ended, "Election already ended");
        
        e.ended = true;
        emit ElectionEnded(_electionId);
    }
    
    function getElectionResults(uint _electionId) 
        public 
        view 
        onlyAuthorizedViewer(_electionId) 
        returns (
            string[] memory candidateNames,
            string[] memory candidateImages,
            uint[] memory voteCounts
        ) 
    {
        Election storage e = elections[_electionId];
        require(block.timestamp > e.endTime || e.ended, "Results not available yet");
        
        uint candidateCount = e.candidates.length;
        candidateNames = new string[](candidateCount);
        candidateImages = new string[](candidateCount);
        voteCounts = new uint[](candidateCount);
        
        for (uint i = 0; i < candidateCount; i++) {
            candidateNames[i] = e.candidates[i].name;
            candidateImages[i] = e.candidates[i].ipfsHash;
            voteCounts[i] = e.candidates[i].voteCount;
        }
    }
    
    function getElectionInfo(uint _electionId) 
        public 
        view 
        returns (
            string memory name,
            string memory imageHash,
            uint startTime,
            uint endTime,
            bool isPublic,
            address creator,
            bool ended,
            uint candidateCount
        ) 
    {
        Election storage e = elections[_electionId];
        return (
            e.name,
            e.electionIpfsHash, // ✅ Fixed: previously was imageHash
            e.startTime,
            e.endTime,
            e.isPublic,
            e.creator,
            e.ended,
            e.candidates.length
        );
    }
    
    function getCandidates(uint _electionId) 
        public 
        view 
        returns (
            string[] memory names,
            string[] memory imageHashes
        ) 
    {
        Election storage e = elections[_electionId];
        uint candidateCount = e.candidates.length;
        
        names = new string[](candidateCount);
        imageHashes = new string[](candidateCount);
        
        for (uint i = 0; i < candidateCount; i++) {
            names[i] = e.candidates[i].name;
            imageHashes[i] = e.candidates[i].ipfsHash; // ✅ Fixed: was imageHash
        }
    }
    
    function hasVoterVoted(uint _electionId, address _voter) 
        public 
        view 
        returns (bool) 
    {
        return elections[_electionId].hasVoted[_voter];
    }
    
    function getVoterChoice(uint _electionId, address _voter) 
        public 
        view 
        onlyAuthorizedViewer(_electionId)
        returns (uint candidateIndex, string memory candidateName) 
    {
        Election storage e = elections[_electionId];
        require(e.hasVoted[_voter], "Voter has not voted");
        
        candidateIndex = e.voterChoice[_voter];
        candidateName = e.candidates[candidateIndex].name;
    }
    
    function isElectionActive(uint _electionId) public view returns (bool) {
        Election storage e = elections[_electionId];
        return (block.timestamp >= e.startTime && block.timestamp <= e.endTime && !e.ended);
    }
    
    function canVote(uint _electionId, address _voter) public view returns (bool) {
        Election storage e = elections[_electionId];
        
        if (e.hasVoted[_voter] || !isElectionActive(_electionId)) {
            return false;
        }
        
        if (e.isPublic) {
            return true;
        }
        
        return isAllowedVoter[_electionId][_voter];
    }
    
    function getTotalVotes(uint _electionId) 
        public 
        view 
        onlyAuthorizedViewer(_electionId)
        returns (uint totalVotes) 
    {
        Election storage e = elections[_electionId];
        for (uint i = 0; i < e.candidates.length; i++) {
            totalVotes += e.candidates[i].voteCount;
        }
    }

    function getElectionCount() public view returns (uint) {
        return electionCount;
    }
}

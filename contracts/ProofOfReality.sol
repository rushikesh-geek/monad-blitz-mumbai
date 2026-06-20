// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Hackathon-grade, not audited. Production would use checks-effects-interactions
/// strictly and a pull-payment pattern instead of push-transfer in a loop.
contract ProofOfReality {
    uint256 public constant MIN_AGENTS = 3;
    uint256 public constant VOTE_WINDOW = 30; // seconds, demo pacing
    int256  public constant REPUTATION_STEP = 5;
    int256  public constant STARTING_REPUTATION = 100;

    struct Observation {
        address reporter;
        string  claimType;
        string  description;
        int256  lat;            // degrees * 1e6
        int256  lng;
        uint256 timestamp;
        uint8   status;          // 0 Pending, 1 Confirmed, 2 Disputed
        uint256 confirmStake;
        uint256 disputeStake;
        bool    finalized;
        uint256 firstVoteTimestamp;
        uint256 voteCount;
    }

    struct AgentProfile {
        bool    registered;
        string  persona;
        int256  reputation;
        uint256 totalVotes;
        uint256 correctVotes;
    }

    uint256 public nextObservationId;
    mapping(uint256 => Observation) public observations;
    mapping(address => AgentProfile) public agents;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public voteChoice;
    mapping(uint256 => mapping(address => uint256)) public voteStake;
    mapping(uint256 => address[]) public observationVoters;

    event AgentRegistered(address indexed agent, string persona);
    event ObservationSubmitted(uint256 indexed id, address indexed reporter, string claimType, string description, int256 lat, int256 lng, uint256 timestamp);
    event AgentVoted(uint256 indexed id, address indexed agent, bool confirm, uint256 stake);
    event ConsensusReached(uint256 indexed id, bool verifiedTrue, uint256 confidenceBps);
    event ReputationUpdated(address indexed agent, int256 newReputation);

    function registerAgent(string calldata persona) external {
        require(!agents[msg.sender].registered, "already registered");
        agents[msg.sender] = AgentProfile(true, persona, STARTING_REPUTATION, 0, 0);
        emit AgentRegistered(msg.sender, persona);
    }

    function submitObservation(
        string calldata claimType,
        string calldata description,
        int256 lat,
        int256 lng
    ) external returns (uint256 observationId) {
        observationId = nextObservationId++;
        observations[observationId] = Observation(
            msg.sender, claimType, description, lat, lng, block.timestamp,
            0, 0, 0, false, 0, 0
        );
        emit ObservationSubmitted(observationId, msg.sender, claimType, description, lat, lng, block.timestamp);
    }

    function agentVote(uint256 observationId, bool confirm) external payable {
        require(agents[msg.sender].registered, "not a registered agent");
        Observation storage obs = observations[observationId];
        require(obs.reporter != address(0), "no such observation");
        require(!obs.finalized, "already finalized");
        require(!hasVoted[observationId][msg.sender], "already voted");
        require(msg.value > 0, "must stake something");

        hasVoted[observationId][msg.sender] = true;
        voteChoice[observationId][msg.sender] = confirm;
        voteStake[observationId][msg.sender] = msg.value;
        observationVoters[observationId].push(msg.sender);

        if (obs.voteCount == 0) obs.firstVoteTimestamp = block.timestamp;
        obs.voteCount += 1;

        if (confirm) obs.confirmStake += msg.value;
        else obs.disputeStake += msg.value;

        emit AgentVoted(observationId, msg.sender, confirm, msg.value);
    }

    function finalizeConsensus(uint256 observationId) external {
        Observation storage obs = observations[observationId];
        require(obs.reporter != address(0), "no such observation");
        require(!obs.finalized, "already finalized");
        require(
            obs.voteCount >= MIN_AGENTS ||
            (obs.firstVoteTimestamp != 0 && block.timestamp >= obs.firstVoteTimestamp + VOTE_WINDOW),
            "quorum not reached"
        );

        uint256 totalStake = obs.confirmStake + obs.disputeStake;
        require(totalStake > 0, "no votes to finalize");

        bool verifiedTrue = obs.confirmStake >= obs.disputeStake;
        uint256 confidenceBps = verifiedTrue
            ? (obs.confirmStake * 10000) / totalStake
            : (obs.disputeStake * 10000) / totalStake;

        obs.status = verifiedTrue ? 1 : 2;
        obs.finalized = true;

        uint256 winningStake = verifiedTrue ? obs.confirmStake : obs.disputeStake;
        uint256 losingPool = totalStake - winningStake;
        address[] memory voters = observationVoters[observationId];

        for (uint256 i = 0; i < voters.length; i++) {
            address voter = voters[i];
            bool votedConfirm = voteChoice[observationId][voter];
            uint256 stake = voteStake[observationId][voter];
            AgentProfile storage profile = agents[voter];
            profile.totalVotes += 1;

            if (votedConfirm == verifiedTrue) {
                profile.correctVotes += 1;
                profile.reputation += REPUTATION_STEP;
                uint256 payout = stake + (winningStake > 0 ? (losingPool * stake) / winningStake : 0);
                payable(voter).transfer(payout);
            } else {
                profile.reputation -= REPUTATION_STEP;
            }
            emit ReputationUpdated(voter, profile.reputation);
        }

        emit ConsensusReached(observationId, verifiedTrue, confidenceBps);
    }

    receive() external payable {}
}

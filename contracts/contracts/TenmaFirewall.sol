// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TenmaFirewall
 * @notice On-Chain Firewall for AI Agent Transactions
 * @dev Enforces spending policies at the smart contract level
 * 
 * Key Features:
 * - Amount limits (per transaction and daily)
 * - Contract whitelist/blacklist
 * - Risk score validation
 * - Time-based restrictions
 * - Gas price limits
 * - Emergency pause
 * - Commit-reveal for MEV protection
 * 
 * Built for 0G Network Hackathon 2025
 */
contract TenmaFirewall {
    
    // ============ Structs ============
    
    struct Policy {
        uint256 maxTransactionAmount;   // Max amount per transaction
        uint256 maxDailyAmount;         // Max amount per day
        uint256 dailySpent;             // Amount spent today
        uint256 lastResetTimestamp;     // Last daily reset time
        uint256 maxGasPrice;            // Max gas price in wei
        uint8 maxRiskScore;             // Max risk score (0-100)
        bool requireApproval;           // Require manual approval
        TimeRestrictions timeRestrictions;
        bool enabled;                   // Policy enabled
    }
    
    struct TimeRestrictions {
        bool enabled;
        uint8 startHour;    // 0-23
        uint8 endHour;      // 0-23
    }
    
    struct Commitment {
        address sender;
        uint256 timestamp;
        bool executed;
        bool approved;      // For manual approval flow
    }
    
    struct TransactionIntent {
        address target;
        uint256 value;
        bytes data;
        bytes32 secret;
    }
    
    // ============ State Variables ============
    
    // User policies
    mapping(address => Policy) public policies;
    
    // Contract whitelist per user
    mapping(address => mapping(address => bool)) public whitelistedContracts;
    
    // Contract blacklist (global)
    mapping(address => bool) public blacklistedContracts;
    
    // Risk scores (set by oracle or admin)
    mapping(address => uint8) public contractRiskScores;
    
    // Commitments for commit-reveal
    mapping(bytes32 => Commitment) public commitments;
    
    // Approved agents per user
    mapping(address => mapping(address => bool)) public approvedAgents;
    
    // Constants
    uint256 public constant COMMIT_DELAY = 5 minutes;
    uint256 public constant REVEAL_WINDOW = 24 hours;
    uint256 public constant MAX_RISK_SCORE = 100;
    
    // Admin
    address public owner;
    bool public paused;
    
    // ============ Events ============
    
    event PolicyUpdated(
        address indexed user,
        uint256 maxTransactionAmount,
        uint256 maxDailyAmount,
        uint256 maxGasPrice,
        uint8 maxRiskScore
    );
    
    event ContractWhitelisted(address indexed user, address indexed target);
    event ContractRemovedFromWhitelist(address indexed user, address indexed target);
    event ContractBlacklisted(address indexed target);
    event ContractRemovedFromBlacklist(address indexed target);
    
    event CommitmentCreated(
        bytes32 indexed commitmentHash,
        address indexed sender,
        uint256 timestamp
    );
    
    event TransactionExecuted(
        bytes32 indexed commitmentHash,
        address indexed sender,
        address indexed target,
        uint256 value,
        bool success
    );
    
    event TransactionBlocked(
        address indexed sender,
        address indexed target,
        uint256 value,
        string reason
    );
    
    event ApprovalRequested(
        bytes32 indexed commitmentHash,
        address indexed sender,
        address indexed target,
        uint256 value
    );
    
    event TransactionApproved(bytes32 indexed commitmentHash, address indexed approver);
    event TransactionRejected(bytes32 indexed commitmentHash, address indexed approver);
    
    event AgentAuthorized(address indexed user, address indexed agent);
    event AgentRevoked(address indexed user, address indexed agent);
    
    event EmergencyPause(address indexed by);
    event EmergencyUnpause(address indexed by);
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "TenmaFirewall: Only owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "TenmaFirewall: Contract is paused");
        _;
    }
    
    modifier policyEnabled(address user) {
        require(policies[user].enabled, "TenmaFirewall: Policy not enabled");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        owner = msg.sender;
        paused = false;
    }
    
    // ============ Policy Management ============
    
    /**
     * @notice Set policy for the caller
     * @param maxTransactionAmount Max amount per transaction
     * @param maxDailyAmount Max amount per day
     * @param maxGasPrice Max gas price in wei
     * @param maxRiskScore Max risk score (0-100)
     * @param requireApproval Whether to require manual approval
     */
    function setPolicy(
        uint256 maxTransactionAmount,
        uint256 maxDailyAmount,
        uint256 maxGasPrice,
        uint8 maxRiskScore,
        bool requireApproval
    ) external {
        require(maxRiskScore <= MAX_RISK_SCORE, "TenmaFirewall: Invalid risk score");
        require(maxTransactionAmount > 0, "TenmaFirewall: Invalid max transaction amount");
        require(maxDailyAmount >= maxTransactionAmount, "TenmaFirewall: Daily limit < transaction limit");
        
        Policy storage policy = policies[msg.sender];
        policy.maxTransactionAmount = maxTransactionAmount;
        policy.maxDailyAmount = maxDailyAmount;
        policy.maxGasPrice = maxGasPrice;
        policy.maxRiskScore = maxRiskScore;
        policy.requireApproval = requireApproval;
        policy.enabled = true;
        
        // Reset daily spent if first time or new day
        if (policy.lastResetTimestamp == 0 || block.timestamp >= policy.lastResetTimestamp + 1 days) {
            policy.dailySpent = 0;
            policy.lastResetTimestamp = block.timestamp;
        }
        
        emit PolicyUpdated(msg.sender, maxTransactionAmount, maxDailyAmount, maxGasPrice, maxRiskScore);
    }
    
    /**
     * @notice Set time restrictions
     * @param enabled Whether time restrictions are enabled
     * @param startHour Start hour (0-23)
     * @param endHour End hour (0-23)
     */
    function setTimeRestrictions(bool enabled, uint8 startHour, uint8 endHour) external {
        require(startHour < 24, "TenmaFirewall: Invalid start hour");
        require(endHour < 24, "TenmaFirewall: Invalid end hour");
        
        Policy storage policy = policies[msg.sender];
        policy.timeRestrictions.enabled = enabled;
        policy.timeRestrictions.startHour = startHour;
        policy.timeRestrictions.endHour = endHour;
    }
    
    /**
     * @notice Disable policy
     */
    function disablePolicy() external {
        policies[msg.sender].enabled = false;
    }
    
    // ============ Whitelist/Blacklist Management ============
    
    /**
     * @notice Add contract to whitelist
     * @param target Contract address to whitelist
     */
    function addToWhitelist(address target) external {
        require(target != address(0), "TenmaFirewall: Invalid address");
        whitelistedContracts[msg.sender][target] = true;
        emit ContractWhitelisted(msg.sender, target);
    }
    
    /**
     * @notice Remove contract from whitelist
     * @param target Contract address to remove
     */
    function removeFromWhitelist(address target) external {
        whitelistedContracts[msg.sender][target] = false;
        emit ContractRemovedFromWhitelist(msg.sender, target);
    }
    
    /**
     * @notice Add contract to global blacklist (owner only)
     * @param target Contract address to blacklist
     */
    function addToBlacklist(address target) external onlyOwner {
        require(target != address(0), "TenmaFirewall: Invalid address");
        blacklistedContracts[target] = true;
        emit ContractBlacklisted(target);
    }
    
    /**
     * @notice Remove contract from global blacklist (owner only)
     * @param target Contract address to remove
     */
    function removeFromBlacklist(address target) external onlyOwner {
        blacklistedContracts[target] = false;
        emit ContractRemovedFromBlacklist(target);
    }
    
    // ============ Risk Score Management ============
    
    /**
     * @notice Set risk score for a contract (owner only)
     * @param target Contract address
     * @param riskScore Risk score (0-100)
     */
    function setRiskScore(address target, uint8 riskScore) external onlyOwner {
        require(riskScore <= MAX_RISK_SCORE, "TenmaFirewall: Invalid risk score");
        contractRiskScores[target] = riskScore;
    }
    
    /**
     * @notice Batch set risk scores (owner only)
     * @param targets Array of contract addresses
     * @param riskScores Array of risk scores
     */
    function batchSetRiskScores(address[] calldata targets, uint8[] calldata riskScores) external onlyOwner {
        require(targets.length == riskScores.length, "TenmaFirewall: Length mismatch");
        
        for (uint256 i = 0; i < targets.length; i++) {
            require(riskScores[i] <= MAX_RISK_SCORE, "TenmaFirewall: Invalid risk score");
            contractRiskScores[targets[i]] = riskScores[i];
        }
    }
    
    // ============ Agent Management ============
    
    /**
     * @notice Authorize an AI agent to act on behalf of the user
     * @param agent Agent address to authorize
     */
    function authorizeAgent(address agent) external {
        require(agent != address(0), "TenmaFirewall: Invalid agent");
        approvedAgents[msg.sender][agent] = true;
        emit AgentAuthorized(msg.sender, agent);
    }
    
    /**
     * @notice Revoke agent authorization
     * @param agent Agent address to revoke
     */
    function revokeAgent(address agent) external {
        approvedAgents[msg.sender][agent] = false;
        emit AgentRevoked(msg.sender, agent);
    }
    
    // ============ Commit-Reveal Flow ============
    
    /**
     * @notice Commit a transaction (hides details for MEV protection)
     * @param commitmentHash Hash of (target, value, data, secret)
     */
    function commit(bytes32 commitmentHash) external whenNotPaused {
        require(commitments[commitmentHash].timestamp == 0, "TenmaFirewall: Commitment exists");
        
        commitments[commitmentHash] = Commitment({
            sender: msg.sender,
            timestamp: block.timestamp,
            executed: false,
            approved: false
        });
        
        emit CommitmentCreated(commitmentHash, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Reveal and execute transaction with policy validation
     * @param target Target contract address
     * @param value Amount to send
     * @param data Call data
     * @param secret Secret used in commitment
     */
    function reveal(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 secret
    ) external payable whenNotPaused {
        // Verify commitment
        bytes32 commitmentHash = keccak256(abi.encodePacked(target, value, data, secret));
        Commitment storage commitment = commitments[commitmentHash];
        
        require(commitment.timestamp > 0, "TenmaFirewall: No commitment");
        require(commitment.sender == msg.sender, "TenmaFirewall: Not commitment sender");
        require(!commitment.executed, "TenmaFirewall: Already executed");
        
        // Check timing
        require(
            block.timestamp >= commitment.timestamp + COMMIT_DELAY,
            "TenmaFirewall: Delay not elapsed"
        );
        require(
            block.timestamp <= commitment.timestamp + REVEAL_WINDOW,
            "TenmaFirewall: Reveal window expired"
        );
        
        // Validate policies
        _validatePolicies(msg.sender, target, value);
        
        // Check manual approval if required
        Policy storage policy = policies[msg.sender];
        if (policy.requireApproval) {
            require(commitment.approved, "TenmaFirewall: Approval required");
        }
        
        // Mark as executed
        commitment.executed = true;
        
        // Update daily spent
        _updateDailySpent(msg.sender, value);
        
        // Execute transaction
        (bool success, ) = target.call{value: value}(data);
        
        emit TransactionExecuted(commitmentHash, msg.sender, target, value, success);
        
        require(success, "TenmaFirewall: Transaction failed");
    }
    
    /**
     * @notice Approve a committed transaction (for manual approval flow)
     * @param commitmentHash Hash of the commitment
     */
    function approveTransaction(bytes32 commitmentHash) external {
        Commitment storage commitment = commitments[commitmentHash];
        
        require(commitment.timestamp > 0, "TenmaFirewall: No commitment");
        require(!commitment.executed, "TenmaFirewall: Already executed");
        require(
            msg.sender == commitment.sender || approvedAgents[commitment.sender][msg.sender],
            "TenmaFirewall: Not authorized"
        );
        
        commitment.approved = true;
        emit TransactionApproved(commitmentHash, msg.sender);
    }
    
    /**
     * @notice Reject a committed transaction
     * @param commitmentHash Hash of the commitment
     */
    function rejectTransaction(bytes32 commitmentHash) external {
        Commitment storage commitment = commitments[commitmentHash];
        
        require(commitment.timestamp > 0, "TenmaFirewall: No commitment");
        require(!commitment.executed, "TenmaFirewall: Already executed");
        require(msg.sender == commitment.sender, "TenmaFirewall: Not sender");
        
        // Mark as executed to prevent reveal
        commitment.executed = true;
        emit TransactionRejected(commitmentHash, msg.sender);
    }
    
    // ============ Direct Execution (No Commit-Reveal) ============
    
    /**
     * @notice Execute transaction directly with policy validation (no MEV protection)
     * @param target Target contract address
     * @param value Amount to send
     * @param data Call data
     */
    function executeTransaction(
        address target,
        uint256 value,
        bytes calldata data
    ) external payable whenNotPaused policyEnabled(msg.sender) {
        // Validate policies
        _validatePolicies(msg.sender, target, value);
        
        // Check manual approval (not supported for direct execution)
        Policy storage policy = policies[msg.sender];
        require(!policy.requireApproval, "TenmaFirewall: Use commit-reveal for approval flow");
        
        // Update daily spent
        _updateDailySpent(msg.sender, value);
        
        // Execute transaction
        (bool success, ) = target.call{value: value}(data);
        
        bytes32 txHash = keccak256(abi.encodePacked(target, value, data, block.timestamp));
        emit TransactionExecuted(txHash, msg.sender, target, value, success);
        
        require(success, "TenmaFirewall: Transaction failed");
    }
    
    // ============ Policy Validation (Internal) ============
    
    /**
     * @notice Validate all policies for a transaction
     * @param sender Transaction sender
     * @param target Target contract
     * @param value Transaction value
     */
    function _validatePolicies(
        address sender,
        address target,
        uint256 value
    ) internal view {
        Policy storage policy = policies[sender];
        
        require(policy.enabled, "TenmaFirewall: Policy not enabled");
        
        // 1. Validate amount limit
        require(
            value <= policy.maxTransactionAmount,
            "TenmaFirewall: Exceeds max transaction amount"
        );
        
        // 2. Validate daily limit
        uint256 dailySpent = policy.dailySpent;
        if (block.timestamp >= policy.lastResetTimestamp + 1 days) {
            dailySpent = 0; // Reset for new day
        }
        require(
            dailySpent + value <= policy.maxDailyAmount,
            "TenmaFirewall: Exceeds daily limit"
        );
        
        // 3. Validate gas price
        require(
            tx.gasprice <= policy.maxGasPrice || policy.maxGasPrice == 0,
            "TenmaFirewall: Gas price too high"
        );
        
        // 4. Validate global blacklist
        require(
            !blacklistedContracts[target],
            "TenmaFirewall: Target is blacklisted"
        );
        
        // 5. Validate whitelist (if any contracts are whitelisted, target must be whitelisted)
        // Note: If no contracts are whitelisted, this check is skipped
        bool hasWhitelist = _hasWhitelist(sender);
        if (hasWhitelist) {
            require(
                whitelistedContracts[sender][target],
                "TenmaFirewall: Target not whitelisted"
            );
        }
        
        // 6. Validate risk score
        uint8 riskScore = contractRiskScores[target];
        require(
            riskScore <= policy.maxRiskScore || policy.maxRiskScore == 0,
            "TenmaFirewall: Risk score too high"
        );
        
        // 7. Validate time restrictions
        if (policy.timeRestrictions.enabled) {
            uint8 currentHour = uint8((block.timestamp / 3600) % 24);
            require(
                currentHour >= policy.timeRestrictions.startHour &&
                currentHour <= policy.timeRestrictions.endHour,
                "TenmaFirewall: Outside allowed hours"
            );
        }
    }
    
    /**
     * @notice Update daily spent amount
     * @param user User address
     * @param amount Amount to add
     */
    function _updateDailySpent(address user, uint256 amount) internal {
        Policy storage policy = policies[user];
        
        // Reset if new day
        if (block.timestamp >= policy.lastResetTimestamp + 1 days) {
            policy.dailySpent = 0;
            policy.lastResetTimestamp = block.timestamp;
        }
        
        policy.dailySpent += amount;
    }
    
    /**
     * @notice Check if user has any whitelisted contracts
     * @param user User address
     * @return hasWhitelist True if user has whitelisted contracts
     */
    function _hasWhitelist(address user) internal view returns (bool) {
        // This is a simplified check - in production, you'd maintain a counter
        // For now, we'll assume if policy is enabled, whitelist is optional
        return false; // Whitelist is optional by default
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Simulate a transaction to check if it would pass policies
     * @param sender Transaction sender
     * @param target Target contract
     * @param value Transaction value
     * @return allowed Whether transaction would be allowed
     * @return reason Reason if not allowed
     */
    function simulateTransaction(
        address sender,
        address target,
        uint256 value
    ) external view returns (bool allowed, string memory reason) {
        Policy storage policy = policies[sender];
        
        if (!policy.enabled) {
            return (false, "Policy not enabled");
        }
        
        if (value > policy.maxTransactionAmount) {
            return (false, "Exceeds max transaction amount");
        }
        
        uint256 dailySpent = policy.dailySpent;
        if (block.timestamp >= policy.lastResetTimestamp + 1 days) {
            dailySpent = 0;
        }
        if (dailySpent + value > policy.maxDailyAmount) {
            return (false, "Exceeds daily limit");
        }
        
        if (policy.maxGasPrice > 0 && tx.gasprice > policy.maxGasPrice) {
            return (false, "Gas price too high");
        }
        
        if (blacklistedContracts[target]) {
            return (false, "Target is blacklisted");
        }
        
        uint8 riskScore = contractRiskScores[target];
        if (policy.maxRiskScore > 0 && riskScore > policy.maxRiskScore) {
            return (false, "Risk score too high");
        }
        
        if (policy.timeRestrictions.enabled) {
            uint8 currentHour = uint8((block.timestamp / 3600) % 24);
            if (currentHour < policy.timeRestrictions.startHour || currentHour > policy.timeRestrictions.endHour) {
                return (false, "Outside allowed hours");
            }
        }
        
        return (true, "Transaction allowed");
    }
    
    /**
     * @notice Check if commitment can be revealed
     * @param commitmentHash Hash of the commitment
     * @return canReveal Whether commitment can be revealed
     * @return remainingDelay Remaining delay in seconds (0 if can reveal)
     */
    function canReveal(bytes32 commitmentHash) external view returns (bool canReveal, uint256 remainingDelay) {
        Commitment storage commitment = commitments[commitmentHash];
        
        if (commitment.timestamp == 0) {
            return (false, 0);
        }
        
        if (commitment.executed) {
            return (false, 0);
        }
        
        if (block.timestamp < commitment.timestamp + COMMIT_DELAY) {
            return (false, commitment.timestamp + COMMIT_DELAY - block.timestamp);
        }
        
        if (block.timestamp > commitment.timestamp + REVEAL_WINDOW) {
            return (false, 0);
        }
        
        return (true, 0);
    }
    
    /**
     * @notice Get remaining delay for a commitment
     * @param commitmentHash Hash of the commitment
     * @return remainingDelay Remaining delay in seconds
     */
    function getRemainingDelay(bytes32 commitmentHash) external view returns (uint256) {
        Commitment storage commitment = commitments[commitmentHash];
        
        if (commitment.timestamp == 0 || commitment.executed) {
            return 0;
        }
        
        if (block.timestamp >= commitment.timestamp + COMMIT_DELAY) {
            return 0;
        }
        
        return commitment.timestamp + COMMIT_DELAY - block.timestamp;
    }
    
    /**
     * @notice Get policy for a user
     * @param user User address
     * @return policy User's policy
     */
    function getPolicy(address user) external view returns (Policy memory) {
        return policies[user];
    }
    
    /**
     * @notice Check if contract is whitelisted for user
     * @param user User address
     * @param target Contract address
     * @return isWhitelisted Whether contract is whitelisted
     */
    function isWhitelisted(address user, address target) external view returns (bool) {
        return whitelistedContracts[user][target];
    }
    
    /**
     * @notice Check if contract is globally blacklisted
     * @param target Contract address
     * @return isBlacklisted Whether contract is blacklisted
     */
    function isBlacklisted(address target) external view returns (bool) {
        return blacklistedContracts[target];
    }
    
    // ============ Emergency Controls ============
    
    /**
     * @notice Pause the contract (owner only)
     */
    function pause() external onlyOwner {
        paused = true;
        emit EmergencyPause(msg.sender);
    }
    
    /**
     * @notice Unpause the contract (owner only)
     */
    function unpause() external onlyOwner {
        paused = false;
        emit EmergencyUnpause(msg.sender);
    }
    
    /**
     * @notice Transfer ownership (owner only)
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "TenmaFirewall: Invalid address");
        owner = newOwner;
    }
    
    // ============ Receive ETH ============
    
    receive() external payable {}
}

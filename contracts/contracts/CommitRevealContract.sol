// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CommitRevealContract
 * @notice MEV-resistant transaction submission using commit-reveal mechanism
 * @dev Implements a two-phase commit-reveal pattern with execution delay
 */
contract CommitRevealContract is Ownable, ReentrancyGuard, Pausable {
    
    // ============ State Variables ============
    
    /// @notice Minimum time between commitment and reveal (in seconds)
    uint256 public executionDelay;
    
    /// @notice Maximum time window for revealing after commitment (in seconds)
    uint256 public revealWindow;
    
    /// @notice Mapping of commitment hash to commitment data
    mapping(bytes32 => Commitment) public commitments;
    
    // ============ Structs ============
    
    struct Commitment {
        address user;           // Address that created the commitment
        uint256 timestamp;      // Block timestamp when committed
        bool revealed;          // Whether the commitment has been revealed
        bool executed;          // Whether the transaction has been executed
        bytes32 payloadHash;    // Hash of the revealed payload (for verification)
    }
    
    // ============ Events ============
    
    event CommitmentCreated(
        bytes32 indexed commitmentHash,
        address indexed user,
        uint256 timestamp
    );
    
    event TransactionRevealed(
        bytes32 indexed commitmentHash,
        bytes32 payloadHash,
        address indexed user
    );
    
    event TransactionExecuted(
        bytes32 indexed commitmentHash,
        bool success,
        bytes returnData
    );
    
    event ExecutionFailed(
        bytes32 indexed commitmentHash,
        string reason
    );
    
    event ExecutionDelayUpdated(
        uint256 oldDelay,
        uint256 newDelay
    );
    
    event RevealWindowUpdated(
        uint256 oldWindow,
        uint256 newWindow
    );
    
    // ============ Errors ============
    
    error CommitmentAlreadyExists();
    error CommitmentNotFound();
    error CommitmentAlreadyRevealed();
    error CommitmentExpired();
    error ExecutionDelayNotElapsed();
    error InvalidCommitmentHash();
    error UnauthorizedCaller();
    error ExecutionReverted(string reason);
    error InvalidExecutionDelay();
    error InvalidRevealWindow();
    
    // ============ Constructor ============
    
    /**
     * @notice Initialize the contract with execution parameters
     * @param _executionDelay Minimum delay between commit and reveal (seconds)
     * @param _revealWindow Maximum time window for reveal (seconds)
     */
    constructor(
        uint256 _executionDelay,
        uint256 _revealWindow
    ) Ownable(msg.sender) {
        if (_executionDelay == 0) revert InvalidExecutionDelay();
        if (_revealWindow == 0) revert InvalidRevealWindow();
        
        executionDelay = _executionDelay;
        revealWindow = _revealWindow;
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Commit a transaction hash without revealing the payload
     * @param commitmentHash The keccak256 hash of (payload + secret)
     */
    function commit(bytes32 commitmentHash) 
        external 
        whenNotPaused 
    {
        if (commitments[commitmentHash].user != address(0)) {
            revert CommitmentAlreadyExists();
        }
        
        commitments[commitmentHash] = Commitment({
            user: msg.sender,
            timestamp: block.timestamp,
            revealed: false,
            executed: false,
            payloadHash: bytes32(0)
        });
        
        emit CommitmentCreated(commitmentHash, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Reveal and execute a committed transaction
     * @param payload The original transaction payload
     * @param secret The secret used in commitment hash
     */
    function reveal(bytes calldata payload, bytes32 secret) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        // Compute commitment hash
        bytes32 commitmentHash = keccak256(abi.encodePacked(payload, secret));
        
        Commitment storage commitment = commitments[commitmentHash];
        
        // Validate commitment exists
        if (commitment.user == address(0)) {
            revert CommitmentNotFound();
        }
        
        // Validate caller is the commitment creator
        if (commitment.user != msg.sender) {
            revert UnauthorizedCaller();
        }
        
        // Validate not already revealed
        if (commitment.revealed) {
            revert CommitmentAlreadyRevealed();
        }
        
        // Validate execution delay has elapsed
        if (block.timestamp < commitment.timestamp + executionDelay) {
            revert ExecutionDelayNotElapsed();
        }
        
        // Validate not expired
        if (block.timestamp > commitment.timestamp + revealWindow) {
            revert CommitmentExpired();
        }
        
        // Mark as revealed
        commitment.revealed = true;
        commitment.payloadHash = keccak256(payload);
        
        emit TransactionRevealed(commitmentHash, commitment.payloadHash, msg.sender);
        
        // Execute the transaction
        _executeTransaction(commitmentHash, payload);
    }
    
    /**
     * @notice Get commitment details
     * @param commitmentHash The commitment hash to query
     * @return Commitment struct with all details
     */
    function getCommitment(bytes32 commitmentHash) 
        external 
        view 
        returns (Commitment memory) 
    {
        return commitments[commitmentHash];
    }
    
    /**
     * @notice Check if a commitment can be revealed
     * @param commitmentHash The commitment hash to check
     * @return bool True if can be revealed
     */
    function canReveal(bytes32 commitmentHash) 
        external 
        view 
        returns (bool) 
    {
        Commitment memory commitment = commitments[commitmentHash];
        
        if (commitment.user == address(0)) return false;
        if (commitment.revealed) return false;
        if (block.timestamp < commitment.timestamp + executionDelay) return false;
        if (block.timestamp > commitment.timestamp + revealWindow) return false;
        
        return true;
    }
    
    /**
     * @notice Check if a commitment has expired
     * @param commitmentHash The commitment hash to check
     * @return bool True if expired
     */
    function isExpired(bytes32 commitmentHash) 
        external 
        view 
        returns (bool) 
    {
        Commitment memory commitment = commitments[commitmentHash];
        
        if (commitment.user == address(0)) return false;
        if (commitment.revealed) return false;
        
        return block.timestamp > commitment.timestamp + revealWindow;
    }
    
    /**
     * @notice Get remaining time until reveal is possible
     * @param commitmentHash The commitment hash to check
     * @return uint256 Seconds remaining (0 if ready or expired)
     */
    function getRemainingDelay(bytes32 commitmentHash) 
        external 
        view 
        returns (uint256) 
    {
        Commitment memory commitment = commitments[commitmentHash];
        
        if (commitment.user == address(0)) return 0;
        if (commitment.revealed) return 0;
        
        uint256 revealTime = commitment.timestamp + executionDelay;
        if (block.timestamp >= revealTime) return 0;
        
        return revealTime - block.timestamp;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update the execution delay
     * @param newDelay New delay in seconds
     */
    function setExecutionDelay(uint256 newDelay) 
        external 
        onlyOwner 
    {
        if (newDelay == 0) revert InvalidExecutionDelay();
        
        uint256 oldDelay = executionDelay;
        executionDelay = newDelay;
        
        emit ExecutionDelayUpdated(oldDelay, newDelay);
    }
    
    /**
     * @notice Update the reveal window
     * @param newWindow New window in seconds
     */
    function setRevealWindow(uint256 newWindow) 
        external 
        onlyOwner 
    {
        if (newWindow == 0) revert InvalidRevealWindow();
        
        uint256 oldWindow = revealWindow;
        revealWindow = newWindow;
        
        emit RevealWindowUpdated(oldWindow, newWindow);
    }
    
    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Internal Functions ============
    
    /**
     * @notice Execute the revealed transaction payload
     * @param commitmentHash The commitment hash
     * @param payload The transaction payload to execute
     */
    function _executeTransaction(
        bytes32 commitmentHash,
        bytes calldata payload
    ) internal {
        // Decode the payload
        // Expected format: abi.encode(target, value, data)
        (address target, uint256 value, bytes memory data) = abi.decode(
            payload,
            (address, uint256, bytes)
        );
        
        // Execute the call
        (bool success, bytes memory returnData) = target.call{value: value}(data);
        
        if (success) {
            commitments[commitmentHash].executed = true;
            emit TransactionExecuted(commitmentHash, true, returnData);
        } else {
            // Extract revert reason if available
            string memory reason = _getRevertReason(returnData);
            emit ExecutionFailed(commitmentHash, reason);
            revert ExecutionReverted(reason);
        }
    }
    
    /**
     * @notice Extract revert reason from return data
     * @param returnData The return data from failed call
     * @return reason The revert reason string
     */
    function _getRevertReason(bytes memory returnData) 
        internal 
        pure 
        returns (string memory reason) 
    {
        if (returnData.length < 68) return "Transaction reverted silently";
        
        assembly {
            returnData := add(returnData, 0x04)
        }
        
        reason = abi.decode(returnData, (string));
    }
    
    // ============ Receive Function ============
    
    /**
     * @notice Allow contract to receive ETH
     */
    receive() external payable {}
}

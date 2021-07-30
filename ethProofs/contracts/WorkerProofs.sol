pragma solidity ^0.8.0;

contract WorkerProofs {

    struct Worker {
    	uint256 id;
        uint256[2] pk;
    }
    
    Worker[] workers;
    mapping(address => uint) workerId;

    struct PeriodProof {
        uint256 aggSign;
        uint256[] workerIds;
    }

    mapping(uint256 => PeriodProof) periodProof;

    struct RData {
        Worker[] workers;
        PeriodProof periodProof;
    }

    function setupWorker(uint256[2] memory pk) public {
        workers.push(Worker(workers.length+1,pk));
    	workerId[msg.sender] = workers.length;
    }

    function addSign(uint256 period, uint256 aggsignature, uint256[] memory workerIds) public {
        periodProof[period] = PeriodProof(
            aggsignature,
            workerIds
        );
    }

    function getAggSign(uint256 period) public view returns (RData memory) {
        return RData(workers,periodProof[period]);
    }

}
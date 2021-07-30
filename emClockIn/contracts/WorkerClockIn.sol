pragma solidity ^0.8.0;

contract WorkerClockIn {
    
    struct Worker {
    	uint256 id;
        uint256[2] pk;
    }
    
    Worker[] workers;
    mapping(address => uint) workerId;

    struct PeriodWorked {
        bool isActive;
        mapping(uint => bool) hasWorked;
        uint256[] workerIds;
        uint256[] signatures;
    }

    mapping(uint => PeriodWorked) periodWorked;

    struct RData {
        uint256[] workerIds;
        uint256[] signatures;
        Worker[] workers;
    }
    
    //-----------------------Functions-----------------------

    function nextPeriod(uint period) public {
        periodWorked[period].isActive = true;
    }
    
    function setupWorker(address workerAddress, uint256[2] memory pk) public {
        require(workerId[workerAddress] == 0);
        workers.push(Worker(workers.length+1,pk));
        uint id = workers.length;
    	workerId[workerAddress] = id;
    }
    
    function clockIn(address workerAddress, uint256 signature, uint period) public {
    	require(workerId[workerAddress] != 0);
    	require(periodWorked[period].isActive);
        require(!periodWorked[period].hasWorked[workerId[workerAddress]]);
        periodWorked[period].hasWorked[workerId[workerAddress]] = true;
        periodWorked[period].workerIds.push(workerId[workerAddress]);
        periodWorked[period].signatures.push(signature);
    }

    function getSignatures(uint period) public view returns(RData memory) {
        RData memory rdata = RData(periodWorked[period].workerIds, periodWorked[period].signatures, workers);
        return rdata;
    }

}

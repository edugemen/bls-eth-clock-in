const WorkerClockIn = artifacts.require("WorkerClockIn");

module.exports = function (deployer) {
  deployer.deploy(WorkerClockIn);
};

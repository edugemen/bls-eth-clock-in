const WorkerProofs = artifacts.require("WorkerProofs");

module.exports = function (deployer) {
    deployer.deploy(WorkerProofs);
};
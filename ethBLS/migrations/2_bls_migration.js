const BLS = artifacts.require("BLS");
const modexp_3064_fd54 = artifacts.require("modexp_3064_fd54");
const modexp_c191_3f52 = artifacts.require("modexp_c191_3f52");

module.exports = function (deployer) {
    deployer.deploy(modexp_3064_fd54);
    deployer.deploy(modexp_c191_3f52);
    deployer.link(modexp_3064_fd54,BLS)
    deployer.link(modexp_c191_3f52,BLS)
    deployer.deploy(BLS)
};
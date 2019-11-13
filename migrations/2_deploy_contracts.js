const Credentials = artifacts.require("Credentials");

module.exports = function (deployer) {
  deployer.deploy(Credentials);
};

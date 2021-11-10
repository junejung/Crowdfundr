const { parse } = require("@ethersproject/transactions");
const { parseEther } = require("@ethersproject/units");
const { expect, should } = require("chai");
const { ethers } = require("hardhat");

describe("Project Contract", function () {
  beforeEach( async function() {
    Project = await ethers.getContractFactory("Project");
    [owner, addr2, addr3, ...addrs] = await ethers.getSigners();
    project = await Project.deploy(parseEther("20"));

    await project.deployed();
  });

  it("Should return the 0 of current balance after initiated", async function () {

    expect(await project.balance()).to.equal(parseEther("0"));
  });

  describe("invest", function() {
    it("Should increased balance after it went through successfully", async function () {
      const aContribution = parseEther("0.01");

      await project.invest({value : aContribution }); 
      expect(await project.balance()).to.deep.equal(aContribution);

    });

    it("Should throw an error when its amount lower than the minimum requirement", async function () {
      const smallContribution = parseEther("0.001");

      await expect(project.invest({ value : smallContribution })).to.be.revertedWith('LOWER_THAN_REQUIRE_MIN');
    })

    it("Should fail when the goal already met", async function () {
      const aLargeContribution = parseEther("20");
      const aContribution = parseEther("0.01");

      await project.invest({value : aLargeContribution }); 
      await expect(project.invest({ value : aContribution })).to.be.reverted;

    });

    it("Should fail if the project ended", async function () {
      const aContribution = parseEther("0.01");

      //invest before project ends
      await project.invest({value : aContribution });
      //passing 30days 
      await network.provider.send("evm_increaseTime", [86400000 * 30]); //30days in millisecond
      await network.provider.send("evm_mine");
      //expect failing the invest attempt after end date passes
      await expect(project.invest({ value : aContribution })).to.be.reverted;
      //expect only the first investment went through
      expect(await project.balance()).to.deep.equal(aContribution);

    });
  });

  describe("withdraw", function() {

    it("Should fail when withdraw isn't the owner of the project", async function () {
      const goalAmountContribution = parseEther("20");

      await project.invest({value : goalAmountContribution });
      await expect(project.connect(addr2).withdraw(goalAmountContribution)).to.be.revertedWith('NOT_OWNER');
      expect(await project.balance()).to.deep.equal(goalAmountContribution);
    });

    it("Should be successful when the owner of project request it after project is successful", async function () {
      const goalAmountContribution = parseEther("20");
      await project.invest({value : goalAmountContribution });

      let balanceBefore = await hre.ethers.provider.getBalance(owner.address);
      await project.connect(owner).withdraw(goalAmountContribution);
      let balanceAfter = await hre.ethers.provider.getBalance(owner.address);
      expect(Number(balanceBefore) < Number(balanceAfter)).to.deep.equal(true);
    });
  });

  describe("refund", function() {

    it("Should be sccessful when project is failed or cancelled", async function() {
      const aContribution = parseEther("15");
      await project.connect(addr2).invest({value : aContribution });

      let balanceBefore = await hre.ethers.provider.getBalance(addr2.address);

      await network.provider.send("evm_increaseTime", [86400000 * 31]); //31days in millisecond
      await network.provider.send("evm_mine");

      await project.connect(addr2).refund();
      let balanceAfter = await hre.ethers.provider.getBalance(addr2.address);
      expect(Number(balanceBefore) < Number(balanceAfter)).to.deep.equal(true);

    });
  });
});

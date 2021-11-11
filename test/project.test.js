const { parse } = require("@ethersproject/transactions");
const { parseEther } = require("@ethersproject/units");
const { expect, should } = require("chai");
const { ethers } = require("hardhat");


describe("Crowdfundr Contract", function () {
  beforeEach( async function() {
    Crowdfundr = await ethers.getContractFactory("Crowdfundr");
    [alex, diana, gab] = await ethers.getSigners();
    crowdfundr = await Crowdfundr.deploy();
    await crowdfundr.deployed();
  });
  it("Should be able to register multiple projects", async function () {
    await crowdfundr.connect(alex).createProject(parseEther('20'));
    await crowdfundr.connect(diana).createProject(parseEther('20'));
    await crowdfundr.connect(gab).createProject(parseEther('20'));

    let projects = await crowdfundr.getAllProjects();
    expect(projects.length).to.deep.equal(3);
  });

  it("Should allow a creator to register more than one project", async function () {
    await crowdfundr.connect(alex).createProject(parseEther('20'));
    await crowdfundr.connect(alex).createProject(parseEther('20'));

    let projects = await crowdfundr.getAllProjects();
    expect(projects.length).to.deep.equal(2);
  });
})

describe("Project Contract", function () {
  beforeEach( async function() {
    Project = await ethers.getContractFactory("Project");
    [owner, addr2, addr3, ...addrs] = await ethers.getSigners();
    project = await Project.deploy(owner.address, parseEther("20"));

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
      await network.provider.send("evm_increaseTime", [86400000 * 30]); //30 days in millisecond
      await network.provider.send("evm_mine");
      //expect failing the invest attempt after end date passes
      await expect(project.invest({ value : aContribution })).to.be.reverted;
      //expect only the first investment went through
      expect(await project.balance()).to.deep.equal(aContribution);

    });

    it("Should fail if the project cancelled", async function () {
      const aContribution = parseEther("0.01");

      await project.connect(owner).cancel();
      await expect(project.connect(addr2).invest({ value : aContribution })).to.be.reverted;
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

    it("Should be sccessful when project is failed", async function() {
      const aContribution = parseEther("15");
      await project.connect(addr2).invest({value : aContribution });

      let balanceBefore = await hre.ethers.provider.getBalance(addr2.address);

      await network.provider.send("evm_increaseTime", [86400000 * 31]); //31 days in millisecond
      await network.provider.send("evm_mine");

      await project.connect(addr2).refund();
      let balanceAfter = await hre.ethers.provider.getBalance(addr2.address);
      expect(Number(balanceBefore) < Number(balanceAfter)).to.deep.equal(true);

    });

    it("Should be sccessful when project is cancelled", async function() {
      const aContribution = parseEther("15");
      await project.connect(addr2).invest({value : aContribution });

      let balanceBefore = await hre.ethers.provider.getBalance(addr2.address);

      await project.connect(owner).cancel();

      await project.connect(addr2).refund();
      let balanceAfter = await hre.ethers.provider.getBalance(addr2.address);
      expect(Number(balanceBefore) < Number(balanceAfter)).to.deep.equal(true);

    });
  });

  describe("cancel", function() {

    it("Should be sccessful when the owner of project request before end of the project deadline", async function() {
      const aContribution = parseEther("15");
      await project.connect(addr2).invest({value : aContribution });

      let cancelation = await project.connect(owner).cancel();
      expect(cancelation).to.emit(project, 'projectCancelled').withArgs(owner.address);
    });

    it("Should fail when owner request it after deadline passed", async function() {
      const aContribution = parseEther("15");
      await project.connect(addr2).invest({value : aContribution });

      await network.provider.send("evm_increaseTime", [86400000 * 31]); //31days in millisecond
      await network.provider.send("evm_mine");

      await expect(project.connect(owner).cancel()).to.be.revertedWith('PROJECT_EXPIRED');
    });

    it("Should fail when other than the owner request it", async function() {
      const aContribution = parseEther("15");
      await project.connect(addr2).invest({value : aContribution });

      await expect(project.connect(addr2).cancel()).to.be.revertedWith('NOT_OWNER');
    });
  });

  describe("reward", function() {
    it("Should be given when contributor made 1ETH countribution", async function () {
      const aNFTContributionAmount = parseEther("1");

      let awardGiven = await project.connect(addr2).invest({ value : aNFTContributionAmount });
      expect(awardGiven).to.emit(project, 'RewardGiven').withArgs(addr2.address, 1);
    });

    it("Should be given more than 1 per 1 ETH when contributor made contribution", async function () {
      const firstContribution = parseEther("0.9");
      const secondContribution = parseEther("2.6");

      let firstInvestment = await project.connect(addr2).invest({ value : firstContribution });
      expect(firstInvestment).to.emit(project, 'RewardGiven').withArgs(addr2.address, 0);
      let secondInvestment = await project.connect(addr2).invest({ value : secondContribution });
      expect(secondInvestment).to.emit(project, 'RewardGiven').withArgs(addr2.address, 3);
    });
  });
});

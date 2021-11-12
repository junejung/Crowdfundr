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
});

describe("Project Contract", function () {
  let aMinContribution = parseEther("0.01");
  let aGoalAmount = parseEther("20");
  let someAmount = parseEther("15");

  beforeEach( async function() {
    Project = await ethers.getContractFactory("Project");
    [owner, gilbert, prolok] = await ethers.getSigners();
    project = await Project.deploy(owner.address, aGoalAmount);

    await project.deployed();
  });

  it("Should return the 0 of current balance after initiated", async function () {

    expect(await project.balance()).to.equal(parseEther("0"));
  });

  describe("invest", function() {

    it("Should increased balance after it went through", async function () {
      await project.invest({value : aMinContribution });

      expect(await project.balance()).to.deep.equal(aMinContribution);
    });

    it("Should throw an error when its amount lower than the minimum requirement", async function () {
      let aTooSmallContribution = parseEther("0.001");

      await expect(project.invest({ value : aTooSmallContribution })).to.be.revertedWith('LOWER_THAN_REQUIRE_MIN');
    })

    it("Should fail when the goal already met", async function () {
      await project.invest({value : aGoalAmount });

      await expect(project.invest({ value : aMinContribution })).to.be.reverted;
    });

    it("Should fail if the project ended", async function () {
      await project.invest({value : aMinContribution });

      await network.provider.send("evm_increaseTime", [86400000 * 30]); //30 days in millisecond
      await network.provider.send("evm_mine");

      await expect(project.invest({ value : aMinContribution })).to.be.reverted;
      expect(await project.balance()).to.deep.equal(aMinContribution);
    });

    it("Should fail if the project cancelled", async function () {
      await project.connect(owner).cancel();

      await expect(project.connect(gilbert).invest({ value : aMinContribution })).to.be.reverted;
    });
  });

  describe("withdraw", function() {

    it("Should fail when withdraw isn't the owner of the project", async function () {
      await project.invest({value : aGoalAmount });
      await expect(project.connect(gilbert).withdraw(aGoalAmount)).to.be.revertedWith('NOT_OWNER');

      expect(await project.balance()).to.deep.equal(aGoalAmount);
    });

    it("Should be successful when the owner of project request it after project is successful", async function () {
      await project.invest({value : aGoalAmount });

      let balanceBefore = await hre.ethers.provider.getBalance(owner.address);
      await project.connect(owner).withdraw(aGoalAmount);
      let balanceAfter = await hre.ethers.provider.getBalance(owner.address);

      expect(Number(balanceBefore) < Number(balanceAfter)).to.deep.equal(true);
    });
  });

  describe("refund", function() {

    it("Should be sccessful when project is failed", async function() {
      await project.connect(prolok).invest({value : someAmount });

      let balanceBefore = await hre.ethers.provider.getBalance(prolok.address);

      await network.provider.send("evm_increaseTime", [86400000 * 31]); //31 days in millisecond
      await network.provider.send("evm_mine");

      await project.connect(prolok).refund();

      let balanceAfter = await hre.ethers.provider.getBalance(prolok.address);
      expect(Number(balanceBefore) < Number(balanceAfter)).to.deep.equal(true);
    });

    it("Should be sccessful when project is cancelled", async function() {
      await project.connect(prolok).invest({value : someAmount });

      let balanceBefore = await hre.ethers.provider.getBalance(prolok.address);
      await project.connect(owner).cancel();
      await project.connect(prolok).refund();
      let balanceAfter = await hre.ethers.provider.getBalance(prolok.address);

      expect(Number(balanceBefore) < Number(balanceAfter)).to.deep.equal(true);
    });
  });

  describe("cancel", function() {

    it("Should be sccessful when the owner of project request before end of the project deadline", async function() {
      await project.connect(gilbert).invest({value : someAmount });

      let cancelation = await project.connect(owner).cancel();
      expect(cancelation).to.emit(project, 'projectCancelled').withArgs(owner.address);
    });

    it("Should fail when owner request it after deadline passed", async function() {
      await project.connect(gilbert).invest({value : someAmount });

      await network.provider.send("evm_increaseTime", [86400000 * 31]); //31days in millisecond
      await network.provider.send("evm_mine");

      await expect(project.connect(owner).cancel()).to.be.revertedWith('PROJECT_EXPIRED');
    });

    it("Should fail when other than the owner request it", async function() {
      await project.connect(gilbert).invest({value : someAmount });

      await expect(project.connect(gilbert).cancel()).to.be.revertedWith('NOT_OWNER');
    });
  });

  describe("reward", function() {
    let aNFTContributionAmount = parseEther("1");

    it("Should be given when contributor made 1ETH countribution", async function () {
      let awardGiven = await project.connect(prolok).invest({ value : aNFTContributionAmount });

      expect(awardGiven).to.emit(project, 'RewardGiven').withArgs(prolok.address, 1);
    });

    it("Should be given more than 1 per 1 ETH when contributor made contribution", async function () {
      let firstContribution = parseEther("0.9");
      let secondContribution = parseEther("2.6");

      let firstInvestment = await project.connect(prolok).invest({ value : firstContribution });
      expect(firstInvestment).to.emit(project, 'RewardGiven').withArgs(prolok.address, 0);

      let secondInvestment = await project.connect(prolok).invest({ value : secondContribution });
      expect(secondInvestment).to.emit(project, 'RewardGiven').withArgs(prolok.address, 3);
    });
  });
});

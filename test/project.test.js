const { parse } = require("@ethersproject/transactions");
const { parseEther } = require("@ethersproject/units");
const { expect, should } = require("chai");
const { ethers } = require("hardhat");

describe("Project Contract", function () {
  
  beforeEach( async function() {
    Project = await ethers.getContractFactory("Project");
    [addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
    project = await Project.deploy(20);

    await project.deployed();
  });

  it("Should return the 0 of current balance after initiated", async function () {

    expect(await project.balance()).to.equal(parseEther("0"));
  });

  describe("invest", function() {
    it("Should return increased balance after an investment is made", async function () {
      const aContribution = parseEther("0.01");

      await project.invest({value : aContribution }); 
      expect(await project.balance()).to.deep.equal(aContribution);

    });

    it("Should throw an error when investment amount lower than the minimum requirement", async function () {
      const smallContribution = parseEther("0.001");

      await expect(project.invest({ value : smallContribution })).to.be.revertedWith('The contribute amount must be at least 0.01 ETH.');
    })

    it("Should fail to invest if the goal already met", async function () {
      const aLargeContribution = parseEther("20");
      const aContribution = parseEther("0.01");

      await project.invest({value : aLargeContribution }); 
      await expect(project.invest({ value : aContribution })).to.be.reverted;

    });
  });
});

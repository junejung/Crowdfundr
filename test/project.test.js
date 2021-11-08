const { parse } = require("@ethersproject/transactions");
const { parseEther } = require("@ethersproject/units");
const { expect } = require("chai");
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
});

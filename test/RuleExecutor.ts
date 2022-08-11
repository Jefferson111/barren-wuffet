import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { RuleExecutor as RuleExecutorType, TriggerStruct, ActionStruct } from '../typechain-types/contracts/RuleExecutor';
import { assert } from "console";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { int } from "hardhat/internal/core/params/argumentTypes";


const GT = 0;
const LT = 1;

const ETH_PRICE = 1300;
const UNI_PRICE = 3;
const ETH_UNI_PARAM = ethers.utils.defaultAbiCoder.encode(["string", "string"], ["eth", "uni"]);
const ETH_UNI_PRICE = (ETH_PRICE / UNI_PRICE);

const BAD_RULE_HASH = "0x" + "1234".repeat(16);

function makePassingTrigger(triggerContract: string): TriggerStruct {
  return {
    op: GT,
    param: ETH_UNI_PARAM,
    callee: triggerContract,
    value: Math.round(ETH_UNI_PRICE - 1)
  };
}

function makeFailingTrigger(triggerContract: string): TriggerStruct {
  return {
    op: GT,
    param: ETH_UNI_PARAM,
    callee: triggerContract,
    value: Math.round(ETH_UNI_PRICE + 1)
  };
}

function makeSwapAction(swapContract: string,
  fromToken: string = ethers.constants.AddressZero,
  toToken: string = ethers.constants.AddressZero): ActionStruct {
  return {
    callee: swapContract,
    data: "0x0000000000000000000000000000000000000000000000000000000000000000",
    fromToken: fromToken, // eth
    toToken: toToken
  };

}

async function createRule(_ruleExecutor: RuleExecutorType, triggers: TriggerStruct[],
  actions: ActionStruct[], wallet: SignerWithAddress, activate: boolean = false): Promise<string> {
  triggers.map(t => _ruleExecutor.addTriggerToWhitelist(t.callee));
  actions.map(a => _ruleExecutor.addActionToWhitelist(a.callee));

  const tx = await _ruleExecutor.connect(wallet).createRule(triggers, actions);
  const receipt2 = await tx.wait();

  const ruleHash = receipt2.events?.find((x => x.event == "Created"))?.args?.ruleHash
  if (activate) {
    const tx2 = await _ruleExecutor.connect(wallet).activateRule(ruleHash);
    await tx2.wait();
  }

  return ruleHash;

}

describe("RuleExecutor", () => {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function deployRuleExecutorFixture() {
    // Contracts are deployed using the first signer/account by default
    const [ownerWallet, ruleMakerWallet, ruleSubscriberWallet, otherWallet1] = await ethers.getSigners();

    const RuleExecutor = await ethers.getContractFactory("RuleExecutor");
    const ruleExecutor = await RuleExecutor.deploy();

    const TestSwapRouter = await ethers.getContractFactory("TestSwapRouter");
    const testSwapRouter = await TestSwapRouter.deploy();

    const SwapUniSingleAction = await ethers.getContractFactory("SwapUniSingleAction");

    // set WETH to ETH, let our test router handle it.    
    const swapUniSingleAction = await SwapUniSingleAction.deploy(
      testSwapRouter.address, ethers.constants.AddressZero);

    const TestOracle = await ethers.getContractFactory("TestOracle");
    const testOracleEth = await TestOracle.deploy(ETH_PRICE);
    const testOracleUni = await TestOracle.deploy(UNI_PRICE);

    const PriceTrigger = await ethers.getContractFactory("PriceTrigger");
    const priceTrigger = await PriceTrigger.deploy();
    await priceTrigger.addPriceFeed("eth", testOracleEth.address);
    await priceTrigger.addPriceFeed("uni", testOracleUni.address);


    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken1 = await TestToken.deploy(100000, "Test1", "TST1");
    const testToken2 = await TestToken.deploy(100000, "Test2", "TST2");

    return {
      ruleExecutor, priceTrigger, swapUniSingleAction, testOracleEth, testOracleUni,
      testToken1, testToken2, ownerWallet, ruleMakerWallet, ruleSubscriberWallet, otherWallet1
    };
  }

  describe("Deployment", () => {

    it("Should set the right owner", async function () {
      const { ruleExecutor, ownerWallet } = await loadFixture(deployRuleExecutorFixture);

      expect(await ruleExecutor.owner()).to.equal(ownerWallet.address);
    });
  });

  describe("Add Rule By Anyone", () => {

    it("Should revert if trigger doesnt have a callee with validateTrigger", async () => {
      const { ruleExecutor, swapUniSingleAction, ruleMakerWallet, testToken1 } = await loadFixture(deployRuleExecutorFixture);

      const badTrigger = makePassingTrigger(ethers.constants.AddressZero); // passing trigger with bad address
      const executableAction = makeSwapAction(swapUniSingleAction.address, testToken1.address);

      ruleExecutor.disableTriggerWhitelist();
      ruleExecutor.disableActionWhitelist();
      await expect(ruleExecutor.connect(ruleMakerWallet).createRule([badTrigger], [executableAction])).to.be.revertedWithoutReason;
    });

    it.skip("Should revert if validateTrigger on trigger does not return true", async () => {
      // Use BadPriceTrigger. I am yet not sure what damage this can do, and what protection we should have for this.      
    });

    it.skip("Should revert if validateTrigger on trigger is not a view fn", async () => {
      // Use BadPriceTrigger. I am yet not sure what damage this can do, and what protection we should have for this.

    });


    it("Should revert if action doesnt have a callee with validate", async () => {
      const { ruleExecutor, priceTrigger, ruleMakerWallet, testToken1 } = await loadFixture(deployRuleExecutorFixture);

      const passingTrigger = makePassingTrigger(priceTrigger.address);
      const badAction = makeSwapAction(ethers.constants.AddressZero, testToken1.address);
      ruleExecutor.disableTriggerWhitelist();
      ruleExecutor.disableActionWhitelist();

      await expect(ruleExecutor.connect(ruleMakerWallet).createRule([passingTrigger], [badAction])).to.be.revertedWithoutReason();

    });

    it.skip("Should revert if validate on action does not return true", async () => {

      // KIV This. currently we dont have a situation where the action fails validation.


    });

    it.skip("Should revert if validate on action is not a view fn", async () => {
      // KIV. Need to create a bad action. I am yet not sure what damage this can do, and what protection we should have for this.


    });

    it("Should revert if trigger has not been whitelisted", async () => {
      const { ruleExecutor, swapUniSingleAction, priceTrigger, ruleMakerWallet, testToken1 } = await loadFixture(deployRuleExecutorFixture);

      const passingTrigger = makePassingTrigger(priceTrigger.address);
      const executableAction = makeSwapAction(swapUniSingleAction.address, testToken1.address);

      await expect(ruleExecutor.connect(ruleMakerWallet).createRule([passingTrigger], [executableAction])).to.be.revertedWith("Unauthorized trigger");
    });

    it("Should revert if action has not been whitelisted", async () => {
      const { ruleExecutor, swapUniSingleAction, priceTrigger, ruleMakerWallet, testToken1 } = await loadFixture(deployRuleExecutorFixture);

      const passingTrigger = makeFailingTrigger(priceTrigger.address); // pass / fail shouldnt matter here
      ruleExecutor.addTriggerToWhitelist(priceTrigger.address);

      const executableAction = makeSwapAction(swapUniSingleAction.address, testToken1.address);

      await expect(ruleExecutor.connect(ruleMakerWallet).createRule([passingTrigger], [executableAction])).to.be.revertedWith("Unauthorized action");
    });

    it("Should emit Created event if Trigger and Action are valid", async () => {
      const { ruleExecutor, swapUniSingleAction, priceTrigger, ruleMakerWallet, testToken1 } = await loadFixture(deployRuleExecutorFixture);

      const passingTrigger = makeFailingTrigger(priceTrigger.address); // pass / fail shouldnt matter here
      const executableAction = makeSwapAction(swapUniSingleAction.address, testToken1.address);

      ruleExecutor.addTriggerToWhitelist(priceTrigger.address);
      ruleExecutor.addActionToWhitelist(swapUniSingleAction.address);

      await expect(ruleExecutor.connect(ruleMakerWallet).createRule(
        [passingTrigger], [executableAction])).to.emit(ruleExecutor, "Created")
        .withArgs(anyValue);
    });

    it("If trigger, action, constrains, user, block are the same, ruleHash should be the same", async () => {
      const { ruleExecutor, swapUniSingleAction, priceTrigger, ruleMakerWallet, testToken1 } = await loadFixture(deployRuleExecutorFixture);

      const passingTrigger = makePassingTrigger(priceTrigger.address);
      const executableAction = makeSwapAction(swapUniSingleAction.address, testToken1.address);

      ruleExecutor.addTriggerToWhitelist(priceTrigger.address);
      ruleExecutor.addActionToWhitelist(swapUniSingleAction.address);

      var rule1Hash: string;
      // This fails because the block isnt the same across these calls.
      // We need to find a way to make both txes part of the same block
      await expect(ruleExecutor.connect(ruleMakerWallet).createRule(
        [passingTrigger], [executableAction])).to.emit(ruleExecutor, "Created")
        .withArgs((_hash: string) => { rule1Hash = _hash; return true; });

      await expect(ruleExecutor.connect(ruleMakerWallet).createRule(
        [passingTrigger], [executableAction])).to.emit(ruleExecutor, "Created")
        .withArgs((_hash2: string) => rule1Hash == _hash2);
    });


    it("Should be able to create multiple unique rules with the same trigger, action, constraints and a different user", async () => {
      const { ruleExecutor, swapUniSingleAction, priceTrigger, ruleMakerWallet, otherWallet1, testToken1, ruleSubscriberWallet } = await loadFixture(deployRuleExecutorFixture);

      const ruleMakerWallet2 = otherWallet1;

      const passingTrigger = makePassingTrigger(priceTrigger.address);
      const executableAction = makeSwapAction(swapUniSingleAction.address, testToken1.address);

      ruleExecutor.addTriggerToWhitelist(priceTrigger.address);
      ruleExecutor.addActionToWhitelist(swapUniSingleAction.address);

      var rule1Hash: string;
      await expect(ruleExecutor.connect(ruleMakerWallet).createRule(
        [passingTrigger], [executableAction])).to.emit(ruleExecutor, "Created")
        .withArgs((_hash: string) => { rule1Hash = _hash; return true; });

      await expect(ruleExecutor.connect(ruleMakerWallet2).createRule(
        [passingTrigger], [executableAction])).to.emit(ruleExecutor, "Created")
        .withArgs((_hash2: string) => rule1Hash != _hash2);
    });

  });

  describe("Check Rule", () => {
    it("should return false if the checkTrigger on the rule denoted by ruleHash returns false", async () => {
      const { ruleExecutor, swapUniSingleAction, priceTrigger, ruleMakerWallet, otherWallet1, testToken1 } = await loadFixture(deployRuleExecutorFixture);

      const passingTrigger = makeFailingTrigger(priceTrigger.address);
      const tokenSwapAction = makeSwapAction(swapUniSingleAction.address, testToken1.address, ethers.constants.AddressZero);
      const ruleHash = await createRule(ruleExecutor, [passingTrigger], [tokenSwapAction], ruleMakerWallet);

      expect(await ruleExecutor.connect(otherWallet1).checkRule(ruleHash)).to.equal(false);

    });

    it.skip("should return false if the checkTrigger is not available on the callee", async () => {
      // WE need to create a Badtrigger for this. 
      // And it's better to test for malicious checkTrigger vs. a non-existent checkTrigger
      // We already check for validateTrigger and revent random addresses from being included      
    });

    it("should return true if the checkTrigger on the callee denoted by ruleHash returns true", async () => {
      const { ruleExecutor, swapUniSingleAction, priceTrigger, ruleMakerWallet, otherWallet1, testToken1 } = await loadFixture(deployRuleExecutorFixture);

      const passingTrigger = makePassingTrigger(priceTrigger.address);
      const tokenSwapAction = makeSwapAction(swapUniSingleAction.address, testToken1.address, ethers.constants.AddressZero);
      const ruleHash = await createRule(ruleExecutor, [passingTrigger], [tokenSwapAction], ruleMakerWallet);

      expect(await ruleExecutor.connect(otherWallet1).checkRule(ruleHash)).to.equal(true);
    });
  });

  describe("Execute Rule with Failing Trigger", () => {
    it("Should revert if anyone tries to execute the rule, and the trigger fails", async () => {
      // It appears that this rule has to be placed before the deployValidRuleFixture.
      // since it calls the deployRuleExecutorFixture
      // It causes all tests after it to fail, if it is located after tests that use deployValidRuleFixture
      const { ruleExecutor, swapUniSingleAction, priceTrigger, ruleMakerWallet, otherWallet1, testToken1 } = await loadFixture(deployRuleExecutorFixture);

      const passingTrigger = makeFailingTrigger(priceTrigger.address);
      const tokenSwapAction = makeSwapAction(swapUniSingleAction.address, testToken1.address, ethers.constants.AddressZero);
      const ruleHash = await createRule(ruleExecutor, [passingTrigger], [tokenSwapAction], ruleMakerWallet, true);


      await expect(ruleExecutor.connect(otherWallet1).executeRule(ruleHash)).to.be.rejectedWith("One (or more) trigger(s) not satisfied");

    });
  });

  async function deployValidRuleFixture() {
    const { ruleExecutor, swapUniSingleAction, priceTrigger, ownerWallet, ruleMakerWallet, ruleSubscriberWallet, otherWallet1, testToken1 } = await loadFixture(deployRuleExecutorFixture);

    const passingTrigger = makePassingTrigger(priceTrigger.address);
    const tokenSwapAction = makeSwapAction(swapUniSingleAction.address, testToken1.address, ethers.constants.AddressZero);
    const ethSwapAction = makeSwapAction(swapUniSingleAction.address, ethers.constants.AddressZero, testToken1.address);

    ruleExecutor.addTriggerToWhitelist(priceTrigger.address);
    ruleExecutor.addActionToWhitelist(swapUniSingleAction.address);

    const ruleHashEth = await createRule(ruleExecutor, [passingTrigger], [ethSwapAction], ruleSubscriberWallet, true);
    const ruleHashToken = await createRule(ruleExecutor, [passingTrigger], [tokenSwapAction], ruleSubscriberWallet, true);

    await testToken1.transfer(ruleSubscriberWallet.address, 200);
    return { ruleHashEth, ruleHashToken, ruleExecutor, ownerWallet, ruleSubscriberWallet, otherWallet1, testToken1 };

  }

  describe("Execute Rule", () => {
    it("should revert if anyone tries to execute an unknown rule", async () => {
      const { ruleHashToken, otherWallet1, ruleExecutor } = await loadFixture(deployValidRuleFixture);
      await expect(ruleExecutor.connect(otherWallet1).executeRule(BAD_RULE_HASH)).to.be.rejectedWith("Rule not found!");
    });

    it.skip("Should revert if anyone tries to execute the rule, and action fails", async () => {
      // Need to create a dummy action and make it fail
      const { ruleHashToken, ruleSubscriberWallet, otherWallet1, ruleExecutor, testToken1 } = await loadFixture(deployValidRuleFixture);
      await expect(ruleExecutor.connect(otherWallet1).executeRule(ruleHashToken)).to.be.rejectedWith("Action unsuccessful");
    });

    it("Should allow anyone to execute the rule and get a reward if gas is paid, and the trigger passes", async () => {
      // execute valid rule with collateral by someone else. and get a reward.
      const { ruleHashToken, ruleSubscriberWallet, otherWallet1, ruleExecutor, testToken1 } = await loadFixture(deployValidRuleFixture);
      await testToken1.connect(ruleSubscriberWallet).approve(ruleExecutor.address, 12);
      await ruleExecutor.connect(ruleSubscriberWallet).addCollateral(ruleHashToken, 12);
      await expect(ruleExecutor.connect(otherWallet1).executeRule(ruleHashToken)).to.emit(ruleExecutor, "Executed")
        .withArgs(ruleHashToken, otherWallet1.address)
        .and.changeTokenBalances(
          testToken1,
          [otherWallet1, ruleExecutor],
          [0, -12],
        );

      // TODO need to implement caller getting paid.
      await expect(ruleExecutor.connect(otherWallet1).executeRule(ruleHashToken)).to.be.revertedWith("Rule is not active!");
    });

    it("Should allow anyone to execute the rule once (native) and get a reward if gas is paid, and the trigger passes", async () => {
      // execute valid rule with collateral by someone else. and get a reward.
      const { ruleHashEth, ruleSubscriberWallet, otherWallet1, ruleExecutor } = await loadFixture(deployValidRuleFixture);
      await expect(ruleExecutor.connect(otherWallet1).executeRule(ruleHashEth)).to.emit(ruleExecutor, "Executed")
        .withArgs(ruleHashEth, otherWallet1.address)
        .and.changeEtherBalances(
          // we dont care about the balance of the swap contracts, 
          // because that's a downstream impact we dont care about here.
          [otherWallet1, ruleSubscriberWallet, ruleExecutor],
          [0, 0, -12],
        );

      // TODO need to implement caller getting paid.
      await expect(ruleExecutor.connect(otherWallet1).executeRule(ruleHashEth)).to.be.revertedWith("Rule is not active!");
    });

    it("Should revert if anyone tries to execute the rule twice", async () => {
      // we get here by calling a valid rule, using up the collateral and call again.
      const { ruleHashToken, ruleSubscriberWallet, otherWallet1, ruleExecutor, testToken1 } = await loadFixture(deployValidRuleFixture);
      await testToken1.connect(ruleSubscriberWallet).approve(ruleExecutor.address, 11);
      await ruleExecutor.connect(ruleSubscriberWallet).addCollateral(ruleHashToken, 6);
      await expect(ruleExecutor.connect(otherWallet1).executeRule(ruleHashToken)).to.emit(ruleExecutor, "Executed")
        .withArgs(ruleHashToken, otherWallet1);

      await expect(ruleExecutor.connect(otherWallet1).executeRule(ruleHashToken)).to.be.revertedWith("Rule is not active!");

    });
  });

  describe.skip("Redeem Balance", () => {
    it("should allow redeeming all the collateral provided if the rule is not yet executed", async () => {

    });

    it("should not allow redeeming collateral if no collateral has been provided by the redeemer", async () => {
      // provide collateral by someone else.
    });

    it("should not allow redeeming collateral if the rule was executed and used the collateral", async () => {

    });

    it("should allow redeeming collateral if the rule returned other assets", async () => {

    });

  });

});

import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { TriggerStruct, ActionStruct, RuleExecutor } from '../typechain-types/contracts/rules/RuleExecutor';
import { assert } from "console";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { int } from "hardhat/internal/core/params/argumentTypes";
import { Contract, Bytes, BigNumber, Wallet } from "ethers";
import {GT, ERC20_DECIMALS, UNI_PRICE_IN_ETH, UNI_PRICE_IN_ETH_PARAM, DEFAULT_REWARD, ETH_PRICE_IN_USD, PRICE_TRIGGER_DECIMALS, UNI_PRICE_IN_USD }  from "./Constants"; 

export async function setupTokens() {
    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken1 = await TestToken.deploy(BigNumber.from("1000000").mul(ERC20_DECIMALS), "Test1", "TST1");
    const testToken2 = await TestToken.deploy(BigNumber.from("1000000").mul(ERC20_DECIMALS), "Test2", "TST2");
    const WETH = await TestToken.deploy(BigNumber.from("1000000").mul(ERC20_DECIMALS), "WETH", "WETH");
    return {testToken1, testToken2, WETH} ; 
}

export function makePassingTrigger(triggerContract: string): TriggerStruct {
    return {
      op: GT,
      param: UNI_PRICE_IN_ETH_PARAM,
      callee: triggerContract,
      value: UNI_PRICE_IN_ETH.sub(1)
    };
  }
  
  export function makeFailingTrigger(triggerContract: string): TriggerStruct {
    return {
      op: GT,
      param: UNI_PRICE_IN_ETH_PARAM,
      callee: triggerContract,
      value: UNI_PRICE_IN_ETH.add(1)
    };
  }
  
  export function makeSwapAction(swapContract: string,
    inputToken: string = ethers.constants.AddressZero,
    outputToken: string = ethers.constants.AddressZero): ActionStruct {
    return {
      callee: swapContract,
      data: "0x0000000000000000000000000000000000000000000000000000000000000000",
      inputToken: inputToken, // eth
      outputToken: outputToken
    };
  
  }
  
  export async function createRule(_whitelistService: Contract, trigWlHash: Bytes, actWlHash: Bytes, _ruleExecutor: Contract, triggers: TriggerStruct[],
    actions: ActionStruct[], wallet: SignerWithAddress, activate: boolean = false): Promise<string> {
    triggers.map(t => _whitelistService.addToWhitelist(trigWlHash, t.callee));
    actions.map(a => _whitelistService.addToWhitelist(actWlHash, a.callee));
  
    // send 1 eth as reward.
    const tx = await _ruleExecutor.connect(wallet).createRule(triggers, actions, { value: DEFAULT_REWARD });
    const receipt2 = await tx.wait();
  
    const ruleHash = receipt2.events?.find(((x: { event: string; }) => x.event == "Created"))?.args?.ruleHash
    if (activate) {
      const tx2 = await _ruleExecutor.connect(wallet).activateRule(ruleHash);
      await tx2.wait();
    }
  
    return ruleHash;
  
  }

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  export async function deployRuleExecutorFixture() {
    // Contracts are deployed using the first signer/account by default
    const [ownerWallet, ruleMakerWallet, ruleSubscriberWallet, botWallet, ethFundWallet] = await ethers.getSigners();

    const WhitelistService = await ethers.getContractFactory("WhitelistService");
    const whitelistService = await WhitelistService.deploy();
    await whitelistService.createWhitelist("triggers");
    const trigWlHash = await whitelistService.getWhitelistHash(ownerWallet.address, "triggers");
    await whitelistService.createWhitelist("actions");
    const actWlHash = await whitelistService.getWhitelistHash(ownerWallet.address, "actions");

    const RuleExecutor = await ethers.getContractFactory("RuleExecutor");
    const ruleExecutor = await RuleExecutor.deploy(whitelistService.address, trigWlHash, actWlHash);
  
    const { testToken1, testToken2, WETH } = await setupTokens(); 

    const TestSwapRouter = await ethers.getContractFactory("TestSwapRouter");
    const testSwapRouter = await TestSwapRouter.deploy(WETH.address);
    // this lets us do 10 swaps
    await testToken1.transfer(testSwapRouter.address, UNI_PRICE_IN_ETH.div(PRICE_TRIGGER_DECIMALS).mul(10).mul(ERC20_DECIMALS));

    await ethFundWallet.sendTransaction({
      to: testSwapRouter.address,
      value: ethers.utils.parseEther('100'), // send 100 ether
    });

    const SwapUniSingleAction = await ethers.getContractFactory("SwapUniSingleAction");
    const swapUniSingleAction = await SwapUniSingleAction.deploy(
      testSwapRouter.address, WETH.address);

    const TestOracle = await ethers.getContractFactory("TestOracle");
    const testOracleEth = await TestOracle.deploy(ETH_PRICE_IN_USD);
    const testOracleUni = await TestOracle.deploy(UNI_PRICE_IN_USD);

    const PriceTrigger = await ethers.getContractFactory("PriceTrigger");
    const priceTrigger = await PriceTrigger.deploy();
    await priceTrigger.addPriceFeed("eth", testOracleEth.address);
    await priceTrigger.addPriceFeed("uni", testOracleUni.address);

    return {
      ruleExecutor, priceTrigger, swapUniSingleAction, testOracleEth, testOracleUni,
      testToken1, testToken2, WETH, ownerWallet, ruleMakerWallet, ruleSubscriberWallet,
      botWallet, whitelistService, trigWlHash, actWlHash
    };
  }

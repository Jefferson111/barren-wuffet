import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, getChainId } from "hardhat";
import { addToWhitelist, getLibraries } from "../utils";
import { Contract } from "ethers";
import dotenv from "dotenv";
import * as liveAddresses from "../arbitrum_addresses";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
  dotenv.config({ path: (await getChainId()) == "31337" ? ".test.env" : ".env", override: true });
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const { TokenLibAddr } = await getLibraries();

  const whitelistService = await ethers.getContract("WhitelistService");
  const actWlHash = await whitelistService.getWhitelistHash(deployer, "actions");
  console.log("actWlHash", actWlHash);
  try {
    await whitelistService.createWhitelist("actions");
  } catch {
    // loose test for "that that whitelist was already created"
  }

  await deployUniswapActions(
    deploy,
    deployer,
    whitelistService,
    actWlHash,
    TokenLibAddr,
    hre.config.networks.hardhat.forking?.enabled
  );
  // TODO: deploy all the other actions

  if ((await whitelistService.getWhitelistOwner(actWlHash)) == deployer) {
    await whitelistService.transferWhitelistOwnership(actWlHash, process.env.PLATFORM_MULTI_SIG_ADDR);
  } // else was already transferred
};

async function deployUniswapActions(
  deploy: any,
  deployer: string,
  whitelistService: Contract,
  actWlHash: any,
  TokenLibAddr: string,
  forked: undefined | boolean
) {
  let uniswapRouterAddr;
  let nonfungiblePositionManagerAddr;
  let weth9Addr;

  // TODO: utils to change the following to vars, depending on chainID
  if ((await getChainId()) == "31337" && !forked) {
    uniswapRouterAddr = (await ethers.getContract("TestSwapRouter")).address;
    nonfungiblePositionManagerAddr = ethers.constants.AddressZero;
    weth9Addr = (await ethers.getContract("WETH")).address;
  } else {
    uniswapRouterAddr = liveAddresses.uniswap.swap_router;
    nonfungiblePositionManagerAddr = liveAddresses.uniswap.non_fungible_position_manager;
    weth9Addr = liveAddresses.tokens.WETH;
  }

  const swapUniSingleAction = await deploy("SwapUniSingleAction", {
    from: deployer,
    args: [uniswapRouterAddr, weth9Addr],
    log: true,
    libraries: { TokenLib: TokenLibAddr }
  });

  const burnLiquidityPositionUniAction = await deploy("BurnLiquidityPositionUni", {
    from: deployer,
    args: [nonfungiblePositionManagerAddr, weth9Addr],
    log: true,
    libraries: { TokenLib: TokenLibAddr }
  });

  const mintLiquidityPositionUniAction = await deploy("MintLiquidityPositionUni", {
    from: deployer,
    args: [nonfungiblePositionManagerAddr, weth9Addr, burnLiquidityPositionUniAction.address],
    log: true,
    libraries: { TokenLib: TokenLibAddr }
  });

  const collectFeesUniAction = await deploy("CollectFeesUni", {
    from: deployer,
    args: [nonfungiblePositionManagerAddr, weth9Addr],
    log: true,
    libraries: { TokenLib: TokenLibAddr }
  });

  const increaseLiquidityUniAction = await deploy("IncreaseLiquidityUni", {
    from: deployer,
    args: [nonfungiblePositionManagerAddr, weth9Addr],
    log: true,
    libraries: { TokenLib: TokenLibAddr }
  });

  const decreaseLiquidityUniAction = await deploy("DecreaseLiquidityUni", {
    from: deployer,
    args: [nonfungiblePositionManagerAddr, weth9Addr],
    log: true,
    libraries: { TokenLib: TokenLibAddr }
  });

  await addToWhitelist(deployer, whitelistService, actWlHash, swapUniSingleAction.address);
  await addToWhitelist(deployer, whitelistService, actWlHash, burnLiquidityPositionUniAction.address);
  await addToWhitelist(deployer, whitelistService, actWlHash, mintLiquidityPositionUniAction.address);
  await addToWhitelist(deployer, whitelistService, actWlHash, collectFeesUniAction.address);
  await addToWhitelist(deployer, whitelistService, actWlHash, increaseLiquidityUniAction.address);
  await addToWhitelist(deployer, whitelistService, actWlHash, decreaseLiquidityUniAction.address);
}

export default func;
func.tags = ["Actions"];
func.dependencies = ["TestStubs", "Libraries", "WhitelistService"];

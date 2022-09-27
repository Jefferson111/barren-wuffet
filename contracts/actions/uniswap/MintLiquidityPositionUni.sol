// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../IAction.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "../../utils/Constants.sol";
import "../DelegatePerform.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";

/*
    Reference: 
        https://docs.uniswap.org/protocol/guides/providing-liquidity/the-full-contract

    Tokens: 
        Will only have 2 input tokens and 3 output (refund of first 2, and an NFT)

    TriggerReturn: 
        Applicable TriggerReturn must be in (asset1, asset2, val) where val.decimals = 8, asset1 = inputToken and asset2 = outputToken
            Example: 
            ETH/USD -> USD per ETH -> ETH Price in USD -> triggerReturn = [ETH, USD, val] -> Must use when tokenIn = ETH and tokenOut = USD (i.e. buying USD with ETH)
            USD/ETH -> ETH per USD -> USD Price in ETH -> triggerReturn = [USD, ETH, val] -> Must use when tokenIn = USD* and tokenOut = ETH (i.e. buying ETH with USD)
*/
contract MintLiquidityPositionUni is IAction, DelegatePerform {
    using SafeERC20 for IERC20;

    INonfungiblePositionManager immutable nonfungiblePositionManager;
    address immutable WETH9Addr;
    address immutable burnPositionAddr;

    constructor(
        address _nonfungiblePositionManager,
        address wethAddress,
        address _burnPositionAddr
    ) {
        nonfungiblePositionManager = INonfungiblePositionManager(_nonfungiblePositionManager);
        WETH9Addr = wethAddress;
        burnPositionAddr = _burnPositionAddr;
    }

    function validate(Action calldata action) external pure returns (bool) {
        //TODO: need more validation here
        require(action.inputTokens.length == 2);
        require(action.outputTokens.length == 3);
        return true;
    }

    // TODO: make this handle ETH pools too
    function perform(Action calldata action, ActionRuntimeParams calldata runtimeParams)
        external
        delegateOnly
        returns (ActionResponse memory)
    {
        uint256[] memory outputs = new uint256[](3);

        // For this example, we will provide equal amounts of liquidity in both assets.
        // Providing liquidity in both assets means liquidity will be earning fees and is considered in-range.
        uint256 amount0ToMint = runtimeParams.collaterals[0];
        uint256 amount1ToMint = runtimeParams.collaterals[1];

        // Approve the position manager
        IERC20(action.inputTokens[0].addr).safeApprove(address(nonfungiblePositionManager), amount0ToMint);
        IERC20(action.inputTokens[1].addr).safeApprove(address(nonfungiblePositionManager), amount1ToMint);

        // The values for tickLower and tickUpper may not work for all tick spacings.
        // Setting amount0Min and amount1Min to 0 is unsafe.
        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: action.inputTokens[0].addr,
            token1: action.inputTokens[1].addr,
            fee: 3000, // TODO:
            tickLower: TickMath.MIN_TICK,
            tickUpper: TickMath.MAX_TICK,
            amount0Desired: amount0ToMint,
            amount1Desired: amount1ToMint,
            amount0Min: 0, // TODO: take these from triggerParams
            amount1Min: 0,
            recipient: address(this),
            deadline: block.timestamp
        });

        (uint256 tokenId, uint256 liquidity, uint256 amount0, uint256 amount1) = nonfungiblePositionManager.mint(
            params
        );

        // Remove allowance and refund in both assets.
        IERC20(action.inputTokens[0].addr).safeApprove(address(nonfungiblePositionManager), 0);
        IERC20(action.inputTokens[1].addr).safeApprove(address(nonfungiblePositionManager), 0);

        uint256 refund0 = 0;
        if (amount0 < amount0ToMint) {
            refund0 = amount0ToMint - amount0;
        }

        uint256 refund1 = 0;
        if (amount1 < amount1ToMint) {
            refund1 = amount1ToMint - amount1;
        }

        outputs[0] = refund0;
        outputs[1] = refund1;
        outputs[2] = tokenId;

        // setting up position
        Token[] memory inputTokens = new Token[](1);
        inputTokens[0] = Token({t: TokenType.ERC721, addr: address(nonfungiblePositionManager), id: tokenId});
        Action[] memory nextActions = new Action[](1);
        nextActions[0] = Action({
            callee: burnPositionAddr,
            data: "",
            inputTokens: inputTokens,
            outputTokens: new Token[](0)
        });
        Position memory pos = Position({actionConstraints: new ActionConstraints[](0), nextActions: nextActions});
        return ActionResponse({tokenOutputs: outputs, position: pos});
    }
}

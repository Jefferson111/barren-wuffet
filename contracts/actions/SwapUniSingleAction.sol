// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../Types.sol";
import "./IAction.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "../REConstants.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SwapUniSingleAction is IAction {
    using SafeERC20 for IERC20;

    ISwapRouter swapRouter;
    address WETH9;

    constructor(address swapRouterAddress, address wethAddress) {
        swapRouter = ISwapRouter(swapRouterAddress);
        WETH9 = wethAddress;
    }

    function validate(Action calldata) external pure returns (bool) {
        // we'll be ignoring action.data in swapUni (?)
        return true;
    }

    function perform(Action calldata action, ActionRuntimeParams calldata runtimeParams)
        external
        payable
        returns (uint256)
    {
        ISwapRouter.ExactInputSingleParams memory params;
        uint256 amountOut;

        if (msg.value > 0) {
            require(action.inputToken == REConstants.ETH, "ETH != inputToken");
            params = ISwapRouter.ExactInputSingleParams({
                tokenIn: WETH9,
                tokenOut: action.outputToken,
                fee: 3000, // TODO: pass from action.data?
                recipient: msg.sender,
                deadline: block.timestamp, // need to do an immediate swap
                amountIn: msg.value,
                amountOutMinimum: runtimeParams.triggerData,
                sqrtPriceLimitX96: 0
            });
            amountOut = swapRouter.exactInputSingle{value: msg.value}(params);
        } else {
            address outputToken;
            if (action.outputToken == REConstants.ETH) {
                outputToken = WETH9;
            } else {
                outputToken = action.outputToken;
            }
            IERC20(action.inputToken).safeTransferFrom(msg.sender, address(this), runtimeParams.totalCollateralAmount);
            IERC20(action.inputToken).safeApprove(address(swapRouter), runtimeParams.totalCollateralAmount);
            params = ISwapRouter.ExactInputSingleParams({
                tokenIn: action.inputToken,
                tokenOut: outputToken,
                fee: 3000, // TODO: pass from action.data?
                recipient: msg.sender,
                deadline: block.timestamp, // need to do an immediate swap
                amountIn: runtimeParams.totalCollateralAmount,
                amountOutMinimum: runtimeParams.triggerData,
                sqrtPriceLimitX96: 0
            });
            amountOut = swapRouter.exactInputSingle(params);
            IERC20(action.inputToken).safeApprove(address(swapRouter), 0);
        }

        return (amountOut);
    }
}

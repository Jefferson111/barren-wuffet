// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
pragma abicoder v2;

// Import this file to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./Utils.sol";
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';

//TODO: we will likely want the trigger value to be fed into the action. we need to specify the param that we want to feed.


contract RuleExecutor is Ownable {
    
    address ETH = address(0); 

    enum Ops { GT, EQ, LT }
    // If Trigger and Action are update, the HashRule needs to be updated
    struct Trigger {
        // eg. asset,price,gt
        string param;
        string value;
        Ops op;
    }

    struct Action {        
        string action;          // eg. swapUni
        bytes data;             // abi encoded function call
        address fromToken;      // token to be used to initiate the action   
        address toToken;        // token to be gotten as output
        uint minTokenAmount;    // minimum amount needed as collateral to subscribe 
        uint totalCollateralAmount; 
    }

    struct Rule {        
        Trigger trigger;
        // action
        // action:data:asset:amount
        // swapUni:
        // action is a smart contract call, data is sent to the call
        // anyone can execute it. 
        Action action;
        bool executed; 
        uint outputAmount; 
    }

    // hash -> Rule
    mapping(bytes32 => Rule) rules;

    struct Subscription {
        address subscriber;
        uint collateralAmount; 
    }

    // ruleHash -> [Subscription]
    mapping(bytes32 => Subscription[]) subscriptions;
        
    struct TriggerFeed {
        address dataSource;
        bytes4 fn;
        mapping(string => string) params;
    }
    
    // keyword -> fn call to get data
    // if we know how to get the value, then it can be a trigger. so this serves as a list of allowed triggers
    // can have multiple, and we find median. This is a standard oracle call we can extend
    mapping(string => TriggerFeed[]) triggerFeeds;

    constructor() {

        // there isnt a cleaner way to init this struct.
        // https://docs.soliditylang.org/en/v0.7.1/070-breaking-changes.html#mappings-outside-storage
        // https://docs.soliditylang.org/en/v0.7.0/types.html?highlight=struct#structs
        TriggerFeed storage tf = triggerFeeds["eth"][0];
        tf.dataSource = 0xc0ffee254729296a45a3885639AC7E10F9d54979; // chainlink feed
        tf.fn="abic";    
        tf.params["token"] = "eth";

        tf = triggerFeeds["uni"][0]; // mutating the vars yo. I feel icky enough already whatever
        tf.dataSource = 0xc0ffee254729296a45a3885639AC7E10F9d54979; // chainlink feed
        tf.fn="abic";    
        tf.params["token"] = "uni";

        tf = triggerFeeds["wbtc"][0]; // mutating the vars yo. I feel icky enough already whatever
        tf.dataSource = 0xc0ffee254729296a45a3885639AC7E10F9d54979; // chainlink feed
        tf.fn="abic";    
        tf.params["token"] = "wbtc";    
    }

    function addTriggerFeeds(string memory param, uint idx, address dataSource, bytes4 fn, string[] memory params) public onlyOwner {
        TriggerFeed storage tf = triggerFeeds[param][idx];
        tf.dataSource = dataSource;
        tf.fn = fn;
        for (uint i = 0; i < params.length; i++){
            // TODO. need to split the params by comma.
            tf.params[params[i]] = params[i];
        }        
    }

    function _first(uint[] memory vals) private pure returns (uint) {        
        return vals[0];
    }

    function _checkTrigger(Trigger storage trigger) private returns (bool) {
        // get the val of var, so we can check if it matches trigger
        (string storage param, string storage val, Ops op) = (trigger.param, trigger.value, trigger.op);
        uint triggerFeedsLength  = 1; //TODO need to keep track of trigger feeds length separately to init this.
        TriggerFeed[] storage _triggerFeeds = triggerFeeds[param];
        uint[] memory oracleValues = new uint[](triggerFeedsLength);
        for (uint i = 0;i < triggerFeedsLength; i++){
            TriggerFeed storage tf = _triggerFeeds[i];
            (address dataSource, bytes4 fn, mapping(string => string) storage params) = (tf.dataSource, tf.fn, tf.params);
            bytes memory oracleValue = Address.functionCall(dataSource, abi.encodeWithSelector(fn)); // bytes(params)));

            oracleValues[i] = abi.decode(oracleValue, (uint));
        }
        uint firstVal = _first(oracleValues); // TODO: we might want some aggregator function. see chainlink code and figure it out.
        
        if(op == Ops.GT){            
            return firstVal > Utils.toUint256(bytes(val), 0);
        }
        if(op == Ops.LT){
            return firstVal < Utils.toUint256(bytes(val), 0);
        }
        if(op == Ops.EQ){
            return firstVal == Utils.toUint256(bytes(val), 0);
        }
    }

    function _performAction(Action storage action) private returns (uint amountOut) {            
        // TODO

        if (Utils.strEq(action.action, "swapUni")) {
            amountOut = _performSwapUni(action);
        }

        // TODO: convert resp to uint and return; this should tell you how much token you've gotten from the trade.
    }

    function _performSwapUni(Action storage action) private returns (uint amountOut) {
        ISwapRouter swapRouter = ISwapRouter(0xc0ffee254729296a45a3885639AC7E10F9d54979);  // TODO: put in the right addr
        address WETH9 = 0xc0ffee254729296a45a3885639AC7E10F9d54979; // TODO: put in the right addr

        ISwapRouter.ExactInputSingleParams memory params; 

        if (action.fromToken == ETH) {
            params =
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: WETH9,
                    tokenOut: action.toToken,
                    fee: 3000, // TODO: pass from action.data? 
                    recipient: address(this),
                    deadline: block.timestamp, // need to do an immediate swap
                    amountIn: action.totalCollateralAmount,
                    amountOutMinimum: 0, // TODO: this needs to be fed in from the trigger
                    sqrtPriceLimitX96: 0
                });
            amountOut = swapRouter.exactInputSingle{value: action.totalCollateralAmount}(params);
        } else {
                address toToken; 
                if (action.toToken == ETH) {
                    toToken = WETH9; 
                } else {
                    toToken = action.toToken; 
                }

                IERC20(action.fromToken).approve(address(swapRouter), action.totalCollateralAmount);
                params =
                    ISwapRouter.ExactInputSingleParams({
                        tokenIn: action.fromToken,
                        tokenOut: toToken,
                        fee: 3000, // TODO: pass from action.data? 
                        recipient: address(this),
                        deadline: block.timestamp, // need to do an immediate swap
                        amountIn: action.totalCollateralAmount,
                        amountOutMinimum: 0, // TODO: this needs to be fed in from the trigger
                        sqrtPriceLimitX96: 0
                    });
                amountOut = swapRouter.exactInputSingle(params);
                IERC20(action.fromToken).approve(address(swapRouter), 0);
        }
    }

    function _redeemBalance(address receiver, uint balance, address token) internal {
        if (token != ETH) {
            IERC20(token).transfer(receiver, balance);
        } else {
            payable(receiver).transfer(balance); 
        }        
    }

    function redeemBalance(bytes32 ruleHash, uint subscriptionIdx) public {
        Rule storage rule = rules[ruleHash]; 
        Subscription storage subscription = subscriptions[ruleHash][subscriptionIdx]; 

        if (rule.executed) {
            // withdrawing after successfully triggered rule
            uint balance = subscription.collateralAmount*rule.outputAmount/rule.action.totalCollateralAmount;
            _redeemBalance(subscription.subscriber, balance, rule.action.toToken); 
        } else {
            // withdrawing before anyone triggered this
            rule.action.totalCollateralAmount = rule.action.totalCollateralAmount - subscription.collateralAmount;
            _redeemBalance(subscription.subscriber, subscription.collateralAmount, rule.action.fromToken);
        }
    }

    function _validateCollateral(Action storage action, address collateralToken, uint collateralAmount) private view {
        require(action.fromToken == collateralToken);
        require(action.minTokenAmount <= collateralAmount);

        if (collateralToken == ETH) {
            require(collateralAmount == msg.value); 
        }
    }

    function addRule(Trigger calldata trigger, Action calldata action) public { // var:val:op, action:data
        // ethPrice: 1000: gt, uniswap:<sellethforusdc>
        // check if action[0] is in actionTypes
        // if action[1] is "swap", we need to do a swap.
        // we could store the "swap" opcodes as data, which will allow us to whitelist rules.
        // the swap will happen on behalf of this contract, 
        // need to approve uniswap to take asset1 from this contract, and get asset2 back        
        _validateTrigger(trigger);
        _validateAction(action);
        Rule storage rule = rules[_hashRule(trigger, action)];
        rule.trigger = trigger;
        rule.action = action;
        rule.executed = false; 
        rule.outputAmount = 0; 
    }

    function _hashRule(Trigger memory trigger, Action memory action) private pure returns (bytes32) {
        return keccak256(abi.encode(trigger.op, trigger.param, trigger.value, action.action, action.data, action.fromToken, action.minTokenAmount));
    }

    function subscribeToRule(bytes32 ruleHash, address collateralToken, uint collateralAmount) public {    
        _validateCollateral(rules[ruleHash].action, collateralToken, collateralAmount);
        _collectCollateral(collateralToken, collateralAmount);  
        Subscription storage newSub = subscriptions[ruleHash].push(); 
        newSub.subscriber = msg.sender; 
        // TODO: take a fee here
        newSub.collateralAmount = collateralAmount;
        rules[ruleHash].action.totalCollateralAmount = rules[ruleHash].action.totalCollateralAmount + collateralAmount; 
    }
    
    function _collectCollateral(address collateralToken, uint collateralAmount) private {
         if (collateralToken != ETH) {
            IERC20(collateralToken).transferFrom(msg.sender, address(this), collateralAmount);
        } // else it should be in our balance already 
    }

    function _validateTrigger(Trigger memory trigger) private view {
        require(bytes(trigger.param).length != 0 && bytes(trigger.value).length != 0 && triggerFeeds[trigger.param][0].dataSource != address(0), "unauthorized trigger");
    }

    // will need to update the contract to add more _create* actions that are allowed. 
    function _validateAction(Action memory action) private {
        require(action.totalCollateralAmount == 0, "Wrong collateral amount stated"); 
        if (Utils.strEq(action.action, "swapUni")) {
            _validateSwapUni(action); 
        } else if (Utils.strEq(action.action, "swapSushi")) {
            _validateSwapSushi(action); 
        } else {
            revert("Action not supported"); 
        }
        // and so on
    }

    function _validateSwapUni(Action memory action) private {
        // we'll be ignoring action.data in swapUni (?)
    }

    function _validateSwapSushi(Action memory action) private {
        // TODO
    }


    function executeRule(bytes32 ruleHash) public payable { // <- send gas, get a refund if action is performed, else lose gas.
        // check if trigger is met
        // if yes, execute the tx
        // give reward to caller
        // if not, abort            
        
        Rule storage rule = rules[ruleHash];
        require(bytes(rule.action.action).length > 0, "Rule not found!");
        require(_checkTrigger(rule.trigger), "Trigger not satisfied");
        uint outputAmount = _performAction(rule.action);
        rule.outputAmount = outputAmount; 
        rule.executed = true; 
    } 
}

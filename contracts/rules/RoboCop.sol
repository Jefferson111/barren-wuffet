// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../utils/Utils.sol";
import "../utils/Constants.sol";
import "../utils/assets/TokenLib.sol";
import "../utils/CustomEnumerableMap.sol";
import "../actions/IAction.sol";
import "../triggers/ITrigger.sol";
import "./RuleTypes.sol";
import "./IRoboCop.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/* 
    Token accoutning modifications: 
        - TokensOnHold = RoboCop has to maintain a list of tokens demarcated for rules that are not yet executed. Custom EnumerableMap(Token=>uint) should work.
            -- At the end of add/reduceCollateral and executeRule, TokensOnHold will be modified by the inputTokens. 
        - ERC20/Native works differently from ERC721. 
            -- ERC20/Native can have a BalanceOf, but ERC721 can't (no way to list all the tokens an address holds)
            -- i.e. ActionResponse.tokenOutputs still has to be kept, but only used for NFTs. 
        - we'll change to a redeemAllBalances() thing, where we walk through every executed rule and send back tokens that are not demarcated: 
            -- For ERC20/NATIVE this is send(getBalanceOf(Token) - TokensOnHold[Token])
            -- For ERC721 this is send(rule.outputs[TokenIdx])
            -- This means `rules` has to become a custom Enumerable Map too. 
*/
contract RoboCop is IRoboCop, IERC721Receiver, Initializable, Ownable, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using CustomEnumerableMap for CustomEnumerableMap.Bytes32ToBytesMap;
    using TokenLib for Token;

    // Storage Start
    CustomEnumerableMap.Bytes32ToBytesMap rules;
    mapping(bytes32 => bytes32[]) public actionPositionsMap;
    EnumerableSet.Bytes32Set private pendingPositions;
    mapping(bytes32 => mapping(address => uint256)) public ruleIncentiveProviders;

    // Storage End

    // disable calling initialize() on the implementation contract
    constructor() {
        _disableInitializers();
    }

    function initialize(address _newOwner) external nonReentrant initializer {
        _transferOwnership(_newOwner);
    }

    function getRule(bytes32 ruleHash) public view returns (Rule memory) {
        return abi.decode(rules.get(ruleHash), (Rule));
    }

    function _setRule(bytes32 ruleHash, Rule memory rule) internal {
        rules.set(ruleHash, abi.encode(rule));
    }

    function getInputTokens(bytes32 ruleHash) public view returns (Token[] memory) {
        return getRule(ruleHash).actions[0].inputTokens;
    }

    function getOutputTokens(bytes32 ruleHash) public view returns (Token[] memory) {
        Rule memory rule = getRule(ruleHash);
        return rule.actions[rule.actions.length - 1].outputTokens;
    }

    function redeemBalance(bytes32 ruleHash) external nonReentrant onlyOwner {
        Rule memory rule = getRule(ruleHash);
        _setRuleStatus(ruleHash, RuleStatus.REDEEMED);
        Token[] memory tokens = getOutputTokens(ruleHash);

        for (uint256 i = 0; i < tokens.length; i++) {
            tokens[i].send(owner(), rule.outputs[i]);
        }
    }

    function addCollateral(bytes32 ruleHash, uint256[] memory collaterals) external payable onlyOwner nonReentrant {
        Rule memory rule = getRule(ruleHash);
        require(rule.status == RuleStatus.ACTIVE || rule.status == RuleStatus.INACTIVE, "Can't add collateral");

        Token[] memory tokens = getInputTokens(ruleHash);
        uint256 collateral;

        for (uint256 i = 0; i < tokens.length; i++) {
            collateral = collaterals[i];

            if (tokens[i].t == TokenType.NATIVE || tokens[i].t == TokenType.ERC20) {
                require(collateral > 0, "amount <= 0");
                rule.collaterals[i] += collateral;
            } else {
                // NFT
                rule.collaterals[i] = collateral; //TODO: already part of token.id; why store again?
            }

            if (tokens[i].t == TokenType.NATIVE) {
                require(collateral == msg.value, "ETH: amount != msg.value");
            } else {
                tokens[i].take(msg.sender, collateral);
            }
        }

        _setRule(ruleHash, rule);
        emit CollateralAdded(ruleHash, collaterals);
    }

    function reduceCollateral(bytes32 ruleHash, uint256[] memory amounts) external onlyOwner nonReentrant {
        Rule memory rule = getRule(ruleHash);
        require(rule.status == RuleStatus.ACTIVE || rule.status == RuleStatus.INACTIVE, "Can't reduce collateral");

        Token[] memory tokens = getInputTokens(ruleHash);
        uint256 amount;

        for (uint256 i = 0; i < tokens.length; i++) {
            amount = amounts[i];
            require(rule.collaterals[i] >= amount, "Not enough collateral.");
            rule.collaterals[i] -= amount;
            tokens[i].send(msg.sender, amount);
        }
        _setRule(ruleHash, rule);
        emit CollateralReduced(ruleHash, amounts);
    }

    function increaseIncentive(bytes32 ruleHash) public payable {
        Rule memory rule = getRule(ruleHash);
        require(rule.status == RuleStatus.ACTIVE || rule.status == RuleStatus.INACTIVE);
        rule.incentive += msg.value;
        _setRule(ruleHash, rule);
        ruleIncentiveProviders[ruleHash][msg.sender] += msg.value;
    }

    function withdrawIncentive(bytes32 ruleHash) external returns (uint256 balance) {
        Rule memory rule = getRule(ruleHash);
        require(rule.status != RuleStatus.EXECUTED && rule.status != RuleStatus.REDEEMED, "Incentive paid");
        balance = ruleIncentiveProviders[ruleHash][msg.sender];
        require(balance > 0, "0 contribution");
        rule.incentive -= balance;
        _setRule(ruleHash, rule);
        ruleIncentiveProviders[ruleHash][msg.sender] = 0;

        // slither-disable-next-line arbitrary-send
        payable(msg.sender).transfer(balance);
    }

    function createRule(Trigger[] calldata triggers, Action[] calldata actions)
        external
        payable
        nonReentrant
        onlyOwner
        returns (bytes32)
    {
        bytes32 ruleHash = _getRuleHash(triggers, actions);
        require(!rules.contains(ruleHash), "Duplicate Rule");
        Rule memory newRule;
        require(actions.length > 0); // has to do something, else is a waste!

        newRule.triggers = new Trigger[](triggers.length);
        for (uint256 i = 0; i < triggers.length; i++) {
            require(ITrigger(triggers[i].callee).validate(triggers[i]), "Invalid Trigger");
            newRule.triggers[i] = triggers[i];
        }

        newRule.actions = new Action[](actions.length);
        for (uint256 i = 0; i < actions.length; i++) {
            require(IAction(actions[i].callee).validate(actions[i]), "Invalid Action");

            if (i != actions.length - 1) {
                Token[] memory inputTokens = actions[i + 1].inputTokens;
                Token[] memory outputTokens = actions[i].outputTokens;
                for (uint256 j = 0; j < outputTokens.length; j++) {
                    require(outputTokens[j].equals(inputTokens[j]), "Invalid inputTokens->outputTokens");
                }
            }
            newRule.actions[i] = actions[i];
        }

        newRule.status = RuleStatus.INACTIVE;

        newRule.collaterals = new uint256[](actions[0].inputTokens.length);

        _setRule(ruleHash, newRule);

        increaseIncentive(ruleHash);

        emit Created(ruleHash);
        return ruleHash;
    }

    /*
        Valid State Transitions: (from) => (to)

        ACTIVE => {inactive, executed}
        INACTIVE => {active}
        EXECUTED => {redeemed}
        REDEEMED => {}
    */
    function _setRuleStatus(bytes32 ruleHash, RuleStatus newStatus) private returns (Rule memory) {
        Rule memory rule = getRule(ruleHash);

        if (newStatus == RuleStatus.ACTIVE) {
            require(rule.status == RuleStatus.INACTIVE, "Can't Activate Rule");
            emit Activated(ruleHash);
        } else if (newStatus == RuleStatus.INACTIVE) {
            require(rule.status == RuleStatus.ACTIVE, "Can't Deactivate Rule");
            emit Deactivated(ruleHash);
        } else if (newStatus == RuleStatus.EXECUTED) {
            require(rule.status == RuleStatus.ACTIVE, "Rule isn't Activated");
            emit Executed(ruleHash, msg.sender);
        } else if (newStatus == RuleStatus.REDEEMED) {
            require(rule.status == RuleStatus.EXECUTED, "Rule isn't pending redemption");
            emit Redeemed(ruleHash);
        } else {
            revert("RuleStatus not covered!");
        }

        rule.status = newStatus;

        _setRule(ruleHash, rule);

        return rule;
    }

    function activateRule(bytes32 ruleHash) external onlyOwner {
        _setRuleStatus(ruleHash, RuleStatus.ACTIVE);
    }

    function deactivateRule(bytes32 ruleHash) external onlyOwner {
        _setRuleStatus(ruleHash, RuleStatus.INACTIVE);
    }

    function _getRuleHash(Trigger[] calldata triggers, Action[] calldata actions) private view returns (bytes32) {
        return keccak256(abi.encode(triggers, actions, msg.sender, block.timestamp, address(this)));
    }

    function _checkTriggers(Trigger[] memory triggers) internal view returns (bool, TriggerReturn[] memory) {
        TriggerReturn[] memory triggerReturnArr = new TriggerReturn[](triggers.length);
        TriggerReturn memory triggerReturn;
        bool valid = false;
        for (uint256 i = 0; i < triggers.length; i++) {
            (valid, triggerReturn) = ITrigger(triggers[i].callee).check(triggers[i]);
            triggerReturnArr[i] = triggerReturn;
            if (!valid) return (false, triggerReturnArr);
        }
        return (true, triggerReturnArr);
    }

    function checkRule(bytes32 ruleHash) external view returns (bool valid) {
        (valid, ) = _checkTriggers(getRule(ruleHash).triggers);
    }

    function _takeAction(Action memory action, ActionRuntimeParams memory runtimeParams)
        private
        returns (uint256[] memory)
    {
        for (uint256 j = 0; j < action.inputTokens.length; j++) {
            // ignore return value

            action.inputTokens[j].approve(action.callee, runtimeParams.collaterals[j]);
        }
        bool positionsClosed;
        bytes32[] memory deletedPositionHashes;
        (positionsClosed, deletedPositionHashes) = Utils._closePosition(action, pendingPositions, actionPositionsMap);
        if (positionsClosed) {
            emit PositionsClosed(abi.encode(action), deletedPositionHashes);
        }

        ActionResponse memory response = Utils._delegatePerformAction(action, runtimeParams);

        bool positionCreated;
        bytes32 positionHash;
        (positionCreated, positionHash) = Utils._createPosition(
            action,
            response.position.nextActions,
            pendingPositions,
            actionPositionsMap
        );

        if (positionCreated) {
            bytes[] memory abiEncodedNextActions = new bytes[](response.position.nextActions.length);
            for (uint256 i = 0; i < response.position.nextActions.length; i++) {
                abiEncodedNextActions[i] = abi.encode(response.position.nextActions[i]);
            }
            emit PositionCreated(positionHash, abi.encode(action), abiEncodedNextActions);
        }

        return response.tokenOutputs;
    }

    function executeRule(bytes32 ruleHash) external nonReentrant {
        Rule memory rule = getRule(ruleHash);
        rule = _setRuleStatus(ruleHash, RuleStatus.EXECUTED); // This ensures only active rules can be executed
        (bool valid, TriggerReturn[] memory triggerReturnArr) = _checkTriggers(rule.triggers);
        require(valid, "Trigger != Satisfied");

        ActionRuntimeParams memory runtimeParams = ActionRuntimeParams({
            triggerReturnArr: triggerReturnArr,
            collaterals: rule.collaterals
        });

        uint256[] memory outputs;
        for (uint256 i = 0; i < rule.actions.length; i++) {
            Action memory action = rule.actions[i];
            outputs = _takeAction(action, runtimeParams);
            runtimeParams.collaterals = outputs; // changes because outputTokens of action[i-1] is inputTokens of action[i]
            _noteIdOfERC721Outputs(outputs, action.outputTokens);
        }

        rule.outputs = outputs;
        _setRule(ruleHash, rule);
        payable(msg.sender).transfer(rule.incentive); // slither-disable-next-line arbitrary-send // for the taking. // As long as the execution reaches this point, the incentive is there // We dont need to check sender here.
    }

    function hasPendingPosition() public view returns (bool) {
        return pendingPositions.length() > 0;
    }

    function actionClosesPendingPosition(Action calldata action) public view returns (bool) {
        return actionPositionsMap[keccak256(abi.encode(action))].length > 0;
    }

    function _noteIdOfERC721Outputs(uint256[] memory outputs, Token[] memory outputTokens) internal {
        // Even if we do know which NFT contract we're going to get an output from,
        // we probably don't know the id of the token issued (determined at the point of execution)
        // so we mutate the rule.outputToken accordingly
        for (uint256 i = 0; i < outputTokens.length; i++) {
            if (outputTokens[i].t == TokenType.ERC721) {
                outputTokens[i].id = outputs[i];
            }
        }
    }

    receive() external payable {}

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        // we don't need to save any info
        return this.onERC721Received.selector;
    }
}

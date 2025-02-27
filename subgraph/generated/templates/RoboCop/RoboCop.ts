// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class Activated extends ethereum.Event {
  get params(): Activated__Params {
    return new Activated__Params(this);
  }
}

export class Activated__Params {
  _event: Activated;

  constructor(event: Activated) {
    this._event = event;
  }

  get ruleHash(): Bytes {
    return this._event.parameters[0].value.toBytes();
  }
}

export class CollateralAdded extends ethereum.Event {
  get params(): CollateralAdded__Params {
    return new CollateralAdded__Params(this);
  }
}

export class CollateralAdded__Params {
  _event: CollateralAdded;

  constructor(event: CollateralAdded) {
    this._event = event;
  }

  get ruleHash(): Bytes {
    return this._event.parameters[0].value.toBytes();
  }

  get amounts(): Array<BigInt> {
    return this._event.parameters[1].value.toBigIntArray();
  }
}

export class CollateralReduced extends ethereum.Event {
  get params(): CollateralReduced__Params {
    return new CollateralReduced__Params(this);
  }
}

export class CollateralReduced__Params {
  _event: CollateralReduced;

  constructor(event: CollateralReduced) {
    this._event = event;
  }

  get ruleHash(): Bytes {
    return this._event.parameters[0].value.toBytes();
  }

  get amounts(): Array<BigInt> {
    return this._event.parameters[1].value.toBigIntArray();
  }
}

export class Created extends ethereum.Event {
  get params(): Created__Params {
    return new Created__Params(this);
  }
}

export class Created__Params {
  _event: Created;

  constructor(event: Created) {
    this._event = event;
  }

  get ruleHash(): Bytes {
    return this._event.parameters[0].value.toBytes();
  }
}

export class Deactivated extends ethereum.Event {
  get params(): Deactivated__Params {
    return new Deactivated__Params(this);
  }
}

export class Deactivated__Params {
  _event: Deactivated;

  constructor(event: Deactivated) {
    this._event = event;
  }

  get ruleHash(): Bytes {
    return this._event.parameters[0].value.toBytes();
  }
}

export class Executed extends ethereum.Event {
  get params(): Executed__Params {
    return new Executed__Params(this);
  }
}

export class Executed__Params {
  _event: Executed;

  constructor(event: Executed) {
    this._event = event;
  }

  get ruleHash(): Bytes {
    return this._event.parameters[0].value.toBytes();
  }

  get executor(): Address {
    return this._event.parameters[1].value.toAddress();
  }
}

export class Initialized extends ethereum.Event {
  get params(): Initialized__Params {
    return new Initialized__Params(this);
  }
}

export class Initialized__Params {
  _event: Initialized;

  constructor(event: Initialized) {
    this._event = event;
  }

  get version(): i32 {
    return this._event.parameters[0].value.toI32();
  }
}

export class OwnershipTransferred extends ethereum.Event {
  get params(): OwnershipTransferred__Params {
    return new OwnershipTransferred__Params(this);
  }
}

export class OwnershipTransferred__Params {
  _event: OwnershipTransferred;

  constructor(event: OwnershipTransferred) {
    this._event = event;
  }

  get previousOwner(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get newOwner(): Address {
    return this._event.parameters[1].value.toAddress();
  }
}

export class PositionCreated extends ethereum.Event {
  get params(): PositionCreated__Params {
    return new PositionCreated__Params(this);
  }
}

export class PositionCreated__Params {
  _event: PositionCreated;

  constructor(event: PositionCreated) {
    this._event = event;
  }

  get positionHash(): Bytes {
    return this._event.parameters[0].value.toBytes();
  }

  get precursorAction(): Bytes {
    return this._event.parameters[1].value.toBytes();
  }

  get nextActions(): Array<Bytes> {
    return this._event.parameters[2].value.toBytesArray();
  }
}

export class PositionsClosed extends ethereum.Event {
  get params(): PositionsClosed__Params {
    return new PositionsClosed__Params(this);
  }
}

export class PositionsClosed__Params {
  _event: PositionsClosed;

  constructor(event: PositionsClosed) {
    this._event = event;
  }

  get closingAction(): Bytes {
    return this._event.parameters[0].value.toBytes();
  }

  get positionHashesClosed(): Array<Bytes> {
    return this._event.parameters[1].value.toBytesArray();
  }
}

export class Redeemed extends ethereum.Event {
  get params(): Redeemed__Params {
    return new Redeemed__Params(this);
  }
}

export class Redeemed__Params {
  _event: Redeemed;

  constructor(event: Redeemed) {
    this._event = event;
  }

  get ruleHash(): Bytes {
    return this._event.parameters[0].value.toBytes();
  }
}

export class RoboCop__actionClosesPendingPositionInputActionStruct extends ethereum.Tuple {
  get callee(): Address {
    return this[0].toAddress();
  }

  get data(): Bytes {
    return this[1].toBytes();
  }

  get inputTokens(): Array<
    RoboCop__actionClosesPendingPositionInputActionInputTokensStruct
  > {
    return this[2].toTupleArray<
      RoboCop__actionClosesPendingPositionInputActionInputTokensStruct
    >();
  }

  get outputTokens(): Array<
    RoboCop__actionClosesPendingPositionInputActionOutputTokensStruct
  > {
    return this[3].toTupleArray<
      RoboCop__actionClosesPendingPositionInputActionOutputTokensStruct
    >();
  }
}

export class RoboCop__actionClosesPendingPositionInputActionInputTokensStruct extends ethereum.Tuple {
  get t(): i32 {
    return this[0].toI32();
  }

  get addr(): Address {
    return this[1].toAddress();
  }
}

export class RoboCop__actionClosesPendingPositionInputActionOutputTokensStruct extends ethereum.Tuple {
  get t(): i32 {
    return this[0].toI32();
  }

  get addr(): Address {
    return this[1].toAddress();
  }
}

export class RoboCop__getInputTokensResultValue0Struct extends ethereum.Tuple {
  get t(): i32 {
    return this[0].toI32();
  }

  get addr(): Address {
    return this[1].toAddress();
  }
}

export class RoboCop__getOutputTokensResultValue0Struct extends ethereum.Tuple {
  get t(): i32 {
    return this[0].toI32();
  }

  get addr(): Address {
    return this[1].toAddress();
  }
}

export class RoboCop__getRuleResultValue0Struct extends ethereum.Tuple {
  get triggers(): Array<RoboCop__getRuleResultValue0TriggersStruct> {
    return this[0].toTupleArray<RoboCop__getRuleResultValue0TriggersStruct>();
  }

  get actions(): Array<RoboCop__getRuleResultValue0ActionsStruct> {
    return this[1].toTupleArray<RoboCop__getRuleResultValue0ActionsStruct>();
  }

  get collaterals(): Array<BigInt> {
    return this[2].toBigIntArray();
  }

  get status(): i32 {
    return this[3].toI32();
  }

  get outputs(): Array<BigInt> {
    return this[4].toBigIntArray();
  }

  get incentive(): BigInt {
    return this[5].toBigInt();
  }
}

export class RoboCop__getRuleResultValue0TriggersStruct extends ethereum.Tuple {
  get callee(): Address {
    return this[0].toAddress();
  }

  get triggerType(): i32 {
    return this[1].toI32();
  }

  get createTimeParams(): Bytes {
    return this[2].toBytes();
  }
}

export class RoboCop__getRuleResultValue0ActionsStruct extends ethereum.Tuple {
  get callee(): Address {
    return this[0].toAddress();
  }

  get data(): Bytes {
    return this[1].toBytes();
  }

  get inputTokens(): Array<
    RoboCop__getRuleResultValue0ActionsInputTokensStruct
  > {
    return this[2].toTupleArray<
      RoboCop__getRuleResultValue0ActionsInputTokensStruct
    >();
  }

  get outputTokens(): Array<
    RoboCop__getRuleResultValue0ActionsOutputTokensStruct
  > {
    return this[3].toTupleArray<
      RoboCop__getRuleResultValue0ActionsOutputTokensStruct
    >();
  }
}

export class RoboCop__getRuleResultValue0ActionsInputTokensStruct extends ethereum.Tuple {
  get t(): i32 {
    return this[0].toI32();
  }

  get addr(): Address {
    return this[1].toAddress();
  }
}

export class RoboCop__getRuleResultValue0ActionsOutputTokensStruct extends ethereum.Tuple {
  get t(): i32 {
    return this[0].toI32();
  }

  get addr(): Address {
    return this[1].toAddress();
  }
}

export class RoboCop extends ethereum.SmartContract {
  static bind(address: Address): RoboCop {
    return new RoboCop("RoboCop", address);
  }

  actionClosesPendingPosition(
    action: RoboCop__actionClosesPendingPositionInputActionStruct
  ): boolean {
    let result = super.call(
      "actionClosesPendingPosition",
      "actionClosesPendingPosition((address,bytes,(uint8,address)[],(uint8,address)[])):(bool)",
      [ethereum.Value.fromTuple(action)]
    );

    return result[0].toBoolean();
  }

  try_actionClosesPendingPosition(
    action: RoboCop__actionClosesPendingPositionInputActionStruct
  ): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "actionClosesPendingPosition",
      "actionClosesPendingPosition((address,bytes,(uint8,address)[],(uint8,address)[])):(bool)",
      [ethereum.Value.fromTuple(action)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  actionPositionsMap(param0: Bytes, param1: BigInt): Bytes {
    let result = super.call(
      "actionPositionsMap",
      "actionPositionsMap(bytes32,uint256):(bytes32)",
      [
        ethereum.Value.fromFixedBytes(param0),
        ethereum.Value.fromUnsignedBigInt(param1)
      ]
    );

    return result[0].toBytes();
  }

  try_actionPositionsMap(
    param0: Bytes,
    param1: BigInt
  ): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "actionPositionsMap",
      "actionPositionsMap(bytes32,uint256):(bytes32)",
      [
        ethereum.Value.fromFixedBytes(param0),
        ethereum.Value.fromUnsignedBigInt(param1)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  checkRule(ruleHash: Bytes): boolean {
    let result = super.call("checkRule", "checkRule(bytes32):(bool)", [
      ethereum.Value.fromFixedBytes(ruleHash)
    ]);

    return result[0].toBoolean();
  }

  try_checkRule(ruleHash: Bytes): ethereum.CallResult<boolean> {
    let result = super.tryCall("checkRule", "checkRule(bytes32):(bool)", [
      ethereum.Value.fromFixedBytes(ruleHash)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  getInputTokens(
    ruleHash: Bytes
  ): Array<RoboCop__getInputTokensResultValue0Struct> {
    let result = super.call(
      "getInputTokens",
      "getInputTokens(bytes32):((uint8,address)[])",
      [ethereum.Value.fromFixedBytes(ruleHash)]
    );

    return result[0].toTupleArray<RoboCop__getInputTokensResultValue0Struct>();
  }

  try_getInputTokens(
    ruleHash: Bytes
  ): ethereum.CallResult<Array<RoboCop__getInputTokensResultValue0Struct>> {
    let result = super.tryCall(
      "getInputTokens",
      "getInputTokens(bytes32):((uint8,address)[])",
      [ethereum.Value.fromFixedBytes(ruleHash)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      value[0].toTupleArray<RoboCop__getInputTokensResultValue0Struct>()
    );
  }

  getOutputTokens(
    ruleHash: Bytes
  ): Array<RoboCop__getOutputTokensResultValue0Struct> {
    let result = super.call(
      "getOutputTokens",
      "getOutputTokens(bytes32):((uint8,address)[])",
      [ethereum.Value.fromFixedBytes(ruleHash)]
    );

    return result[0].toTupleArray<RoboCop__getOutputTokensResultValue0Struct>();
  }

  try_getOutputTokens(
    ruleHash: Bytes
  ): ethereum.CallResult<Array<RoboCop__getOutputTokensResultValue0Struct>> {
    let result = super.tryCall(
      "getOutputTokens",
      "getOutputTokens(bytes32):((uint8,address)[])",
      [ethereum.Value.fromFixedBytes(ruleHash)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      value[0].toTupleArray<RoboCop__getOutputTokensResultValue0Struct>()
    );
  }

  getRule(ruleHash: Bytes): RoboCop__getRuleResultValue0Struct {
    let result = super.call(
      "getRule",
      "getRule(bytes32):(((address,uint8,bytes)[],(address,bytes,(uint8,address)[],(uint8,address)[])[],uint256[],uint8,uint256[],uint256))",
      [ethereum.Value.fromFixedBytes(ruleHash)]
    );

    return changetype<RoboCop__getRuleResultValue0Struct>(result[0].toTuple());
  }

  try_getRule(
    ruleHash: Bytes
  ): ethereum.CallResult<RoboCop__getRuleResultValue0Struct> {
    let result = super.tryCall(
      "getRule",
      "getRule(bytes32):(((address,uint8,bytes)[],(address,bytes,(uint8,address)[],(uint8,address)[])[],uint256[],uint8,uint256[],uint256))",
      [ethereum.Value.fromFixedBytes(ruleHash)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      changetype<RoboCop__getRuleResultValue0Struct>(value[0].toTuple())
    );
  }

  hasPendingPosition(): boolean {
    let result = super.call(
      "hasPendingPosition",
      "hasPendingPosition():(bool)",
      []
    );

    return result[0].toBoolean();
  }

  try_hasPendingPosition(): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "hasPendingPosition",
      "hasPendingPosition():(bool)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  onERC721Received(
    param0: Address,
    param1: Address,
    param2: BigInt,
    param3: Bytes
  ): Bytes {
    let result = super.call(
      "onERC721Received",
      "onERC721Received(address,address,uint256,bytes):(bytes4)",
      [
        ethereum.Value.fromAddress(param0),
        ethereum.Value.fromAddress(param1),
        ethereum.Value.fromUnsignedBigInt(param2),
        ethereum.Value.fromBytes(param3)
      ]
    );

    return result[0].toBytes();
  }

  try_onERC721Received(
    param0: Address,
    param1: Address,
    param2: BigInt,
    param3: Bytes
  ): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "onERC721Received",
      "onERC721Received(address,address,uint256,bytes):(bytes4)",
      [
        ethereum.Value.fromAddress(param0),
        ethereum.Value.fromAddress(param1),
        ethereum.Value.fromUnsignedBigInt(param2),
        ethereum.Value.fromBytes(param3)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  owner(): Address {
    let result = super.call("owner", "owner():(address)", []);

    return result[0].toAddress();
  }

  try_owner(): ethereum.CallResult<Address> {
    let result = super.tryCall("owner", "owner():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  ruleIncentiveProviders(param0: Bytes, param1: Address): BigInt {
    let result = super.call(
      "ruleIncentiveProviders",
      "ruleIncentiveProviders(bytes32,address):(uint256)",
      [
        ethereum.Value.fromFixedBytes(param0),
        ethereum.Value.fromAddress(param1)
      ]
    );

    return result[0].toBigInt();
  }

  try_ruleIncentiveProviders(
    param0: Bytes,
    param1: Address
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "ruleIncentiveProviders",
      "ruleIncentiveProviders(bytes32,address):(uint256)",
      [
        ethereum.Value.fromFixedBytes(param0),
        ethereum.Value.fromAddress(param1)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  withdrawIncentive(ruleHash: Bytes): BigInt {
    let result = super.call(
      "withdrawIncentive",
      "withdrawIncentive(bytes32):(uint256)",
      [ethereum.Value.fromFixedBytes(ruleHash)]
    );

    return result[0].toBigInt();
  }

  try_withdrawIncentive(ruleHash: Bytes): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "withdrawIncentive",
      "withdrawIncentive(bytes32):(uint256)",
      [ethereum.Value.fromFixedBytes(ruleHash)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }
}

export class ConstructorCall extends ethereum.Call {
  get inputs(): ConstructorCall__Inputs {
    return new ConstructorCall__Inputs(this);
  }

  get outputs(): ConstructorCall__Outputs {
    return new ConstructorCall__Outputs(this);
  }
}

export class ConstructorCall__Inputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class ActivateRuleCall extends ethereum.Call {
  get inputs(): ActivateRuleCall__Inputs {
    return new ActivateRuleCall__Inputs(this);
  }

  get outputs(): ActivateRuleCall__Outputs {
    return new ActivateRuleCall__Outputs(this);
  }
}

export class ActivateRuleCall__Inputs {
  _call: ActivateRuleCall;

  constructor(call: ActivateRuleCall) {
    this._call = call;
  }

  get ruleHash(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }
}

export class ActivateRuleCall__Outputs {
  _call: ActivateRuleCall;

  constructor(call: ActivateRuleCall) {
    this._call = call;
  }
}

export class AddCollateralCall extends ethereum.Call {
  get inputs(): AddCollateralCall__Inputs {
    return new AddCollateralCall__Inputs(this);
  }

  get outputs(): AddCollateralCall__Outputs {
    return new AddCollateralCall__Outputs(this);
  }
}

export class AddCollateralCall__Inputs {
  _call: AddCollateralCall;

  constructor(call: AddCollateralCall) {
    this._call = call;
  }

  get ruleHash(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }

  get amounts(): Array<BigInt> {
    return this._call.inputValues[1].value.toBigIntArray();
  }
}

export class AddCollateralCall__Outputs {
  _call: AddCollateralCall;

  constructor(call: AddCollateralCall) {
    this._call = call;
  }
}

export class CreateRuleCall extends ethereum.Call {
  get inputs(): CreateRuleCall__Inputs {
    return new CreateRuleCall__Inputs(this);
  }

  get outputs(): CreateRuleCall__Outputs {
    return new CreateRuleCall__Outputs(this);
  }
}

export class CreateRuleCall__Inputs {
  _call: CreateRuleCall;

  constructor(call: CreateRuleCall) {
    this._call = call;
  }

  get triggers(): Array<CreateRuleCallTriggersStruct> {
    return this._call.inputValues[0].value.toTupleArray<
      CreateRuleCallTriggersStruct
    >();
  }

  get actions(): Array<CreateRuleCallActionsStruct> {
    return this._call.inputValues[1].value.toTupleArray<
      CreateRuleCallActionsStruct
    >();
  }
}

export class CreateRuleCall__Outputs {
  _call: CreateRuleCall;

  constructor(call: CreateRuleCall) {
    this._call = call;
  }

  get value0(): Bytes {
    return this._call.outputValues[0].value.toBytes();
  }
}

export class CreateRuleCallTriggersStruct extends ethereum.Tuple {
  get callee(): Address {
    return this[0].toAddress();
  }

  get triggerType(): i32 {
    return this[1].toI32();
  }

  get createTimeParams(): Bytes {
    return this[2].toBytes();
  }
}

export class CreateRuleCallActionsStruct extends ethereum.Tuple {
  get callee(): Address {
    return this[0].toAddress();
  }

  get data(): Bytes {
    return this[1].toBytes();
  }

  get inputTokens(): Array<CreateRuleCallActionsInputTokensStruct> {
    return this[2].toTupleArray<CreateRuleCallActionsInputTokensStruct>();
  }

  get outputTokens(): Array<CreateRuleCallActionsOutputTokensStruct> {
    return this[3].toTupleArray<CreateRuleCallActionsOutputTokensStruct>();
  }
}

export class CreateRuleCallActionsInputTokensStruct extends ethereum.Tuple {
  get t(): i32 {
    return this[0].toI32();
  }

  get addr(): Address {
    return this[1].toAddress();
  }
}

export class CreateRuleCallActionsOutputTokensStruct extends ethereum.Tuple {
  get t(): i32 {
    return this[0].toI32();
  }

  get addr(): Address {
    return this[1].toAddress();
  }
}

export class DeactivateRuleCall extends ethereum.Call {
  get inputs(): DeactivateRuleCall__Inputs {
    return new DeactivateRuleCall__Inputs(this);
  }

  get outputs(): DeactivateRuleCall__Outputs {
    return new DeactivateRuleCall__Outputs(this);
  }
}

export class DeactivateRuleCall__Inputs {
  _call: DeactivateRuleCall;

  constructor(call: DeactivateRuleCall) {
    this._call = call;
  }

  get ruleHash(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }
}

export class DeactivateRuleCall__Outputs {
  _call: DeactivateRuleCall;

  constructor(call: DeactivateRuleCall) {
    this._call = call;
  }
}

export class ExecuteRuleCall extends ethereum.Call {
  get inputs(): ExecuteRuleCall__Inputs {
    return new ExecuteRuleCall__Inputs(this);
  }

  get outputs(): ExecuteRuleCall__Outputs {
    return new ExecuteRuleCall__Outputs(this);
  }
}

export class ExecuteRuleCall__Inputs {
  _call: ExecuteRuleCall;

  constructor(call: ExecuteRuleCall) {
    this._call = call;
  }

  get ruleHash(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }
}

export class ExecuteRuleCall__Outputs {
  _call: ExecuteRuleCall;

  constructor(call: ExecuteRuleCall) {
    this._call = call;
  }
}

export class IncreaseIncentiveCall extends ethereum.Call {
  get inputs(): IncreaseIncentiveCall__Inputs {
    return new IncreaseIncentiveCall__Inputs(this);
  }

  get outputs(): IncreaseIncentiveCall__Outputs {
    return new IncreaseIncentiveCall__Outputs(this);
  }
}

export class IncreaseIncentiveCall__Inputs {
  _call: IncreaseIncentiveCall;

  constructor(call: IncreaseIncentiveCall) {
    this._call = call;
  }

  get ruleHash(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }
}

export class IncreaseIncentiveCall__Outputs {
  _call: IncreaseIncentiveCall;

  constructor(call: IncreaseIncentiveCall) {
    this._call = call;
  }
}

export class InitializeCall extends ethereum.Call {
  get inputs(): InitializeCall__Inputs {
    return new InitializeCall__Inputs(this);
  }

  get outputs(): InitializeCall__Outputs {
    return new InitializeCall__Outputs(this);
  }
}

export class InitializeCall__Inputs {
  _call: InitializeCall;

  constructor(call: InitializeCall) {
    this._call = call;
  }

  get _newOwner(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class InitializeCall__Outputs {
  _call: InitializeCall;

  constructor(call: InitializeCall) {
    this._call = call;
  }
}

export class RedeemBalanceCall extends ethereum.Call {
  get inputs(): RedeemBalanceCall__Inputs {
    return new RedeemBalanceCall__Inputs(this);
  }

  get outputs(): RedeemBalanceCall__Outputs {
    return new RedeemBalanceCall__Outputs(this);
  }
}

export class RedeemBalanceCall__Inputs {
  _call: RedeemBalanceCall;

  constructor(call: RedeemBalanceCall) {
    this._call = call;
  }

  get ruleHash(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }
}

export class RedeemBalanceCall__Outputs {
  _call: RedeemBalanceCall;

  constructor(call: RedeemBalanceCall) {
    this._call = call;
  }
}

export class ReduceCollateralCall extends ethereum.Call {
  get inputs(): ReduceCollateralCall__Inputs {
    return new ReduceCollateralCall__Inputs(this);
  }

  get outputs(): ReduceCollateralCall__Outputs {
    return new ReduceCollateralCall__Outputs(this);
  }
}

export class ReduceCollateralCall__Inputs {
  _call: ReduceCollateralCall;

  constructor(call: ReduceCollateralCall) {
    this._call = call;
  }

  get ruleHash(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }

  get amounts(): Array<BigInt> {
    return this._call.inputValues[1].value.toBigIntArray();
  }
}

export class ReduceCollateralCall__Outputs {
  _call: ReduceCollateralCall;

  constructor(call: ReduceCollateralCall) {
    this._call = call;
  }
}

export class RenounceOwnershipCall extends ethereum.Call {
  get inputs(): RenounceOwnershipCall__Inputs {
    return new RenounceOwnershipCall__Inputs(this);
  }

  get outputs(): RenounceOwnershipCall__Outputs {
    return new RenounceOwnershipCall__Outputs(this);
  }
}

export class RenounceOwnershipCall__Inputs {
  _call: RenounceOwnershipCall;

  constructor(call: RenounceOwnershipCall) {
    this._call = call;
  }
}

export class RenounceOwnershipCall__Outputs {
  _call: RenounceOwnershipCall;

  constructor(call: RenounceOwnershipCall) {
    this._call = call;
  }
}

export class TransferOwnershipCall extends ethereum.Call {
  get inputs(): TransferOwnershipCall__Inputs {
    return new TransferOwnershipCall__Inputs(this);
  }

  get outputs(): TransferOwnershipCall__Outputs {
    return new TransferOwnershipCall__Outputs(this);
  }
}

export class TransferOwnershipCall__Inputs {
  _call: TransferOwnershipCall;

  constructor(call: TransferOwnershipCall) {
    this._call = call;
  }

  get newOwner(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class TransferOwnershipCall__Outputs {
  _call: TransferOwnershipCall;

  constructor(call: TransferOwnershipCall) {
    this._call = call;
  }
}

export class WithdrawIncentiveCall extends ethereum.Call {
  get inputs(): WithdrawIncentiveCall__Inputs {
    return new WithdrawIncentiveCall__Inputs(this);
  }

  get outputs(): WithdrawIncentiveCall__Outputs {
    return new WithdrawIncentiveCall__Outputs(this);
  }
}

export class WithdrawIncentiveCall__Inputs {
  _call: WithdrawIncentiveCall;

  constructor(call: WithdrawIncentiveCall) {
    this._call = call;
  }

  get ruleHash(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }
}

export class WithdrawIncentiveCall__Outputs {
  _call: WithdrawIncentiveCall;

  constructor(call: WithdrawIncentiveCall) {
    this._call = call;
  }

  get balance(): BigInt {
    return this._call.outputValues[0].value.toBigInt();
  }
}

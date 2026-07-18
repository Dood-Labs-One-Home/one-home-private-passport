import {
  createConstructorContext,
  createCircuitContext,
  dummyContractAddress
} from "@midnight-ntwrk/compact-runtime";

import {
  Contract
} from "./src/managed/passport/contract/index.js";

const REQUIRED_CREDENTIAL = 777001n;

const witnesses = {
  privateCredential(context) {
    return [
      context.privateState,
      context.privateState.credential
    ];
  }
};

function runVerification(privateCredential) {
  const contract = new Contract(witnesses);

  const privateState = {
    credential: privateCredential
  };

  const testCoinPublicKey = new Uint8Array(32);

  const constructorContext = createConstructorContext(
    privateState,
    testCoinPublicKey
  );

  const initialState = contract.initialState(
    constructorContext,
    REQUIRED_CREDENTIAL
  );

  const circuitContext = createCircuitContext(
    dummyContractAddress(),
    initialState.currentZswapLocalState,
    initialState.currentContractState,
    privateState
  );

  const verification = contract.circuits.verifyEligibility(
    circuitContext
  );

  return verification.result;
}

console.log("===== ONE HOME PRIVATE PASSPORT TEST =====");
console.log("");

const validResult = runVerification(777001n);
console.log("Matching private credential:");
console.log(`Eligibility result: ${validResult}`);

console.log("");

const invalidResult = runVerification(123456n);
console.log("Nonmatching private credential:");
console.log(`Eligibility result: ${invalidResult}`);

console.log("");
console.log("The private credential values were not displayed.");

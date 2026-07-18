export type PrivatePassportPrivateState = {
  credential: bigint;
};

export const witnesses = {
  privateCredential: (
    context: { privateState: PrivatePassportPrivateState }
  ): [PrivatePassportPrivateState, bigint] => {
    return [context.privateState, context.privateState.credential];
  }
};

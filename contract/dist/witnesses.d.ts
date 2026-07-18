export type PrivatePassportPrivateState = {
    credential: bigint;
};
export declare const witnesses: {
    privateCredential: (context: {
        privateState: PrivatePassportPrivateState;
    }) => [PrivatePassportPrivateState, bigint];
};

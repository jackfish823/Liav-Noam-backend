import mongoose from 'mongoose';

/**
 * Checks if the current MongoDB topology supports transactions.
 */
export function supportsTransactions(): boolean {
    // @ts-ignore - topology is internal but necessary for detection
    const topologyType = mongoose.connection.getClient().topology?.description?.type;
    return [
        'ReplicaSetWithPrimary',
        'ReplicaSetNoPrimary',
        'Sharded',
        'LoadBalanced'
    ].includes(topologyType);
}

/**
 * Starts a transaction on the session only if the topology supports it.
 */
export function startTransactionSafely(session: mongoose.ClientSession) {
    if (supportsTransactions()) {
        session.startTransaction();
    }
}

/**
 * Commits a transaction on the session only if it's currently in a transaction.
 */
export async function commitTransactionSafely(session: mongoose.ClientSession) {
    if (session.inTransaction()) {
        await session.commitTransaction();
    }
}

/**
 * Aborts a transaction on the session only if it's currently in a transaction.
 */
export async function abortTransactionSafely(session: mongoose.ClientSession) {
    if (session.inTransaction()) {
        await session.abortTransaction();
    }
}

import { PartialTransaction, TransactionModel } from "../models";
import { rollbacks } from "../utility/Rollback.utility";

export const SetTransactionRollback = (
    txnId: string,
    data: PartialTransaction
) => {
    rollbacks.set("setTransactionRollback", async () => {
        await TransactionModel.updateOne(
            { _id: txnId },
            {
                $set: {
                    ...data,
                },
            }
        );
    });
};

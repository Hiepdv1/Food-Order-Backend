import HttpErrors from "http-errors";
import { ITransactionDoc, TransactionModel } from "../models";

type Projection<T> = {
    [key in keyof T]: 0 | 1;
};

export const ValidateTransaction = async (
    txnId: string,
    select?: Partial<Projection<ITransactionDoc>>
) => {
    const transaction = await TransactionModel.findById(txnId, {
        status: 1,
        ...select,
    });

    if (!transaction) throw new HttpErrors.NotFound("Transaction Id not found");

    if (transaction.status === "FAILED")
        throw new HttpErrors.BadRequest("Transaction status is FAILED");

    return transaction;
};

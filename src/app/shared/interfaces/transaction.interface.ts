import { TransactionType } from "../enum/transaction-type.enum";

export interface Transaction {
    userId: string,
    categoryId: string,
    description: string,
    value: number,
    type: TransactionType,
    fixedExpense: boolean,
    transactionDate: Date,
    createdAt: Date,
    updatedAt: Date, 
}
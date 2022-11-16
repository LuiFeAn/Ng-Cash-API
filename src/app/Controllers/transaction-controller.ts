import { Request, Response } from "express";

import TransactionBody from "../@types/transaction-body";

import User from "../models/User";
import Account from "../models/Account";
import Transaction from "../models/Transaction";

import { CustomRequest } from "../middlewares/jwt-verification";
import TokenPayload from "../@types/token-payload";
import AppDataSource from "../database";


class TransactionController {

    async create(request: Request, response: Response){

        const { token } = ( request as CustomRequest );
        const { accountId, username } = (token as TokenPayload);

        const { toUser, value } = (request.body as TransactionBody);

        const transactionErrors = [];

        if(!toUser) transactionErrors.push({
            reason:'O usuário para o qual receberá a transação não foi específicado'
        });

        if(!value) transactionErrors.push({
            reason:'O valor da transação não foi específicado'
        });

        if(transactionErrors.length > 0)
        return response.status(404).json( {error: transactionErrors} );

        const accountRepository = AppDataSource.getRepository(Account);
        const fromUserAccount = await accountRepository.findOne({where:{ id: accountId}});

        if(fromUserAccount?.balance && fromUserAccount.balance < value){
            return response.status(401).json({
                error: 'Você não possui saldo o suficiente para realizar essa transação'}
            );
        }

        if(username === toUser)
        return response.status(401).json( {
            error: 'Você não pode realizar uma transação para si mesmo'
        } );

        const userRepository = AppDataSource.getRepository(User);

        const toUserTransaction = await userRepository.findOne({ where: { username: toUser}});
        if(!toUserTransaction)
        return response.status(404).json({
             error: 'Não conseguimos encontrar este usuário'
        });

        accountRepository.update(fromUserAccount?.id as string, {
            balance:Number(fromUserAccount?.balance ? fromUserAccount.balance - value : null)
        });

        const toUserAccount = await accountRepository.findOne({ where: { id: toUserTransaction.accountId }});

        accountRepository.update(toUserAccount?.id as string,{
            balance:Number(toUserAccount?.balance ? toUserAccount.balance + value : null)
        })

        const transactionRepository = AppDataSource.getRepository(Transaction);
        const transaction = transactionRepository.create({
            debitedAccountId:fromUserAccount?.id,
            creditedAccountId:toUserAccount?.id,
            value
        });
        transactionRepository.save(transaction);

        response.json(transaction);

    }

}

export default new TransactionController();

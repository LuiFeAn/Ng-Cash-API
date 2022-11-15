import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert } from 'typeorm';
import AppDataSource from '../database';
import { hashSync } from 'bcrypt';

import Account from './Account';

@Entity('users')
class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('varchar')
    username: string;

    @Column('varchar')
    password: string;

    @Column('uuid')
    accountId: string;

    @BeforeInsert()
    async handlePassword(){

        this.password = hashSync(this.password,10);
        const accountRepository = AppDataSource.getRepository(Account);
        const balance = accountRepository.create({ balance: 100.000});
        const newAccount = await accountRepository.save(balance);
    }

}

export default User;

import { Module } from '@nestjs/common';
import { ContractDiscountController } from './contract-discount/contract-discount.controller';
import { ContractModule } from 'src/contract/contract.module';

@Module({
  controllers: [ContractDiscountController],
  imports: [ContractModule],
})
export class PrivateApiModule {}

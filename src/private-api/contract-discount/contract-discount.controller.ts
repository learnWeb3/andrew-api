import { Controller, Inject, Post, forwardRef } from '@nestjs/common';
import { ContractService } from 'src/contract/contract/contract.service';

@Controller('contract-discount')
export class ContractDiscountController {
  constructor(
    @Inject(forwardRef(() => ContractService))
    private readonly contractService: ContractService,
  ) {}

  @Post('')
  async handleContractDiscounts() {
    const currentDate: Date = new Date();
    const firstOfTheMonth: Date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    await this.contractService.handleDiscounts(
      currentDate.getTime(),
      firstOfTheMonth.getTime(),
    );
  }
}

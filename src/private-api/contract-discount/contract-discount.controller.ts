import { Controller, Inject, Post, forwardRef } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContractService } from 'src/contract/contract/contract.service';

@ApiTags('contract-discount')
@Controller('contract-discount')
export class ContractDiscountController {
  constructor(
    @Inject(forwardRef(() => ContractService))
    private readonly contractService: ContractService,
  ) {}

  @ApiOperation({
    summary:
      'Handle contract discount apply, analyses all active contracts and set up the discount in the ecommerce webservice',
  })
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

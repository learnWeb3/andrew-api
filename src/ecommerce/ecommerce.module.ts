import { Module } from '@nestjs/common';
import { EcommerceService } from './ecommerce/ecommerce.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [EcommerceService],
  imports: [HttpModule],
  exports: [EcommerceService],
})
export class EcommerceModule {}

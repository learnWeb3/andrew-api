import { Module } from '@nestjs/common';
import { OpensearchService } from './opensearch/opensearch.service';

@Module({
  providers: [OpensearchService],
  exports: [OpensearchService],
})
export class OpensearchModule {}

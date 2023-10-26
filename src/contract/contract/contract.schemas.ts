import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Customer } from 'src/customer/customer/customer.schemas';
import { ContractStatus } from 'src/lib/interfaces/contract-status.enum';
import { EcommerceGateway } from 'src/lib/interfaces/ecommerce-gateway.enum';
import { v4 as uuid } from 'uuid';

export type ContractDocument = HydratedDocument<Contract>;

@Schema({
  timestamps: true,
})
export class Contract {
  @Prop({
    type: mongoose.Schema.Types.String,
    default: function genUUID() {
      return uuid();
    },
  })
  _id: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  ref: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    ref: Customer.name,
  })
  customer: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    status: ContractStatus,
    default: ContractStatus.INACTIVE,
  })
  status: ContractStatus;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  contractDocURL: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    default: null,
  })
  ecommerceProduct: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    default: null,
  })
  ecommerceSubscription: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    default: null,
  })
  ecommerceCheckoutURL: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    enum: EcommerceGateway,
  })
  ecommerceGateway: EcommerceGateway;
}

const ContractSchema = SchemaFactory.createForClass(Contract);

ContractSchema.index(
  {
    ref: 1,
  },
  { unique: true },
);

export { ContractSchema };

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { v4 as uuid } from 'uuid';

// CONTACT
export type CustomerContactInformationsDocument =
  HydratedDocument<CustomerContactInformations>;

@Schema({
  _id: false,
})
export class CustomerContactInformations {
  @Prop({
    type: mongoose.Schema.Types.String,
  })
  phoneNumber?: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  email?: string;
}

export const CustomerContactInformationsSchema = SchemaFactory.createForClass(
  CustomerContactInformations,
);

// BILLING
export type CustomerBillingInformationsDocument =
  HydratedDocument<CustomerBillingInformations>;

@Schema({
  _id: false,
})
export class CustomerBillingInformations {
  @Prop({
    type: mongoose.Schema.Types.String,
  })
  lastName?: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  firstName?: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  company?: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  address?: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  postCode?: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  city?: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  country?: string;
}

export const CustomerBillingInformationsSchema = SchemaFactory.createForClass(
  CustomerBillingInformations,
);

// PAYMENTS
export type CustomerPaymentInformationsDocument =
  HydratedDocument<CustomerPaymentInformations>;

@Schema({
  _id: false,
})
export class CustomerPaymentInformations {
  @Prop({
    type: mongoose.Schema.Types.String,
  })
  ecommerceCustomer?: string;
}

export const CustomerPaymentInformationsSchema = SchemaFactory.createForClass(
  CustomerPaymentInformations,
);

// PAYMENTS DOCS

export type CustomerPaymentDocsDocument = HydratedDocument<CustomerPaymentDocs>;

@Schema({
  _id: false,
})
export class CustomerPaymentDocs {
  @Prop({
    type: mongoose.Schema.Types.String,
  })
  termsOfSaleDocURL?: string;
}

export const CustomerPaymentDocsSchema =
  SchemaFactory.createForClass(CustomerPaymentDocs);

// IDENTITY DOCS

export type CustomerIdentityDocsDocument =
  HydratedDocument<CustomerIdentityDocs>;

@Schema({
  _id: false,
})
export class CustomerIdentityDocs {
  @Prop({
    type: mongoose.Schema.Types.String,
  })
  idCardDocURL?: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  residencyProofDocURL?: string;
}

export const CustomerIdentityDocsSchema =
  SchemaFactory.createForClass(CustomerIdentityDocs);

// CUSTOMER

export type CustomerDocument = HydratedDocument<Customer>;

@Schema({
  timestamps: true,
})
export class Customer {
  @Prop({
    type: mongoose.Schema.Types.String,
    default: function genUUID() {
      return uuid();
    },
  })
  _id: string;

  @Prop({
    default: false,
    type: mongoose.Schema.Types.Boolean,
  })
  insurer: boolean;

  @Prop({
    type: mongoose.Schema.Types.String,
    required: true,
  })
  authorizationServerUserId: string;

  @Prop({
    type: CustomerContactInformationsSchema,
  })
  contactInformations: CustomerContactInformations;

  @Prop({
    type: CustomerBillingInformationsSchema,
  })
  billingInformations: CustomerBillingInformations;

  @Prop({
    type: CustomerPaymentInformationsSchema,
  })
  paymentInformations: CustomerPaymentInformations;

  @Prop({
    type: CustomerIdentityDocsSchema,
  })
  identityDocs: CustomerIdentityDocs;

  @Prop({
    type: CustomerPaymentDocsSchema,
  })
  paymentDocs: CustomerPaymentDocs;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  firstName: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  lastName: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  fullName: string;
}

const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.index(
  {
    'contactInformations.email': 1,
  },
  { unique: true },
);

CustomerSchema.index({
  'contactInformations.email': 1,
});

CustomerSchema.index({
  firstName: 1,
});

CustomerSchema.index({
  lastName: 1,
});

CustomerSchema.index({
  fullName: 1,
});

export { CustomerSchema };

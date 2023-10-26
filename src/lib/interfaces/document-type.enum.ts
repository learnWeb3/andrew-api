export enum DocumentType {
  /** CUSTOMERS */
  // payments docs
  TERMS_OF_SALE = 'customer/payments/terms-of-sales',
  // identity docs
  ID_CARD = 'customer/identity/id-card',
  RESIDENCY_PROOF = 'customer/identity/residency-proof',
  /** CONTRACTS */
  CONTRACT = 'contract/contract',
  /** VEHICLE */
  DRIVER_LICENSE = 'vehicle/driver-license',
  VEHICLE_REGISTRATION_CARD = 'vehicle/registration-card',
}

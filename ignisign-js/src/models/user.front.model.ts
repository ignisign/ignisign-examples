import { COUNTRIES } from "@ignisign/public";

export enum MY_USER_TYPES {
  CUSTOMER  = 'CUSTOMER',
  EMPLOYEE  = 'EMPLOYEE',
}

export type MyUser = {
  type          : MY_USER_TYPES;
  email         : string;
  firstName    ?: string;
  lastName     ?: string;
  nationality  ?: COUNTRIES;
  birthDate    ?: Date;
  birthPlace   ?: string;
  birthCountry ?: COUNTRIES;
  signerId     ?: string;
  authSecret   ?: string;
  phoneNumber  ?: string;
  _id          ?: string;
}
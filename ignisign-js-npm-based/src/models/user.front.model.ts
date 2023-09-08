import { COUNTRIES } from "@ignisign/public";

export type MyUser = {
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
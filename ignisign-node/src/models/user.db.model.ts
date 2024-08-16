import { COUNTRIES, IGNISIGN_APPLICATION_ENV } from "@ignisign/public";
import { getDb } from "../utils/db.util";

const db = getDb()

export enum MY_USER_TYPES {
  CUSTOMER = 'CUSTOMER',
  EMPLOYEE   = 'EMPLOYEE',
}

export type MyUser = {
  type                 : MY_USER_TYPES;
  firstName           ?: string;
  lastName            ?: string;
  email               ?: string;
  nationality         ?: string;
  birthDate           ?: string;
  birthPlace          ?: string;
  birthCountry        ?: string;
  signerId            ?: string;
  ignisignAuthSecret  ?: string;
  phoneNumber         ?: string;
  ignisignAppId       ?: string;
  ignisignAppEnv      ?: IGNISIGN_APPLICATION_ENV;
  _id                 ?: string;
}


export const MyUserModel = db.collection("users");

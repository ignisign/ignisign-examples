import { COUNTRIES } from "@ignisign/public";
import { getDb } from "../utils/db.util";

const db = getDb()

export enum MY_USER_TYPES {
  CUSTOMER = 'CUSTOMER',
  SELLER   = 'SELLER',
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
  _id                 ?: string;
}


export const MyUserModel = db.collection("users");

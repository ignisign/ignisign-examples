import { faker } from "@faker-js/faker";
import { COUNTRY_LIST } from "@ignisign/public";

const countriesDataset = COUNTRY_LIST.map(c => ({ label : c.name, value: c.code }));

const getDefaultPhoneNumber = () => process.env.REACT_APP_PHONE ?? '';
const DEFAULT_EMAIL = process.env.REACT_APP_EMAIL ?? '';

//Take a standard email adresse and create a random one by adding a random number before the @
const createRandomEmail = (email) => {
  if(email === '')
    return '';

  const random = Math.floor(Math.random() * (10000 - 1 + 1)) + 1
  const [name, domain] = email.split('@')
  return `${name}+${random}@${domain}`
}

const createFakeBirthDate = () => {
  const birthDate = faker.date.birthdate();
  return `${birthDate.getFullYear()}-${birthDate.getMonth() < 10 ? '0' : ''}${birthDate.getMonth() + 1}-${birthDate.getDate() < 10 ? '0' : ''}${birthDate.getDate()}`
}

export const INPUTS: any = [
  {label: 'First name',     name: 'firstName',     faker: faker.person.firstName },
  {label: 'Last name',      name: 'lastName',      faker: faker.person.lastName },
  {label: 'Email',          name: 'email',         faker: () => createRandomEmail(DEFAULT_EMAIL) },
  {label: 'BirthPlace',     name: 'birthPlace',    faker: faker.location.countryCode  },
  {label: 'Nationality',    name: 'nationality',   faker: createFakeBirthDate,        type: 'select', dataset: countriesDataset},
  {label: 'BirthDate',      name: 'birthDate',     faker: faker.location.city,        type: 'date'},
  {label: 'Phone number',   name: 'phoneNumber',   faker: getDefaultPhoneNumber,      type: 'tel'},
  {label: 'BirthCountry',   name: 'birthCountry',  faker: faker.location.countryCode, type: 'select', dataset: countriesDataset},
]
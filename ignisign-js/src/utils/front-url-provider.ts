import { create } from "domain";

export const  FrontUrlProvider = {
  homePage                  : () => "/",
  signContract              : (contractId = null, userId = null) => `/contract/${contractId || ':contractId'}/user/${userId ?? ':userId'}/sign`,
  createContract            : () => '/create-contract',
  contractsPage             : () => '/contracts',
  bareSignaturePage         : () => '/bare-signature',
  bareSignatureCallbackPage : () => '/bare-signature-callback',
  createM2MSeal                : () => '/create-m2m-seal',
  sealsPage                 : () => '/seals',
  createLogCapsule          : () => '/create-log-capsule',
  createSealApproved        : () => '/create-seal-approved',
}


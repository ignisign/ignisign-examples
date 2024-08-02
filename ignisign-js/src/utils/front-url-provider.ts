export const  FrontUrlProvider = {
  homePage                  : () => "/",
  signContract              : (contractId = null, userId = null) => `/contract/${contractId || ':contractId'}/user/${userId ?? ':userId'}/sign`,
  createContract            : () => '/create-contract',
  contractsPage             : () => '/contracts',
  bareSignaturePage         : () => '/bare-signature',
  bareSignatureCallbackPage : () => '/bare-signature-callback',
  createSeal                : () => '/create-seal',
}


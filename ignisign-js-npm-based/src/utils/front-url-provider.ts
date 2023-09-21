export const  FrontUrlProvider = {
  homePage                       : () => "/",
  // usersPage                      : () => "/users",
  // signatureRequestsPage          : () => '/signature-requests',
  // signatureRequestCreationPage   : () => '/signature-request-creation',
  // signatureRequestsDetailPage    : (signatureRequestId = null) => `/signature-request/${signatureRequestId || ':signatureRequestId'}`,
  signContract: (contractId = null, userId = null) => `/contract/${contractId || ':contractId'}/user/${userId ?? ':userId'}/sign`,
  makeContract: () => '/make-contract',
  contractsPage: () => '/contracts',
}


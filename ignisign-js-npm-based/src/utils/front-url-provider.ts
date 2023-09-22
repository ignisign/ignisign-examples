export const  FrontUrlProvider = {
  homePage      : () => "/",
  signContract  : (contractId = null, userId = null) => `/contract/${contractId || ':contractId'}/user/${userId ?? ':userId'}/sign`,
  makeContract  : () => '/make-contract',
  contractsPage : () => '/contracts',
}


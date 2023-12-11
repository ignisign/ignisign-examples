## Ignisign Node Example

This is an example of how to use the Ignisign NodeJS library in your application.
The example application is a tiny backend that manage some seller, customer and contract between them.

### Prerequisites

- NodeJS > 18.0.0
- NPM/Yarn

### How to use
- Create a `.env` from `.env.example` and fill it with your credentials.

- Get AppId from application settings & paste to .env
- Choose your env: `DEVELOPMENT` | `STAGING` | `PRODUCTION`, 
- generate secret key & paste to .env

- Create a webhook endpoint in your application into the ignisign console.<br/>
  We suggest to use [ngrok](https://ngrok.com/) to create a tunnel to your localhost. (we don't have any agreement with ngrok, it's just a suggestion and a great tool!)<br/>
  The webhook endpoint should be `{your_url}/v1/ignisign-webhook`<br/>
- `yarn install` (or npm if you prefer)
- `yarn dev` 

### How to use it with the Ignisign JS Example

- You can use the Ignisign JS Example to test this backend. (`../ignisign-js-example`)
- See instruction Into the README.md of the Ignisign JS Example for the installation and the configuration. <br/>
  Ignisign JS is an example of `Embedded` integration into your application.<br/> 
- You can also use Ignisign with a `By-side` integration,In this case, Ignisign manage all the signature process for you and you will receive informations about the signature process by webhook.


### Key point regarding Ignisign Interactions : 
- The `src/services/ignisign-sdk-manager.service.ts` manage all core interactions with the IgniSign API. HAve a look on it to understand how to communicate with the IgniSign API.

- Main endpoint that handle interaction with the IgniSign API : 
    - Into `src/controllers/app.controller.ts` the `POST /v1/ignisign-webhook` is used to receive webhooks from Ignisign. The Url have to be configurated into the Ignisign Console

    - Into `src/controllers/app.controller.ts` the `GET /v1/files/:fileHash/private-file-info` is used to provide information related to private file to needed by the IgnisignJS SDK (front-end) to presente the file.

    - Into `src/controllers/app.controller.ts` the `GET /v1/app-context` provide a field named `requiredInputs` that get the `getSignatureProfileSignerInputsConstraints`.  It allows to know which information are required to create a signer.

    - Into `src/controllers/contract.controller.ts` the `POST /v1/contracts` create signature requests

    - Into `src/controllers/customer.controller.ts` the `POST /v1/customers` and Into `src/controllers/seller.controller.ts` the `POST /v1/seller` create signers.


### More Information:
- Global documentation: https://docs.ignisign.io
- Ignisign Console URL : https://console.ignisign.io
- Ignisign NodeJS library sources: https://github.com/ignisign/ignisign-node
- Ignisign JS library: https://github.com/ignisign/ignisign-js
- More information about Integration Mode : https://doc.ignisign.io/#tag/Embeded-or-By-Side-Integration
- More information about Webhook Events: https://doc.ignisign.io/#tag/Webhook-Events

## Ignisign Node Example: Integrating the Ignisign NodeJS SDK

This repository offers a practical example of integrating the Ignisign NodeJS SDK into your application. 
The sample is a straightforward CRM backend, demonstrating key Ignisign functionalities.

### Prerequisites

- NodeJS, version 18.0.0 or higher
- NPM or Yarn

### Setup and Usage

1. **Environment Configuration**: Start by creating a `.env` file from `.env.example`. Fill in your Ignisign credentials.

2. **Acquire API Keys**:
   - Find your `appId`, `appEnv`, and `appSecret` in the "API Keys" section of the [Ignisign Console](https://console.ignisign.io/).
   - Specify a `signatureProfileId`, obtainable from the "Signature Profile" section of the Ignisign Console. Select your desired signature profile, expand its details, and copy the SignatureProfileId value.

3. **Setting up a Webhook Endpoint**:
   - Create a webhook endpoint in your application and register it as a `webhook end-point` in the Ignisign Console (webhooks section).
   - Consider using [ngrok](https://ngrok.com/) during your development to establish a tunnel to your localhost. (Note: This is a suggestion, not an endorsement.)
     - If you are using ngrok, the command to establish a tunnel is `ngrok http http://localhost:4242`. 
     - The process must be keeped live (use a dedicated terminal to execute). 
     - The process will generate a URL that you can use as the server_root for your webhook endpoint.
   - Your webhook endpoint should follow the format: `{your_server_root_url}/v1/ignisign-webhook`.

4. **Installation and Launch**:
   - Install dependencies with `yarn install` (or `npm install`).
   - Launch the application using `yarn dev`.

### Integration with the Ignisign JS Example

- Pair this backend with the Ignisign JS Example (`../ignisign-js`).
- Follow instructions in the README.md of the Ignisign JS Example for setup and configuration.

### Key Points on Ignisign Interactions

- **Core Interactions**: The `src/services/ignisign-sdk-manager.service.ts` file handles essential interactions with the Ignisign API.
- **Main Endpoints**:
  - `src/controllers/app.controller.ts`:
    - `POST /v1/ignisign-webhook` for receiving Ignisign webhooks.
    - `GET /v1/files/:fileHash/private-file-info` for providing information on private files to the IgnisignJS SDK.
    - `GET /v1/app-context` offers a `requiredInputs` field to determine necessary information for creating a signer.
  - `src/controllers/contract.controller.ts`:
    - `POST /v1/contracts` for creating signature requests.
  - `src/controllers/customer.controller.ts` and `src/controllers/seller.controller.ts`:
    - `POST /v1/customers` and `POST /v1/seller` for creating signers.

### Additional Information

- Global Documentation: [Ignisign Docs](https://docs.ignisign.io)
- Ignisign Console: [Access Here](https://console.ignisign.io)
- Ignisign NodeJS Library: [GitHub Repository](https://github.com/ignisign/ignisign-node)
- Ignisign JS Library: [GitHub Repository](https://github.com/ignisign/ignisign-js)
- Integration Mode Details: [Embedded or By-Side Integration](https://doc.ignisign.io/#tag/Embeded-or-By-Side-Integration)
- Webhook Events Details: [Webhook Events](https://doc.ignisign.io/#tag/Webhook-Events)
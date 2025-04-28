# Ignisign Node.js Example Server

This is the backend server for the Ignisign example application, demonstrating various Ignisign integration features, including OAuth 2.0 flows.

## Features

- Contract signatures
- Bare signatures
- Seals
- Log capsules
- OAuth 2.0 integration with Ignisign

## Prerequisites

- Node.js 18+
- npm or yarn

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env` and fill in the necessary values.
   - Make sure to set the OAuth provider URL if needed.

3. Start the development server:
   ```
   npm run dev
   ```

The server will be running at http://localhost:4242 by default.

## OAuth 2.0 Integration

This example server includes endpoints to support OAuth 2.0 integration with Ignisign:

- **Test Connection** - Verify an access token is valid
- **Refresh Token** - Exchange a refresh token for a new access token
- **User Info** - Get user profile information using an access token
- **Test Ignisign API** - Test the Ignisign API with the OAuth token
- **Run API Tests** - Run a series of tests against the API

### OAuth Endpoints

All OAuth endpoints are prefixed with `/v1/oauth/`:

- `POST /v1/oauth/test-connection` - Test an access token
- `POST /v1/oauth/refresh-token` - Refresh an access token
- `POST /v1/oauth/user-info` - Get user information
- `POST /v1/oauth/test-ignisign-api` - Test the Ignisign API integration
- `POST /v1/oauth/run-api-tests` - Run a series of API tests

### OAuth Flow

The OAuth 2.0 flow implemented in this example is the Authorization Code flow with PKCE (Proof Key for Code Exchange), which is recommended for client-side applications.

The flow consists of:

1. Generate a code verifier and challenge
2. Direct the user to the authorization endpoint
3. User authenticates and grants permissions
4. Receive an authorization code via the redirect URI
5. Exchange the code for tokens
6. Use the access token to make API calls
7. Refresh the token when it expires

## Ignisign Integration

After obtaining an OAuth token, you can use it as an API secret to initialize the Ignisign client:

```typescript
const client = new IgnisignClient({
  apiId: 'your-api-id',
  apiSecret: accessToken, // The OAuth token
  env: IGNISIGN_ENV.DEVELOPMENT,
  version: IGNISIGN_VERSION.V4,
});
```

This allows you to make calls to the Ignisign API using the OAuth token for authentication.

## Ignisign Node Example: Integrating the Ignisign NodeJS SDK

This repository offers a practical example of integrating the Ignisign NodeJS SDK into your application. 
The sample is a straightforward CRM backend, demonstrating main Ignisign functionalities.

### Prerequisites

- NodeJS, version 18.0.0 or higher
- NPM or Yarn

### Setup and Usage

1. **Environment Configuration**: Start by creating a `.env` file from `.env.example`. Fill in your Ignisign credentials.

2. **Acquire API Keys**:
   - Find your `appId`, `appEnv`, and `appSecret` in the "API Keys" section of the [Ignisign Console](https://console.ignisign.io/).
   <!-- - Specify a `signatureProfileId`, obtainable from the "Signature Profile" section of the Ignisign Console. Select your desired signature profile, expand its details, and copy the SignatureProfileId value. -->

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



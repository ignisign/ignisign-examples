# Ignisign JS - Front End Example Application (NPM based)

This example application demonstrates how to use Ignisign in an `embedded` mode with NPM based application using the Ignisign JS library.

- You can also use Ignisign with a `By-side` integration,In this case, Ignisign manage all the signature process for you and you will receive informations about the signature process by webhook or manage the whole process through the IgniSign's Console.

This example application is linked to the Backend demo application. 
You can find the source code of the backend application writed in NodeJS [here](https://github.com/ignisign/ignisign-examples/tree/main/ignisign-node-example)

### Prerequisites

- NodeJS > 18.0.0
- NPM/Yarn

### How to use
- Create a `.env` from `.env.example` and fill it with your credentials.

- Get appId and your appSecret from the Ignisign console & paste to .env
- Choose your env: `DEVELOPMENT` | `STAGING` | `PRODUCTION`, 

- `yarn install` (or npm if you prefer)
- `yarn dev` 

## Application Structure
The application is a simple react application with a single page. 
The Integration with IgniSign is made in `src/pages/signature-request-details.page.tsx` file.

### More Information:
- Global documentation: https://docs.ignisign.io
- Ignisign Console URL : https://console.ignisign.io
- Ignisign JS library: https://github.com/ignisign/ignisign-js
- More information about Integration Mode : https://doc.ignisign.io/#tag/Embeded-or-By-Side-Integration




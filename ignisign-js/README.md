# Ignisign JS - Front-End Example Application (NPM-Based)

- This repository provides a comprehensive example of integrating the Ignisign JS library into a front-end application. 
- It's designed to pair with a backend demo, such as our [Ignisign Node Example](https://github.com/ignisign/ignisign-examples/tree/main/ignisign-node). 
- The application supports various signature profiles and can be used with both `Embedded` and `By Side` integration methods, accommodating `standard` and `private` files. 
- Signature profile configurations are managed in the backend application.
- In `Embedded` mode, the application leverages the Ignisign JS library for seamless integration.

## Prerequisites

Before starting, ensure you have:
- NodeJS (version 18.0.0 or higher)
- NPM or Yarn

## Getting Started

1. Clone the repository and create a `.env` file following the `.env.example`.
2. Install dependencies using `yarn install` or `npm install`.
3. Set up and launch a compatible backend, such as our [Ignisign Node Example](https://github.com/ignisign/ignisign-examples/tree/main/ignisign-node), to handle API calls.
4. Start the application with `yarn start`.

## Application Overview

This React-based application demonstrates the practical integration of Ignisign into a front-end environment.

### Showcase Features:
The application simulates a basic CRM system to demonstrate Ignisign's capabilities. You can:
- Create sellers and customers.
- Facilitate contract creation between sellers and customers.
- Enable electronic signing of contracts through IgniSign.
- Provide signature proof upon completion of signings.

### Key Components

Key areas of the application include:
- `src/components/embedded-signature.tsx`: Demonstrates initiating Ignisign JS instances.
- `src/pages/create-contract.page.tsx`: Provides insights into creating signature requests.

### Additional Resources

- **Global Documentation**: [Ignisign Documentation](https://ignisign.io/docs/core-concepts/Overview)
- **Ignisign Console**: [Access Here](https://console.ignisign.io)
- **Ignisign JS Library**: [GitHub Repository](https://github.com/ignisign/ignisign-js)
- **Integration Mode Details**: [Embedded or By-Side Integration](https://ignisign.io/docs/core-concepts/Embeded_or_By-Side_Integration)

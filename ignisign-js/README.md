# Ignisign JS - Front-End Example Application (NPM-Based)

This example application showcases the use of Ignisign in an `embedded` mode within an NPM-based application, utilizing the Ignisign JS library.

Key Integration Modes:
- **Embedded Mode**: Direct integration into your application.
- **By-side Integration**: In this mode, Ignisign manages the entire signature process. You'll receive updates via webhook or can manage the process through IgniSign's Console.

This front-end application is designed to complement our Back-end demo application. You can explore the NodeJS-based back-end application's source code [here](https://github.com/ignisign/ignisign-examples/tree/main/ignisign-node-example).

### Prerequisites

Ensure you have the following installed:
- NodeJS, version 18.0.0 or higher
- NPM or Yarn

### Getting Started

1. Create a `.env` file based on the `.env.example`.
2. Install dependencies with `yarn install` (or `npm install` if you prefer).
3. Launch the application using `yarn dev`.

## Application Structure

The application is a straightforward React application featuring a single page. The IgniSign integration is implemented in the `src/pages/signature-request-details.page.tsx` file.

### Additional Resources:

- **Global Documentation**: [Ignisign Documentation](https://docs.ignisign.io)
- **Ignisign Console**: [Access Here](https://console.ignisign.io)
- **Ignisign JS Library**: [GitHub Repository](https://github.com/ignisign/ignisign-js)
- **Integration Mode Details**: [Embedded or By-Side Integration](https://doc.ignisign.io/#tag/Embeded-or-By-Side-Integration)

---

This revision enhances the clarity and readability of the text, making it more accessible and informative for users.

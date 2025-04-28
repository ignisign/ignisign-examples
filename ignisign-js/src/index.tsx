import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { CssBaseline, MuiThemeProvider } from "@material-ui/core";
import { createTheme } from "@material-ui/core/styles";
import { IgnisignSnackbarProvider } from './contexts/snackbar.context';
import { HomePage } from './pages/home.page';
import Menu from './components-ui/menu';
import muiTheme from './utils/mui-theme';
import { FrontUrlProvider } from './utils/front-url-provider';
import './index.css';
import CreateContract from './pages/create-contract.page';
import { CustomerContextProvider } from './contexts/customer.context';
import { GlobalContextProvider } from './contexts/global.context';
import { EmployeeContextProvider } from './contexts/employee.context';
import Contracts from './pages/contracts.page';
import { ContractContextProvider } from './contexts/contract.context';
import SignAContract from './pages/sign-a-contract.page';
import { SealContextProvider } from './contexts/seal.context';
import { BareSignaturePage } from './pages/bare-signature';
import { BareSignatureCallback } from './pages/bare-signature-callback';
import { CreateALogCapsulePage } from './pages/create-a-log-capsule';
import { CreateM2mSeal } from './pages/seal/create-m2m-seal.page';
import { Seals } from './pages/seal/seals.page';
import { SealApprovedPage } from './pages/seal/create-a-seal-approved';
import SignASeal from './pages/seal/sign-a-contract.page';
import { OAuthTestPage } from './pages/oauth-test.page';
import { OAuthCallbackPage } from './pages/oauth-callback.page';

const NotFoundPage = () => {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>The requested page could not be found.</p>
    </div>
  );
};

function AppRouter() {
  return (
    <div className='mt-12'>
      <Switch>
        <Route exact path={FrontUrlProvider.homePage()}>
          <HomePage/>
        </Route>
        <Route exact path={FrontUrlProvider.signContract()}>
          <SignAContract/>
        </Route>
        <Route exact path={FrontUrlProvider.createContract()}>
          <CreateContract/>
        </Route>
        <Route exact path={FrontUrlProvider.contractsPage()}>
          <Contracts/>
        </Route>
        <Route exact path={FrontUrlProvider.createM2MSeal()}>
          <CreateM2mSeal/>
        </Route>
        <Route exact path={FrontUrlProvider.sealsPage()}>
          <Seals/>
        </Route>
        <Route exact path={FrontUrlProvider.signSealDoc()}>
          <SignASeal/>
        </Route>
        <Route exact path={FrontUrlProvider.createSealApproved()}>
          <SealApprovedPage/>
        </Route>
        <Route exact path={FrontUrlProvider.bareSignaturePage()}>
          <BareSignaturePage/>
        </Route>
        <Route exact path={FrontUrlProvider.bareSignatureCallbackPage()}>
          <BareSignatureCallback/>
        </Route>
        <Route exact path={FrontUrlProvider.createLogCapsule()}>
          <CreateALogCapsulePage/>
        </Route>
        <Route exact path={FrontUrlProvider.oauthTestPage()}>
          <OAuthTestPage/>
        </Route>
        <Route exact path={FrontUrlProvider.oauthCallbackPage()}>
          <OAuthCallbackPage/>
        </Route>
        <Route>
          <NotFoundPage/>
        </Route>
      </Switch>
    </div>
  )
}

const providers = [
  ContractContextProvider,
  CustomerContextProvider,
  EmployeeContextProvider,
  SealContextProvider
];

function App() {
  const themeConfig = createTheme(muiTheme);

  return (
    <MuiThemeProvider theme={themeConfig}>
      <CssBaseline/>
      <Router>
        <IgnisignSnackbarProvider>
          <GlobalContextProvider>
            <Menu>
              {
                providers.reduce((acc, Provider) => {
                  return <Provider>{acc}</Provider>
                }, <AppRouter/>)
              }
            </Menu>
          </GlobalContextProvider>
        </IgnisignSnackbarProvider>
      </Router>
    </MuiThemeProvider>
  )
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App/>);




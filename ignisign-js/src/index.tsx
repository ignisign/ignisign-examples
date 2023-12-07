import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { CssBaseline, MuiThemeProvider } from "@material-ui/core";
import { createTheme } from "@material-ui/core/styles";
import { IgnisignSnackbarProvider } from './contexts/snackbar.context';
import { HomePage } from './pages/home.page';
import Menu from './components/menu';
import muiTheme from './utils/mui-theme';
import { FrontUrlProvider } from './utils/front-url-provider';
import './index.css';
import MakeContract from './pages/contract/make-contract.page';
import { CustomerContextProvider } from './contexts/customer.context';
import { GlobalContextProvider } from './contexts/global.context';
import { SellerContextProvider } from './contexts/seller.context';
import Contracts from './pages/contracts.page';
import { ContractContextProvider } from './contexts/contract.context';
import SignAContract from './pages/contract/sign-a-contract.page';

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

        <Route exact path={FrontUrlProvider.makeContract()}>
          <MakeContract/>
        </Route>

        <Route exact path={FrontUrlProvider.contractsPage()}>
          <Contracts/>
        </Route>

        <Route>
          <NotFoundPage/>
        </Route>

      </Switch>
    </div>
  )
}

function App() {
  const themeConfig = createTheme(muiTheme);

  return (
    <MuiThemeProvider theme={themeConfig}>
      <CssBaseline/>
      <Router>
        <IgnisignSnackbarProvider>
          <GlobalContextProvider>
            <Menu>
              <ContractContextProvider>
                <CustomerContextProvider>
                  <SellerContextProvider>
                    <AppRouter/>
                  </SellerContextProvider>
                </CustomerContextProvider>
              </ContractContextProvider>
            </Menu>
          </GlobalContextProvider>
        </IgnisignSnackbarProvider>
      </Router>
    </MuiThemeProvider>
  )
}

const container = document.getElementById('root');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(<App  />);




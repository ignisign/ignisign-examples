
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useHistory, useLocation } from "react-router";
import { FrontUrlProvider } from '../utils/front-url-provider';
import { Button } from './button';
import { useGlobal } from '../contexts/global.context';

const drawerWidth = 240;

const MenuItem = ({link, text, disabled = false}) => {
  const history                   = useHistory();
  const location                  = useLocation();
  

  const [isSelected, setSelected] = useState(false);


  useEffect(() => {
    setSelected(location.pathname === link);
  }, [location.pathname, link]);

  
  const goTo = () => {
    if(!disabled){
      history.push(link)
    }
  }

  return <>
    <div onClick={goTo} className={`justify-center py-3 px-5 border-t border-b  ${(disabled)? 'bg-gray-200 text-gray-500 cursor-not-allowed' : `${isSelected ? 'bg-primary-200 text-primary-500 font-semibold' : 'hover:bg-gray-300 hover:underline hover:font-semibold'} cursor-pointer`}`}>
      {text}
    </div>
  </>
}

const MenuContent = () => {
  // const {signatureProfile} = useGlobal()

  const { 
    isAppSeal,
    isAppSignature,
    isAppBareSignature,
    isAppLogCapsule }            = useGlobal();

  return <div className='mt-2'>
    <MenuItem link={FrontUrlProvider.homePage()} text='Home Page'/>
    { isAppSignature      && <MenuItem link={FrontUrlProvider.createContract()} text='Create a contract'/> }
    { isAppSignature      && <MenuItem link={FrontUrlProvider.contractsPage()} text='List contracts'/>}
    
    { isAppSeal           && <MenuItem link={FrontUrlProvider.sealsPage()} text='All Seals'/>}
    { isAppSeal           && <MenuItem link={FrontUrlProvider.createM2MSeal()} text='Create a M2M seal'/>}
    { isAppSeal           && <MenuItem link={FrontUrlProvider.createSealApproved()} text='Create a Approved Seal'/>}

    { isAppBareSignature  && <MenuItem link={FrontUrlProvider.bareSignaturePage()} text='Create a bare signature'/>}
    { isAppLogCapsule     && <MenuItem link={FrontUrlProvider.createLogCapsule()} text='Create a log capsule'/>}
  </div>
}

const Menu = ({children}) => {
  const history = useHistory();
  // const {signatureProfile} = useGlobal()

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar className='bg-primary-500' position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar className='flex justify-between'>
          <Typography variant="h6" noWrap component="div">
            Ignisign example - Contract signing app
          </Typography>
          <Button onClick={() => history.push(FrontUrlProvider.createContract())}>Start by creating a contract</Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <div className='pt-14 h-screen bg-gray-200'>
          <MenuContent/>
        </div>
      </Drawer>
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <div className='pt-4 h-full'>
              <div className='mx-auto max-w-7xl'>
                {children}
              </div>
            </div>
          </Box>
    </Box>
  )
}

export default Menu
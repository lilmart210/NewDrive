import { useState } from 'react'

import {Route,Routes,Navigate,Outlet} from 'react-router-dom';
import {Home} from './module/home/home'
import { Login,Logout,AdminProtected,SignUp} from './module/login/login';

import { Header } from './module/Header/Header';
import { Auth0Provider } from "@auth0/auth0-react";

import { AxiosContext,AxiosProvider,ProtectView } from './module/Context/ConnectionContext';
import { Upload } from './module/browser/Upload';
import { Browser } from './module/browser/Browser';
import { AdminPanel } from './module/browser/Admin';
import { Profile } from './module/home/profile';
import { ModernBrowser } from './module/browser/ModernBrowser';

//port number 5173

function App(){
  return (
    <Routes>
      <Route path = '/' element = {<ProtectView></ProtectView>}>
        <Route path = '/home' element ={<ModernBrowser></ModernBrowser>}>

          <Route path = '/home/browse/:driveid' element={<Browser></Browser>}/>
          <Route path = '/home/profile' element ={<Profile></Profile>}/>
          <Route path = '/home/admin' element = {<AdminProtected></AdminProtected>}>
                <Route path = '/home/admin/' element = {<AdminPanel></AdminPanel>}></Route>
          </Route>

          <Route path = '/home/*' element = {<Navigate to = '/home'></Navigate>}/>

        </Route> 
        <Route path = '/' element ={<Navigate to = '/home' />}></Route>
      </Route>
      <Route path = '/logout' element = {<Logout></Logout>}/>
      <Route path = '/signup' element = {<SignUp></SignUp>}/>
      <Route path = '/login' element = {<Login></Login>}/>

      <Route path ='*' element ={<Navigate to={'/'}></Navigate>}></Route>
    </Routes>
  )
}

export default App

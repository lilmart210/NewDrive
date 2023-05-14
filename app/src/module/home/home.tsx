
import Background from '../../assets/HomeBackground.svg';
import {Outlet,Navigate,useNavigate} from 'react-router-dom'
import { AxiosContext } from '../Context/ConnectionContext';
import {useContext,useEffect,useState} from 'react';

export function Home(){
    const nav = useNavigate();
    const {} = useContext(AxiosContext);
    
    const NavToProfile = ()=>{
        nav('/profile');
    }
    

    return (
        <div className='HomeLayout'>
            <div className='ScreenHeader'>
                <div>Logo</div>
                <input type='search' className='SearchBar'></input>
                <button onClick={()=>{nav('/profile')}}>profile</button>
            </div>
            <div className='LeftSearch'>
                <div className='LeftDirectory Widget'>
                    <button onClick={()=>{nav('/home/upload')}}>Upload</button>
                    <button onClick={()=>{nav('/home')}}>My Drive</button>
                    <button onClick={()=>{nav('/home/Shared')}}>Shared</button>
                    <button onClick={()=>{nav('/home/Trash')}}>Trash</button>
                    <button onClick={()=>{nav('/home/Secret')}}>Secret</button>
                    <button onClick={()=>{nav('/home/Favorite')}}>Favorite</button>
                    <button onClick={()=>{nav('/admin')}}>Admin Panel</button>
                    <button onClick={()=>{nav('/logout')}}>Logout</button>
                </div>
                <div className='LeftArtifact Widget'>
                    <label>Whats good</label>
                    <label>Total Storage</label>
                </div>
            </div>
            <div className='FileDirectory'>
                <Outlet/>
            </div>
        </div>
    )
}

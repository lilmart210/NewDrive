import { useNavigate,Outlet } from "react-router-dom"
import { ChangeEvent, ChangeEventHandler, ReactNode, useContext, useEffect, useState } from "react";

import { Upload } from "./Upload";
import { AxiosContext } from "../Context/ConnectionContext";

export function ModernBrowser(){
    const {getDrives,createDrive,updateDrive} = useContext(AxiosContext);

    const [theme,setTheme] = useState('DarkTheme');
    const [enlarged,setEnlarged] = useState(false);
    const [selTab, setSelected] = useState('Preview');

    const [drivedata,setDriveData] = useState<{[name : string] : any}>({});
    const [drivelist,setDriveList] = useState<Array<{[name : string] : any}>>([]);
    const [selectedDrive,setSelectedDrive] = useState<{[name : string] : any}>({});

    const nav = useNavigate();
    
    function fetchDriveList(){
        getDrives()
        .then((data)=>{
            data.status && setDriveList(data.data);
        })
    }

    //inverts theme from current theme
    function changeTheme(){
        const c1 = theme == 'LightTheme';
        setTheme(c1 ? 'DarkTheme' : 'LightTheme');
    }
    //Inherites system theme
    function InheritTheme(event : MediaQueryListEvent){
        event.matches ? setTheme('DarkTheme') : setTheme('LightTheme');
    }
    //change/toggles side panel size
    function changeSize(){
        setEnlarged(!enlarged);
    }
    //on load listener for Automatic theme control
    useEffect(()=>{
        fetchDriveList();

        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        isDark ? setTheme('DarkTheme') : setTheme('LightTheme');

        window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change',InheritTheme);

        return ()=>{
            window.matchMedia('(prefers-color-scheme: dark)')
            .removeEventListener('change',InheritTheme);
        }
    },[])
    //switches pages when clicked
    function switchpage(apage : string){
        setSelected(apage);
        setEnlarged(true);
    }
    
    //sets drive data
    function DriveChange(e : ChangeEvent<HTMLInputElement>){
        const val = e.target.value;
        const aname = e.target.name;
        const pckg = {...drivedata};
        pckg[aname] = val;
        setDriveData(pckg);
    }
    //sends drive creation requrest to back end
    function makeDrive(){
        createDrive(drivedata)
        .then(resp=>{
            resp.status && fetchDriveList()
        });
    }

    function PressedDrive(item : {[name : string] : any}){
        //switchpage('Upload');
        setSelectedDrive(item);
        nav(`/home/browse/${item.id}`);
    }

    function MakePrivateDrives(arr : Array<{[name : string] : any}>) : ReactNode[] {
        const ret = arr.filter(item=>item.private && !item.deleted)
        .map((item,i)=><button key = {`item${i}`} onClick={()=>(PressedDrive(item))}>{item.name}</button>)   
        return ret;
    }

    
    function MakeDrives(arr : Array<{[name : string] : any}>) : ReactNode[] {
        
        const ret = arr.filter(item=>!item.private && !item.deleted)
        .map((item,i)=><button  key = {`dr${i}`} onClick={()=>(PressedDrive(item))}>{item.name}</button>)
        return ret;
    }

    function deleteDrive(){
        selectedDrive.id && updateDrive({deleted : true,id : selectedDrive.id})
        .then((resp)=>{
            if(resp.status){
                setSelectedDrive({})
                fetchDriveList();
            } 
        })
    }

    return (
        <div className={`HomeLayout ${theme}`} >
            <div className='ScreenHeader'>
                <label className="Logo">MyDrive</label>
                <input type='search' className='SearchBar'></input>
                <button className="Profile" onClick={()=>{nav('/home/profile')}}>Profile</button>
                <button onClick={changeTheme}>L/D</button>
            </div>
            <div className='LeftSearch'>
                <div className='LeftDirectory Widget'>
                    <button onClick={()=>{switchpage('Upload')}}>Upload</button>
                    <button onClick={()=>{nav('/home')}}>My Drive</button>
                    <button onClick={()=>{nav('/home/Trash')}}>Trash</button>
                    <button onClick={()=>{nav('/home/Favorite')}}>Favorite</button>
                    <button onClick={()=>{nav('/home/admin')}}>Admin Panel</button>
                    <button onClick={()=>{nav('/logout')}}>Logout</button>
                </div>
                <div className='LeftArtifact Widget'>
                    <label>Total Storage</label>

                    <label>My Drives</label>
                    {MakeDrives(drivelist)}
                    <button className="Plus" onClick={()=>switchpage('NewDrive')}></button>

                    <label>Private Drives</label>
                    {MakePrivateDrives(drivelist)}
                    <button className="Plus" onClick={()=>switchpage('NewDrive')}></button>

                    <label>Shared Drives</label>
                    <button className="Plus" onClick={()=>switchpage('Shared')}></button>
                </div>
            </div>
            <div className='FileDirectory'>
                {<Outlet/> || <div>asdf</div>}
            </div>
            <div className='FileContent'>
                <button className={enlarged ? 'RightArrow' : 'LeftArrow'} onClick={changeSize}></button>
                
                <button onClick={()=>setSelected('NewDrive')}>new</button>
                <button onClick={()=>setSelected('Upload')}>upload</button>
                <button onClick={()=>setSelected('Preview')}>preview</button>
                <button onClick={()=>setSelected('Shared')}>shared</button>
                <button onClick={()=>setSelected('Move')}>move</button>
                <button onClick={()=>setSelected('Settings')}>setting</button>
            </div>
            <div className={`FileContentPanel ${enlarged ? 'Enlarge' : 'Shrink'}`}>
                
                <div className={`Tab ${selTab != 'Default' && 'Invisible'}`}>
                    <big>Select A Tab</big>    
                </div>
                
                <div className={`Tab ${selTab != 'NewDrive' && 'Invisible'}`}>
                    <div className="DrivePanel">
                        <big>New Drive</big>
                        <label>Name <input name = 'name'  onChange={DriveChange} type="text"/></label>
                        <label>Private <input name = 'private' onChange={DriveChange} type="checkbox"/></label>
                        <label>password <input name = 'password' onChange={DriveChange} type="text"/></label>
                        
                        <button onClick={makeDrive}>create</button>
                    </div>
                </div>

                <div className={`Tab ${selTab != 'Upload' && 'Invisible'}`}>
                    {selectedDrive.id && <Upload drive = {selectedDrive}></Upload>}
                    {!selectedDrive.id && <big>Select A drive To Upload</big>}
                </div>

                <div className={`Tab ${selTab != 'Preview' && 'Invisible'}`}>
                    <big>Preview Image / Folder with Stats</big>
                </div>

                <div className={`Tab ${selTab != 'Shared' && 'Invisible'}`}>
                    <div className="DrivePanel">
                        <big>Share Drive</big>
                        <label>to <input type="text"/></label>
                        <label>Read-Only <input type="checkbox"/></label>

                        <button >share</button>
                    </div>
                </div>

                <div className={`Tab ${selTab != 'Move' && 'Invisible'}`}>
                    <big>Move Files to Drive or Folder</big>
                </div>

                <div className={`Tab ${selTab != 'Settings' && 'Invisible'}`}>
                    <div className="DrivePanel">
                        <big>Settings</big> 
                        {!selectedDrive.id && <h5>Select a drive first</h5>}
                        <h4>{selectedDrive.name} {selectedDrive.id}</h4>
                        {selectedDrive.id && <h5>Delete This Drive?</h5> }
                        {selectedDrive.id && <h5>(this is the confirmation)</h5>}
                        {selectedDrive.id && <button onClick={deleteDrive}>Delete</button>}
                        
                    </div>
                </div>

            </div>
        </div>
    )
}
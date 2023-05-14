
import { createContext, useContext, useEffect, useState } from "react";
import axios, { AxiosResponse } from 'axios';
import { Navigate, Outlet, useNavigate } from "react-router-dom";


const delim = "%";

const AuthEvent = new Event("AuthEvent");

type AnyDict = {
    [name : string] : any
}

function Server() {
    const envUrl = import.meta.env.VITE_ADDRESS;
    const envAuthUrl = import.meta.env.VITE_AUTH_ADDRESS;

    if(!envUrl) console.warn('No environment variable Address, defaulting to localhost:8060')
    if(!envAuthUrl) console.warn('No Environmental variable addres for auth server, defaulting to localhost:7765');
    //VITE_ADDRESS=http://localhost:8060
    const serverurl = envUrl ? envUrl : 'http://localhost:8060';
    const authurl = envAuthUrl ? envAuthUrl : 'http://localhost:7765';

    let authListeners : Function[] = []
    let controller = new AbortController();
    let isAdmin = false;
    let headers : any = null;
    let isAuthenticated = false;
    let MetaData : {
        accessToken : string | null,
        refreshToken : string | null,
        email : string | null,
    } = {
        accessToken : null,
        refreshToken : null,
        email : null
    };

    sessionStorage.setItem('Meta',JSON.stringify(MetaData));
    const MetaMem = sessionStorage.getItem('Meta');
    if(MetaMem){
        MetaData = JSON.parse(MetaMem);
    }

    const options = {
        withCredentials : true,
        validateStatus : (status : number)=>{
            return status >=200 && status <= 500;
        }
    }

    axios.interceptors.response.use((config)=>{
        //ignore 404 errors
        //isAuthenticated = config.status == 200 && config.config.url != serverurl + '/logout';
        //isAuthenticated = isAuthenticated || config.status == 404;
        headers = config.headers;
        return config;
    })

    async function RequestAdmin(){
        return post(serverurl + '/admin')
        .then((res : AxiosResponse<any>)=>{
            if(res.status == 200){
                isAdmin = true;
                return {status : true}
            }else {
                isAdmin = false;
                return {status : false}
            }
        }).catch(()=>{
            isAdmin = false;
            return {status : false}
        })
    }

    function InitController(){
        controller = new AbortController();
    }

    async function get(to : string,opts : AnyDict = {},headers : AnyDict = {}){
        const auth = {headers : {"authorization" : `Bearer ${MetaData.accessToken}`,...headers}};
        return axios.get(to,{...options,...auth,...opts});
    }

    async function post(to : string,data : AnyDict | any = {},opts : AnyDict = {},head : AnyDict = {},replace : boolean = false){
        //console.log(to,data,opts,replace);
        const auth = {headers : {"authorization" : `Bearer ${MetaData.accessToken}`,...head}};
        return axios.post(to,
            replace ? data : {
                ...data
            },
            {...options,...auth,...opts}
        )
    }
    async function remove(to : string,opts : AnyDict = {}){
        const auth = {headers : {"authorization" : `Bearer ${MetaData.accessToken}`}};
        return axios.delete(
            to,
            {
                ...options,
                ...auth,
                ...opts
            }
        )
    }
    //response type : arraybuffer, blob, document, json, stream, text
    async function logout(){
        return remove(authurl + '/logout')
        .then(()=>{
            sessionStorage.removeItem('Meta')
            isAuthenticated = false;
            return {status : true, msg : "logged out"}
        })
        .catch(()=>{return {status : false, msg : "unexpected error"}});
    }

    async function login(adata : any){
        return post(authurl + '/login',adata)
        .then((msg)=>{
            if(msg.status == 200){
                MetaData = msg.data
                sessionStorage.setItem('Meta',JSON.stringify(MetaData));
                isAuthenticated = true;
                return {status : true, msg : "logged in"};
            }else {
                return {status : false, msg : "try again"}
            }
        })
        .catch(()=>{return {status : false,msg : "unexpected failure"}});
        //return axios.post(serverurl + '/login',{...adata},options);
    }

    async function Signup(adata : {[name : string] : any}){
        return post(authurl + '/register',adata)
        .then((res)=>{return {status : res.status,msg : res.statusText}});
    }
    
    async function getDrives(){
        return get(
            serverurl + '/account/drives'
        ).then((resp)=>({status : resp.status == 200,data : resp.data}))
        .catch(()=>({status : false, msg : "failed to get drives",data : []}))
    }

    async function listDrive(apath : string,driveid : number){
        return post(
            serverurl + '/account/drives/' + driveid,{path : apath}
        ).then(resp=>({status : resp.status == 200, msg : resp.statusText,data : resp.data}))
        .catch(resp=>({status : resp.status == 200, msg : resp.statusText,data : []}))
    }

    async function createDrive(data : {[name : string] : any}){
        return post(
            serverurl + '/create/drive',data
        )
        .then((resp)=>({status : resp.status,msg : resp.statusText}))
        .catch(()=>({status : false,msg : "could not create drive"}))
    }
    async function getDriveMeta(driveid : number){
        return get(
            serverurl + ''
        )
    }

    type DriveInfo = {
        oldpassword ? : string,
        newpassword ? : string,
        name ? : string,
        id : number,
        private ? : boolean,
        deleted ? : boolean
    }
    async function updateDrive(data : DriveInfo){
        return post(
            serverurl + '/update/drive',data
        ).then(info=>({status : info.status == 200,msg : info.statusText}))
        .catch(()=>({status : false,msg :"couldn't update"}))
    }

    async function upload(data : {[name : string] : any}){
        ///account/upload/drive/:driveid/path/:apath
        return post(
            serverurl + '/account/upload',
            data,
            {'Content-Type': `multipart/form-data; boundary=----arbitrary boundary`},
            {'Content-Type': `multipart/form-data; boundary=----arbitrary boundary`},
            true
        )
        .then(()=>{return {status : true,msg : "uploaded"}})
        .catch(()=>{return {status : false,msg : "failed to upload"}});
    }

    async function dir(apath : string = '/',driveid : number){
        return post(serverurl + '/account/list',{path : apath,id : driveid})
        .then((info)=>{return {status : info.status == 200, msg : "fetched",data : info.data} })
        .catch(()=>{return {status : false,msg : "failed to fetch",data : {}}});
    }

    async function mkdir(apath : string, aname : string,driveid : number){
        return post(serverurl + '/create/dir',{path : apath,name : aname,id : driveid})
        .then(()=>{return {status : true,msg : "created"}})
        .catch(()=>{return {status : false,msg : "failed to create"}})
    }
    async function getImg(apath : string, aname : string,compression : string){
        return post(
            serverurl + '/account/get',
            {
            path : apath,
            name : aname,
            compression : compression
        },
        {responseType : 'blob',signal : controller.signal})
        .then((info)=>{return {status : true,msg : "fetched",data : info.data}})
        .catch(()=>{return {status : false,msg : "failed to fetch",data : null}});
    }

    function toNetworkSource(apath : string,aname : string,compression : string,id : number){
        ///image/get/user/:token/dir/:dir/name/:path
        //'/image/get/user/:token/driveid/:driveid/dir/:dir/name/:name/comp/:compression'
        const base = serverurl + '/image/get/'
        const imgurl = apath.replaceAll('/',"!aasd!aa")

        const newurl = `${base}user/${MetaData.accessToken}/driveid/${id}/dir/${imgurl}/comp/${compression}/name/${aname}`;
        return newurl;
    }

    async function setDirectory(apath : string) {
        return post(
            serverurl + '/admin/setDirectory',
            {path : apath}
        )
        .then(()=>{return {status : true,msg : "set directory"}})
        .catch(()=>{return {status : false,msg : "failed to set directory"}})
    }
    async function getMeta(){
        return get(
            serverurl + '/admin/tables'
        ).then((data)=>{
            return {status : true, data : data.data}
        }).catch(()=>{
            return {status : false, data : []}
        })
    }
    async function getUsers(){
        return get(
            serverurl + '/admin/whitelist'
        )
        .then((info)=>{return {status : true,msg : "get users",data : info.data}})
        .catch(()=>{return {status : false,msg : "failed to get users"}})
    }
    
    async function addUser(aname : string){
        return post(
            serverurl + '/admin/newUser',
            {gmail : aname}
        )
        .then(()=>{return {status : true,msg : "added user"}})
        .catch(()=>{return {status : false,msg : "failed to add user"}})
    }

    async function getRoot(){
        return get(serverurl + '/admin/rootpath')
        .then((info)=>{return {status : true,msg : "root user",data : info.data}})
        .catch(()=>{return {status :false, msg : "failed to get root user"}});
    }

    async function UpdateUserRecords(data : AnyDict = {}){
        return post(
            serverurl + '/admin/userdata',
            data
            ).then((res)=>{
                if(res.status == 200){
                    return {status : true}
                }else {
                    return {status : false}
                }
            }).catch(()=>{
                return {status : false}
            })
    }
    
    async function UpdatePassword(data : AnyDict = {}){
        return post(
            serverurl + '/user/changepassword',
            data
            ).then((res)=>{
                if(res.status == 200){
                    return {status : true}
                }else {
                    return {status : false}
                }
            }).catch(()=>{
                return {status : false}
            })
    }

    function getAuth(){
        return isAuthenticated
    }

    //return cmd;
    return {
        toNetworkSource,
        getRoot,
        addUser,
        getUsers,
        setDirectory,
        getImg,
        mkdir,
        dir,
        login,
        logout,
        upload,
        RequestAdmin,
        InitController,
        Signup,
        isAdmin,
        isAuthenticated,
        controller,
        getAuth,
        getMeta,
        UpdateUserRecords,
        UpdatePassword,
        getDrives,
        createDrive,
        updateDrive,
        listDrive
    }
}

const ServerConnection = Server();

export const AxiosContext = createContext(ServerConnection);

export function AxiosProvider(props : React.PropsWithChildren){
    //can throw a loading screen or something here.
    return (
    <AxiosContext.Provider value = {ServerConnection}>
        {props.children}
    </AxiosContext.Provider>
    )
}

export function ProtectView(){
    const {getAuth} = useContext(AxiosContext);
    const [isauth,setauth] = useState(getAuth());
    useEffect(()=>{
        //console.log("authe ",isauth);
    },[])
    return (
        isauth ? <Outlet/> : <Navigate to ='/login' replace={true}/>
    )
}



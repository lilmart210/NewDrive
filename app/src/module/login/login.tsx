


//making a request to backend at /login will check if authenticated.

import { useState,useEffect,FormEvent,useContext} from 'react'
import {Outlet,Navigate,useNavigate} from 'react-router-dom';
import axios from 'axios';
import { AxiosContext } from '../Context/ConnectionContext';

//import './login.css';

//gmail must be present in body even if just checking authentication
export function Login(props? : {[setAuth : string] : (abool : boolean)=>void}) {
    const [formstate,setFormstate] = useState<{[name : string] : any}>({});
    const [message,setMessage] = useState("");
    const nav = useNavigate();
    const {login,getAuth} = useContext(AxiosContext);
    

    useEffect(()=>{
        if(getAuth()){
            nav('/home')
        }
    },[])

    const changeHandler = (event :FormEvent<HTMLInputElement>)=>{
        event.currentTarget;
        const aname = event.currentTarget.name;
        const avalue = event.currentTarget.value;
        const pckg = {...formstate};
        pckg[aname] = avalue;
        setFormstate(pckg);
    }

    const submit = ()=>{

        login(formstate)
        .then(data => {
            if(data.status){
                nav('/home');
                setMessage(data.msg)
            }else {
                setMessage(data.msg);
            }
        })
        .catch(()=>{});

    }

    return (
        <div className = "LoginPage">
            <div className = "LoginPanel">
                <label>{message}</label>
                <h1>Login Page</h1>
                <input
                    placeholder='Email'
                    name = 'email'
                    type = 'email'
                    onChange={changeHandler}
                />
                <input placeholder='Password' name = 'password' type={'password'} onChange={changeHandler}></input>
                <div className='Panel'>
                    <button onClick={submit}>Submit</button>
                    <button onClick={()=>{nav('/signup')}}>signup</button>
                </div>
            </div>
            
        </div>
    )
}

export function Logout(){
    const {logout} = useContext(AxiosContext);
    const nav = useNavigate();

    useEffect(()=>{
        logout().then((out)=>{
            out.status && nav('/login');
        });
    },[])

    return <div>Logging out</div>
}


export function AdminProtected(props : {[name : string] : any}){
    const {RequestAdmin,isAdmin} = useContext(AxiosContext);
    const [anAdmin,setAdmin] = useState(isAdmin);
    const nav = useNavigate();

    useEffect(()=>{
        RequestAdmin()
        .then((resp)=>{
            setAdmin(resp.status);
        })

    },[])


    return (
        <>
            {!anAdmin && <h1>Checking Admin</h1>}
            {anAdmin ? <Outlet/> : <h1>You are not allowed here <button onClick={()=>{nav('/home')}}>home</button></h1>}
        </>
        
    )
}

export function SignUp(){
    const {Signup} = useContext(AxiosContext);
    const [msgResp,setResp] = useState('');
    const [data,setdata] = useState<{[name : string] : any}>({});
    const nav = useNavigate();


    const change = (e : FormEvent<HTMLInputElement>) => {
        const aname = e.currentTarget.name;
        const aval = e.currentTarget.value;
        const newpack : {[name : string] : any}= {};
        newpack[aname] = aval;
        setdata({...data , ...newpack});
    }

    const click = ()=>{
        const isequal = data.password && data.password == data.confirm;

        !isequal && data.password && setResp("Password not the same")
        !isequal && !data.password && setResp("Invalid Password")

        isequal && Signup(data)
        .then((rep)=>{
            if(rep.status == 200){
                nav('/login')
            }else {
                setResp(rep.msg)
            }
        })
        .catch(()=>{});
    }

    return (
        <div className = "LoginPage">
            <div className='LoginPanel'>
                <h1>Sign up</h1>
                <label>{msgResp}</label>
                <input onChange={change} name = 'email' type={'email'} placeholder ='email'></input>
                <input onChange={change} name = 'password' type={'password'} placeholder = 'password'/>
                <input onChange={change} name = 'confirm' type={'password'} placeholder = 'Confirm Password'/>
                <div className='Panel'>
                    <button onClick={click}>Submit</button>
                    <button onClick={()=>nav('/')}>back</button>
                </div>
            </div>
        </div>
    )
}
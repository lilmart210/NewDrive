import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom"
import { AxiosContext } from "../Context/ConnectionContext";


export function Profile(){
    const nav = useNavigate();
    const [data,setData] = useState<{[name : string] : any}>({});
    const {UpdatePassword} = useContext(AxiosContext);

    function submit(){

        UpdatePassword(data)
        .then((res)=>{
            if(res.status){
                nav('/home')
            }else {
                
            }
        })
    }

    function change(event : React.ChangeEvent<HTMLInputElement>){
        const aname = event.currentTarget.name;
        const aval = event.currentTarget.value;

        const pckg : {[name : string] : any} = {};
        pckg[aname] = aval;

        setData({...data,...pckg});
    }


    return (
        <div className = "LoginPage">
            <div className='LoginPanel bigger'>
                <button onClick={()=>nav('/home')}>home</button>
                <input onChange={change} name="password" type='password' placeholder="Old Password"></input>
                <input onChange={change} name="newPassword" type='password' placeholder="New Password"></input>
                <button onClick={submit}>submit</button>
            </div>
        </div>
    )
}
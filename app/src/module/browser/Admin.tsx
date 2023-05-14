
import { AxiosContext } from "../Context/ConnectionContext"
import { useState,useContext, useEffect, FormEvent, useRef} from "react"
import { useNavigate } from "react-router-dom"

//admin only panel
export function AdminPanel(){
    const nav = useNavigate();
    const {getMeta,UpdateUserRecords} = useContext(AxiosContext);

    const [users, setUsers] = useState<Array<{[name : string] : any}>>([]);
    const [formvalue,setform] = useState<aUser>({});
    const [RootDirectory,setRoot] = useState('');

    type aUser = {admin? : string,email? : string,username? : string,whitelist? : string};
    const [init,setInit] = useState<Array<aUser>>([])
    const selRef = useRef<HTMLSelectElement>(null);
    const [selUser,setUser] = useState<aUser | undefined>({})

    useEffect(()=>{
        getMeta()
        .then((data)=>{
            //admin email usernam whitelist
            if(data.status){
                setInit(data.data)
            }
        })
    },[])

    function editUser(){
        const targ = selRef.current?.value;
        const userdata = init.find((item)=>item.email == targ)
        setUser(userdata);
    }
    function saveall(){
        console.log(formvalue,"form")
        UpdateUserRecords({...formvalue,"email" : selUser?.email})
        .then((resp)=>{
            if(resp.status) nav('/home');
        })
    }
    function Changes(event : React.ChangeEvent<HTMLInputElement>){
        const tg = event.currentTarget;
        const aname = tg.name;

        const avalue = tg.type =='checkbox' ? tg.value == 'on' : tg.value;
        const pckg : {[name : string] : any} = {};
        
        pckg[aname] =  avalue;

        setform({...formvalue,...pckg});
        setUser({...selUser,...pckg});

    }
    return (
        <div className = "LoginPage">
            <div className='LoginPanel bigger'>
                <h1>Form Data</h1>
                
                <button onClick={()=>{nav('/home')}}>back</button>
                <select name = "updates" ref={selRef}>
                    {
                        init.map((item : any,i)=>{
                            return <option key = {i} value = {item.email}>
                                {item.email}
                            </option>
                        })
                    }
                </select>
                
                <button onClick={editUser} >get</button>
                {
                    selUser?.username && 
                    <div className={'Mygrid'}>
                        <div>
                            <p>username</p>
                            <input onChange={Changes} name="username"type = {'text'} defaultValue={selUser.username}/>
                        </div>
                        <div>
                            <p>email</p>
                            <input onChange={Changes} name="email"type = {'email'} defaultValue={selUser.email}/>
                        </div>
                        <div>
                            <p>admin</p>
                            <input onChange={Changes} name="admin"type ={'checkbox'} defaultChecked={Boolean(selUser.admin)}/>
                        </div>
                        <div>
                            <p>whitelist</p>
                            <input onChange={Changes} name="whitelist"type={'checkbox'} defaultChecked={Boolean(selUser.whitelist)}/>
                        </div>
                    </div>
                }
                <button onClick={saveall}>save</button>
            </div>
        </div>
    )
}
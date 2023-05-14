import {useEffect,useState,useContext,useRef} from 'react'
import { AxiosContext } from '../Context/ConnectionContext';
import loadsvg from '../../assets/load.svg'
import play from '../../assets/play.svg'

import path, { isAbsolute } from 'path';
import * as mime from 'mime';
import { useParams } from 'react-router-dom';

type MyImage = {
    DateTime : string | null,
    atime : string,
    atimeMs : number,
    birthtime : number,
    birthtimeMs : number,
    blksize : number,
    blocks : number,
    ctime : string,
    ctimeMs : number,
    dev : number,
    gid : number,
    ino : number,
    mode : number,
    mtime : string,
    mtimeMs : number,
    name : string,
    nlink : number,
    rdev : number,
    size : number,
    uid : number
}

//width = {200} height = {200} filename = {SelectedContent} filedir = {currentDir}
type MediaDisplay = {
    width? : number,
    height? : number,
    filedir? : string,
    onClick? : Function,
    data? : MyImage,
    controls? : boolean,
    media? : Blob,
    passMedia? : (aurl : Blob) => void;
    quality : string,
    noHighlight? : boolean,
    expand? : boolean,
    id? : number
}
//server only uses .mp4, .mp3 and jpg
//when downloading original, the original format is kept
export function MediaDisplay(props : MediaDisplay = {quality : 'min'}){
    const displayRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const vidRef = useRef<HTMLVideoElement>(null);
    const audRef = useRef<HTMLAudioElement>(null);
    const objRef = useRef<HTMLObjectElement>(null);

    const {getImg,toNetworkSource} = useContext(AxiosContext);
    const [blobdata,setBlobData] = useState<Blob | null>(null)
    const [NetSRC,setNetSRC] = useState<string>(loadsvg);

    const rimg = new RegExp(/\.((png)|(gif)|(jpeg)|(jpg))/,'i');
    const rvideo = new RegExp(/\.((mp4)|(mov)|(wmv)|(webm)|(mkv))/,'i');
    const raudio = new RegExp(/\.((ogg)|(mp3))/,'i');

    function getName(){
        return props.data && props.data.name || "";
    }

    function intersect(entries : any) {
        if(entries[0].isIntersecting){
            //visible
            if(props.filedir && props.data && !blobdata && props.id){
                const ssr = toNetworkSource(props.filedir,props.data.name,props.quality,props.id);
                setNetSRC(ssr)
            }
        }else {
            //not visible
            setNetSRC(loadsvg);
        }
    }

    //use intersection observer to render videos/images
    useEffect(function(){
        displayRef.current?.addEventListener('click',ClickHandler)
        objRef.current?.addEventListener('click',ClickHandler);
        //imageRef.current?.addEventListener('x')       

        const visibleObserver = new IntersectionObserver(intersect);
        displayRef.current && visibleObserver.observe(displayRef.current);

        return ()=>{
            visibleObserver.disconnect();
            displayRef.current?.removeEventListener('click',ClickHandler);
        }
    },[])

    //onclick
    function ClickHandler(e : Event){
        if(rvideo.test(getName())){
            console.log(NetSRC);
        }
        props.onClick && props.onClick();
    }

    function gettype(aname : string = props.data?.name || "") : string{
        const mi = props.data && mime.getType(aname)
        return mi ? mi : "";
    }

    return (
        <div ref = {displayRef} className={`Item File Media ${props.noHighlight ? "NoHover" : ""} ${props.expand ? "Expand" : ""}`}>
           {props.data && 
            (
                rimg.test(props.data?.name) && <img src={NetSRC} alt={`${props.data.name}\nNot Supported`}></img> ||

                rvideo.test(props.data?.name) && (props.quality == 'min' ? <video src={NetSRC} />  : <video src={NetSRC} controls/> )||

                raudio.test(props.data?.name) && <audio  src = {NetSRC}ref = {audRef}></audio> ||
                <img alt={`${props.data.name}\nNot Supported`}></img>

            )
           }
        </div>
    )
}



export function Browser(){
    type BuildType = {
        directories : Array<{[name : string] : any}>,
        files : Array<MyImage>,
    }
    const {getImg,listDrive,InitController,controller} = useContext(AxiosContext);
    const [SelectedContent,SetSelectedContent] = useState<null | MyImage>(null);
    const [currentDir,setCurrentDir] = useState<string>("/");
    const [dirLock,setDirLock] = useState<boolean>(false);
    const [dirData,setDirData] = useState<BuildType>({directories : [],files : []});
    const {driveid} = useParams();
    
    //for displaying data
    const [imgSource, setImgSource] = useState<any>(null);


    useEffect(()=>{
        //directories : [] | files : []
        driveid != null && listDrive(currentDir,Number(driveid))
        .then(res=>{
           if(res.status){
               setDirData(res.data);
               setDirLock(false);
           }
        })
    },[currentDir])

    const buildCategories = (filelist : MyImage[]) : React.ReactNode[] =>{
        const ret : React.ReactNode[] = [];
        //seperate based on date
        let res : {[name : number] : Array<MyImage>} = dirData.files
        .reduce((axx : {[name : string] : any},item : MyImage)=>{
            let chosentime = item.birthtimeMs
            if(item.DateTime){
                //yyyy:mm:dd hh:mm:ss
                const ymd = item.DateTime.split(" ")[0].split(":").map((t)=>Number(t));
                const hms = item.DateTime.split(" ")[1].split(":").map((t)=>Number(t));
                chosentime = new Date(ymd[0],ymd[1],ymd[2],hms[0],hms[1],hms[2]).getTime();
            }

            const newtime : number = Math.floor(chosentime / (24 * 60 * 60 * 1000));
            axx[newtime] ? axx[newtime].push(item) : axx[newtime] = [item];
            return axx;
        },{})
        //build objects
        const sortedKeys = Object.keys(res).sort().reverse();
        ;
        for(let s = 0;s< sortedKeys.length;s++){
            //forces me to use number...
            const key : number = parseInt(sortedKeys[s]);
            const adate = new Date(Number(key) * 24 * 60 * 60 * 1000);
            const aday = adate.getDate();
            const ayear = adate.getFullYear();
            const amonth = adate.getMonth();
            
            ret.push(
                <div key = {key} className = 'MediaContainer'>
                    <label>{`${ayear} ${amonth} ${aday}`}</label>
                    {
                        res[key].map((item : MyImage, i : number)=>{

                            return <MediaDisplay
                                id = {Number(driveid)}
                                onClick = {()=>{SetSelectedContent(item)}}
                                key = {i}
                                data = {item}
                                filedir = {currentDir}
                                quality = 'min'
                            />
                        })
                    }
                </div>
            )
        }
        return ret;
    }

    function CloseBigDisplay(){
        //Server.InitController();
        SetSelectedContent(null);
    }

    function buildDirectories(data : BuildType["directories"]){
        return data.map((item,i)=>(
            <div key = {'d' + i}
                className = 'Item Directory'
                onClick={()=>{
                    controller.abort();
                    InitController();
                    !dirLock && setCurrentDir(path.join(currentDir,item.name))
                    !dirLock && setDirLock(true);
                }}
            >
                {item.name}
            </div>
        ))
    }
    //data = {SelectedContent} filedir = {currentDir}
    //<img width={200} height = {200} className = 'DisplayImage' src = {imgSource} alt = "broken"></img>
    return (
        <div className='BrowserContainer'>
            {
                SelectedContent &&
                <div className='DisplayContent'>
                    <button onClick={CloseBigDisplay}>close</button>
                    <MediaDisplay id = {Number(driveid)} filedir={currentDir} data = {SelectedContent}
                     quality = 'full' noHighlight = {true} expand = {true}/>
                </div>
            }
            <div className='Header'></div>
            <div className='FileContainer'>
                <button onClick={()=>{setCurrentDir(path.dirname(currentDir))}}>../</button>
                {
                    buildDirectories(dirData.directories)
                }
                {
                    buildCategories(dirData.files)
                }

            </div>
        </div>
    )
}
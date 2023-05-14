
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('node:fs');
const sharp = require('sharp');
const bcryypt = require('bcrypt');
const exif = require('jpeg-exif');
const mime = require('mime');


/**
 * todo
 * logout clear token
 * token time out 
 */

/**
 * @type {fs.promises}
 */
const fsp = require('node:fs/promises');
const { HasPrimaryDirectory,upload,GetRequestFilePath,getRequestDirectory,createUserDirectory } = require('./DirectoryMiddleware');
const { isWhitelisted, isAdmin,db,rootDirectory,ensureDirectories,checkjwt } = require('./DatabaseFunctions');
const {makeToken} = require('./serverFunctions');


//app
const port = 8060;
const app = express();

app.set('trust proxy',1);
app.use(session({
    secret : 'it is as clear as ink is on paper',
    resave: false,
    saveUninitialized: true
}));

const corsorigins = ['http://localhost:5173']
if(process.env.NEW_ORIGIN){
    corsorigins.push(process.env.NEW_ORIGIN)
}

app.use(cors({
    origin: corsorigins, // use your actual domain name (or localhost), using * is not recommended
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Origin', 'X-Requested-With', 'Accept', 'x-client-key', 'x-client-token', 'x-client-secret', 'Authorization'],
    credentials: true
}));

app.use(express.json());



app.post('/admin',checkjwt,isWhitelisted,isAdmin,(req,res)=>{
    res.sendStatus(200);
})

app.post('/admin/userdata',checkjwt,isWhitelisted,isAdmin,(req,res)=>{
    
    const pckg = {}
    if(req.body.whitelist != null) pckg.whitelist =  req.body.whitelist ? true : false;
    if(req.body.admin != null) pckg.admin = req.body.admin
    if(req.body.email == null) return res.sendStatus(403)
    if(req.body.email != null) pckg.email = req.body.email;
    db('Users')
    .where({email : pckg.email})
    .update(pckg)
    .then(()=>res.sendStatus(200))
    .catch(()=>res.sendStatus(500))
});

//implement a flag for passwords that increment based on current allowed tokens
//example. Creation = 1; we can log out every token simply by increasing the 
//creation value inside the token to some arbitrary number like 2; doing this will
//disable any older logins and force the user to sign in manually in order to regain token/
//refresh api access while still remaining stateless 
app.post('/user/changepassword',checkjwt,isWhitelisted,(req,res)=>{
    if(!req.body.password || !req.body.newPassword)return res.sendStatus(400);
    //we have a password and old password
    const newhash = bcryypt.hashSync(req.body.newPassword,10);
    //verify the password
    if(bcryypt.compareSync(req.body.password,req.user.password)){
        db('Users')
        .select()
        .where({email : req.user.email})
        .update({password : newhash})
        .then(()=>res.sendStatus(200))
        .catch(()=>res.sendStatus(500));
    }else {
        res.sendStatus(403);
    }

})

app.get("/admin/tables",checkjwt,isWhitelisted,isAdmin,async(req,res)=>{
    db('Users')
    .select('whitelist','email','username','admin')
    .then(rows=>{
        res.status(200).json(rows);
    })
    .catch(()=>{
        res.status(500);
    });
})

app.get('/admin/whitelist',checkjwt,isWhitelisted,isAdmin,(req,res)=>{
    db('Users')
    .select('*')
    .then(rows=>{
        res.send(rows);
    })
    .catch(()=>{
        res.sendStatus(500);
    })
})
app.get('/admin/rootpath',checkjwt,isWhitelisted,isAdmin,async (req,res)=>{
    const apath = await rootDirectory;
    res.send(apath);
})

app.post('/admin/newUser',checkjwt,isWhitelisted,isAdmin,(req,res)=>{
    const email = req.body && (req.body.email || req.body.email === '');
    if(!email) return res.sendStatus(400);

    db('Users')
    .insert({email : email})
    .then(()=>{
        res.sendStatus(200)
    })
    .catch(()=>{
        res.sendStatus(500)
    })
});

app.post('/admin/setDirectory',checkjwt,isWhitelisted,isAdmin,(req,res)=>{
    const apath = req.body && req.body.path;
    //root -> dir
    db('root').update({dir : apath})
    .then(()=>{
        res.sendStatus(200);
    })
    .catch(()=>{
        res.sendStatus(500);
    })
    console.log('Home Directory Changed : restart needed');

});

//upload to file system
app.post('/account/upload',checkjwt,isWhitelisted,upload.any(),(req,res)=>{
    res.sendStatus(200);
});

app.get('/image/get/user/:token/driveid/:driveid/dir/:dir/comp/:compression/name/:name',checkjwt,isWhitelisted,async(req,res)=>{
    //delim is !aasd!aa
    
    const newbody = {
        id : req.params.driveid,
        name : req.params.name,
        path : req.params.dir.replace('!aasd!aa','/')
    }
    //req.body = newbody;
    

    const fileobj = req.drives.find(item=>item.id == newbody.id)
    if(!fileobj) return res.sendStatus(404);
    const fileexists = fs.existsSync(fileobj.path);
    if(!fileexists) return res.sendStatus(404);

    const filepath = path.join(fileobj.path,newbody.path,newbody.name);

    const qual = req.params.compression;

    //needs to be in sync with the request
    const rimg = new RegExp(/\.((png)|(gif)|(jpeg)|(jpg))/,'i');
    const rvideo = new RegExp(/\.((mp4)|(mov)|(wmv)|(webm)|(mkv))/,'i');
    const raudio = new RegExp(/\.((ogg)|(mp3))/,'i');

    const isphoto = rimg.test(filepath);
    const isVideo = rvideo.test(filepath);
    const isAudio = raudio.test(filepath);
    const iselse = !(isphoto || isVideo || isAudio)

    if(isphoto){
        let imgdata = sharp(filepath)
        .jpeg({mozjpeg : true})

        if(qual == 'min'){
            imgdata = imgdata.resize(200,200,{fit : 'contain'})
        }

        imgdata
        .toBuffer()
        .then(buf =>{
            res.send(buf)
            //console.log('full ',buf.length);
        })
        .catch((e)=>{
            console.log("err",e);
            res.sendStatus(500);
        })

    } else {
        
        res.sendFile(filepath)
    }

})

//create folders | escape (../) vunlerability?
app.post('/create/dir',checkjwt,isWhitelisted,async(req,res)=>{
    if(req.body.id == null) return res.sendStatus(403);

    const base = req.drives.find(item=>item.id == req.body.id);
    if(!base || !req.body.path) return res.sendStatus(404);

    const prefix = base.path;

    const reqPath = path.join(prefix,req.body.path,req.body.name);
    const pathexists = fs.existsSync(reqPath);

    if(pathexists) {
        //path aleady exists
        res.sendStatus(200);
    }else {
        fs.mkdir(reqPath,()=>{
            res.sendStatus(200);
        },(e)=>{
            console.log(e);
            res.sendStatus(401);
        })
    }
})

app.get('/account/drives',checkjwt,isWhitelisted,async (req,res)=>{
    const drives = req.drives.map(item=>({
        id : item.id,
        private : item.private,
        name : item.name,
        trash : item.trash,
        deleted : item.deleted
    }));

    res.send(drives)
});

app.post('/account/drives/:driveid',checkjwt,isWhitelisted,async (req,res)=>{
    const driveid = req.params.driveid;

    //is drive in shared or drives then allow read access
    const indrive = req.drives.find(item=>item.id == driveid);
    const sharedrive = req.shared.find(item=> item.driveid == driveid);
    const adrive = indrive || sharedrive;
    if(adrive == undefined) return res.status(403).send([]);
    const extendedpath = req.body.path ? req.body.path : '/';

    const apath = path.join(adrive.path,extendedpath);

    const data = fs.readdirSync(apath,{withFileTypes : true})
    const alldirs = data.filter(item => item.isDirectory());
    const allfiles = data.filter(item => ! item.isDirectory());

    const filesStats = allfiles.map((item)=>{
        let stats = fs.statSync(path.join(apath,item.name));;
        const rimg = new RegExp(/\.((jpg)|(jpeg))/,'i');
        if(rimg.test(item.name)){
            const morestats = exif.parseSync(path.join(apath,item.name));
            stats = {...stats,...morestats}
        }

        return {
            name : item.name,
            ...stats
        }
    })

    res.send({"directories" : alldirs,"files" : filesStats});
});

app.post('/update/drive',checkjwt,isWhitelisted,(req,res)=>{
    const newpassword = req.body.newpassword
    const oldpassword = req.body.oldpassword
    const name = req.body.name;
    const id = req.body.id;
    const private = req.body.private;
    const deleted = req.body.deleted;

    if(!id)return res.status(401).send('Bad id');

    const elem = req.drives.find(item=>item.id == id);

    const pckg = {};
    if(newpassword && bcryypt.compareSync(oldpassword,elem.password)){
        pckg.password = newpassword;
    }
    if(name) pckg.name = name;
    if(private !== null) pckg.private = private;
    if(deleted !== null) pckg.deleted = deleted;

    db('Drives')
    .where({id : id})
    .update(pckg)
    .then(()=>res.sendStatus(200))
    .catch((e)=>{console.log(e);res.sendStatus(500)})
})

app.post('/create/drive',checkjwt,isWhitelisted,(req,res)=>{
    //id userid private path name  password trash
    const priv = req.body.private;
    const aname = req.body.name;
    const pswd = req.body.password;
    
    const okay = ((priv && pswd != undefined) || !priv) && aname
    
    if(!okay) return res.status(403).send("missing fields");

    const pckg = {}
    pckg.name = aname;
    pckg.private = priv? true : false;
    pckg.user = req.jwt.id;
    pckg.trash = false;
    const pathname = req.profile.email.split('@')[0] + Date.now().toString();
    const fullpath = path.join(rootDirectory,pathname);
    pckg.path = fullpath;

    pckg.password = pswd ? bcryypt.hashSync(pswd,10) : null
    
    fs.mkdirSync(fullpath);

    db('Drives')
    .insert(pckg)
    .then(()=>res.sendStatus(200))
    .catch(()=>res.sendStatus(500))

})


//before we listen we must make sure everything is in order
async function InitialCheck(){
    //TODO load from filesystem any folders that already exists if not 
    //located in database already. Templaye : email_id_hash

    //initialize the tables 
    const check1 = db.schema.hasTable('Users').then(async (exists)=>{
        if(exists) return;
        //create the whitelist table
        await db.schema.createTable('Users',(table)=>{

            table.increments('id').primary();
            table.string('email').unique();
            table.string('password');
            table.string('username');
            table.boolean('whitelist');
            table.boolean('admin');
            table.integer('clearance');

        }).then(()=>{console.log("initialized table")})
        //password : 'admin', inserts default user
        await db('Users').insert([{
            username: 'admin',
            email : 'admin',
            password: bcryypt.hashSync('admin',10),
            admin : true,
            whitelist : true,
            clearance : 1   
        }])
        .then(()=>console.log('inserted user admin with password admin'))
        .catch(()=>console.log('failed to insert user admin'))
    })
    const check2 = db.schema.hasTable('Profile').then(async (exists)=>{
        if(exists) return;
        await db.schema.createTable('Profile',(table)=>{
            table.increments('id').primary();

            table.integer('userid');
            table.foreign('userid').references('Users.id');

            table.binary('picture');

            table.integer('maindrive');
            table.foreign('maindrive').references('Drives.id');
            
            table.integer('secretdrive');
            table.foreign('secretdrive').references('Drives.id');
            
            table.integer('trashdrive');
            table.foreign('trashdrive').references('Drives.id');


            
        })
    })
    const check3 = db.schema.hasTable('Shared').then(async (exists)=>{
        if(exists) return;
        await db.schema.createTable('Shared',(table)=>{
            table.increments('id').primary();

            table.string('from');
            table.foreign('from').references('Users.email');

            table.string('to');
            table.foreign('to').references('Users.email');

            table.string('driveid');
            table.foreign('driveid').references('Drives.id');

            table.integer('access')
        })

    })

    const check4 = db.schema.hasTable('Drives').then(async (exists)=>{
        if(exists) return;
        await db.schema.createTable('Drives',(table)=>{
            table.increments('id').primary();
            
            table.integer('user');
            table.foreign('user').references('Users.id');

            table.boolean('private');
            table.string('path');
            table.string('name');
            table.string('password');
            table.string('trash');

            table.boolean('deleted');

        })
    })

    const check5 = db.schema.hasTable('Favorites').then(async (exists)=>{
        if(exists) return;
        await db.schema.createTable('Favorites',(table)=>{
            table.increments('id');

            table.integer('from');
            table.foreign('from').references('Drives.id');

            table.string('path');

        })

    })

    //set the base directory to be ./FileSystem | change to Meta
    const check6 = db.schema.hasTable('meta').then(async (exists)=>{
        if(!exists){
            await db.schema.createTable('meta',(table)=>{
                table.string('directory')
            }).then(()=>{console.log('initilizad server meta. change at /admin')})
            await db('meta').insert([{'directory':path.join(__dirname,'FileSystem')}]).then(()=>{
                console.log('primary directory created');
            });
        }
    })

    //trash, list all deleted drives
    const check7 = db.schema.hasTable('Trash').then(async (exists)=>{
        if(exists) return;
        await db.schema.createTable('Trash',(table)=>{
            table.increments('id');

            table.integer('user');
            table.foreign('user').references('User.id');

            //is the original 
            table.integer('drive');
            table.foreign('drive').references('Drives.id');
            //original local path in drive
            table.string('origin');
            //location in trash bin
            table.string('path')
            //was this item a private item?
            table.boolean('private');

            table.string('password');

        })
    })


    await Promise.allSettled([check1,check2,check3,check4,check5,check6,rootDirectory])
    .then(()=>{console.log("finished Server checks")})
    .catch(()=>{console.error("couldn't finish checks, aborting...")})

    //host the server
    app.listen(port,()=>{
        console.log(`listening on localhost:${port}/`);
    })
}

InitialCheck()
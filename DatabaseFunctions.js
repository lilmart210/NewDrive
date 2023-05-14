require('dotenv').config();

const path = require('path');
const knex = require('knex');
const fs = require('fs');

const jwt = require('jsonwebtoken');

//add multiple connection types

//database
const dbSettings = {
    client : 'sqlite3',
    connection : {
        filename : './database/data.sqlite3'
    },
    useNullAsDefault : true,
};

/**
 * @type {knex.Knex}
 */
const db = knex(dbSettings);

const rootDirectory = path.join(__dirname,"FileSystem")

//authentication middleware | goes after checkjwt
const isWhitelisted  = async (req,res,next)=>{
    if(req.user.whitelist){
        next();
    }else{
        res.status(403).send("Not Whitelisted");
    }
}

const isAdmin = async (req,res,next)=>{
    if(req.user.admin){
        next()
    }else {
        res.status(403).send("Not An Admin");
    }
}
//req.profile
async function getProfile(req){
    return db('Users')
    .where({id : req.jwt.id})
    .then((rows)=>{
        if(rows.length > 0){
            req.profile = rows[0];
        }else {
            req.profile = {};
        }
    })
    .catch(()=>{
        req.profile = {};
    })
}
//req.user
async function getUser(req){
    return db('Users')
    .where({id : req.jwt.id})
    .then((rows)=>{
        if(rows.length > 0){
            req.user = rows[0];
        }else {
            req.user = {};
        }
    })
    .catch(()=>{
        req.user = {};
    })
}
//req.favorites
async function getFavorite(req){
    return db('Favorites')
    .where({from : req.jwt.id})
    .then((rows)=>{
        req.favorites = rows;
    })
    .catch(()=>{
        req.favorites = [];
    })
}
//req.shared
async function getShared(req){
    return db('Shared')
    .where({from : req.jwt.id})
    .orWhere({to : req.jwt.id})
    .then((rows)=>{
        req.shared = rows;
    })
    .catch(()=>{
        req.shared = [];
    })
}
//req.drives
async function getDrives(req){
    return db('Drives')
    .where({user : req.jwt.id})
    .then((rows)=>{
        req.drives = rows;
    })
    .catch(()=>{
        req.drives = [];
    })
}

async function getUserMetaData(req,res){
    await Promise.allSettled([getDrives(req),getShared(req),getFavorite(req),getProfile(req),getUser(req)])
    .then(()=>{
    })
    .catch(()=>{
        res.status(500).send("Bad User Data");
    })
}

//only verifies that the jwt token is legit
async function checkjwt(req,res,next){
    
    const header = req.headers['authorization'];
    //first part is Bearer xyz.token
    let token = header && header.split(' ')[1];
    token = token || req.params && req.params.token
    if(token == null) return res.sendStatus(401);
    
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        async(err,auser)=>{
            //console.error(err);
            if(err) return res.status(403).send("Bad Token");

            req.jwt = {...auser};
            await getUserMetaData(req,res,next);

            checkAdmission(req,res,next)

        }
    )
}


async function checkAdmission(req,res,next){
    if(req.jwt.clearance >= req.user.clearance){
        next()
    }else {
        res.status(403).send("Bad Clearance, Log in again");
    }
}

module.exports = {
    db,
    checkjwt,
    isWhitelisted,
    rootDirectory,
    isAdmin
}
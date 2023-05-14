# Not responsible for any data loss or curruption

# Schema for Database and FileSystem

### whitelist table
> when shuffling files, middleware may
> detect if this structure exists or not 
> before handling the request
```json
{
    "$Table Whitelist" : {
        "id" : 0,
        "gmail" : "@gmail.com",
        "token" : "refreshToken",
    },

    "$Table Directory$userl" :{
        "(Key $gmail)" : "@gmail.com",
        "primaryDirectory" : "$tokenhash",
        "OpenDirectory" : ["$tokenhash"],
        "SecretDirectory" : [""],
        "OpenFavorited" : ["image name"],
        "SecretFavorited" : [""],

    }
}
```
### Schema for filesystem

| ` $user is the gmail account name before the @`

> Directories are stored in a `key` which is the 
> `gmail` + `tokenhash`. this is to reduce collision.
> Each virtual directory in the database points to a file
> location. The purpose is not to fragment but if fragmentation occurs, it can be handled.
> The front end will send a GET 'filepath' to the server which will respond with the file that was requested.
> uploaded files with the same name in the same directory will first be checked to see if the bits are the `same`. If they are, `no saving will take place` and the file will be `skipped`. If it is not, `it will be renamed` and then saved.

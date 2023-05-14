const crypto = require('crypto');

const makeToken = (size = 16)=>{
    const random = size => Buffer.from(
        String.fromCharCode(
          ...crypto.getRandomValues(
            new Uint8Array(size)
          )
        )).toString('base64')
      .replaceAll('+', 'x').replaceAll('/', 'I').slice(0, size)
      
    return random(size);
}


/**
 * Returns a hash code from a string
 * @param  {String} str The string to hash.
 * @return {Number}    A 32bit integer
 * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
function hashCode(str) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}


module.exports = {makeToken ,hashCode };
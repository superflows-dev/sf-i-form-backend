
import { processKmsDecrypt } from './kmsdecrypt.mjs';

import crypto from 'crypto';
 

export const processDecryptData = async (strData) => {
    
    const strArr = strData.split("::");
    if(strArr.length <= 2){
        return strData
    }
    const newEncSecret = strArr[0];
    const newEncKey = strArr[1];
    const newBaseIV = strArr[2];
    
    
    const newSecret = process.env.ENCRYPTION_SECRET;
    const newKey = await processKmsDecrypt(newEncKey);
    const newIV = process.env.ENCRYPTION_VECTOR;
    // try{
        const buff = Buffer.from(strArr[3], 'base64')
        console.log('key length decrypt', newKey.length)
        const decipher = crypto.createDecipheriv("aes-256-cbc", newKey, newIV)
        var strDataDecrypt = decipher.update(buff.toString('utf8'), 'hex', 'utf8') + decipher.final('utf8');
        
        
        return strDataDecrypt;
    // }catch(e){
    //     console.log('decryptionError', e.message)
    //     return strData
    // }
    
}
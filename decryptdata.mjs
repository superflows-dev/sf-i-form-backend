
import { processKmsDecrypt } from './kmsdecrypt.mjs';

import crypto from 'crypto';
 

export const processDecryptData = async (projectid, strData) => {
    
    const strArr = strData.split("::");
    const newEncSecret = strArr[0];
    const newEncKey = strArr[1];
    const newBaseIV = strArr[2];
    
    
    const newSecret = await processKmsDecrypt(projectid, newEncSecret);
    const newKey = await processKmsDecrypt(projectid, newEncKey);
    const newIV = Buffer.from(newBaseIV, 'base64');
    
    const buff = Buffer.from(strArr[3], 'base64')
    const decipher = crypto.createDecipheriv("aes-256-cbc", newKey, newIV)
    var strDataDecrypt = decipher.update(buff.toString('utf8'), 'hex', 'utf8') + decipher.final('utf8');
    
    
    return strDataDecrypt;
    
}
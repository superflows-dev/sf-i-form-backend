import { processKmsEncrypt } from './kmsencrypt.mjs';
import crypto from 'crypto';


export const processEncryptData = async (strData) => {
    
    const newSecret = process.env.ENCRYPTION_SECRET;
    const newKey = crypto.createHash('sha256').update(String(newSecret)).digest('base64').substr(0, 32);
    const newIV = process.env.ENCRYPTION_VECTOR;
    const newIVStr = newIV.toString('base64')
    console.log('encryption key elements', newKey, newIVStr)
    const newEncSecret = await processKmsEncrypt(newSecret);
    const newEncKey = await processKmsEncrypt(newKey);
    
    const cipher = crypto.createCipheriv("aes-256-cbc", newKey, newIV)
    var strDataEncrypt = Buffer.from(
        cipher.update(strData, 'utf8', 'hex') + cipher.final('hex')
    ).toString('base64');
    
    strDataEncrypt = newEncSecret + "::" + newEncKey + "::" + newIVStr + "::" + strDataEncrypt;
    
    return strDataEncrypt;
    
}
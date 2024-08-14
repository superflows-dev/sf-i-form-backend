import {  kmsClient, DecryptCommand } from "./globals.mjs";

export const processKmsDecrypt = async (plaintext) => {

    var input;
    
    try {
    
        input = {
          "KeyId": process.env.KMS_KEY,
          "CiphertextBlob": Buffer.from(plaintext, 'base64')
          
        };
        
    } catch (e) {
        
        console.log(e);
        return "Error";
        
    }
    console.log('decrypt command', input)
    const command = new DecryptCommand(input);
    
    try {
    
        const response = await kmsClient.send(command);  
        // console.log(new Buffer.from(response.Plaintext, 'binary').toString('utf-8'));
        return new Buffer.from(response.Plaintext, 'binary').toString('utf-8');
        
    } catch (err) {
        // console.log(err);
        return err + "";
        
    }
    
}
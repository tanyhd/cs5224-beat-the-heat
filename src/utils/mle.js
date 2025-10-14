import fs from 'fs';
import * as nodeJose from 'node-jose';

import {
    ENCRYPTION_KEY_PATH,
    ENCRYPTION_CLIENT_CERT_PATH,
    ENCRYPTION_SERVER_CERT_PATH,
    ENCRYPTION_KEY_ID
} from '../config.js';


/**
 * Encrypts payload and return a payload used by VDP for MLE
 * @param {any} payload
 * @returns
 */
async function createEncryptedPayload(payload, verbose = true){
    const payloadString =
        typeof payload === 'string' ? payload : JSON.stringify(payload);
    verbose && console.log('Payload String:', payloadString);
    const keystore = nodeJose.JWK.createKeyStore();
    const encProps = {
        kid: ENCRYPTION_KEY_ID,
        alg: 'RSA-OAEP-256',
        enc: "A128GCM",
    };
    const encryptionCert = fs.readFileSync(ENCRYPTION_SERVER_CERT_PATH);
    const key = await keystore.add(encryptionCert, 'pem', encProps);
    const encOptions = {
        format : 'compact',
        fields: {
            enc: 'A128GCM',
            iat: Date.now()
        },
    };
    const encrypter = nodeJose.JWE.createEncrypt(encOptions, key);
    const encData = await encrypter.update(payloadString).final();
    console.log('Encrypted Jocelyn:', encData);
    return { encData };
}

/**
 * Decrypts the raw response payload string from VDP and returns the decrypted payload
 * @param {string} encryptedPayloadString
 * @returns
 */
async function fetchDecryptedPayload(encryptedPayloadString){

    const encryptedPayload =
        typeof encryptedPayloadString === 'string'
            ? JSON.parse(encryptedPayloadString)
            : encryptedPayloadString;
    const keystore = nodeJose.JWK.createKeyStore();
    const decProps = {
        kid: ENCRYPTION_KEY_ID,
        alg: 'RSA-OAEP-256',
        enc: 'A128GCM',
    };
    const decryptionKey = fs.readFileSync(ENCRYPTION_KEY_PATH);
    const key = await keystore.add(decryptionKey, 'pem', decProps);
    const decrypter = nodeJose.JWE.createDecrypt(key);
    const result = await decrypter.decrypt(encryptedPayload.encData);
    return JSON.parse(result.payload.toString());   
}

export { createEncryptedPayload, fetchDecryptedPayload };
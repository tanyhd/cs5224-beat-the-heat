import { truncate } from 'node:fs';
import {createEncryptedPayload, fetchDecryptedPayload} from './mle.js';
import { get, post } from './ssl.js';

/**
 * Posts with SSL and MLE for VDP
 * @param {string} uri
 * @param {any} payload
 * @param {any} headers
 * @returns
 */

async function post_mle(uri, payload = {}, headers = {}, verbose = true) {
    verbose && console.log('Payload to encrypt:\n' + JSON.stringify(payload));

    verbose && console.log("Encrypting payload...");
    const encryptedPayload = await createEncryptedPayload(payload);
    //verbose && console.log('Encrypted Payload:\n' + encryptedPayload);

    const stringPayload = JSON.stringify(encryptedPayload);

    verbose && console.log('Posting to:', uri);
    const res = await post(uri, stringPayload, headers);
    const resHeaders = Object.fromEntries(breakit(res.response.rawHeaders));

    verbose && console.log("CR:", resHeaders["X-CORRELATION-ID"]);
    const body = res.body;

    verbose && console.log('Response Body:', body);

    verbose && console.log("Decrypting payload...");
    const decryptedPayload = await fetchDecryptedPayload(body);
    verbose && console.log('Decrypted Payload:', decryptedPayload);

    return decryptedPayload;
}

function breakit(data,len = 2){
    const result = [];
    let temp = [];
    for (let i = 0; i < data.length; i++) {
        if (i % len === 0 && i > 0) {
            result.push(temp.slice());
            temp = [];
        }
        temp.push(data[i]);
    }
    result.push(temp);
    return result;
}

export { post_mle };
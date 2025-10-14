import request from 'request';
import fs from 'fs';

var req = request.defaults();

import {
    SSL_KEY_PATH,
    SSL_CERT_PATH,
    SSL_CA_CERT_PATH,
    USER_ID,
    PASSWORD,
    ENCRYPTION_KEY_ID,
} from '../config.js';

const key = fs.readFileSync(SSL_KEY_PATH);
const cert = fs.readFileSync(SSL_CERT_PATH);

const agentOptions = {key, cert};

/**
 * Posts using SSL configs for VDP
 * @param {string} url
 * @param {any} data
 * @param {any} headers
 * @returns
 */
function post(url, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const postOptions = {
            url,
            agentOptions,
            headers: getRequestHeaders(headers),
            body: stringifyIfNotString(data),
        };
        req.post(postOptions, getOnResponse(resolve, reject));
    });
}

/**
 * Gets using SSL configs for VDP
 * @param {string} url
 * @param {any} headers
 * @returns
 */
function get(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const getOptions = {
            url,
            agentOptions,
            headers: getRequestHeaders(headers),
        };
        req.get(getOptions, getOnResponse(resolve, reject));
    });
}

function stringifyIfNotString(data) {
    return typeof data === 'string' ? data : JSON.stringify(data);
}

function getRequestHeaders(customHeaders) {
    return {
        keyId: ENCRYPTION_KEY_ID,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Basic ' + Buffer.from(USER_ID + ':' + PASSWORD, "utf8").toString('base64'),
        ...customHeaders,
    };
}

function getOnResponse(resolve, reject) {
    return function (error, response, body) {
        if (error) {
            reject(error);
        } else {
            resolve({response, body});
        }
    };
}

export { get, post };

const request = require('request');

const API_BASE = 'https://luminus.nus.edu.sg/v2/api/';

// Returns a promise containing the body of a GET request directed to API_BASE + path
function queryAPI(auth, path) {
    const options = {
        headers: { 'Authorization': auth },
        uri: API_BASE + path,
        method: 'GET'
    }
    return new Promise(function(resolve, reject) {
        request(options, (err, res, body) => {
            if (err) return reject(err);
            if (res.statusCode != 200) return reject(res.statusMessage);
            resolve(JSON.parse(body)['data']);
        })
    });
}

function getDownloadURL(auth, url) {
    const options = {
        headers: { 'Authorization': auth },
        uri: url,
        method: 'GET'
    }
    return new Promise(function(resolve, reject) {
        request(options, (err, res, body) => {
            if (err) return reject(err);
            if (res.statusCode != 200) return reject(res.statusMessage);
            resolve(JSON.parse(body)['data']);
        })
    });
}

// Returns a promise containing the body of the downloaded file/folder as a buffer
async function downloadAPI(auth, url) {
    const downloadURL = await getDownloadURL(auth, url);
    const options = {
        headers: { 'Authorization': auth },
        uri: downloadURL,
        method: 'GET',
        encoding: null // Allows `body` to be a buffer instead of a string by default
    }
    return new Promise(function(resolve, reject) {
        request(options, (err, res, body) => {
            if (err) return reject(err);
            if (res.statusCode != 200) return reject(res.statusMessage);
            resolve(body);
        })
    });
}

async function downloadFileAPI(auth, file_id) {
    const file_url = 'https://luminus.nus.edu.sg/v2/api/files/file/' + file_id + '/downloadurl';
    return await downloadAPI(auth, file_url);
}

async function downloadFolderAPI(auth, folder_id) {
    const folder_url = 'https://luminus.nus.edu.sg/v2/api/files/' + folder_id + '/downloadurl';
    return await downloadAPI(auth, folder_url);
}

module.exports = { queryAPI, downloadFileAPI, downloadFolderAPI };

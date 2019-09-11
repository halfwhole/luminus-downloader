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

// Returns a promise containing the body of the downloaded file as a buffer
async function downloadAPI(auth, file_id) {
    function getDownloadURL() {
        const options = {
            headers: { 'Authorization': auth },
            uri: 'https://luminus.nus.edu.sg/v2/api/files/file/' + file_id + '/downloadurl',
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

    const downloadURL = await getDownloadURL();
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

module.exports = { queryAPI, downloadAPI };

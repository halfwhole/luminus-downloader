const request = require('request');

const AUTH_CODE = '';
const API_BASE = 'https://luminus.nus.edu.sg/v2/api/';

function queryAPI(path) {
    const options = {
        headers: { 'Authorization': AUTH_CODE },
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

async function exploreModules() {
    const MODULE_PATH = 'module/?populate=Creator%2CtermDetail%2CisMandatory';
    return await queryAPI(MODULE_PATH);
}

async function exploreModule(module_id) {
    console.log(module_id);
    const FILES_PATH = 'files/?populate=totalFileCount%2CsubFolderCount%2CTotalSize&ParentID=' + module_id;
    return await queryAPI(FILES_PATH);
}

// main() is for testing only
async function main() {
    const modules = await exploreModules();
    const module_ids = modules.map(module => module['id']);
    const module = await exploreModule(module_ids[2]);
    console.log(module);
}

main();

module.exports = {};

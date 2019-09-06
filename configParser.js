const fs = require('fs');

const CONFIG_FILE = 'CONFIG.txt'

function read(property) {
    try {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8').toString();
        const propertyLine = data.split('\n').filter(line => line.split('=')[0].trim() === property)[0];
        const splitLine = propertyLine.split('=');
        splitLine.shift();
        const value = splitLine.join('=').trim();
        return value;
    } catch (e) {
        throw 'Could not read ' + property + ' from ' + CONFIG_FILE + ', terminating.';
    }
}

// TODO: can be simplified further into an object/dictionary
function readUsername() {
    return read('username');
}

function readPassword() {
    return read('password');
}

function readPrint() {
    return read('print') === 'true';
}

function readDirectoryPath() {
    return read('directory_path');
}

function readNumModules() {
    return parseInt(read('num_modules'));
}

module.exports = { readUsername, readPassword, readPrint, readDirectoryPath, readNumModules };


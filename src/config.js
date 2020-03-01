const fs = require('fs');
const yargs = require('yargs');

const argv = yargs.
      option('silent', {
          alias: 's',
          description: 'Runs the script silently',
          type: 'boolean'
      })
      .argv;

const CONFIG_FILE  = 'config/CONFIG.txt';
const MODULES_FILE = 'config/MODULES.txt';

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

function readUsername() {
    return read('username');
}

function readPassword() {
    return read('password');
}

function readPrint() {
    return !argv.silent;
}

function readDirectoryPath() {
    return read('directory_path');
}

// Returns an object mapping LumiNUS module names to local module names
function readModuleMapping() {
    try {
        const data = fs.readFileSync(MODULES_FILE, 'utf8').toString();
        const lines = data.split('\n');
        let mapping = {};
        for (const line of lines) {
            if (line.trim() === '') continue;
            const splitLine = line.split(':');
            const luminusModuleName = splitLine[0].trim();
            const localModuleName = splitLine[1] ? splitLine[1].trim() : null;
            mapping[luminusModuleName] = localModuleName;
        }
        return mapping;
    } catch (e) {
        throw 'Could not read module mappings from ' + MODULES_FILE + ', terminating.';
    }
}


module.exports = {
    readUsername,
    readPassword,
    readPrint,
    readDirectoryPath,
    readModuleMapping
};

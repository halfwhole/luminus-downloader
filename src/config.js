const fs = require('fs');
const yargs = require('yargs');
const prompt = require('prompt-sync')();
const yaml = require('js-yaml');
const homedir = require('os').homedir;

const CONFIG_FILE = 'config/CONFIG.yaml';
const MODULES_FILE = 'config/MODULES.txt';
const TIMEOUT = 5000;
const CONFIG_FIELDS = ['username', 'password', 'directory_path'];

const argv = yargs
    .option('silent', {
        alias: 's',
        description: 'Runs the script silently',
        type: 'boolean'
    })
    .option('timeout', {
        alias: 't',
        description: 'Timeout for each request in ms, defaults to ' + TIMEOUT,
        type: 'integer'
    })
    .option('no-save', {
        alias: 'n',
        description: 'Do not save the user configuration',
        type: 'boolean'
    })
    .option('reset-configuration', {
        alias: 'r',
        description: 'Re-enter NUSNET credentials and directory path',
        type: 'boolean'
    })
    .argv;

const config = (() => {
    const data = getFileData();
    for (const [property, value] of Object.entries(data)) {
        if (!value) {
            if (property === 'directory_path') data[property] = prompt(property.toUpperCase() + ': ' + homedir);
            else if (property === 'password') data[property] = prompt.hide(property.toUpperCase() + ': ');
            else data[property] = prompt(property.toUpperCase() + ': ');
        }
    }
    if (argv['no-save']) fs.unlink(CONFIG_FILE, (err) => console.log('Configuration was not saved to disk, you will have to re-enter your details again the next time'));
    else fs.writeFileSync(CONFIG_FILE, yaml.dump(data), {encoding: 'utf8'});
    return data;
})()

function createEmptyData() {
    const data = {};
    for (const key of CONFIG_FIELDS) data[key] = '';
    return data;
}

function getFileData() {
    if (argv['reset-configuration']) return createEmptyData();
    try {
        fs.accessSync(CONFIG_FILE);
        return yaml.load(fs.readFileSync(CONFIG_FILE, {encoding: 'utf8'}));
    }
    catch (err) {
        console.log('No existing configuration detected, creating new configuration')
        return createEmptyData();
    }
}

function readUsername() {
    return config.username;
}

function readPassword() {
    return config.password;
}

function readPrint() {
    return !argv.silent;
}

function readTimeout() {
    return argv.timeout ? argv.timeout : TIMEOUT;
}

function readDirectoryPath() {
    return config.directory_path;
}

// Returns an object mapping LumiNUS module names to local module names
function readModuleMapping() {
    try {
        const data = fs.readFileSync(MODULES_FILE, {encoding: 'utf8'}).toString();
        const lines = data.split('\n');
        let mapping = {};
        for (const line of lines) {
            if (line.trim() === '') continue;
            const splitLine = line.split(':');
            const luminusModuleName = splitLine[0].trim();
            mapping[luminusModuleName] = splitLine[1] ? splitLine[1].trim() : null;
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
    readTimeout,
    readDirectoryPath,
    readModuleMapping
};

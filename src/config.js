const fs = require('fs');
const yargs = require('yargs');
const prompt = require('prompt-sync')({
    sigint: true,
});
const yaml = require('js-yaml');

const CONFIG_FILE = 'config/credentials.yaml';
const MODULES_FILE = 'config/modules.yaml';
const TIMEOUT = 5000;
const CONFIG_FIELDS = ['username', 'password'];

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
        description: 'Do not save the user login credentials',
        type: 'boolean'
    })
    .option('reset-credentials', {
        alias: 'r',
        description: 'Re-enter NUSNET login credentials',
        type: 'boolean'
    })
    .argv;

const config = (() => {
    const data = getFileData();
    let isUserPrompted = false;
    for (const property of CONFIG_FIELDS) {
        const value = data[property];
        if (value && !argv['reset-credentials']) continue;
        isUserPrompted = true;
        if (property === 'username') {
            data[property] = prompt('Username (e.g. nusstu\\e0123456): ');
        } else if (property === 'password') {
            data[property] = prompt.hide(`Password: `);
        } else {
            // This should not happen, but acts as a failsafe
            data[property] = prompt(property.toUpperCase() + ': ');
        }
    }
    if (!argv['no-save'] && isUserPrompted) {
        fs.writeFileSync(CONFIG_FILE, yaml.dump(data), {encoding: 'utf8'});
        console.log(`Your credentials have been saved to ${CONFIG_FILE}.`);
    }
    return data;
})();

function createEmptyData() {
    const data = {};
    for (const key of CONFIG_FIELDS) data[key] = '';
    return data;
}

function getFileData() {
    try {
        fs.accessSync(CONFIG_FILE);
        return yaml.load(fs.readFileSync(CONFIG_FILE, {encoding: 'utf8'}));
    } catch (err) {
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
    try {
        const data = yaml.load(fs.readFileSync(MODULES_FILE, {encoding: 'utf8'}));
        const dirName = Object.keys(data)[0];
        return dirName;
    } catch (e) {
        throw 'Invalid file format for ' + MODULES_FILE + ', please ensure that its format is correct.';
    }
}

// Returns an object mapping LumiNUS module names to local module names
function readModuleMapping() {
    try {
        const data = yaml.load(fs.readFileSync(MODULES_FILE, {encoding: 'utf8'}));
        const dirName = Object.keys(data)[0];
        const modules = data[dirName];
        const mapping = {};
        for (const module of modules) {
            const moduleName = Object.keys(module)[0];
            const luminusModuleName = module[moduleName];
            mapping[luminusModuleName] = moduleName;
        }
        return mapping;
    } catch (e) {
        throw 'Invalid file format for ' + MODULES_FILE + ', please ensure that its format is correct.';
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

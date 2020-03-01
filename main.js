'use strict';

const path = require('path');
const os = require('os');

const { login } = require('./src/login');
const { exploreModules } = require('./src/exploreLuminusDirectory');
const { exploreLocalModules } = require('./src/exploreLocalDirectory');
const { compareModules, modulesPrintString } = require('./src/compareDirectories');
const { readPrint, readDirectoryPath } = require('./src/config');
const { downloadNewFoldersFilesInModule } = require('./src/downloader');

const DIRECTORY_PATH = path.join(os.homedir(), readDirectoryPath());
const PRINT = readPrint();

/* MAIN PROCESS */

async function main() {
    const auth = await login();
    const modules = await exploreModules(auth);
    const localModules = exploreLocalModules(DIRECTORY_PATH);
    compareModules(modules, localModules);

    const promises = modules.map(module => {
        return downloadNewFoldersFilesInModule(auth, module, DIRECTORY_PATH);
    });
    await Promise.all(promises);

    const modulesString = modulesPrintString(modules);
    if (PRINT) console.log(modulesString);
}

main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log("Whoops, an error occurred. Here's some details:")
        console.log(e);
        process.exit(1);
    });

'use strict';

const path = require('path');
const os = require('os');

const { login } = require('./login');
const { exploreModules } = require('./exploreLuminusDirectory');
const { exploreLocalModules } = require('./exploreLocalDirectory');
const { compareModules } = require('./compareDirectories');
const { readDirectoryPath } = require('./configParser');
const { downloadNewFoldersFilesInModule } = require('./downloader');

const DIRECTORY_PATH = path.join(os.homedir(), readDirectoryPath());

function printDiffModules(modules) {
    let printString = '';
    let nothingNew = true;
    for (const module of modules) {
        const moduleDiff = module.anyDiff();
        if (!moduleDiff) continue;
        printString += '\n';
        nothingNew = false;
        printString += module.printString(true);
    }
    if (nothingNew) {
        printString += 'No new files or folders!';
    }
    console.log(printString);
}

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

    printDiffModules(modules);
}

main()
.then(() => process.exit(0))
.catch(e => {
    console.log("Whoops, an error occurred. Here's some details:")
    console.log(e);
    process.exit(1);
});


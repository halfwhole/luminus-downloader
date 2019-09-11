'use strict';

// TODO: Use `npm init` to create package.json

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
    let first = true;
    for (const module of modules) {
        const moduleDiff = module.anyDiff();
        if (!moduleDiff) continue;
        if (!first) console.log();
        first = false;
        module.print(true);
    }
    if (first) {
        console.log('No new files or folders!');
    }
}

/* MAIN PROCESS */

async function main() {
    const auth = await login();
    const modules = await exploreModules(auth);
    const localModules = exploreLocalModules(DIRECTORY_PATH);
    compareModules(modules, localModules);

    for (const module of modules) {
        await downloadNewFoldersFilesInModule(auth, module, DIRECTORY_PATH);
    }

    printDiffModules(modules);
}

main()
.then(() => process.exit(0))
.catch(e => {
    console.log(e);
    process.exit(1);
});


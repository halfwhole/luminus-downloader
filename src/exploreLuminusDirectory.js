const { Module, Folder, File } = require('./directory');
const { readPrint, readModuleMapping } = require('./config');
const { queryModulesAPI, queryFoldersAPI, queryFilesAPI } = require('./api');

const PRINT = readPrint();
const MAPPING = readModuleMapping();

// Entry point for exploring all modules
// Returns: an array of Modules
async function exploreModules(auth) {
    const modulesInfo = await queryModulesAPI(auth);
    // Filter out modules that haven't been mapped in MODULES.txt
    const filteredModulesInfo = modulesInfo.filter(moduleInfo => {
        return Object.keys(MAPPING).includes(moduleInfo['name']);
    });
    // Map module codes according to user-defined module mappings
    const modules = filteredModulesInfo.map(moduleInfo => {
        return new Module(moduleInfo['id'], MAPPING[moduleInfo['name']], moduleInfo['courseName']);
    });

    // Recursively explore its children for folders
    const promises = modules.map(module => {
        return new Promise(async (resolve, reject) => {
            if (PRINT) console.log('Exploring ' + module.code + ': ' + module.name + ' ...');
            const folders = await exploreFolders(auth, module.id);
            module.populateFolders(folders);
            resolve();
        });
    });
    await Promise.all(promises);
    if (PRINT) console.log();

    return modules;
}

async function exploreFolders(auth, parent_id) {
    const foldersInfo = await queryFoldersAPI(auth, parent_id);
    // Filter for folders that aren't submission folders, and are open folders
    const filteredFoldersInfo = foldersInfo.filter(folderInfo => {
        return !folderInfo['allowUpload'] && folderInfo['totalFileCount'] !== null;
    });
    const folders = filteredFoldersInfo.map(folderInfo => {
        return new Folder(folderInfo['id'], folderInfo['name'].trim());
    });

    // Recursively explore its children for folders and files
    for (const folder of folders) {
        const subFolders = await exploreFolders(auth, folder.id);
        const subFiles   = await exploreFiles(auth, folder.id);
        folder.populateFolders(subFolders);
        folder.populateFiles(subFiles);
    }

    return folders;
}

async function exploreFiles(auth, parent_id) {
    const filesInfo = await queryFilesAPI(auth, parent_id);
    // Filter for files that allow downloading
    const filteredFilesInfo = filesInfo.filter(fileInfo => {
        return fileInfo['allowDownload'];
    });
    const files = filteredFilesInfo.map(fileInfo => {
        return new File(fileInfo['id'], fileInfo['fileName'], fileInfo['lastUpdatedByName']);
    });
    return files;
}

module.exports = { exploreModules };

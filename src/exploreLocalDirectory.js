const path = require('path');
const fs = require('fs');

const { Module, Folder, File } = require('./directory');

const DUMMY_ID = '';

// Entry point for exploring the local directory
// Returns: an array of Modules in the folder path
function exploreLocalModules(folderPath) {
    let dirents;
    try {
        dirents = fs.readdirSync(folderPath, { withFileTypes: true });
    } catch (err) {
        throw `Local directory path '${folderPath}' is invalid. To reset your path, use option -r or edit the file config/CONFIG.yaml.`;
    }
    const moduleCodes = dirents
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    const modules = moduleCodes.map(moduleCode => {
        return exploreLocalModule(folderPath, moduleCode);
    });
    return modules;
}

// Returns: an array of Folders, and an array of Files
function exploreLocalFoldersFiles(folderPath) {
    const dirents = fs.readdirSync(folderPath, { withFileTypes: true })
    const folderNames = dirents
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    const fileNames = dirents
        .filter(dirent => !dirent.isDirectory())
        .map(dirent => dirent.name);

    const folders = folderNames.map(folderName => {
        return exploreLocalFolder(folderPath, folderName);
    });
    const files = fileNames.map(fileName => {
        return new File(DUMMY_ID, fileName);
    });

    return { 'folders': folders, 'files': files };
}

// Returns: a Folder
function exploreLocalFolder(folderPath, folderName) {
    const newPath = path.join(folderPath, folderName);
    const localFoldersFiles = exploreLocalFoldersFiles(newPath);
    const folders = localFoldersFiles['folders'];
    const files = localFoldersFiles['files'];

    const folder = new Folder(DUMMY_ID, folderName);
    folder.populateFolders(folders);
    folder.populateFiles(files);
    return folder;
}

// Returns: a Module
function exploreLocalModule(folderPath, moduleCode) {
    const newPath = path.join(folderPath, moduleCode);
    const localFoldersFiles = exploreLocalFoldersFiles(newPath);
    const folders = localFoldersFiles['folders'];

    const module = new Module(DUMMY_ID, moduleCode, '');
    module.populateFolders(folders);
    return module;
}

module.exports = { exploreLocalModules };


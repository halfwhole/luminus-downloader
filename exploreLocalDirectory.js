const path = require('path');
const fs = require('fs');

const { Module, Folder, File } = require('./directory');

// Entry point for exploring the local directory
// Returns: an array of Modules in the folder path
function exploreLocalModules(folderPath) {
    const dirents = fs.readdirSync(folderPath, { withFileTypes: true })
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
        return new File(fileName);
    });

    return { 'folders': folders, 'files': files };
}

// Returns: a Folder
function exploreLocalFolder(folderPath, folderName) {
    const newPath = path.join(folderPath, folderName);
    const localFoldersFiles = exploreLocalFoldersFiles(newPath);
    const folders = localFoldersFiles['folders'];
    const files = localFoldersFiles['files'];
    return new Folder(folderName, '', files, folders);
}

// Returns: a Module
function exploreLocalModule(folderPath, moduleCode) {
    const newPath = path.join(folderPath, moduleCode);
    const localFoldersFiles = exploreLocalFoldersFiles(newPath);
    const folders = localFoldersFiles['folders'];
    return new Module(moduleCode, '', folders);
}

module.exports = { exploreLocalModules };


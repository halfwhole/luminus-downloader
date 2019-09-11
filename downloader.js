const path = require('path');
const fs = require('fs');

const { readPrint } = require('./configParser');
const { downloadFileAPI, downloadFolderAPI } = require('./api');

const PRINT = readPrint();

// Entry point
// Downloads all new folders and files in the module
async function downloadNewFoldersFilesInModule(auth, module, base_path) {
    const new_path = path.join(base_path, module.code);
    await downloadNewFolders(auth, module.folders, new_path);
}

async function downloadNewFoldersFilesInFolder(auth, folder, base_path) {
    const new_path = path.join(base_path, folder.name);
    await downloadNewFolders(auth, folder.folders, new_path);
    await downloadNewFiles(auth, folder.files, new_path);
}

async function downloadNewFolders(auth, folders, path) {
    // TODO: make async?
    for (const folder of folders) {
        if (folder.diff) {
            await downloadFolder(auth, folder.id, folder.name, path);
        } else {
            // Recursively explores non-different folders for new children
            await downloadNewFoldersFilesInFolder(auth, folder, path);
        }
    }
}

async function downloadNewFiles(auth, files, path) {
    // TODO: make async?
    for (const file of files) {
        if (file.diff) {
            await downloadFile(auth, file.id, file.name, path);
        }
    }
}

/* HELPER FUNCTIONS FOR DOWNLOADING AND WRITING FILES/FOLDERS */

async function downloadFile(auth, file_id, file_name, path) {
    const buffer = await downloadFileAPI(auth, file_id);
    await writeItem(buffer, file_name, path);
    if (PRINT) console.log('Downloaded file ' + file_name + ' to ' + path);
}

async function downloadFolder(auth, folder_id, folder_name, path) {
    const buffer = await downloadFolderAPI(auth, folder_id);
    await writeItem(buffer, folder_name + '.zip', path);
    // TODO: need to unzip folder
    if (PRINT) console.log('Downloaded folder ' + folder_name + ' to ' + path);
}

async function writeItem(buffer, name, base_path) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path.join(base_path, name), buffer, (err) => {
            if (err) reject(err);
            resolve();
        });
    });
}

// For testing only
async function main() {
    const AUTH = '';
    // const file_id = 'cfe83093-d8f1-4669-b921-abeaf747af7a';
    // const file_name = 'T02_Parallel_Solved.c';
    const folder_id = 'a4fcc83e-1bc8-4e9e-9569-e578e963d55e';
    const folder_name = 'Lecture Notes.zip';
    await downloadFolder(AUTH, folder_id, folder_name);
}

// main();

module.exports = { downloadNewFoldersFilesInModule };

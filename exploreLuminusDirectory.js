const { Module, Folder, File } = require('./directory');
const { readPrint } = require('./configParser');
const { queryAPI } = require('./api');

const PRINT = readPrint();

// Entry point for exploring all modules
// Returns: an array of Modules
async function exploreModules(auth) {
    /* EXAMPLE OF A MODULE
    { id: '3f294850-b35f-452e-929c-95822999fc20',
      createdDate: '2019-07-08T10:34:59.137+08:00',
      creatorID: '5f0d8587-f144-4c23-91e1-9cef106e2ed8',
      lastUpdatedDate: '2019-08-15T14:35:28.43+08:00',
      lastUpdatedBy: '5f0d8587-f144-4c23-91e1-9cef106e2ed8',
      name: 'CS2106',
      startDate: '2019-07-08T10:34:00+08:00',
      endDate: '2019-12-21T23:59:00+08:00',
      publish: true,
      parentID: '3f294850-b35f-452e-929c-95822999fc20',
      resourceID: '00000000-0000-0000-0000-000000000000',
      access:
       { access_Full: false,
         access_Read: true,
         access_Create: false,
         access_Update: false,
         access_Delete: false,
         access_Settings_Read: false,
         access_Settings_Update: false },
      courseName: 'Introduction to Operating Systems',
      facultyCode: '39',
      departmentCode: '252',
      term: '1910',
      acadCareer: 'UGRD',
      courseSearchable: true,
      allowAnonFeedback: 'N',
      displayLibGuide: false,
      copyFromID: '00000000-0000-0000-0000-000000000000',
      l3: false,
      enableLearningFlow: true,
      usedNusCalendar: false,
      isCorporateCourse: false,
      creatorUserID: 'dcscrist',
      creatorName: 'Cristina Carbunaru',
      creatorEmail: 'dcscrist@nus.edu.sg',
      termDetail:
       { acadCareer: 'UGRD',
         term: '1910',
         description: '2019/2020 Semester 1',
         termBeginDate: '2019-08-05T00:00:00+08:00',
         termEndDate: '2019-12-07T00:00:00+08:00' },
      isMandatory: false }
    */

    const MODULE_PATH = 'module/?populate=Creator%2CtermDetail%2CisMandatory';
    const modulesInfo = await queryAPI(auth, MODULE_PATH);
    const modules = modulesInfo.map(moduleInfo => {
        return new Module(moduleInfo['id'], moduleInfo['name'], moduleInfo['courseName']);
    });

    // Recursively explore its children for folders
    // TODO: can explore asynchronously for further speedup ;)
    for (const module of modules) {
        if (PRINT) console.log('Exploring ' + module.code + ': ' + module.name + ' ...');
        const folders = await exploreFolders(auth, module.id);
        module.populateFolders(folders);
    }

    return modules;
}

async function exploreFolders(auth, parent_id) {
    /* EXAMPLE OF A FOLDER
    { access:
        { access_Full: false,
          access_Read: true,
          access_Create: false,
          access_Update: false,
          access_Delete: false,
          access_Settings_Read: false,
          access_Settings_Update: false },
      id: '9fce3f35-d6ab-4114-961c-bf141449f500',
      createdDate: '2019-01-11T14:48:00+08:00',
      creatorID: 'e98ffb04-eb4e-4f97-ab58-76ef3950b566',
      lastUpdatedDate: '2019-07-22T14:14:20.02+08:00',
      lastUpdatedBy: 'e98ffb04-eb4e-4f97-ab58-76ef3950b566',
      name: 'Lecture Notes',
      startDate: '2019-08-12T14:48:00+08:00',
      endDate: '2019-12-12T14:48:00+08:00',
      publish: true,
      parentID: 'ffbd17d6-094a-4493-89c5-168f47b729b9',
      rootID: 'ffbd17d6-094a-4493-89c5-168f47b729b9',
      sortFilesBy: 'Date',
      allowUpload: false,
      uploadDisplayOption: 'Name',
      viewAll: true,
      folderScore: 0,
      allowComments: true,
      isTurnitinFolder: false,
      totalFileCount: 26,
      totalSize: 390119172,
      subFolderCount: 22 } ]
    */

    const FOLDER_PATH = 'files/?populate=totalFileCount%2CsubFolderCount%2CTotalSize&ParentID=' + parent_id;
    const foldersInfo = await queryAPI(auth, FOLDER_PATH);
    // Filter for folders that aren't submission folders, and are open folders
    const filteredFoldersInfo = foldersInfo.filter(folderInfo => {
        return !folderInfo['allowUpload'] && folderInfo['totalFileCount'] != null;
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
    /* EXAMPLE OF A FILE
     { id: '7bc2e06e-24e0-4e59-968d-db8686b214a5',
       parentID: '7bc2e06e-24e0-4e59-968d-db8686b214a5',
       resourceID: '30f331f0-51c1-4261-ad3d-973119fb76b8',
       publish: true,
       name: 'Test 1 AY1920 Instructions.pdf',
       allowDownload: true,
       fileSize: 245018,
       fileFormat: 'File',
       fileName: 'Test 1 AY1920 Instructions.pdf',
       creatorID: 'e98ffb04-eb4e-4f97-ab58-76ef3950b566',
       createdDate: '2019-09-09T18:58:58.817+08:00',
       creatorName: 'Edmund Low',
       creatorUserID: 'usplsye',
       creatorEmail: 'usplsye@nus.edu.sg',
       creatorMatricNo: '049907',
       lastUpdatedDate: '2019-09-09T18:58:58.817+08:00',
       lastUpdatedBy: 'e98ffb04-eb4e-4f97-ab58-76ef3950b566',
       lastUpdatedByName: 'Edmund Low',
       lastUpdatedByUserID: 'usplsye',
       lastUpdatedByEmail: 'usplsye@nus.edu.sg',
       lastUpdatedByMatricNo: '049907',
       comment: [] }
    */

    const FILES_PATH  = 'files/' + parent_id + '/file?populate=Creator%2ClastUpdatedUser%2Ccomment';
    const filesInfo = await queryAPI(auth, FILES_PATH);
    const files = filesInfo.map(fileInfo => {
        return new File(fileInfo['id'], fileInfo['fileName'], fileInfo['lastUpdatedByName']);
    });
    return files;
}

module.exports = { exploreModules };

const request = require('request');

const API_BASE = 'https://luminus.nus.edu.sg/v2/api/';

// Returns a promise containing the body of a GET request directed to API_BASE + path
function queryAPI(auth, path) {
    const options = {
        headers: { 'Authorization': auth },
        uri: API_BASE + path,
        method: 'GET'
    }
    return new Promise(function(resolve, reject) {
        request(options, (err, res, body) => {
            if (err) return reject(err);
            if (res.statusCode != 200) {
                return reject('queryAPI failed. Status code: ' + res.statusCode +
                              ', status message: ' + res.statusMessage);
            }
            resolve(JSON.parse(body)['data']);
        })
    });
}

function queryModulesAPI(auth) {
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
    return queryAPI(auth, MODULE_PATH);
}

function queryFoldersAPI(auth, parent_id) {
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
    return queryAPI(auth, FOLDER_PATH);
}

function queryFilesAPI(auth, parent_id) {
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
    return queryAPI(auth, FILES_PATH);
}

function getDownloadURL(auth, path) {
    const options = {
        headers: { 'Authorization': auth },
        uri: API_BASE + path,
        method: 'GET'
    }
    return new Promise(function(resolve, reject) {
        request(options, (err, res, body) => {
            if (err) return reject(err);
            if (res.statusCode != 200) {
                return reject('getDownloadURL failed. Status code: ' + res.statusCode +
                              ', status message: ' + res.statusMessage);
            }
            resolve(JSON.parse(body)['data']);
        })
    });
}

// Returns a promise containing the body of the downloaded file/folder as a buffer
async function downloadAPI(auth, path) {
    const downloadURL = await getDownloadURL(auth, path);
    const options = {
        headers: { 'Authorization': auth },
        uri: downloadURL,
        method: 'GET',
        encoding: null // Allows `body` to be a buffer instead of a string by default
    }
    return new Promise(function(resolve, reject) {
        request(options, (err, res, body) => {
            if (err) return reject(err);
            if (res.statusCode != 200) {
                return reject('downloadAPI failed. Status code: ' + res.statusCode +
                              ', status message: ' + res.statusMessage);
            }
            resolve(body);
        })
    });
}

async function downloadFileAPI(auth, file_id) {
    const file_path = 'files/file/' + file_id + '/downloadurl';
    return await downloadAPI(auth, file_path);
}

async function downloadFolderAPI(auth, folder_id) {
    const folder_path = 'files/' + folder_id + '/downloadurl';
    return await downloadAPI(auth, folder_path);
}

module.exports = { queryModulesAPI, queryFoldersAPI, queryFilesAPI, downloadFileAPI, downloadFolderAPI };

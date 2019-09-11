const fs = require('fs');

const MODULES_FILE = 'MODULES.txt'

// Returns an object mapping LumiNUS module names to local module names
function readModuleMapping() {
    try {
        const data = fs.readFileSync(MODULES_FILE, 'utf8').toString();
        const lines = data.split('\n');
        let mapping = {};
        for (const line of lines) {
            if (line.trim() === '') continue;
            const splitLine = line.split(':');
            const luminusModuleName = splitLine[0].trim();
            const localModuleName = splitLine[1] ? splitLine[1].trim() : null;
            mapping[luminusModuleName] = localModuleName;
        }
        return mapping;
    } catch (e) {
        throw 'Could not read module mappings from ' + MODULES_FILE + ', terminating.';
    }
}

module.exports = { readModuleMapping };


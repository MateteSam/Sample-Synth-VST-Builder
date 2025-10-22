const fs = require('fs');
const path = require('path');

const mappingPath = 'c:\\Users\\DELL\\Documents\\FILING CABINET OF MILLIONS\\Seko Sa\\backend\\export\\1760824541495\\mapping.json';
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

console.log('UI keys:', Object.keys(mapping.ui));
console.log('Has bindings:', !!mapping.ui.bindings);
console.log('bindings length:', (mapping.ui.bindings || []).length);
console.log('bindingOrder length:', (mapping.ui.bindingOrder || []).length);
console.log('canvas:', JSON.stringify(mapping.ui.canvas, null, 2));
console.log('presetName:', mapping.ui.presetName);

const path = require('path');
const commonPath = require.resolve('@urbackend/common');
console.log('Resolved @urbackend/common path:', commonPath);

const common = require('@urbackend/common');
console.log('common keys:', Object.keys(common));
console.log('loginSchema shape:', common.loginSchema?._def?.shape?.());

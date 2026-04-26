const path = require('path');
const planEnforcement = require(path.join(process.cwd(), 'apps/dashboard-api/src/middlewares/planEnforcement.js'));
console.log('Keys:', Object.keys(planEnforcement));
console.log('checkMailTemplatesGate:', typeof planEnforcement.checkMailTemplatesGate);

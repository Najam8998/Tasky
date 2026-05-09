const crypto = require('crypto');
function getDiscriminator(name) {
  return Array.from(crypto.createHash('sha256').update('global:' + name).digest().slice(0, 8));
}
console.log('cancel_task', getDiscriminator('cancel_task'));
console.log('edit_task', getDiscriminator('edit_task'));

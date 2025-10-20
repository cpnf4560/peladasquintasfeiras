// Gerar hash bcrypt para password 'bodelos'
const bcrypt = require('bcrypt');

const password = 'bodelos';
const hash = bcrypt.hashSync(password, 10);

console.log('========================================');
console.log('  HASH BCRYPT PARA PASSWORD: bodelos');
console.log('========================================');
console.log('');
console.log('Hash gerado:');
console.log(hash);
console.log('');
console.log('SQL para Render (PostgreSQL):');
console.log('');
console.log(`UPDATE users SET password = '${hash}' WHERE username = 'presidente';`);
console.log('');
console.log('========================================');

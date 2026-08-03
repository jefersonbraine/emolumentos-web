const fs = require('fs');

const apiKey = process.env.API_KEY || '';
const apiBase = process.env.API_BASE || 'https://api-emolumentos.jefersonbraineleal.dev';

const conteudo = `export const environment = {
  production: true,
  apiBase: '${apiBase}',
  apiKey: '${apiKey}',
};
`;


fs.writeFileSync('src/environments/environment.ts', conteudo);
fs.writeFileSync('src/environments/environment.prod.ts', conteudo);

console.log('environment.ts e environment.prod.ts gerados com sucesso.');

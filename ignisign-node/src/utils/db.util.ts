import * as fs from 'fs';

export const getDb = () => {
  const Engine = require('tingodb')();
  const dir    = `./data/${process.env.IGNISIGN_APP_ENV}/${process.env.IGNISIGN_APP_ID}`
  fs.mkdirSync(dir, { recursive: true })
  
  const db = new Engine.Db(dir, {});
  return db
}
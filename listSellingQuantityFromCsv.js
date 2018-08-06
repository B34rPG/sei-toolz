/**
 * Copyright (c) 2018
 *
 * @summary 依據商品名稱加總其總銷售量，並且移除不必要之欄位。(資料來源：Shopline)
 * @author SC
 *
 * =======================================================
 * 指令: node listSellingQuantityFromCsv.js [檔案路徑]
 * 範例: node listSellingQuantityFromCsv.js /Users/sei/Desktop/xxxxx_RevenueReport_20180726_20180802.csv
 * =======================================================
 */

const fs = require('fs');
const csv = require('csv');
const colors = require('colors');
const _ = require('lodash');
const Promise = require('bluebird');
const path = require('path');
const fsReadFile = Promise.promisify(fs.readFile, fs);
const fsWriteFile = Promise.promisify(fs.writeFile, fs);
const csvParse = Promise.promisify(csv.parse, csv);
const csvStringify = Promise.promisify(csv.stringify, csv);

const itemTypeIndex = 0;
const itemNameIndex = 1;
const itemIdIndex = 3;
const itemSellingQunatityIndex = 5;

const filePath = _.trim(process.argv[2]);

const pathObj = path.parse(filePath);
const fileBase = pathObj.base;
const fileDir = pathObj.dir;
const fileExt = pathObj.ext;
if (fileExt !== '.csv') { return console.log('===> [ Error ]: Please import csv file.'.red); }

const newFileBase = `_${fileBase}`;
const newFilePath = path.resolve(fileDir, newFileBase);

console.log('===> Start...'.blue);
fsReadFile(filePath)
  .then(raw => {
    if (!raw) { throw new Error('Ooops... Cannot read the file.'); }

    return csvParse(raw.toString());
  })
  .then(fileCsvFormat => {
    if (!fileCsvFormat) { throw new Error('Ooops... Cannot parse the file to csv format.'); }

    // remove the first row
    fileCsvFormat.shift();

    return calculate(fileCsvFormat);
  })
  .then(newContent => {
    if (!newContent) { throw new Error('Ooops... Cannot calculate from the file.'); }

    console.log('==========> Writing...'.blue);
    return fsWriteFile(newFilePath, newContent, 'utf8');
  })
  .then(() => { console.log('============> Finish!!!'.rainbow); })
  .catch(err => {
    console.log('===> [ Error ]:'.red, err);
  })

// =================================================
// === functions
// =================================================
function calculate(rows) {
  console.log('======> Calculating...'.blue);
  const items = _.map(rows, (row) => {
    return {
      itemType: _.trim(row[itemTypeIndex]),
      itemName: _.trim(row[itemNameIndex]),
      itemId: _.trim(row[itemIdIndex]),
      itemSellingQunatity: 0
    };
  });
  const uniqueItems = _.uniqBy(items, 'itemName');

  _.forEach(uniqueItems, (ui, index) => {
    _.forEach(rows, (row) => {
      if (ui.itemName === _.trim(row[itemNameIndex])) {
        uniqueItems[index].itemSellingQunatity += parseInt(row[itemSellingQunatityIndex]);
      }
    });
  });

  const payload = transferObjectToArray(uniqueItems);
  return csvStringify(payload);
}

function transferObjectToArray(items) {
  const orderedItems = _.orderBy(items, ['itemSellingQunatity'], ['desc']);

  const payload = _.map(orderedItems, (item) => {
    return [item.itemType, item.itemName, item.itemId, item.itemSellingQunatity];
  });

  return payload;
}
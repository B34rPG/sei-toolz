/**
 * Copyright (c) 2018
 *
 * @summary 依據商品名稱加總其總銷售量，並且移除不必要之欄位。(資料來源：Shopline)
 * @author SC
 *
 * =======================================================
 * 指令: node listSellingQuantityFromXls.js [檔案路徑]
 * 範例: node listSellingQuantityFromXls.js /Users/sei/Desktop/xxxxx_RevenueReport_20180726_20180802.xls
 * =======================================================
 */

const fs = require('fs');
const colors = require('colors');
const _ = require('lodash');
const path = require('path');
const XLSX = require('xlsx')

const itemTypeIndex = 0;
const itemNameIndex = 1;
const itemIdIndex = 3;
const itemSellingQunatityIndex = 5;

const filePath = _.trim(process.argv[2]);

const pathObj = path.parse(filePath);
const fileBase = pathObj.base;
const fileDir = pathObj.dir;
const fileExt = pathObj.ext;
if (fileExt !== '.xls' && fileExt !== '.xlsx') { return console.log('===> [ Error ]: Please import xls file.'.red); }

const newFileBase = `_${fileBase}`;
const newFilePath = path.resolve(fileDir, newFileBase);

var workbook = XLSX.readFile(filePath, { sheetStubs: true });

const focusSheetName = workbook.SheetNames[0];
const contentObj = workbook.Sheets[focusSheetName];

transferContentObjectToArray(contentObj);


// =================================================
// === functions
// =================================================
function transferContentObjectToArray(contentObj) {
  let contentArr = [];
  let unusedProperties = {};
  for (let key in contentObj) {
    if (key[0] === '!') { unusedProperties[key] = contentObj[key]; }
    else {
      const index = parseInt(key.match(/[0-9, \.]+/g)) - 1;

      if (contentArr[index] === undefined) { contentArr[index] = [ contentObj[key].v ]; }
      else { contentArr[index].push(contentObj[key].v); }
    }
  }

  calculate(contentArr, unusedProperties);
}

function calculate(rows, unusedProperties) {
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

  transferArrayToTemplate(uniqueItems, unusedProperties);
}

function transferArrayToTemplate(items, unusedProperties) {
  const orderedItems = _.orderBy(items, ['itemSellingQunatity'], ['desc']);

  const payload = {};
  _.forEach(orderedItems, (item, index) => {
    const keyNumber = index;
    payload['A' + keyNumber] = { v: item.itemType, t: 's', w: item.itemType };
    payload['B' + keyNumber] = { v: item.itemName, t: 's', w: item.itemName };
    payload['C' + keyNumber] = { v: item.itemId, t: 's', w: item.itemId };
    payload['D' + keyNumber] = { v: item.itemSellingQunatity, t: 'n', w: item.itemSellingQunatity };
  });

  workbook.Sheets[focusSheetName] = {...payload, ...unusedProperties};
  XLSX.writeFile(workbook, newFilePath);
}
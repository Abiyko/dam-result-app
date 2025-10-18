const axios = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const { stringify } = require("csv-stringify");
const xml2js = require("xml2js");
const parser = new xml2js.Parser();
require("dotenv").config({ path: __dirname + "/.env" });

urlDxg = "https://www.clubdam.com/app/damtomo/scoring/GetScoringDxgListXML.do"
scoringHistoryIdDxg = "scoringDxgId"


// CSVから最新のscoringHistoryIdを読み取る関数
async function readCsvValue(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`${filePath} が見つかりません。`);
      return null;
    }

    const records = await new Promise((resolve, reject) => {
      fs.readFile(filePath, { encoding: "utf-8" }, (err, data) => {
        if (err) return reject(err);
        if (data.trim() === "") {
          resolve([]);
        } else {
          parse(data, {}, (err, records) => {
            if (err) return reject(err);
            resolve(records);
          });
        }
      });
    });

    if (records.length > 1) {
      const lastRecord = records[records.length - 1];
      if (lastRecord.length > 0) {
        return lastRecord[0];
      }
    }
    return null;
  } catch (error) {
    console.error("CSVファイルの読み込み中にエラーが発生しました:", error);
    return null;
  }
}

// データを取得しCSVファイルに保存する関数
async function fetchDataAndSaveToCsv(url, scoringHistoryId, filePath, lastStoredId) {
  const detailFlg = "1";
  const allAcquiredData = [];
  let pageNo = 1;
  let existingRecordFlg = false;

  // 環境変数からcdmCardNoの取得
  const cdmCardNo = process.env.CDM_CARD_NO;
  if (!cdmCardNo) {
    console.error("エラー: 環境変数 'CDM_CARD_NO' が設定されていません。");
    return;
  }

  while (true) {
    try {
      const response = await axios.get(url, {
        params: {
          cdmCardNo: cdmCardNo,
          detailFlg: detailFlg,
          pageNo: pageNo,
          dxgType: 1,
          enc: "utf-8",
        },
        responseType: "text",
      });

      const jsonData = await parser.parseStringPromise(response.data);
      const documentData = jsonData.document;

      if (
        !documentData ||
        !documentData.list ||
        documentData.list[0].$.count === "0"
      ) {
        console.log("取得できるデータがなくなりました。");
        break;
      }

      const pageData = documentData.list[0].data;

      for (const item of pageData) {
        const scoringId = parseInt(
          item.scoring[0].$[scoringHistoryId],
          10
        );
        if (scoringId <= lastStoredId) {
          if (allAcquiredData.length === 0) {
            console.log("新たな記録はありませんでした。");
            return;
          }
          existingRecordFlg = true;
          break;
        }
        allAcquiredData.push(item);
      }

      // フラグがtrueなら、whileループも終了
      if (existingRecordFlg) {
        break;
      }

      const hasNext = documentData.list[0].$.hasNext;
      if (hasNext === "0") {
        console.log("すべてのページのデータを取得しました。");
        break;
      }

      pageNo++;
    } catch (error) {
      console.error("データの取得または処理中にエラーが発生しました:", error);
      break;
    }
  }

  if (allAcquiredData.length === 0) {
    console.log("新たな記録はありませんでした。");
    return;
  }

  allAcquiredData.sort((a, b) => {
    const idA = parseInt(a.scoring[0].$[scoringHistoryId], 10);
    const idB = parseInt(b.scoring[0].$[scoringHistoryId], 10);
    return idA - idB;
  });

  //指定ファイルがない場合に新たなファイルの作成とヘッダーの書き込み
  const fileExists = fs.existsSync(filePath);
  if (!fileExists) {
    const headers = Object.keys(allAcquiredData[0].scoring[0].$);
    const headerString = headers.join(",") + "\n";
    fs.writeFileSync(filePath, headerString, { encoding: "utf-8" });
    console.log("新しいファイルにヘッダーが書き込まれました。");
  }

  const tableData = allAcquiredData.map((item) => item.scoring[0].$);
  const csvString = await new Promise((resolve, reject) => {
    stringify(
      tableData,
      {
        quoted: true,
        header: false,
      },
      (err, output) => {
        if (err) reject(err);
        resolve(output);
      }
    );
  });

  fs.appendFileSync(filePath, csvString, { encoding: "utf-8" });
  console.log("新しいデータが scoresHeart.csv に追記されました。");
}

async function main() {
  const path = require("path");
  let filePath;
  let url;
  let scoringHistoryId;
  let lastStoredId;
  
  exportFilename = "scoresDxg.csv"
  filePath = path.join(__dirname, "..", exportFilename);
  url = urlDxg;
  scoringHistoryId = scoringHistoryIdDxg;
  lastStoredId = await readCsvValue(filePath);
  if (lastStoredId) {
    await fetchDataAndSaveToCsv(url, scoringHistoryId, filePath, lastStoredId);
  } else {
    console.log(
      "scoresHeart.csvにデータが見つかりませんでした。新しくデータを取得します。"
    );
    await fetchDataAndSaveToCsv(url, scoringHistoryId, filePath, null);
  }
}

main();

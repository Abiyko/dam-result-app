const axios = require('axios');
const fs = require('fs');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();
require('dotenv').config();

async function readCsvValue(filePath) {
  try {
    // 1. ファイルが存在するか確認
    if (!fs.existsSync(filePath)) {
      console.log(`${filePath} が見つかりません。新しいファイルを作成します...`);
      try {
        // 同期的に空のファイルを作成
        fs.writeFileSync(filePath, '');
        console.log(`${filePath} が正常に作成されました。`);
      } catch (err) {
        console.error(`エラー: ${filePath} の作成中に問題が発生しました。`, err);
        return;
      }
    }

    // 2. CSVファイルを読み込み、解析
    const records = await new Promise((resolve, reject) => {
      fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
        if (err) return reject(err);

        parse(data, {}, (err, records) => {
          if (err) return reject(err);
          resolve(records);
        });
      });
    });

    // A2の値を抽出
    //return records[1][0];
    if (records.length > 1 && records[1].length > 0) {
      return records[1][0];
    } else {
      // データが空の場合
      return null;
    }

  } catch (error) {
    console.error("CSVファイルの読み込み中にエラーが発生しました:", error);
    return null;
  }
}


async function fetchDataAndSaveToCsv(a2Value) {
  const url = 'https://www.clubdam.com/app/damtomo/scoring/GetScoringHeartsListXML.do';
  const detailFlg = '1';
  const pageNo = '1';

  // .envファイルからcdmCardNoを読み込む
  const cdmCardNo = process.env.CDM_CARD_NO; 
  if (!cdmCardNo) {
    console.error("エラー: 環境変数 'CDM_CARD_NO' が設定されていません。");
    return;
  }

  try {
    const response = await axios.get(url, {
      params: {
        cdmCardNo: cdmCardNo,
        pageNo: pageNo,
        detailFlg: detailFlg,
        enc: 'utf-8'
      },
      responseType: 'text'
    });

    // データの取得
    const jsonData = await parser.parseStringPromise(response.data);

    // データが空でないか確認
    if (!jsonData.document.list || jsonData.document.list[0].$.count === '0') {
      console.log("取得したデータがありません。");
      return;
    }
    
    // すべての曲のデータを含む配列を取得
    const allSongData = jsonData.document.list[0].data;

    // 配列の最後の要素にアクセス
    const lastSong = allSongData[allSongData.length - 1];

    // 最後に取得した曲のscoringHeartsHistoryIdを抽出
    const lastSongId = lastSong.scoringHearts[0].$.scoringHeartsHistoryId;

    // IDをコンソールに出力
    console.log('最後に取得した曲のID:', lastSongId);

    // データ加工
    const tableData = jsonData.document.list[0].data.map(item => {
      const hearts = item.scoringHearts[0];
      
      // すべての属性を抽出
      return {
        ...hearts.$
      };
    });

    // CSVに変換してファイルに書き込み
    stringify(tableData, { header: true }, (err, csvString) => {
      if (err) {
        console.error('CSVの生成中にエラーが発生しました:', err);
        return;
      }
      fs.writeFile('scores.csv', csvString, (err) => {
        if (err) {
          console.error('ファイルの書き込み中にエラーが発生しました:', err);
          return;
        }
        console.log('scores.csvにデータが保存されました。');
      });
    });

  } catch (error) {
    console.error('データの取得または処理中にエラーが発生しました:', error);
  }
}

// 処理を制御するメイン関数
async function main() {
  const filePath = 'scores.csv';
  const a2Value = await readCsvValue(filePath);

  if (a2Value) {
    // ファイルからデータが読み込めた場合
    console.log(`CSVから読み込んだ値: ${a2Value}`);
    // ここで何か後続の処理（例えば、a2Valueを使ってデータを絞り込むなど）を行う
    await fetchDataAndSaveToCsv(); // 例として既存の処理をそのまま呼び出す
  } else {
    // ファイルが存在しないか、データが空だった場合
    console.log('scores.csvにデータが見つかりませんでした。新しくデータを取得します。');
    await fetchDataAndSaveToCsv();
  }
}


// メイン関数を実行
main();
const axios = require('axios');
const fs = require('fs');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();
require('dotenv').config();

// CSVから値（A2セル）を読み取る関数
async function readCsvValue(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`${filePath} が見つかりません。`);
            return null;
        }

        const records = await new Promise((resolve, reject) => {
            fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
                if (err) return reject(err);
                if (data.trim() === '') {
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
async function fetchDataAndSaveToCsv(filePath, lastStoredId) {
    const url = 'https://www.clubdam.com/app/damtomo/scoring/GetScoringHeartsListXML.do';
    const detailFlg = '1';
    const allAcquiredData = [];
    let pageNo = 1;
    let foundExistingRecord = false; // フラグ変数を追加

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
                    pageNo: pageNo,
                    detailFlg: detailFlg,
                    enc: 'utf-8'
                },
                responseType: 'text'
            });

            const jsonData = await parser.parseStringPromise(response.data);
            const documentData = jsonData.document;

            if (!documentData || !documentData.list || documentData.list[0].$.count === '0') {
                console.log("取得できるデータがなくなりました。");
                break;
            }

            const pageData = documentData.list[0].data;

            for (const item of pageData) {
                const historyId = parseInt(item.scoringHearts[0].$.scoringHeartsHistoryId, 10);
                if (lastStoredId && historyId <= lastStoredId) {
                    console.log('既存のデータです。');
                    if (allAcquiredData.length === 0) {
                        console.log('新たな記録はありませんでした。');
                        return;
                    }
                    foundExistingRecord = true; // フラグを立てる
                    break;
                }
                allAcquiredData.push(item);
            }

            // フラグがtrueなら、whileループも終了
            if (foundExistingRecord) {
                break;
            }

            console.log(`ページ ${pageNo} のデータを取得しました。`);

            const hasNext = documentData.list[0].$.hasNext;
            if (hasNext === "0") {
                console.log('すべてのページのデータを取得しました。');
                break;
            }
            pageNo++;
        } catch (error) {
            console.error('データの取得または処理中にエラーが発生しました:', error);
            break;
        }
    }

    if (allAcquiredData.length === 0) {
        console.log('新たな記録はありませんでした。');
        return;
    }

    allAcquiredData.sort((a, b) => {
        const idA = parseInt(a.scoringHearts[0].$.scoringHeartsHistoryId, 10);
        const idB = parseInt(b.scoringHearts[0].$.scoringHeartsHistoryId, 10);
        return idA - idB;
    });

    const fileExists = fs.existsSync(filePath);
    if (!fileExists) {
        const headers = Object.keys(allAcquiredData[0].scoringHearts[0].$);
        const headerString = headers.join(',') + '\n';
        fs.writeFileSync(filePath, headerString, { encoding: 'utf-8' });
        console.log('新しいファイルにヘッダーが書き込まれました。');
    }

    const tableData = allAcquiredData.map(item => item.scoringHearts[0].$);
    const csvString = await new Promise((resolve, reject) => {
        stringify(tableData, {
            quoted: true,
            header: false
        }, (err, output) => {
            if (err) reject(err);
            resolve(output);
        });
    });

    fs.appendFileSync(filePath, csvString, { encoding: 'utf-8' });
    console.log('新しいデータが scoresHearts.csv に追記されました。');
}

// 処理を制御するメイン関数
async function main() {
    const filePath = 'scoresHeart.csv';
    const lastStoredId = await readCsvValue(filePath);

    if (lastStoredId) {
        console.log(`CSVから読み込んだ最新ID: ${lastStoredId}`);
        await fetchDataAndSaveToCsv(filePath, lastStoredId);
    } else {
        console.log('scoresHeart.csvにデータが見つかりませんでした。新しくデータを取得します。');
        // ファイルがない場合、ここで空のファイルを作成
        fs.writeFileSync(filePath, '');
        await fetchDataAndSaveToCsv(filePath, null);
    }
}

main();
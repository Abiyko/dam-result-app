const fs = require("fs");
const { parse } = require("csv-parse");

// ファイルパスを設定
const csvFilePath = "./server/scoresHeart.csv";
const jsonFilePath = "./server/configHeart.json";



function getHighestScore(records) {
  // --records.totalScore の最大値を取得--
  const totalScores = records
    .map(record => parseFloat(record.totalScore)) // totalScoreを数値に変換した配列を作成
  let HighestScore = 0;
  if (totalScores.length > 0) {
    HighestScore = Math.max(...totalScores);
  }

  return HighestScore
}


function CountRecordsPerYear(records) {
  // --年ごとのレコード数を抽出--
  const RecordCountByYear = {};

  records.forEach(record => {
      if (!record.scoringDateTime) return;
      const year = String(record.scoringDateTime).slice(0, 4); // scoringDateTime の上4桁（年）を文字列として取得
      RecordCountByYear[year] = (RecordCountByYear[year] || 0) + 1; // 年ごとのカウントをインクリメント
  });

  return RecordCountByYear
}


function GetSongDatasMostSung(records) {
  // --歌唱回数の多い曲名とアーティスト名の取得 (上位5つ)--
  // 各レコードをループしてrequestNoとartistNameの数をカウント
  const requestNoCounts = {};
  const artistNameCounts = {};
  const requestNoToSongName = {};
  const requestNoToArtistName = {};

  records.forEach((record) => {
    const { requestNo, artistName, songName } = record;
    
    // カウント処理
    requestNoCounts[requestNo] = (requestNoCounts[requestNo] || 0) + 1;
    artistNameCounts[artistName] = (artistNameCounts[artistName] || 0) + 1;

    // requestNoとsongNameの対応を記録
    if (!requestNoToSongName[requestNo] && songName) {
        requestNoToSongName[requestNo] = songName;
    }

    // requestNoArtistNameの対応を記録
    if (!requestNoToArtistName[requestNo] && artistName) {
      requestNoToArtistName[requestNo] = artistName;
    }
  });

  // 配列をソート
  const sortedRequestNoCounts = Object.entries(requestNoCounts)
    .sort(([, countA], [, countB]) => countB - countA);
  
  // ソートされた配列から上位5つのキー（requestNo）を抽出
  const top5RequestNos = sortedRequestNoCounts
    .slice(0, 5) // 配列の最初から5要素を抽出
    .map(([requestNo,]) => requestNo); // 各要素の0番目（requestNo）だけを抽出

  // top5RequestNosに対応する曲名を取得
  const top5SongNames = top5RequestNos.map(requestNo => {
      // requestNoToSongNameマップから曲名を取得
      return requestNoToSongName[requestNo] || "不明な曲名";
  });

  // top5RequestNosに対応するアーティスト名を取得
  const top5ArtistNames = top5RequestNos.map(requestNo => {
      // requestNoToSongNameマップからアーティスト名を取得
      return requestNoToArtistName[requestNo] || "不明なアーティスト名";
  });
  
  return { top5RequestNos, top5SongNames, top5ArtistNames};
}


function getRecent7Dates(records) {
  const recent7Dates = [];
  const formatted7Dates = [];
  const seenDate = new Set();

  // 配列の末尾から先頭に向かってループ
  for (let i = records.length - 1; i >= 0; i--) {
    const scoringDateTime = records[i].scoringDateTime;
    if (!scoringDateTime) continue; 
    const dateKey = String(scoringDateTime).slice(0, 8); // 記録日時の上8桁(YYYYMMDD)を取得
    
    // 追加済みの上8桁でなければ新たに配列に追加
    if (!seenDate.has(dateKey)) {
      seenDate.add(dateKey);
      recent7Dates.push(dateKey);
      const formattedDate = dateKey.slice(0,4) + '/' + dateKey.slice(4,6) + '/' + dateKey.slice(6,8);
      formatted7Dates.push(formattedDate);

      // 7種類集まったらループを終了
      if (recent7Dates.length >= 7) {
        break;
      }
    }
  }

  return {recent7Dates, formatted7Dates};
}


function groupRecordsByDate(records, recent7Dates) {
  // 抽出した7種類の日付キーを Set に格納
  const recent7DatesRecord = {};
  const targetDate = new Set(recent7Dates);
  
  // 全レコードをループし、該当するレコードを dateKey ごとに格納
  records.forEach((record) => {
      if (!record.scoringDateTime) return;
      const recordDate = String(record.scoringDateTime).slice(0, 8);
      if (targetDate.has(recordDate)) {
          // 該当する dateKey の配列がまだ存在しない場合は初期化
          if (!recent7DatesRecord[recordDate]) {
            recent7DatesRecord[recordDate] = [];
          }
          recent7DatesRecord[recordDate].push(record);
      }
  });

  return recent7DatesRecord;
}


function calcLatestStates(targetRecords, latestDateKey) {
  const dataCount = targetRecords.length; // データの数（平均値計算用）

  let maxTotalScore = 0;
  let sumPitch = 0;
  let sumStability = 0;
  let sumExpressive = 0;
  let sumVibratoLongtone = 0;
  let sumRhythm = 0;
  let sumHearing = 0;

  targetRecords.forEach(record => {
    // totalScore の最大値
    const totalScore = parseFloat(record.totalScore);
    if (totalScore > maxTotalScore) {
      maxTotalScore = totalScore;
    }

    // 各レーダーチャート項目の合計値
    sumPitch += parseFloat(record.radarChartPitch);
    sumStability += parseFloat(record.radarChartStability);
    sumExpressive += parseFloat(record.radarChartExpressive);
    sumVibratoLongtone += parseFloat(record.radarChartVibratoLongtone);
    sumRhythm += parseFloat(record.radarChartRhythm);
    sumHearing += parseFloat(record.radarChartHearing);
  });

    // 最大値と平均値を計算し、変数に格納
    const latestDateAvgPitch = (dataCount > 0 ? (sumPitch / dataCount) : 0).toFixed(3);
    const latestDateAvgStability = (dataCount > 0 ? (sumStability / dataCount) : 0).toFixed(3);
    const latestDateAvgExpressive = (dataCount > 0 ? (sumExpressive / dataCount) : 0).toFixed(3);
    const latestDateAvgVibratoLongtone = (dataCount > 0 ? (sumVibratoLongtone / dataCount) : 0).toFixed(3);
    const latestDateAvgRhythm = (dataCount > 0 ? (sumRhythm / dataCount) : 0).toFixed(3);
    const latestDateAvgHearing = (dataCount > 0 ? (sumHearing / dataCount) : 0).toFixed(3);


    return {
      dateKey: latestDateKey,
      maxTotalScore: maxTotalScore,
      avgPitch:parseFloat(latestDateAvgPitch),
      avgStability: parseFloat(latestDateAvgStability),
      avgExpressive: parseFloat(latestDateAvgExpressive),
      avgVibratoLongtone: parseFloat(latestDateAvgVibratoLongtone),
      avgRhythm: parseFloat(latestDateAvgRhythm),
      avgHearing: parseFloat(latestDateAvgHearing),
    };
}


function main() {
  // --ファイルの読み込み--
  const stream = fs.createReadStream(csvFilePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
    })
  );
  const records = [];
  stream.on("data", (data) => records.push(data));

  stream.on("end", () => {
    //-- レコードの有無を確認--
    if (records.length === 0) {
        console.log("レコードが見つかりませんでした。");
        return; 
    }

    const configData = {}; // JSONに格納するデータを保持するオブジェクト

    // --records.totalScore の最大値を取得--
    configData.highestScore = getHighestScore(records);

    // --年ごとのレコード数を抽出--
    configData.recordCountByYear = CountRecordsPerYear(records);

    // --歌唱回数の多い予約番号,曲名,アーティスト名の取得 (上位5つ)--
    const songDatasMostSung = GetSongDatasMostSung(records);
    configData.top5RequestNos = songDatasMostSung.top5RequestNos;
    configData.top5SongNames = songDatasMostSung.top5SongNames;
    configData.top5ArtistNames = songDatasMostSung.top5ArtistNames;

    // --採点日のカウント--
    recent7DatesData = getRecent7Dates(records);
    recent7Dates = recent7DatesData.recent7Dates;
    formatted7Dates = recent7DatesData.formatted7Dates;
    configData.recentDate = formatted7Dates;


    // --指定された日付キーのレコードをグループ化--
    recent7DatesRecord = groupRecordsByDate(records, recent7Dates);

    // --最新の記録における最高スコアとチャートの平均値の抽出--
    const latestDateKey = recent7Dates[0];
    const targetRecords = recent7DatesRecord[latestDateKey];
    configData.latestDateStats = calcLatestStates(targetRecords, latestDateKey)

    // --JSONファイルへの書き込み--
    try {
      const jsonString = JSON.stringify(configData, null, 2);
      fs.writeFileSync(jsonFilePath, jsonString, 'utf8');
      console.log("CSVデータの読み込みと解析が完了しました。");
      console.log(`すべての統計情報は、'${jsonFilePath}' にJSON形式で出力されました。`);
    } catch (err) {
      console.error("JSONファイルの書き込み中にエラーが発生しました:", err);
    }
  });

  // エラーハンドリング
  stream.on("error", (err) => {
    console.error("CSVファイルの読み込み中にエラーが発生しました:", err);
  });
}



// 関数を実行
main();

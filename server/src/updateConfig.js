const fs = require("fs");
const { parse } = require("csv-parse");

// ファイルパスを設定
const csvFilePath = "./server/scoresHeart.csv";

function processCsvAndReadData() {
  // ファイルの読み込み
  // CSVファイルを読み込むためのReadableStreamを作成
  const stream = fs.createReadStream(csvFilePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
    })
  );
  

  // データを読み込み
  const records = [];
  stream.on("data", (data) => records.push(data));


  // ファイルの読み込みが完了した後に実行
  stream.on("end", () => {
    console.log("CSVデータの読み込みが完了しました。");
    console.log("合計レコード数:", records.length);

    // 各ランキングデータの抽出
    const requestNoCounts = {};
    const artistNameCounts = {};

    // 各レコードをループしてrequestNoとartistNameの数をカウント
    records.forEach((record) => {
      const { requestNo } = record;
      requestNoCounts[requestNo] = (requestNoCounts[requestNo] || 0) + 1;
      const { artistName } = record;
      artistNameCounts[artistName] = (artistNameCounts[artistName] || 0) + 1;
    });

    // 配列をソート
    const sortedRequestNoCounts = Object.entries(requestNoCounts)
      .sort(([, countA], [, countB]) => countB - countA);
    const sortedArtistNameCounts = Object.entries(artistNameCounts)
      .sort(([, countA], [, countB]) => countB - countA);
    
    // ソートされた配列から上位5つのキー（requestNo）を抽出
    const top5RequestNos = sortedRequestNoCounts
      .slice(0, 5) // 配列の最初から5要素を抽出
      .map(([requestNo,]) => requestNo); // 各要素の0番目（requestNo）だけを抽出
    console.log("歌唱回数の多い曲のナンバー (上位5つ):");
    console.log(top5RequestNos);

    // ソートされた配列から上位5つのキー（artistName）を抽出
    const top5ArtistName = sortedArtistNameCounts
      .slice(0, 5) // 配列の最初から5要素を抽出
      .map(([requestNo,]) => requestNo); // 各要素の0番目（artistName）だけを抽出
    console.log("歌唱回数の多い曲の歌手名 (上位5つ):");
    console.log(top5ArtistName);

    // 歌唱回数のカウント
    const lastRecord = records[records.length - 1];

    if (lastRecord) {
      // 最後のレコードの 'damserial' と一致するオブジェクトをフィルタリング
      const latestRecords = records.filter(
        (record) => record.damserial === lastRecord.damserial
      );
      console.log("latestRecords:", latestRecords.length);
    } else {
      console.log("レコードが見つかりませんでした。");
    }
  });

  // エラーハンドリング
  stream.on("error", (err) => {
    console.error("CSVファイルの読み込み中にエラーが発生しました:", err);
  });
}

// 関数を実行
processCsvAndReadData();

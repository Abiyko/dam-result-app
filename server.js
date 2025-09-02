const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// JSONのパースを有効にする
app.use(express.json());

// APIエンドポイントの定義
app.get('/get-xml', async (req, res) => {
  const url = 'https://www.clubdam.com/app/damtomo/scoring/GetScoringHeartsListXML.do';

  // 固定値で cdmCardNo、pageNoを設定
  // detailFlgは0 or 1
  const cdmCardNo = '';
  const pageNo = '1';
  const detailFlg = '1';

  try {
    const response = await axios.get(url, {
      params: {
        cdmCardNo: cdmCardNo,
        pageNo: pageNo,
        detailFlg: detailFlg,
        enc: 'utf-8'
      }
    });
    
    // 取得したXMLデータをそのままクライアントに返す
    res.set('Content-Type', 'text/xml');
    res.send(response.data);
    
    // コンソールにも表示
    console.log('取得したXMLデータ:\n', response.data);
  } catch (error) {
    console.error('データの取得に失敗しました:', error);
    res.status(500).send('Error fetching data.');
  }
});

// サーバーの起動
app.listen(port, () => {
  console.log(`Proxy server listening at http://localhost:${port}`);
});
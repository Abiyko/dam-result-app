# 現在鋭意制作中です！

要件定義は [document.md](https://github.com/Abiyko/dam-result-app/blob/main/document.md)に記載。

### server.js について。

DAM の精密採点 AiHeart の結果を取得するスクリプトです。
Node.js でローカルサーバーを立ち上げてデータを取得したものをブラウザに表示するだけです。
url は
http://localhost:3000/get-xml
です。
cdmCardNo はサイト内に明示的に示されているわけではないので、ブラウザの開発者モードを開いてネットワークタブにて cdmCardId を見つけましょう。GoogleChrome より MicrosoftEdge のほうが見つけやすいと思います。

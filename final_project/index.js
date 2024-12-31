// 必要なモジュールをインポート
// Expressモジュールをインポート
/*
インメモリストレージ（デフォルト）：
express-session（または他のセッションミドルウェア）を使用している場合、デフォルトでは、セッションデータはサーバのメモリ（RAM）内に保存されます。
この方法は開発環境や小規模なアプリケーションには便利ですが、スケーラビリティが欠けるため、実運用環境では一般的には使用されません。
*/
const express = require('express'); // Expressフレームワーク
const jwt = require('jsonwebtoken'); // JSON Web Token (JWT) ライブラリ
const session = require('express-session'); // セッション管理ライブラリ
const customer_routes = require('./router/auth_users.js').authenticated; // 認証ユーザールート
const genl_routes = require('./router/general.js').general; // 一般ルート

// Expressアプリケーションを作成
const app = express();

// JSON形式のリクエストボディを解析するミドルウェアを設定
app.use(express.json());


const os = require('os');   // 'os' モジュールをインポートして OS 情報を取得するために使用
const HOST = process.env.HOST || '0.0.0.0'; // ホスト名を環境変数 'HOST' から取得、指定がなければ '0.0.0.0' を使用
const PORT = process.env.PORT || 3000;      // ポート番号を環境変数 'PORT' から取得、指定がなければ 3000 を使用

// "/customer"ルートに対するセッション設定
app.use("/customer", session({
  secret: "fingerprinat_customer", // セッションの秘密鍵
  resave: false, // セッションが変更されていなくても保存する
  saveUninitialized: true, // 初期化されていないセッションを保存する
  cookie: { 
    maxAge: 3600000,        // セッションの有効期限を1時間（ミリ秒）に設定
    secure: false           // HTTPSではない場合は`secure: false`に設定　：クッキーをHTTPのみアクセス可能に設定（セキュリティ）
  }
}));

// "/customer/auth/*" ルートで認証処理を行うミドルウェア
//　クライアントから送付されたクッキー情報をもとにサーバで発行したアクセストークンの格納先を見つけ出して検証
app.use("/customer/auth/*", function auth(req, res, next) {
  // 認証メカニズムをここに記述
  // 必要に応じてJWTやセッションを検証する

  console.log("認証開始（クライアントのクッキー情報を元にセッション情報（アクセストークン・ユーザ名）を抽出）")

  console.log("req.session.authorization:",req.session.authorization)

  // ユーザーがログインしていて、有効なアクセストークンを持っているか確認
  // クッキーのセッションID（connect.sid）を基に、セッションデータを取得

  /*具体的な動作の流れ
  1.クライアントが最初にサーバにリクエストを送るとき、サーバはセッションを生成し、connect.sidという名前のクッキー（cookies.txt）をレスポンスでブラウザに送信します。
  　このクッキーにはセッションIDが格納されています。

  2.クライアントが再度リクエストを送るとき、ブラウザはconnect.sidというセッションIDを自動的にHTTPヘッダーに追加します。
  　このセッションIDは、サーバが過去に生成したものです。

  3.サーバ側では、リクエストを受け取ると、クッキーからセッションIDを抽出し、
  　それを使ってセッションストレージ（メモリやRedisなど）から該当するセッションデータを取り出します。

  4.セッションIDに紐づけられたセッションデータがreq.sessionに格納され、req.session.authorizationにアクセスすることができます。
  */


  if (req.session.authorization) {
      let token = req.session.authorization['accessToken'];

      // JWTトークンを検証
      jwt.verify(token, "access", (err, user) => {
          if (!err) {
              req.user = user; // ユーザー情報をリクエストに追加
              next(); // 次のミドルウェアへ進む
          } else {
              return res.status(403).json({ message: "User not authenticated" }); // 認証エラー
          }
      });
  } else {
      return res.status(403).json({ message: "User not logged in" }); // ログインしていない場合
  }



});

// サーバーがリッスンするポート番号
//const PORT = 5000;

// "/customer" ルートを処理するルートハンドラーを追加 
// customer_routes = require('./router/auth_users.js').authenticated; // 認証ユーザールート
app.use("/customer", customer_routes);

// "/" ルートを処理する一般ルートハンドラーを追加
app.use("/", genl_routes);






// ローカル IP アドレスを取得する関数を定義
const getLocalIP = () => {
    // ネットワークインターフェース情報を取得
    const interfaces = os.networkInterfaces();
  
    console.log("interfaces:",interfaces);
  
    // プラットフォーム情報を取得 ('win32' は Windows、'linux' は Linux/WSL)
    const platform = process.platform;
    
    console.log("platform:",platform)
  
    // Windows の場合、WSL (Windows Subsystem for Linux) の仮想ネットワークインターフェースをチェック
    if (platform === 'win32' && interfaces['vEthernet (WSL (Hyper-V firewall))']) {
      // IPv4 アドレスで内部ネットワークでないものを検索
      const iface = interfaces['vEthernet (WSL (Hyper-V firewall))'].find(
        i => i.family === 'IPv4' && !i.internal
      );
      // 条件に合うアドレスが見つかった場合は返す
      if (iface) return iface.address;
    }
  
    // Linux またはその他のインターフェースを使用
    // Linux では 'eth0' インターフェースを使用、それ以外では最初のインターフェースを使用
    let targetInterface = platform === 'linux' ? 'eth0' : Object.keys(interfaces)[0];
  
    console.log("targetInterface:",targetInterface)
  
    // IPv4 アドレスで内部ネットワークでないものを検索
    const iface = interfaces[targetInterface]?.find(i => i.family === 'IPv4' && !i.internal);
  
    // 条件に合うアドレスが見つかった場合は返す、見つからない場合は '127.0.0.1' を返す
    return iface ? iface.address : '127.0.0.1';
  };
  
  // ローカル IP アドレスを取得
  const localIP = getLocalIP();
  
  console.log("expressWithAuthentication.js起動")
  
  // サーバーを起動し、ホスト名とポート番号を指定
  app.listen(PORT, HOST, () => {
    // サーバーの起動情報をコンソールに出力
    console.log(`Server is running at http://${localIP}:${PORT}`);
  });


// サーバーを指定したポートで起動
//app.listen(PORT, () => console.log("Server is running"));


// npm startでサーバ起動
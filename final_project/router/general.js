// 必要なモジュールをインポート
const express = require('express'); // Expressフレームワークをインポート
let books = require("./booksdb.js"); // 書籍データベースをインポート
let isValid = require("./auth_users.js").isValid; // ユーザー名が有効か確認する関数をインポート
let users = require("./auth_users.js").users; // ユーザー情報をインポート
const public_users = express.Router(); // パブリックルーターを作成

const axios = require('axios');

// ユーザーを登録するエンドポイント
// 新規ユーザー登録用エンドポイント
// 成功例　curl -X POST http://172.27.64.1:3000/register -H "Content-Type: application/json" -d '{"username": "john_doe", "email": "john@example.com", "password": "password123"}'
// 入力不足で失敗　curl -X POST http://172.27.64.1:3000/register -H "Content-Type: application/json" -d '{"username": "john_doe", "email": "john@example.com"}'
// メールアドレスが重複して失敗　curl -X POST http://172.27.64.1:3000/register -H "Content-Type: application/json" -d '{"username": "john_doe", "email": "john@example.com", "password": "password123"}'
public_users.post("/register", (req, res) => {

  console.log("登録処理開始")

  // 仮のユーザーDB（実際にはデータベースを使うべき）
  //let users = [];

  // リクエストからユーザー情報を取得
  const { username, email, password } = req.body;

  console.log("username：",username)
  console.log("email：",email)
  console.log("password：",password)

  // 入力チェック: ユーザー名、メールアドレス、パスワードがすべて提供されているかを確認
  if (!username || !email || !password) {
    return res.status(400).json({ message: "ユーザー名、メールアドレス、パスワードは必須です。" });
  }

  // すでに同じメールアドレスで登録されているか確認
  const existingUser = users.find(user => user.email === email);

  console.log("existingUser：",existingUser)

  if (existingUser) {
    return res.status(409).json({ message: "このメールアドレスはすでに登録されています。" });
  }

  // 新しいユーザーオブジェクトを作成
  const newUser = { username, email, password };

  console.log("ユーザ登録完了しました。ユーザ情報(更新前)：",users)

  // ユーザーを仮のDBに保存
  users.push(newUser);

  console.log("ユーザ登録完了しました。ユーザ情報(更新後)：",users)

  // 成功メッセージを返す
  return res.status(201).json({ users:users , message: "ユーザー登録が完了しました。" });

  // ユーザー登録処理をここに記述
  //return res.status(300).json({ message: "まだ実装されていません" }); // 未実装のメッセージを返す

});



// ショップで利用可能な書籍リストを取得するエンドポイント
//　public_users.get('/', function (req, res) {
  // 書籍リストを取得する処理をここに記述
  //return res.status(300).json({ message: "まだ実装されていません" }); // 未実装のメッセージを返す

  // 書籍リストを取得してレスポンスとして返す（タスク1）
  //　return res.status(200).json(books);
  

// 書籍リストを取得するエンドポイント（async-await版）タスク10
/*
  処理の全体像（フロー図）
  クライアントがエンドポイント / にリクエストを送信。
  サーバーで非同期処理を開始。
  書籍リストが存在するかチェック。
  存在する場合: 書籍リストを resolve してクライアントに送信。
  存在しない場合: エラーメッセージを reject してクライアントに送信。
  成功した場合:
  HTTP 200 と書籍リストを返す。
  エラーが発生した場合:
  HTTP 500 とエラー内容を返す。
*/
// 成功例　curl -X GET  http://172.27.64.1:3000

public_users.get('/', async function (req, res) {
  try {

    console.log("非同期で書籍リストを取得開始")

    // 非同期で書籍リストを取得
    const data = await new Promise((resolve, reject) => {
      if (books) {
        console.log("取得成功！")
        resolve(books); // 書籍リストが存在すれば解決
      } else {
        reject('書籍リストが見つかりません'); // 存在しなければ拒否
      }
    });

    // 書籍リストをレスポンスとして返す
    res.status(200).json(data);
  } catch (error) {
    // エラーをレスポンスとして返す
    res.status(500).json({ error: error });
  }

});




// ISBNに基づいて書籍の詳細を取得するエンドポイント
// 成功　curl -X GET http://172.27.64.1:3000/isbn/1
// 失敗　curl -X GET http://172.27.64.1:3000/isbn/100

/*　タスク2
public_users.get('/isbn/:isbn', function (req, res) {

  // リクエストパラメータからISBNを取得
  const isbn = req.params.isbn;

  console.log("bookリスト:",books);

  // ISBNがbooksデータに存在するか確認
  const book = books[isbn];

  console.log("検索対象book:",book);

  if (book) {
    // 書籍データをレスポンスとして返す
    return res.status(200).json(book);
  } else {
    // ISBNが存在しない場合、エラーメッセージを返す
    return res.status(404).json({ message: "指定されたISBNの書籍は見つかりませんでした。" });
  }

  // ISBNに基づく書籍の詳細取得処理をここに記述
  //return res.status(300).json({ message: "まだ実装されていません" }); // 未実装のメッセージを返す
});
*/

// ISBN に基づく書籍情報を取得するエンドポイント（async-await版）　タスク11
public_users.get('/isbn/:isbn', async function (req, res) {
  try {
    // リクエストパラメータから ISBN を取得
    const isbn = req.params.isbn;

    console.log("リクエストされたISBN:", isbn);
    console.log("bookリスト:",books);

    // Promise を利用して非同期的に書籍データを取得
    const book = await new Promise((resolve, reject) => {
      if (books[isbn]) {
        console.log("検索対象bookが見つかりました！");
        resolve(books[isbn]); // ISBN に基づく書籍が存在すれば解決
      } else {
        reject("指定されたISBNの書籍は見つかりませんでした。"); // 存在しなければ拒否
      }
    });

    console.log("検索対象book:",book);

    // 書籍データをレスポンスとして返す
    res.status(200).json(book);
  } catch (error) {
    // エラーをレスポンスとして返す
    res.status(404).json({ message: error });
  }
});





// 著者名に基づいて書籍の詳細を取得するエンドポイント
//　成功例　curl -X GET "http://172.27.64.1:3000/author/Jane%20Austen"
//　失敗例　curl -X GET "http://172.27.64.1:3000/author/Unknown%20Author"


/*　　小ネタ　空白を「%20」に指定する理由

1. URL の仕様
URL は ASCII 文字 のみを含むべきと定義されています。スペース ( ) やその他の特定の文字は、URL に直接含めることができません。
そのため、スペースなどの文字を「エンコード」する必要があります。

2. スペースのエンコード
スペースは、URL の中では %20 として表されます。このエンコードは URL エンコーディング（パーセントエンコーディング）と呼ばれます。

例：Jane Austen → Jane%20Austen
これは URL がネットワーク経由で正しく解釈されるために必要な変換です。

*/

/*　タスク3

public_users.get('/author/:author', function (req, res) {

  console.log("bookリスト(辞書型):",books);

  const author = req.params.author; // URLパラメータから著者名を取得

  // booksオブジェクト（辞書型）の値を配列化し、著者名が一致するものをフィルタリング
  const result = Object.values(books).filter(book => book.author === author);

  console.log("著者検索結果result:",result)
  console.log("result.length:",result.length)
  

  if (result.length === 0) {
    // 著者名に一致する書籍が見つからない場合
    return res.status(404).json({ message: "指定された著者の書籍は見つかりませんでした。" });
  }

  // 一致する書籍を返す
  return res.status(200).json(result);


  // 著者名に基づく書籍の詳細取得処理をここに記述
  //return res.status(300).json({ message: "まだ実装されていません" }); // 未実装のメッセージを返す
});

*/


// 著者名に基づく書籍情報を取得するエンドポイント（async-await版）　タスク12
//　成功例　curl -X GET "http://172.27.64.1:3000/author/Jane%20Austen"
//　失敗例　curl -X GET "http://172.27.64.1:3000/author/Unknown%20Author"

public_users.get('/author/:author', async function (req, res) {

  console.log("bookリスト(辞書型):",books);

  try {
    // URLパラメータから著者名を取得
    const author = req.params.author; 

    console.log("リクエストされた著者名:", author);

    // Promise を利用して非同期的に著者に基づく書籍をフィルタリング
    const result = await new Promise((resolve, reject) => {
      // booksオブジェクトから著者名が一致する書籍をフィルタリング
      // booksオブジェクト（辞書型）の値を配列化し、著者名が一致するものをフィルタリング
      const filteredBooks = Object.values(books).filter(book => book.author === author);
      
      console.log("著者検索結果filteredBooks:",filteredBooks)
      console.log("filteredBooks.length:",filteredBooks.length)

      // 一致する書籍がない場合、エラーメッセージを返しcatchブロックへ処理が遷移
      if (filteredBooks.length === 0) {
        reject("指定された著者の書籍は見つかりませんでした。");
      } else {
        // 見つかった書籍を返す
        resolve(filteredBooks); 
      }
    });

    console.log("result:",result);

    // 結果をレスポンスとして返す
    res.status(200).json(result);

  } catch (error) {
    // エラーをレスポンスとして返す
    res.status(404).json({ message: error });
  }
});





// タイトルに基づいてすべての書籍を取得するエンドポイント
// 成功例　curl -X GET "http://172.27.64.1:3000/title/things%20fall%20apart"
// 失敗例　curl -X GET "http://172.27.64.1:3000/title/nonexistent%20book"

/* タスク4
public_users.get('/title/:title', function (req, res) {

  console.log("bookリスト(辞書型):",books);

  // リクエストからタイトルを取得
  //toLowerCase()：文字列内のすべてのアルファベットを小文字に変換
  //データベースやオブジェクト内のタイトルと比較する際、大文字小文字の違いが検索に影響しないようにするためです。
  const title = req.params.title.toLowerCase(); 

  console.log("title（リクエストパラメータを小文字化）:",title);

  // タイトルに一致する書籍をフィルタリング
  const booksByTitle = Object.values(books).filter(book => 
    book.title.toLowerCase().includes(title)
  );
  
  console.log("booksByTitle（Title検索結果）:",booksByTitle);
  console.log("booksByTitle.length:",booksByTitle.length);

  // 結果が空かどうかを確認してレスポンスを返す
  if (booksByTitle.length > 0) {
    return res.status(200).json(booksByTitle);
  } else {
    return res.status(404).json({ message: "指定されたタイトルの書籍が見つかりません。" });
  }

  // タイトルに基づく書籍の詳細取得処理をここに記述
  //return res.status(300).json({ message: "まだ実装されていません" }); // 未実装のメッセージを返す
});

*/


// タイトルに基づいてすべての書籍を取得するエンドポイント
// 成功例　curl -X GET "http://172.27.64.1:3000/title/things%20fall%20apart"
// 失敗例　curl -X GET "http://172.27.64.1:3000/title/nonexistent%20book"

// タイトルに基づいて書籍情報を取得するエンドポイント（async-await版） タスク13
public_users.get('/title/:title', async function (req, res) {
  try {
    console.log("bookリスト(辞書型):", books); // booksリスト全体の確認用ログ

    // リクエストからタイトルを取得
    // toLowerCase()：文字列内のすべてのアルファベットを小文字に変換
    const title = req.params.title.toLowerCase(); 

    console.log("title（リクエストパラメータを小文字化）:", title); // 小文字化したタイトルをログに出力

    // 非同期で書籍をタイトルに基づいて検索する
    const result = await new Promise((resolve, reject) => {
      // booksオブジェクトからタイトルが一致する書籍をフィルタリング
      //　Object.values(books) を使って、books の値部分（書籍データ）を配列に変換し、その中から book.title に対して小文字で部分一致を検索します
      const booksByTitle = Object.values(books).filter(book => 
        book.title.toLowerCase().includes(title) // 小文字化して部分一致をチェック
      );

      console.log("booksByTitle（Title検索結果）:", booksByTitle); // 検索結果をログに出力
      console.log("booksByTitle.length:", booksByTitle.length); // 結果の件数をログに出力

      if (booksByTitle.length > 0) {
        // 見つかった書籍があれば、それらを返す
        resolve(booksByTitle); 
      } else {
        // 一致する書籍がない場合はエラーを返す
        reject("指定されたタイトルの書籍が見つかりません。");
      }
    });

    // 検索結果をレスポンスとして返す
    res.status(200).json(result);

  } catch (error) {
    // エラーが発生した場合、エラーメッセージをレスポンスとして返す
    res.status(404).json({ message: error });
  }
});






// ISBNに基づいて書籍のレビューを取得するエンドポイント
// 成功例　curl -X GET "http://172.27.64.1:3000/review/1"
// 失敗例　curl -X GET "http://172.27.64.1:3000/review/11"
public_users.get('/review/:isbn', function (req, res) {

  // リクエストからISBNを取得
  const isbn = req.params.isbn;

  console.log("isbn:",isbn)

  // ISBNに基づく書籍を取得
  const book = books[isbn];

  console.log("book:",book);

  // 書籍が存在しない場合
  if (!book) {
    return res.status(404).json({ message: "指定されたISBNの書籍が見つかりません。" });
  }

  console.log("Object.keys(book.reviews):",Object.keys(book.reviews));

  // 書籍にレビューが存在するかどうか
  if (Object.keys(book.reviews).length === 0) {
    return res.status(404).json({ message: "この書籍にはまだレビューがありません。" });
  }

  // 書籍のレビューを返す
  return res.status(200).json(book.reviews);

  // ISBNに基づくレビュー取得処理をここに記述
  //return res.status(300).json({ message: "まだ実装されていません" }); // 未実装のメッセージを返す
});

// モジュールをエクスポート
module.exports.general = public_users; // パブリックルーターをエクスポート

// 必要なモジュールをインポート
const express = require('express'); // Expressフレームワーク
const jwt = require('jsonwebtoken'); // JSON Web Token (JWT) ライブラリ
let books = require("./booksdb.js"); // 本データベースをインポート
const auth_users = express.Router(); // ルーターを作成

// ユーザー情報を格納する配列
let users = [];

// ユーザー名が有効かどうかをチェックする関数（booleanを返す）
const isValid = (username) => {
  // ユーザー名が有効であるかどうかを確認するコードをここに記述

  console.log("isValid関数開始（ユーザ名チェック開始）");

  // ユーザー名が空でないことを確認
  if (!username) {
    return false;
  }
  
  // ユーザー名の長さを確認（3文字以上、15文字以下）
  if (username.length < 3 || username.length > 15) {
    return false;
  }
  
  // ユーザー名に使用できる文字はアルファベット、数字、アンダースコアのみ
  const regex = /^[a-zA-Z0-9_]+$/;
  if (!regex.test(username)) {
    return false;
  }
  
  // すべての条件を満たしている場合は有効とする
  return true;

};

// ユーザー名とパスワードが一致するかをチェックする関数（booleanを返す）
const authenticatedUser = (username, password) => {
  // 登録されたユーザー情報と一致するかどうかを確認するコードをここに記述
  // ユーザー名とパスワードが一致するユーザーをusers配列からフィルタリング
  let valid_users = users.filter((user) => {
    return (user.username === username && user.password === password);
  });

  console.log("valid_users:",valid_users)

  // 一致するユーザーが存在する場合はtrueを返す
  if (valid_users.length > 0) {
      return true;
  } else {
      return false; // 存在しない場合はfalseを返す
  }


};

// ログイン用エンドポイント
// 登録済みのユーザーのみがログイン可能
//詳細確認
//サーバで作成・送信されたクッキーをクライアント側で保存
//curl -X POST http://172.27.64.1:3000/customer/login -H "Content-Type: application/json" -d '{"username": "john_doe", "password": "password123"}' -c cookies.txt -v

auth_users.post("/login", (req, res) => {

  console.log("ログイン処理開始")

  console.log("req.body:",req.body)

  const username = req.body.username; // リクエストボディからユーザー名を取得
  const password = req.body.password; // リクエストボディからパスワードを取得

  // ユーザー名が有効かチェック
  if (!isValid(username)) {
    return res.status(400).json({ message: "無効なユーザー名です。" });
  }

  // ユーザー名またはパスワードが欠けている場合
  if (!username || !password) {
      return res.status(404).json({ message: "Error logging in" });
  }

  // ユーザー認証し、TrueならJWTアクセストークン発行
  if (authenticatedUser(username, password)) {
      // JWTアクセストークンを生成
      let accessToken = jwt.sign({
          data: password
      }, 'access', { expiresIn: 60 * 60 });

      // セッションにアクセストークンとユーザー名を保存
      req.session.authorization = {
          accessToken, username
      }
      console.log("認証成功！（サーバ側でアクセストークン発行・ユーザ名とともに保存しクライアントに返す）")
      console.log("req.session.authorization:",req.session.authorization)
      
      //return res.status(200).send("User successfully logged in");
      return res.status(200).json({ message: "User successfully logged in" });
  } else {
      return res.status(208).json({ message: "Invalid Login. Check username and password" });
  }


  // ログイン処理のコードをここに記述
  // return res.status(300).json({ message: "まだ実装されていません" }); // 未実装のメッセージを返す
});



// 書籍にレビューを追加する
// レビュー追加
//　成功例(追加)　curl -X PUT http://172.27.64.1:3000/customer/auth/review/10 -H "Content-Type: application/json" -d '{"review": {"rating": 3, "comment": "この本はとても面白かったです！"}}' -b cookies.txt -v
//　成功例(更新)　curl -X PUT http://172.27.64.1:3000/customer/auth/review/10 -H "Content-Type: application/json" -d '{"review": {"rating": 4, "comment": "この本はまじ最高！"}}' -b cookies.txt -v


auth_users.put("/auth/review/:isbn", (req, res) => {
  
  console.log("レビュー追加/更新開始")

  // リクエストパラメータからISBNを取得
  const isbn = req.params.isbn;

  console.log("isbn:",isbn)

  // クエリパラメータからレビュー内容を取得
  const review = req.body.review; // リクエストボディからレビューを取得

  console.log("review:",review)

  // セッションからユーザー名を取得（ユーザーがログインしていない場合はnull）
  /* 「?」の意味
   req.session.authorization が存在する（つまり、ユーザーが認証されている）場合、
   req.session.authorization.username（セッションに保存されたユーザー名）を取得します。
   req.session.authorization が存在しない場合（つまり、認証されていない場合）、null を代入します。
  */
  const username = req.session.authorization ? req.session.authorization.username : null;
  
  console.log("username:",username)

  // ユーザーがログインしていない場合はエラーを返す
  if (!username) {
    return res.status(401).json({ message: "ログインしていないため、レビューを投稿できません。" });
  }

  // レビューが提供されていない場合はエラーを返す
  if (!review) {
    return res.status(400).json({ message: "レビューが提供されていません。" });
  }

  // 対象のISBNの書籍がデータベース（または書籍リスト）に存在するか確認
  let book = books[isbn];

  console.log("books:",books)
  console.log("book(レビュー追加/更新前):",book)

  // ISBNに対応する書籍が見つからなければエラーを返す
  if (!book) {
    return res.status(404).json({ message: "指定されたISBNの書籍が見つかりません。" });
  }

  // 既にユーザーによるレビューが存在する場合、レビューを上書き
  if (book.reviews[username]) {
    // ユーザーが投稿したレビューを新しいレビューで上書き
    book.reviews[username] = review;
    
    console.log("book(レビュー更新後):",book)

    // レビューの更新が成功したことを返す
    return res.status(200).json({ book:book, message: "レビューが更新されました。" });
  } else {
    // 新しいユーザーによるレビュー投稿の場合、レビューを新たに追加
    book.reviews[username] = review;
  
    console.log("book(レビュー追加後):",book)

    // レビューの追加が成功したことを返す
    return res.status(201).json({ book:book, message: "レビューが追加されました。" });
  }


  // レビューを追加する処理のコードをここに記述
  // return res.status(300).json({ message: "まだ実装されていません" }); // 未実装のメッセージを返す
});




// 書籍のレビューを削除する
// レビュー削除
//　成功例　curl -X DELETE http://172.27.64.1:3000/customer/auth/review/10 -b cookies.txt -v
//　失敗例(削除レビューがない)　curl -X DELETE http://172.27.64.1:3000/customer/auth/review/11 -b cookies.txt -v

auth_users.delete("/auth/review/:isbn", (req, res) => {
  console.log("レビュー削除開始");

  // リクエストパラメータからISBNを取得
  const isbn = req.params.isbn;
  console.log("isbn:", isbn);


  // セッションからユーザー名を取得（ユーザーがログインしていない場合はnull）
  /* 「?」の意味
   req.session.authorization が存在する（つまり、ユーザーが認証されている）場合、
   req.session.authorization.username（セッションに保存されたユーザー名）を取得します。
   req.session.authorization が存在しない場合（つまり、認証されていない場合）、null を代入します。
  */

  // セッションからユーザー名を取得
  const username = req.session.authorization ? req.session.authorization.username : null;
  console.log("username:", username);

  // ユーザーがログインしていない場合はエラーを返す
  if (!username) {
    return res.status(401).json({ message: "ログインしていないため、レビューを削除できません。" });
  }

  // 対象のISBNの書籍がデータベースに存在するか確認
  let book = books[isbn];
  console.log("books:", books);
  console.log("book(削除前):", book);

  // ISBNに対応する書籍が見つからない場合はエラーを返す
  if (!book) {
    return res.status(404).json({ message: "指定されたISBNの書籍が見つかりません。" });
  }

  // ユーザーのレビューが存在するか確認
  if (!book.reviews[username]) {
    return res.status(404).json({ message: "削除するレビューが見つかりません。" });
  }

  // ユーザーのレビューを削除
  delete book.reviews[username];
  console.log("book(削除後):", book);

  // 成功レスポンスを返す
  return res.status(200).json({ book: book, message: "レビューが削除されました。" });
});





// モジュールをエクスポート
module.exports.authenticated = auth_users; // 認証されたルーターをエクスポート
module.exports.isValid = isValid; // ユーザー名の有効性を確認する関数をエクスポート
module.exports.users = users; // ユーザー情報をエクスポート

# Medcalc4 非破壊リファクタリング PR 作業案

## 目的

臨床検査データから各指標を計算する現行動作を維持したまま、今後の診療科・標的臓器・指標追加に備えて責務を分離する。

対象は `Medcalc4.html` と、既に抽出が始まっている `src/domain`、`src/usecase`、`src/presentation` 配下のモジュール。

## 作業進捗

最終更新: 2026-06-01

- PR-0: 進行済み。手動操作で問題なく動作していることを確認済み。
- PR-1: 完了。`dom.js` と `message-renderer.js` に Presentation 共通処理を分離済み。
- PR-2: 完了。腎機能タブを `InputReader -> UseCase -> Domain -> Renderer` の標準パターンへ整理済み。
- PR-3: 完了。共通患者入力と腎機能入力を input reader に分離済み。
- PR-4: 完了。肝機能タブを分離済み。
- PR-5: 完了。糖代謝タブを分離済み。
- PR-6: 完了。脂質異常タブを分離済み。段階案ではなく、既存挙動維持を優先してタブ単位で一括移行した。
- PR-7: 完了。貧血タブを分離済み。既存表示文言を維持するため、現時点では Domain がメッセージ配列を返す形を踏襲している。
- PR-8: 完了。泌尿器タブを分離済み。標的臓器ごとの判定は `ORGAN_RULES` に集約し、臓器追加時の変更点を限定した。
- PR-9: 完了。日付計算タブを分離済み。ローカル日付として扱う `parseDateLocal`、`addDays`、`diffDays` などを Domain に移した。
- PR-10: 完了。γ計算タブを分離済み。薬剤定義は `drug-info.js`、計算は `gamma-calculator.js`、薬剤チップ描画は renderer に分離した。
- PR-11: 完了。タブ切替、共通入力、セクションイベント委譲、薬剤選択イベント、初回全計算を `app-shell.js` に分離した。

次の候補:

- PR-12: 配布形態の整理。

## 現状評価

- `Medcalc4.html` は UI、入力取得、計算式、判定文言、描画、イベント配線が同居している。
- タブ切替、`handlers`、`bindSection` により、イベント配線は比較的整理されている。
- 腎機能は `domain/usecase/presentation` への縦切り分離が始まっており、今後の標準パターンとして使える。
- 残タブは `calculateXxx` が入力取得、計算、表示メッセージ生成までまとめて担当している。
- 医療計算の安全性を考えると、式・閾値・表示文言の変更と、責務分離の変更は同じ PR に混ぜない方がよい。

## 目標アーキテクチャ

### Presentation

責務:

- DOM 参照
- 入力値の読み取り
- タブ切替
- イベント配線
- 計算結果の描画

候補:

- `src/presentation/app-shell.js`
- `src/presentation/dom.js`
- `src/presentation/input-readers/<section>-input-reader.js`
- `src/presentation/renderers/<section>-renderer.js`

### UseCase

責務:

- 入力 DTO を受け取る
- Domain の純粋計算を呼ぶ
- Renderer に渡しやすい ViewModel を返す
- 複数 Domain の合成が必要な場合の調停

候補:

- `src/usecase/<section>/run-<section>.js`
- `src/usecase/common/patient-context.js`

### Domain

責務:

- DOM や HTML を知らない純粋な計算
- 医学的な式、分類、閾値判定
- 入力 object から結果 object を返す

候補:

- `src/domain/<section>/<section>-calculator.js`
- `src/domain/common/rounding.js`
- `src/domain/common/date-calculator.js`
- `src/domain/common/risk-classification.js`

## 非破壊リファクタリングのルール

- PR 内で医学的な式、閾値、表示文言を変更しない。
- PR 内で rename、抽出、仕様変更を混ぜない。
- 1 PR につき 1 タブ、または 1 共通責務だけを扱う。
- 既存の HTML id、class、タブ名、出力先 id は維持する。
- 既存の `calculateXxx` はすぐ削除せず、移行中は facade として残す。
- Domain から `document`、`window`、`innerHTML`、`getElementById` を参照しない。
- Renderer 以外で HTML 文字列を作らない。
- 入力なし、0、未選択の扱いは現行挙動と一致させる。

## PR-0: ベースライン確認と現状固定

目的:

分割前の動作を確認し、以後の PR で差分が出た時に戻れる基準を作る。

作業:

- `docs/manual-test-checklist.md` の代表入力を使って全タブを手動確認する。
- ブラウザ console error の有無を記録する。
- 主要タブの表示結果をスクリーンショットまたはテキストで保存する。

触らないもの:

- 計算式
- 表示文言
- DOM 構造

受け入れ条件:

- 8 タブすべてで入力に対する表示が出る。
- タブ切替が壊れていない。
- 共通入力の変更で関連タブが再計算される。

## PR-1: Presentation 共通部品の純移設

目的:

DOM アクセスとメッセージ描画を共通部品化する。

作業:

- `src/presentation/dom.js` に `$`、`getNum`、`getSelectValue`、`isChecked` を集約する。
- `src/presentation/renderers/message-renderer.js` に `setMessages` を集約する。
- `Medcalc4.html` は既存関数の呼び出し先を差し替えるだけにする。

触らないもの:

- 各 `calculateXxx` の中身
- 表示 HTML の形

受け入れ条件:

- 出力の `<p>...</p>` 構造が移設前と一致する。
- 全タブの入力イベント、change イベントが従来どおり発火する。

## PR-2: 腎機能タブを標準パターンとして完成

目的:

既に始まっている腎機能の縦切りを、以後のタブ移行の見本にする。

作業:

- `src/domain/renal/renal-calculator.js` は純粋計算に限定する。
- `src/usecase/renal/run-renal.js` は Domain 呼び出しと結果整形に限定する。
- `src/presentation/renderers/renal-renderer.js` は描画だけに限定する。
- `Medcalc4.html` の `calculateRenal` は入力取得と usecase 呼び出しだけを担当する facade にする。

触らないもの:

- eGFR、eCCr、FENa、FEUN、FEK、FEUa、推定食塩摂取量、推定 K 摂取量の計算式
- 表示順
- 表示文言

受け入れ条件:

- 腎機能タブの手動テスト結果が PR-0 と一致する。
- `renal-calculator.js` に DOM API が含まれない。
- `Medcalc4.html` 側の腎機能処理が facade として読める。

## PR-3: 入力 Reader の導入

目的:

各 `calculateXxx` から DOM 読み取り責務を外し、今後の入力フォーム追加に強くする。

作業:

- `src/presentation/input-readers/common-input-reader.js` を追加する。
- `age`、`gender`、`height`、`weight` を `PatientContext` 相当の plain object にする。
- 腎機能から先に `readRenalInput()` を導入する。
- `calculateRenal` は `readRenalInput()`、`runRenal()`、`renderRenal()` の順に呼ぶだけにする。

触らないもの:

- 腎機能以外のタブ
- DOM id

受け入れ条件:

- 共通入力変更時に腎機能が従来どおり再計算される。
- 入力未設定時の空表示が従来どおり。

## PR-4: 肝機能タブの Domain 分離

目的:

BMI、AST/ALT 比、Fib-4、MASLD fibrosis score、FLI を純粋計算へ移す。

作業:

- `src/domain/liver/liver-calculator.js` を追加する。
- `src/usecase/liver/run-liver.js` を追加する。
- `src/presentation/renderers/liver-renderer.js` を追加する。
- `calculateLiver` を facade 化する。

触らないもの:

- 肝機能の式、閾値、判定文言
- 入力フォーム

受け入れ条件:

- 肝機能タブの手動テスト結果が PR-0 と一致する。
- Domain に `document`、`window`、HTML タグがない。

## PR-5: 糖代謝タブの Domain 分離

目的:

CPI と HOMA-IR の計算・判定を移す。

作業:

- `src/domain/glucose/glucose-calculator.js` を追加する。
- `src/usecase/glucose/run-glucose.js` を追加する。
- `src/presentation/renderers/glucose-renderer.js` を追加する。
- `calculateGlucose` を facade 化する。

受け入れ条件:

- 糖代謝タブの表示が PR-0 と一致する。
- 入力不足時の表示有無が従来どおり。

## PR-6: 脂質異常タブの段階分離

目的:

脂質タブはロジック量が多いため、1 PR で全移行せず、計算とリスク分類を分けて移す。

PR-6a 作業:

- LDL、Non-HDL、Friedewald 推算 LDL の計算だけを `src/domain/lipid/lipid-values.js` に移す。
- 表示文言と治療目標判定はまだ `Medcalc4.html` に残す。

PR-6b 作業:

- CAD、DM、CKD、高血圧、喫煙などの入力からリスク分類する処理を `src/domain/lipid/lipid-risk-classifier.js` に移す。
- 久山町スコア相当の点数計算を小関数化する。

PR-6c 作業:

- `src/usecase/lipid/run-lipid.js` と `src/presentation/renderers/lipid-renderer.js` を追加する。
- `calculateLipid` を facade 化する。

受け入れ条件:

- 各サブ PR で脂質タブの表示が PR-0 と一致する。
- 途中段階でもアプリ全体が動作する。
- リスク分類の分岐に対して、代表入力を最低 3 パターン確認する。

## PR-7: 貧血タブの段階分離

目的:

MCV、TSAT、RPI、鉄評価、EPO 反応、網状赤血球反応を保守しやすくする。

PR-7a 作業:

- MCV、TSAT、RPI の計算を `src/domain/anemia/anemia-values.js` に移す。

PR-7b 作業:

- 鉄評価、EPO 評価、網赤血球評価、MCV 分類を `src/domain/anemia/anemia-classifier.js` に移す。

PR-7c 作業:

- `src/usecase/anemia/run-anemia.js` と `src/presentation/renderers/anemia-renderer.js` を追加する。
- `calculateAnemia` を facade 化する。

受け入れ条件:

- 貧血タブの表示が PR-0 と一致する。
- MCV 入力値と自動計算値の差分警告が従来どおり。

## PR-8: 泌尿器タブの標的臓器分離

目的:

標的臓器の追加をしやすくする。

作業:

- `src/domain/uro/uro-volume-calculator.js` を追加する。
- 臓器ごとの判定を strategy 風の object にまとめる。
- `src/usecase/uro/run-uro.js` と `src/presentation/renderers/uro-renderer.js` を追加する。
- `organSelect` の選択肢追加時に Domain 側へ判定を足すだけで済む構造にする。

受け入れ条件:

- 前立腺、膀胱、残尿の表示ラベルと判定が従来どおり。
- 未選択時の fallback が従来どおり。

## PR-9: 日付計算タブの純関数化

目的:

日付処理を UI から切り離し、タイムゾーン由来の事故を減らす。

作業:

- `src/domain/date-calc/date-calculator.js` を追加する。
- `parseDateLocal`、`fmtYMD`、`weekdayJP`、`addDays`、`diffDays` を移す。
- `src/usecase/date-calc/run-date-calc.js` と renderer を追加する。

受け入れ条件:

- `2026-05-24 + 14日 + 2週` などの代表ケースが PR-0 と一致する。
- 日付差分の符号表示が従来どおり。

## PR-10: γ計算タブの薬剤定義分離

目的:

薬剤追加と γ 計算を分け、薬剤マスターを保守しやすくする。

作業:

- `src/domain/gamma/gamma-calculator.js` を追加する。
- `src/domain/gamma/drug-info.js` に `DRUG_INFO` を移す。
- `src/usecase/gamma/run-gamma.js` と renderer を追加する。
- 薬剤チップ描画は renderer に閉じ込める。

触らないもの:

- 薬剤名
- 濃度
- 推奨範囲
- 選択時に濃度入力へ反映する挙動

受け入れ条件:

- 現在 γ と目標 γ からの投与速度が PR-0 と一致する。
- 薬剤選択で濃度欄が従来どおり更新される。
- 薬剤チップの選択表示が従来どおり。

## PR-11: App shell 抽出

目的:

全タブ移行後に、タブ切替とイベント配線を `Medcalc4.html` から外す。

作業:

- `src/presentation/app-shell.js` を追加する。
- `handlers`、`runAll`、`activateTab`、`bindSection`、共通入力イベントを移す。
- `Medcalc4.html` の inline script を最小化する。

受け入れ条件:

- 初期表示で全タブの初回計算が走る。
- タブ切替が従来どおり。
- 各タブ内の input/change イベントが従来どおり。

## PR-12: 配布形態の整理

目的:

開発時は分割ファイル、配布時は単一 HTML という運用を両立する。

作業:

- 依存なしで済ませるなら、外部 script を保持したまま運用手順を docs 化する。
- 単一 HTML が必須なら、bundle 用スクリプトを追加する。
- 生成物を `dist/Medcalc4.html` に置くか、現行ファイル名を上書きするかを決める。

受け入れ条件:

- 配布用 HTML をブラウザで直接開いて動く。
- 開発用ファイル構成と配布用ファイル構成の違いが README または docs に明記されている。

## 推奨実施順

1. PR-0: ベースライン確認
2. PR-1: Presentation 共通部品
3. PR-2: 腎機能の標準パターン完成
4. PR-3: 入力 Reader 導入
5. PR-4: 肝機能
6. PR-5: 糖代謝
7. PR-6: 脂質異常
8. PR-7: 貧血
9. PR-8: 泌尿器
10. PR-9: 日付計算
11. PR-10: γ計算
12. PR-11: App shell
13. PR-12: 配布形態

## レビュー観点

- Domain に UI 依存が混ざっていないか。
- UseCase が DOM id を知らないか。
- Renderer 以外で HTML 文字列を組み立てていないか。
- 移行 PR で医学的な式、閾値、文言が変わっていないか。
- 入力未設定、0、未選択の扱いが現行と一致しているか。
- 1 PR の差分が対象タブに閉じているか。

## 将来の機能追加時の流れ

新しい診療科または標的臓器を追加する場合:

1. Domain に純粋計算を追加する。
2. UseCase に入力 DTO と結果 ViewModel の変換を追加する。
3. Presentation に input reader と renderer を追加する。
4. App shell の handlers にタブを登録する。
5. `docs/manual-test-checklist.md` に代表入力と期待表示を追加する。

この順序にすると、UI 追加と医学的ロジック追加の影響範囲を分離しやすい。

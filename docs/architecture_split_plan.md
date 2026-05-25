# Medcalc4.html 現状構造と分割方針（分析メモ）

## 現状の把握
- 単一HTML内に Presentation (DOM/CSS/イベント) と Domain (医学指標計算) が同居。
- タブ単位のハンドラレジストリ `handlers` と `bindSection` により、イベント結線は比較的整理済み。
- 各 `calculateXxx` が「入力取得・計算・表示文生成」までを一括実行しており責務が混在。

## 現状の層的な分離ポイント
- GUI層相当: `activateTab`, `bindSection`, `setMessages`, DOM取得ユーティリティ。
- ドメイン層相当: `calculateRenal`, `calculateLiver`, `calculateAnemia` などの式・判定ロジック。
- ユースケース層相当: 現状は未分離（GUIイベントから直接ドメイン処理を呼び出し）。

## 推奨分割（ファイル構成案）

### 1. Presentation（GUI責務）
- `src/presentation/app-shell.js`
  - 初期化、全体イベント配線、タブ切替。
- `src/presentation/dom.js`
  - `getNum/getSelectValue/isChecked` などDOMアダプタ。
- `src/presentation/renderers/<section>-renderer.js`
  - ドメイン結果（構造化データ）をHTMLへ描画。

### 2. UseCase（アプリ固有フロー）
- `src/usecase/<section>/run-<section>.js`
  - 入力DTO受け取り → domain計算呼び出し → 表示用ViewModelへ整形。

### 3. Domain（純粋ロジック）
- `src/domain/<section>/<section>-calculator.js`
  - 数式・判定のみ。
- `src/domain/common/units.js`
  - 単位換算・丸め・範囲判定。
- `src/domain/common/value-objects.js`
  - 年齢・性別・検査値のバリデーション型。

### 4. Infra（将来用）
- `src/infra/repository/input-snapshot-repository.js`
  - 入力履歴保存が必要になった場合の受け皿。

## 分割順序（安全な移行）
1. `calculateRenal` から pure function 化（引数: plain object, 戻り値: result object）。
2. `setMessages` 依存を renderer に隔離。
3. 同じ手順を liver/anemia へ展開。
4. 共通入力（age/sex/height/weight）を `PatientContext` DTO として usecase 層に統一。
5. 最後に build で単一 `Medicalc4.html` へバンドル（運用要件維持）。

## 設計上の注意
- DomainからDOM APIを参照しない。
- UseCaseはUIライブラリを知らず、入出力DTOだけを扱う。
- RendererでのみHTML文字列を扱い、XSS対策のため将来はテキストノード生成へ移行。

## 小さめ差分での作業分割提案（動作非破壊重視）

### PR-1: 事前ガード（挙動固定）
- 目的: 分割前後で結果が変わっていないことを確認できる状態を作る。
- 差分:
  - `docs/manual-test-checklist.md` を追加（各タブで代表入力と期待表示を記載）。
  - `Medcalc4.html` の既存関数・ID・表示文言は変更しない。
- 受け入れ条件:
  - 主要8タブで「入力→表示」が現状どおり。

### PR-2: Presentationユーティリティ抽出（純移設）
- 目的: GUI層の土台を先に分離。
- 差分:
  - `src/presentation/dom.js` に `getNum/getSelectValue/isChecked/$` を移設。
  - `src/presentation/renderers/message-renderer.js` に `setMessages` を移設。
  - `Medcalc4.html` 側は呼び出し先だけ差し替え（ロジック変更なし）。
- 受け入れ条件:
  - 出力HTML（`<p>...</p>` 列）が従来と一致。

### PR-3: Renalを最初の縦切りで分離
- 目的: 1セクションだけで UI→UseCase→Domain の流れを成立させる。
- 差分:
  - `src/domain/renal/renal-calculator.js`（純関数）
  - `src/usecase/renal/run-renal.js`（DTO組立・整形）
  - `src/presentation/renderers/renal-renderer.js`（表示）
  - `Medcalc4.html` の `calculateRenal` はFacade化（内部でusecase呼び出し）。
- 受け入れ条件:
  - 腎機能タブの全指標（eGFR/FENa/FEUN等）が完全一致。

### PR-4: 共通入力DTO導入（PatientContext）
- 目的: age/sex/height/weight の重複取得を整理。
- 差分:
  - `src/usecase/common/patient-context.js` 追加。
  - renal/liver/anemia で共通DTOを利用。
- 受け入れ条件:
  - 共通項目を変更した際に各タブ再計算が従来どおり発火。

### PR-5: Liver/Anemiaを同パターンで順次移行
- 目的: リスクの高い計算タブを1つずつ移す。
- 差分:
  - PRを分けて `liver` → `anemia` の順で移行。
- 受け入れ条件:
  - 移行対象外タブには触れない（影響範囲を限定）。

### PR-6: 残タブ移行 + エントリ整理
- 目的: 全タブの責務分離を完了。
- 差分:
  - glucose/lipid/uro/dateCalc/gamma を同様に移行。
  - `handlers` を usecase参照に統一。
- 受け入れ条件:
  - タブ切り替え・イベント委譲・薬剤選択連動が従来どおり。

### PR-7: ビルド統合（運用は単一HTML維持）
- 目的: 開発は分割、配布は単一HTMLを両立。
- 差分:
  - build手順（bundle/minify）を追加。
  - 生成物として `Medicalc4.html`（または現行命名）を出力。
- 受け入れ条件:
  - 生成HTML単体で現行と同等動作。

## 実務上のルール（各PR共通）
- 1PRあたり「1責務のみ」変更する（抽出・rename・計算変更を混在させない）。
- 医学的閾値や文言は移行PRでは変更しない（改善は別PR）。
- 先に pure function 化、次にDI、最後に最適化の順で進める。

export const UI_LANGUAGES = Object.freeze(['en', 'zh-Hant', 'ja']);

const MESSAGES = {
  en: {
    subtitle: 'Local Unicode text forensics. Detect invisible, format-control, confusable, and mixed-script text, then produce an auditable clean version.',
    privacy: 'Local only · text is not uploaded',
    drop: 'Drop .txt / .md / .markdown here, or choose Open file. Analysis stays in this browser.',
    original: 'Original text', clean: 'Clean version', reanalyze: 'Analyze again', copyClean: 'Copy clean text', downloadReport: 'Download JSON report', openFile: 'Open file', sample: 'Load sample',
    allFindings: 'All findings', highRisk: 'High risk', confusables: 'Confusables', mixedScripts: 'Mixed scripts', safeCleaning: 'Conservative cleaning', changed: 'Changed', noChange: 'No change',
    inlineMarkers: 'Inline forensic markers', inlineHelp: 'Invisible characters become visible markers. Confusables and mixed-script tokens keep their original text with annotations.',
    skeleton: 'Confusable skeleton', skeletonHelp: 'Known visually confusable Unicode is mapped to a UTS #39 skeleton for comparison.',
    changes: 'Change list', originalPosition: 'Original position', cleanPosition: 'Clean position', removed: 'Removed', added: 'Added', noChanges: 'No conservative-cleaning changes are required.',
    findings: 'Findings', severity: 'Severity', category: 'Category', position: 'Position', charType: 'Character / type', risk: 'Risk', reason: 'Reason', remediation: 'Remediation', noFindings: 'No findings match the current filters.',
    uiLanguage: 'UI language', analysisLanguage: 'Analysis language', all: 'All', copied: 'Clean text copied.', sampleMeta: 'Test sample',
    invalidFile: 'Workbench drag-and-drop accepts .txt / .md / .markdown only.', largeFile: 'Browser Workbench limit is 5 MiB per file. Use CLI --stream for large files.',
    shapingTitle: 'Legitimate invisible controls', shapingHelp: 'ZWNJ, ZWJ, bidi direction controls, variation selectors, and Unicode tag characters can carry legitimate shaping, layout, presentation, or standardized emoji semantics. Conservative cleaning preserves them by default while still reporting them as findings.',
    notice: 'Project Purify reports text-level Unicode evidence only. A finding can come from AI tools, websites, PDFs, typography, copy/paste, legitimate multilingual writing, or malicious text. A finding alone does not prove AI authorship.'
  },
  'zh-Hant': {
    subtitle: '本機 Unicode 文字鑑識。找出隱形、format-control、confusable 與 mixed-script 文字，並產生可審查的純淨版本。',
    privacy: 'Local only · 不上傳文字',
    drop: '拖放 .txt / .md / .markdown 到這裡，或按「開啟檔案」。分析只在目前瀏覽器完成。',
    original: '原始文字', clean: '純淨版本', reanalyze: '重新分析', copyClean: '複製純淨文字', downloadReport: '下載 JSON report', openFile: '開啟檔案', sample: '載入測試樣本',
    allFindings: '全部 findings', highRisk: 'High risk', confusables: 'Confusables', mixedScripts: 'Mixed scripts', safeCleaning: '保守清理', changed: '有變更', noChange: '無變更',
    inlineMarkers: 'Inline forensic markers', inlineHelp: '隱形字元會變成可見標記；confusable 與 mixed-script token 會保留原文並附上提示。',
    skeleton: 'Confusable skeleton', skeletonHelp: '將已知 visually confusable Unicode 映射為 UTS #39 skeleton，方便比較看似相同的字串。',
    changes: '變更清單', originalPosition: '原文位置', cleanPosition: '純淨版位置', removed: '移除', added: '加入', noChanges: '沒有需要保守清理的變更。',
    findings: 'Findings', severity: 'Severity', category: 'Category', position: '位置', charType: '字元 / 類型', risk: '風險', reason: '原因', remediation: '建議處理', noFindings: '沒有符合目前篩選條件的 findings。',
    uiLanguage: '介面語言', analysisLanguage: '分析語言', all: '全部', copied: '已複製純淨文字。', sampleMeta: '測試樣本',
    invalidFile: 'Workbench 拖放目前只接受 .txt / .md / .markdown。', largeFile: '瀏覽器 Workbench 單檔上限為 5 MiB；大型檔案請使用 CLI --stream。',
    shapingTitle: '合法的隱形控制字元', shapingHelp: 'ZWNJ、ZWJ、雙向文字方向控制、variation selector 與 Unicode tag character 都可能承載合法的 shaping、排版、字形呈現或標準 emoji 語義。保守清理預設保留它們，但仍會將它們列為 finding。',
    notice: 'Project Purify 只提供文字層級的 Unicode 證據。finding 可能來自 AI 工具、網站、PDF、排版、複製貼上、合法多語言文字或惡意內容；單一 finding 不能證明文字由 AI 生成。'
  },
  ja: {
    subtitle: 'ローカル Unicode テキスト・フォレンジクス。不可視文字、format-control、confusable、mixed-script を検出し、監査可能なクリーン版を作成します。',
    privacy: 'Local only · テキストは送信しません',
    drop: '.txt / .md / .markdown をここにドロップするか、「ファイルを開く」を選択してください。解析はブラウザ内で完結します。',
    original: '元のテキスト', clean: 'クリーン版', reanalyze: '再解析', copyClean: 'クリーン版をコピー', downloadReport: 'JSON report を保存', openFile: 'ファイルを開く', sample: 'サンプルを読み込む',
    allFindings: '全 findings', highRisk: 'High risk', confusables: 'Confusables', mixedScripts: 'Mixed scripts', safeCleaning: '保守的クリーニング', changed: '変更あり', noChange: '変更なし',
    inlineMarkers: 'Inline forensic markers', inlineHelp: '不可視文字を可視マーカーに置換します。confusable と mixed-script token は元の文字を残して注記します。',
    skeleton: 'Confusable skeleton', skeletonHelp: '既知の visually confusable Unicode を UTS #39 skeleton に変換して比較します。',
    changes: '変更一覧', originalPosition: '元の位置', cleanPosition: 'クリーン版の位置', removed: '削除', added: '追加', noChanges: '保守的クリーニングによる変更はありません。',
    findings: 'Findings', severity: 'Severity', category: 'Category', position: '位置', charType: '文字 / 種類', risk: 'リスク', reason: '理由', remediation: '推奨対応', noFindings: '現在のフィルターに一致する finding はありません。',
    uiLanguage: 'UI 言語', analysisLanguage: '解析言語', all: 'すべて', copied: 'クリーン版をコピーしました。', sampleMeta: 'テストサンプル',
    invalidFile: 'Workbench で読み込めるのは .txt / .md / .markdown のみです。', largeFile: 'Browser Workbench の上限は 1 ファイル 5 MiB です。大きなファイルは CLI --stream を使用してください。',
    shapingTitle: '正当な不可視制御文字', shapingHelp: 'ZWNJ、ZWJ、双方向テキストの方向制御、variation selector、Unicode tag character は、正当な shaping、レイアウト、表示、標準 emoji の意味に必要な場合があります。保守的クリーニングでは既定で保持し、finding としては引き続き報告します。',
    notice: 'Project Purify は文字レベルの Unicode 証拠のみを報告します。finding は AI、Web、PDF、組版、コピー＆ペースト、正当な多言語テキスト、悪意ある文字列などから生じます。単一の finding だけで AI 生成を証明することはできません。'
  }
};

export function getMessages(language = 'en') {
  return MESSAGES[UI_LANGUAGES.includes(language) ? language : 'en'];
}

export function translate(language, key) {
  return getMessages(language)[key] ?? MESSAGES.en[key] ?? key;
}

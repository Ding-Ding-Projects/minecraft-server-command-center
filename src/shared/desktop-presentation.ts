import type { UniversalLanguageMode, UniversalSettingsV1 } from "./universal-contracts";

type CopyVariants = readonly [string, string, string, string, string];

interface DesktopCopyDefinition {
  readonly english: CopyVariants;
  readonly cantonese: CopyVariants;
  readonly dialogEmoji?: string;
}

export const DESKTOP_PRESENTATION_KEYS = [
  "settings.eyebrow",
  "settings.title",
  "settings.schema",
  "settings.search.eyebrow",
  "settings.search.title",
  "settings.search.badge",
  "settings.search.placeholder",
  "settings.search.label",
  "settings.regex.button",
  "settings.regex.dialogLabel",
  "settings.regex.tokensLabel",
  "settings.regex.patternLabel",
  "settings.regex.placeholder",
  "settings.regex.start",
  "settings.regex.end",
  "settings.regex.letters",
  "settings.regex.group",
  "settings.regex.either",
  "settings.regex.oneOrMore",
  "settings.regex.ignoreCase",
  "settings.regex.plainStatus",
  "settings.regex.ready",
  "settings.regex.running",
  "settings.regex.invalid",
  "settings.language.title",
  "settings.language.description",
  "settings.language.option.english",
  "settings.language.option.cantonese",
  "settings.language.option.bilingual",
  "settings.englishFunny.title",
  "settings.englishFunny.description",
  "settings.cantoneseFunny.title",
  "settings.cantoneseFunny.description",
  "settings.emoji.title",
  "settings.emoji.description",
  "settings.emoji.toggle",
  "settings.displayName.title",
  "settings.displayName.description",
  "settings.school.title",
  "settings.school.description",
  "settings.school.toggle",
  "settings.personalVocabulary.eyebrow",
  "settings.personalVocabulary.title",
  "settings.personalVocabulary.description",
  "settings.personalVocabulary.privacy",
  "settings.personalVocabulary.status.empty",
  "settings.personalVocabulary.status.loaded",
  "settings.personalVocabulary.entryCount",
  "settings.personalVocabulary.choose",
  "settings.personalVocabulary.replace",
  "settings.personalVocabulary.clear",
  "settings.personalVocabulary.retry",
  "settings.personalVocabulary.notice.loaded",
  "settings.personalVocabulary.notice.rejected",
  "settings.personalVocabulary.notice.cleared",
  "settings.personalVocabulary.notice.clearFailed",
  "settings.personalVocabulary.notice.loadFailed",
  "settings.personalVocabulary.notice.cacheRemovalFailed",
  "settings.personalVocabulary.command.choose",
  "settings.personalVocabulary.command.chooseDescription",
  "settings.personalVocabulary.command.replace",
  "settings.personalVocabulary.command.replaceDescription",
  "settings.personalVocabulary.command.status",
  "settings.personalVocabulary.command.statusDescription",
  "settings.personalVocabulary.command.clear",
  "settings.personalVocabulary.command.clearDescription",
  "settings.personalVocabulary.command.retry",
  "settings.personalVocabulary.command.retryDescription",
  "settings.personalVocabulary.picker.title",
  "settings.personalVocabulary.picker.filter",
  "palette.eyebrow",
  "palette.title",
  "palette.help",
  "palette.close",
  "palette.search.label",
  "palette.search.placeholder",
  "palette.regex.dialogLabel",
  "palette.regex.tokensLabel",
  "palette.regex.patternLabel",
  "palette.regex.placeholder",
  "palette.regex.ignoreCase",
  "palette.regex.plainStatus",
  "palette.regex.ready",
  "palette.regex.running",
  "palette.regex.invalid",
  "palette.status.loading",
  "palette.status.available",
  "palette.status.empty",
  "palette.status.unavailable",
  "palette.results.label",
  "palette.command.docsSearch",
  "palette.command.docsSearchDescription",
  "palette.command.docsRegex",
  "palette.command.docsRegexDescription",
  "palette.command.settingsSearch",
  "palette.command.settingsSearchDescription",
  "palette.command.settingsRegex",
  "palette.command.settingsRegexDescription",
  "notifications.search.title",
  "notifications.search.label",
  "notifications.search.placeholder",
  "notifications.regex.dialogLabel",
  "notifications.regex.tokensLabel",
  "notifications.regex.patternLabel",
  "notifications.regex.placeholder",
  "notifications.regex.ignoreCase",
  "settings.appearance.title",
  "settings.appearance.description",
  "settings.appearance.theme",
  "settings.appearance.theme.dark",
  "settings.appearance.theme.light",
  "settings.appearance.density",
  "settings.appearance.density.comfortable",
  "settings.appearance.density.compact",
  "settings.appearance.accent",
  "settings.tabDock.title",
  "settings.tabDock.description",
  "settings.tabDock.select",
  "settings.tabDock.left",
  "settings.tabDock.right",
  "settings.tabDock.top",
  "settings.tabDock.bottom",
  "settings.actions.reset",
  "settings.footnote",
  "settings.status.loading",
  "settings.status.pending",
  "settings.status.saved",
  "settings.status.saveFailed",
  "settings.status.resetSaved",
  "settings.status.resetFailed",
  "settings.snackbar.saveFailed",
  "settings.snackbar.reset",
  "settings.snackbar.resetFailed",
  "startup.settingsReady",
  "startup.settingsDefaults",
  "notification.title",
] as const;

export type DesktopPresentationKey = (typeof DESKTOP_PRESENTATION_KEYS)[number];

const DESKTOP_COPY: Record<DesktopPresentationKey, DesktopCopyDefinition> = {
  "settings.eyebrow": {
    english: ["Local preferences", "Local preferences", "Local preferences, kept tidy", "Local preferences, no server drama", "Local preferences, still refusing server drama"],
    cantonese: ["本機偏好設定", "本機偏好設定", "本機偏好設定，整整齊齊", "本機偏好設定，唔使驚動伺服器", "本機偏好設定，伺服器想插嘴都冇門"],
  },
  "settings.title": {
    english: ["Universal settings foundation", "Universal settings foundation", "Universal settings, now with knobs", "Universal settings, knobs included", "Universal settings, the knob cabinet is open"],
    cantonese: ["通用設定基礎", "通用設定基礎", "通用設定，而家有掣可以撳", "通用設定，旋鈕已經開檔", "通用設定，掣櫃大門正式打開"],
  },
  "settings.schema": {
    english: ["Schema v1", "Schema v1", "Schema v1 · local", "Schema v1 · local only", "Schema v1 · local only, no cloud circus"],
    cantonese: ["Schema v1", "Schema v1", "Schema v1 · 本機", "Schema v1 · 只留本機", "Schema v1 · 只留本機，唔搞雲端馬戲"],
  },
  "settings.search.eyebrow": {
    english: ["Find a setting", "Find a setting", "Find a setting before it hides", "Find a setting, no treasure map needed", "Find a setting before it starts playing hide-and-seek"],
    cantonese: ["搵設定", "搵設定", "搵設定，唔使玩捉迷藏", "搵設定，唔使畫寶藏地圖", "搵設定，唔好俾佢玩失蹤"],
  },
  "settings.search.title": {
    english: ["Search this settings surface", "Search this settings surface", "Search this settings surface locally", "Search this settings surface without spelunking", "Search this settings surface; the settings are not allowed to vanish"],
    cantonese: ["搜尋呢個設定頁面", "搜尋呢個設定頁面", "本機搜尋呢個設定頁面", "搜尋呢個設定頁面，唔使落洞穴", "搜尋呢個設定頁面，設定唔准玩消失"],
  },
  "settings.search.badge": {
    english: ["Plain text by default", "Plain text by default", "Plain text first", "Plain text first; regex is opt-in", "Plain text first; regex only when you ask nicely"],
    cantonese: ["預設純文字", "預設純文字", "先用純文字", "先用純文字；Regex 要自己開", "先用純文字；Regex 要你親自請佢出場"],
  },
  "settings.search.placeholder": {
    english: ["Search language, tone, appearance…", "Search language, tone, appearance…", "Search language, tone, and appearance…", "Search language, tone, and appearance locally…", "Search language, tone, and appearance before the settings grow legs…"],
    cantonese: ["搜尋語言、語氣、外觀…", "搜尋語言、語氣、外觀…", "搜尋語言、語氣同外觀…", "本機搜尋語言、語氣同外觀…", "搜尋語言、語氣同外觀，趁設定未生腳走佬…"],
  },
  "settings.search.label": {
    english: ["Search universal settings", "Search universal settings", "Search universal settings locally", "Search universal settings on this surface", "Search universal settings before they start hiding"],
    cantonese: ["搜尋通用設定", "搜尋通用設定", "本機搜尋通用設定", "喺呢個頁面搜尋通用設定", "搜尋通用設定，趁佢哋未開始匿埋"],
  },
  "settings.regex.button": {
    english: ["Regex", "Regex", "Regex", "Regex builder", "Regex builder (local and bounded)"],
    cantonese: ["Regex", "Regex", "Regex", "Regex 建構器", "Regex 建構器（本機有界）"],
  },
  "settings.regex.dialogLabel": {
    english: ["Regex builder for universal settings", "Regex builder for universal settings", "Local Regex builder for universal settings", "Bounded local Regex builder for universal settings", "Bounded local Regex builder for universal settings; no runaway patterns"],
    cantonese: ["通用設定 Regex 建構器", "通用設定 Regex 建構器", "通用設定本機 Regex 建構器", "通用設定有界本機 Regex 建構器", "通用設定有界本機 Regex 建構器；唔俾模式失控"],
  },
  "settings.regex.tokensLabel": {
    english: ["Regex pattern shortcuts", "Regex pattern shortcuts", "Regex pattern shortcuts", "Bounded Regex pattern shortcuts", "Bounded Regex pattern shortcuts"],
    cantonese: ["Regex 模式快捷鍵", "Regex 模式快捷鍵", "Regex 模式快捷鍵", "有界 Regex 模式快捷鍵", "有界 Regex 模式快捷鍵"],
  },
  "settings.regex.patternLabel": {
    english: ["Bounded local pattern", "Bounded local pattern", "Bounded local pattern", "Bounded local pattern for this search", "Bounded local pattern; no runaway regex party"],
    cantonese: ["有界本機模式", "有界本機模式", "有界本機模式", "呢個搜尋用嘅有界本機模式", "有界本機模式；唔開 Regex 失控派對"],
  },
  "settings.regex.placeholder": {
    english: ["For example: ^Language", "For example: ^Language", "For example: ^Language", "For example: ^Language|Tone", "For example: ^Language|Tone (bounded)"],
    cantonese: ["例如：^Language", "例如：^Language", "例如：^Language", "例如：^Language|Tone", "例如：^Language|Tone（有界）"],
  },
  "settings.regex.start": {
    english: ["Start", "Start", "Start", "Start anchor", "Start anchor"],
    cantonese: ["開頭", "開頭", "開頭", "開頭錨點", "開頭錨點"],
  },
  "settings.regex.end": {
    english: ["End", "End", "End", "End anchor", "End anchor"],
    cantonese: ["結尾", "結尾", "結尾", "結尾錨點", "結尾錨點"],
  },
  "settings.regex.letters": {
    english: ["Letters", "Letters", "Letters", "Letters class", "Letters class"],
    cantonese: ["字母", "字母", "字母", "字母字元類別", "字母字元類別"],
  },
  "settings.regex.group": {
    english: ["Group", "Group", "Group", "Capture group", "Capture group"],
    cantonese: ["群組", "群組", "群組", "捕捉群組", "捕捉群組"],
  },
  "settings.regex.either": {
    english: ["Either", "Either", "Either", "Either option", "Either option"],
    cantonese: ["其一", "其一", "其一", "其一選項", "其一選項"],
  },
  "settings.regex.oneOrMore": {
    english: ["One or more", "One or more", "One or more", "One or more", "One or more"],
    cantonese: ["一個或以上", "一個或以上", "一個或以上", "一個或以上", "一個或以上"],
  },
  "settings.regex.ignoreCase": {
    english: ["Ignore case", "Ignore case", "Ignore letter case", "Ignore letter case", "Ignore letter case"],
    cantonese: ["忽略大小寫", "忽略大小寫", "忽略字母大小寫", "忽略字母大小寫", "忽略字母大小寫"],
  },
  "settings.regex.plainStatus": {
    english: ["Plain text search is active. Regex is an explicit local opt-in.", "Plain text search is active. Regex is an explicit local opt-in.", "Plain text search is active; Regex stays opt-in.", "Plain text search is active; Regex stays a bounded local opt-in.", "Plain text search is active; Regex waits politely for an explicit invitation."],
    cantonese: ["純文字搜尋已啟用；Regex 要明確喺本機開啟。", "純文字搜尋已啟用；Regex 要明確喺本機開啟。", "純文字搜尋已啟用；Regex 仍然要自己開。", "純文字搜尋已啟用；Regex 仍然係有界本機選擇。", "純文字搜尋已啟用；Regex 有禮貌咁等你明確邀請。"],
  },
  "settings.regex.ready": {
    english: ["Regex mode is ready. Add a bounded pattern or choose a token.", "Regex mode is ready. Add a bounded pattern or choose a token.", "Regex mode is ready; add a bounded pattern or choose a token.", "Regex mode is ready; add a bounded pattern or choose a token for this local surface.", "Regex mode is ready; feed it a bounded pattern before it starts making abstract art."],
    cantonese: ["Regex 模式準備好；加入有界模式或者揀一個字元。", "Regex 模式準備好；加入有界模式或者揀一個字元。", "Regex 模式準備好；加入有界模式或者揀一個字元。", "Regex 模式準備好；喺呢個本機頁面加入有界模式或者揀一個字元。", "Regex 模式準備好；俾佢食有界模式，唔好等佢畫抽象畫。"],
  },
  "settings.regex.running": {
    english: ["Pattern runs locally against this settings surface.", "Pattern runs locally against this settings surface.", "Pattern runs locally against this settings surface.", "Pattern runs locally against this settings surface; no network request is made.", "Pattern runs locally against this settings surface; no network request gets a backstage pass."],
    cantonese: ["模式會喺呢個設定頁面本機執行。", "模式會喺呢個設定頁面本機執行。", "模式會喺呢個設定頁面本機執行。", "模式會喺呢個設定頁面本機執行；唔會發出網絡請求。", "模式會喺呢個設定頁面本機執行；網絡請求冇後台通行證。"],
  },
  "settings.regex.invalid": {
    english: ["The local regex pattern is invalid.", "The local regex pattern is invalid.", "The local regex pattern is invalid for this search.", "The local regex pattern is invalid; fix it before filtering this surface.", "The local regex pattern is invalid; it tripped over its own brackets."],
    cantonese: ["本機 Regex 模式無效。", "本機 Regex 模式無效。", "呢個搜尋嘅本機 Regex 模式無效。", "本機 Regex 模式無效；修正後先可以篩選呢個頁面。", "本機 Regex 模式無效；佢俾自己啲括號絆倒咗。"],
  },
  "settings.language.title": {
    english: ["Language mode", "Language mode", "Language mode for this desktop", "Language mode for this desktop surface", "Language mode: tell the desktop which voice to wear"],
    cantonese: ["語言模式", "語言模式", "呢部桌面程式嘅語言模式", "呢個桌面頁面嘅語言模式", "語言模式：話俾桌面程式知今日講邊種口吻"],
  },
  "settings.language.description": {
    english: ["Choose English, playful Hong Kong-style Cantonese, or bilingual. The setting is local and persisted.", "Choose English, playful Hong Kong-style Cantonese, or bilingual. The choice stays local and persisted.", "Choose English, playful Hong Kong-style Cantonese, or bilingual. The desktop remembers it locally.", "Choose English, playful Hong Kong-style Cantonese, or bilingual. The desktop remembers it locally; no server action is involved.", "Choose English, playful Hong Kong-style Cantonese, or bilingual. The desktop remembers it locally, while the server sits safely out of this setting."],
    cantonese: ["選擇英文、玩味香港式廣東話，或者雙語。設定只留本機並會保存。", "選擇英文、玩味香港式廣東話，或者雙語。揀咗乜會留喺本機。", "選英文、玩味香港式廣東話，或者雙語；桌面程式會喺本機記住。", "選英文、玩味香港式廣東話，或者雙語；桌面程式會喺本機記住，唔會郁伺服器。", "選英文、玩味香港式廣東話，或者雙語；桌面程式本機記住，伺服器就乖乖坐喺旁邊。"],
  },
  "settings.language.option.english": {
    english: ["English", "English", "English", "English (straightforward)", "English (straightforward, jokes optional)"],
    cantonese: ["英文", "英文", "英文", "英文（直接講）", "英文（直接講，笑位自選）"],
  },
  "settings.language.option.cantonese": {
    english: ["Playful Hong Kong-style Cantonese", "Playful Hong Kong-style Cantonese", "Playful Hong Kong-style Cantonese", "Playful Hong Kong-style Cantonese (local voice)", "Playful Hong Kong-style Cantonese (local voice, no server required)"],
    cantonese: ["玩味香港式廣東話", "玩味香港式廣東話", "玩味香港式廣東話", "玩味香港式廣東話（本地口吻）", "玩味香港式廣東話（本地口吻，唔使伺服器幫手）"],
  },
  "settings.language.option.bilingual": {
    english: ["Bilingual", "Bilingual", "Bilingual", "Bilingual (English + Cantonese)", "Bilingual (English + Cantonese, double subtitles)"],
    cantonese: ["雙語", "雙語", "雙語", "雙語（英文＋廣東話）", "雙語（英文＋廣東話，字幕雙份）"],
  },
  "settings.englishFunny.title": {
    english: ["English funny level", "English funny level", "English funny level", "English funny level, independently adjustable", "English funny level, independently adjustable so jokes do not form a committee"],
    cantonese: ["英文搞笑程度", "英文搞笑程度", "英文搞笑程度", "英文搞笑程度，可獨立調校", "英文搞笑程度，可獨立調校，笑位唔使開會"],
  },
  "settings.englishFunny.description": {
    english: ["Styles English message voice from serious to maximum playful without changing facts.", "Styles English message voice from serious to maximum playful while keeping every fact.", "Styles English message voice from serious to maximum playful; facts stay put.", "Styles English message voice from serious to maximum playful; warnings keep their facts and options.", "Styles English message voice from serious to maximum playful; jokes may dance, facts remain seated."],
    cantonese: ["將英文訊息由認真至最玩味調校，但唔會改變事實。", "將英文訊息口吻由認真至最玩味調校，所有事實照舊。", "英文口吻由認真至最玩味；事實乖乖留低。", "英文口吻由認真至最玩味；警告嘅事實同選項唔會走樣。", "英文口吻由認真至最玩味；笑位可以跳舞，事實要坐定定。"],
  },
  "settings.cantoneseFunny.title": {
    english: ["Cantonese funny level", "Cantonese funny level", "Cantonese funny level", "Cantonese funny level, independently adjustable", "Cantonese funny level, independently adjustable so the joke meter has its own steering wheel"],
    cantonese: ["廣東話搞笑程度", "廣東話搞笑程度", "廣東話搞笑程度", "廣東話搞笑程度，可獨立調校", "廣東話搞笑程度，可獨立調校，笑位有自己個軚盤"],
  },
  "settings.cantoneseFunny.description": {
    english: ["Styles Cantonese message voice independently with the same factual-warning boundary.", "Styles Cantonese message voice independently; the factual-warning boundary stays fixed.", "Styles Cantonese message voice independently; facts and recovery choices stay clear.", "Styles Cantonese message voice independently; errors still say what happened and what to do.", "Styles Cantonese message voice independently; jokes can take the stage while facts and recovery choices stay clear."],
    cantonese: ["獨立調校廣東話訊息口吻，並保持事實警告界線。", "獨立調校廣東話訊息口吻；事實警告界線保持不變。", "獨立調校廣東話口吻；事實同補救選項照樣清楚。", "獨立調校廣東話口吻；出錯時仍然講清楚發生咩事同下一步。", "獨立調校廣東話口吻；笑位可以出場，事實同補救路線唔會走失。"],
  },
  "settings.emoji.title": {
    english: ["Dialog emoji decoration", "Dialog emoji decoration", "Dialog and message-box emoji", "Dialog and message-box emoji decoration", "Dialog and message-box emoji: tiny garnish, zero hidden meaning"],
    cantonese: ["對話框 emoji 裝飾", "對話框 emoji 裝飾", "對話框同訊息框 emoji", "對話框同訊息框 emoji 裝飾", "對話框同訊息框 emoji：少少配菜，絕不偷換意思"],
  },
  "settings.emoji.description": {
    english: ["Decorative emoji may appear in dialogs and message boxes; controls and accessible names stay factual.", "Decorative emoji may appear in dialogs and message boxes, never in control labels or accessible names.", "Decorative emoji may appear in dialogs and message boxes; buttons and accessible names remain emoji-free.", "Decorative emoji may appear in dialogs and message boxes; action labels and screen-reader names stay exact.", "Decorative emoji may appear in dialogs and message boxes; the controls keep their serious little nametags."],
    cantonese: ["對話框同訊息框可以有裝飾 emoji；控制項同無障礙名稱保持事實清楚。", "對話框同訊息框可以有裝飾 emoji，但唔會放入控制項標籤或無障礙名稱。", "對話框同訊息框可以有裝飾 emoji；掣同讀屏名稱唔會有 emoji。", "對話框同訊息框可以有裝飾 emoji；動作標籤同讀屏名稱保持原意。", "對話框同訊息框可以有裝飾 emoji；控制項繼續戴住佢哋認真嘅名牌。"],
  },
  "settings.emoji.toggle": {
    english: ["Show emojis", "Show emojis", "Show emojis in dialogs and message boxes", "Show emojis in dialogs and message boxes", "Show emojis in dialogs and message boxes (decorative only)"],
    cantonese: ["顯示 emoji", "顯示 emoji", "喺對話框同訊息框顯示 emoji", "喺對話框同訊息框顯示 emoji", "喺對話框同訊息框顯示 emoji（只作裝飾）"],
  },
  "settings.displayName.title": {
    english: ["Application display name", "Application display name", "Application display name", "Application display name (presentation only)", "Application display name (a label, not an identity transplant)"],
    cantonese: ["應用程式顯示名稱", "應用程式顯示名稱", "應用程式顯示名稱", "應用程式顯示名稱（只改顯示）", "應用程式顯示名稱（改名牌，唔換身份證）"],
  },
  "settings.displayName.description": {
    english: ["Changes the visible label only; installed identity and data location remain constant.", "Changes the visible label only; installed identity and data location do not move.", "Changes the visible label only; package identity and data location stay fixed.", "Changes the visible label only; package identity, executable name, and data location stay fixed.", "Changes the visible label only; the package identity and data home stay put, like sensible furniture."],
    cantonese: ["只改畫面顯示名稱；安裝身份同資料位置保持不變。", "只改畫面顯示名稱；安裝身份同資料位置唔會搬屋。", "只改畫面顯示名稱；套件身份同資料位置固定不變。", "只改畫面顯示名稱；套件身份、執行檔名稱同資料位置都唔會郁。", "只改畫面顯示名稱；套件身份同資料屋企原地坐低，唔會亂搬。"],
  },
  "settings.school.title": {
    english: ["School mode name", "School mode name", "School mode name", "School mode name and focus switch", "School mode name and focus switch, kept in its own lane"],
    cantonese: ["專注模式名稱", "專注模式名稱", "專注模式名稱", "專注模式名稱同專注開關", "專注模式名稱同專注開關，各行各路"],
  },
  "settings.school.description": {
    english: ["Rename the focus setting. Its unlock value is not stored in this preference file.", "Rename the focus setting; its unlock value stays out of this preference file.", "Rename the focus setting; credentials stay outside this preference record.", "Rename the focus setting; the unlock credential is not copied into this local settings JSON.", "Rename the focus setting; the unlock credential stays out of this JSON, because secrets dislike sightseeing."],
    cantonese: ["重新命名專注設定；解鎖值唔會儲喺呢份偏好檔案。", "重新命名專注設定；解鎖值留喺偏好檔案之外。", "重新命名專注設定；憑證唔會放入呢份設定記錄。", "重新命名專注設定；解鎖憑證唔會複製入本機設定 JSON。", "重新命名專注設定；解鎖憑證唔會入 JSON，秘密唔需要周圍觀光。"],
  },
  "settings.school.toggle": {
    english: ["Enable focus mode", "Enable focus mode", "Enable the focus setting", "Enable the focus setting", "Enable the focus setting; the label remains yours to rename"],
    cantonese: ["啟用專注模式", "啟用專注模式", "啟用專注設定", "啟用專注設定", "啟用專注設定；個名由你改"],
  },
  "settings.personalVocabulary.eyebrow": {
    english: ["Private local vocabulary", "Private local vocabulary", "Private local vocabulary, kept on this computer", "Private local vocabulary, no server detour", "Private local vocabulary, the server did not get an invitation"],
    cantonese: ["本機私人詞彙", "本機私人詞彙", "本機私人詞彙，留喺呢部電腦", "本機私人詞彙，唔繞去伺服器", "本機私人詞彙，伺服器今次冇收到請柬"],
  },
  "settings.personalVocabulary.title": {
    english: ["Upload a local JSON vocabulary file", "Upload a local JSON vocabulary file", "Upload a local JSON vocabulary file for this desktop", "Upload a local JSON vocabulary file; validation comes first", "Upload a local JSON vocabulary file; the bytes must pass the bouncer"],
    cantonese: ["上載本機 JSON 詞彙檔案", "上載本機 JSON 詞彙檔案", "為呢個桌面上載本機 JSON 詞彙檔案", "上載本機 JSON 詞彙檔案；先驗證先改字", "上載本機 JSON 詞彙檔案；啲 bytes 要先過門口"],
  },
  "settings.personalVocabulary.description": {
    english: ["Choose a bounded JSON file. It is validated locally before the cache or displayed wording changes.", "Choose a bounded JSON file. Local validation happens before the cache or displayed wording changes.", "Choose a bounded JSON file; invalid input leaves the current wording alone.", "Choose a bounded JSON file; the whole payload must pass before any wording changes.", "Choose a bounded JSON file; the whole payload gets checked before the wording puts on a new hat."],
    cantonese: ["揀一份有界 JSON 檔案；本機驗證完成前，快取同顯示文字都唔會改。", "揀一份有界 JSON 檔案；本機驗證會先行，快取同顯示文字保持原樣。", "揀一份有界 JSON 檔案；輸入無效就保留目前文字。", "揀一份有界 JSON 檔案；完整 payload 通過前，任何文字都唔會改。", "揀一份有界 JSON 檔案；完整 payload 要先驗身，文字先至可以換新帽。"],
  },
  "settings.personalVocabulary.privacy": {
    english: ["File bytes, paths, and entries stay in the local cache; this settings record stores status and count only.", "File bytes, paths, and entries stay local; the settings record keeps status and count only.", "The cache stays local, while settings keep only its status and count.", "The app does not send the file, path, or entries anywhere; this record keeps status and count only.", "The file stays home, the path stays quiet, and this record keeps only status and count."],
    cantonese: ["檔案 bytes、路徑同項目留喺本機快取；呢份設定記錄只保存狀態同數量。", "檔案 bytes、路徑同項目只留本機；設定記錄只保留狀態同數量。", "快取留喺本機，設定記錄只保留狀態同數量。", "程式唔會將檔案、路徑或項目送去任何地方；呢份記錄只保留狀態同數量。", "檔案留屋企、路徑保持安靜，呢份記錄只帶住狀態同數量。"],
  },
  "settings.personalVocabulary.status.empty": {
    english: ["No local vocabulary file is active.", "No local vocabulary file is active.", "No local vocabulary file is active yet.", "No local vocabulary file is active; original shipped wording remains.", "No local vocabulary file is active; the original wording is still wearing its first-day outfit."],
    cantonese: ["未有本機詞彙檔案啟用。", "未有本機詞彙檔案啟用。", "暫時未有本機詞彙檔案啟用。", "未有本機詞彙檔案啟用；原本出廠文字保持原樣。", "未有本機詞彙檔案啟用；原本文字仲著住出廠第一日套衫。"],
  },
  "settings.personalVocabulary.status.loaded": {
    english: ["A validated local vocabulary file is active.", "A validated local vocabulary file is active.", "A validated local vocabulary file is active locally.", "A validated local vocabulary file is active; wording changes stay local.", "A validated local vocabulary file is active; the wording has received its tiny local makeover."],
    cantonese: ["已啟用通過驗證嘅本機詞彙檔案。", "已啟用通過驗證嘅本機詞彙檔案。", "已喺本機啟用通過驗證嘅詞彙檔案。", "已啟用通過驗證嘅本機詞彙檔案；文字變更只留本機。", "已啟用通過驗證嘅本機詞彙檔案；文字換咗件細細件本機外套。"],
  },
  "settings.personalVocabulary.entryCount": {
    english: ["entries loaded", "entries loaded", "entries loaded locally", "entries loaded locally", "entries loaded locally, all accounted for"],
    cantonese: ["個項目已載入", "個項目已載入", "個項目已喺本機載入", "個項目已喺本機載入，數量清楚", "個項目已喺本機載入，粒粒有數"],
  },
  "settings.personalVocabulary.choose": {
    english: ["Choose local JSON file", "Choose local JSON file", "Choose a local JSON file", "Choose a local JSON file to validate", "Choose a local JSON file; let the validator have a look"],
    cantonese: ["揀本機 JSON 檔案", "揀本機 JSON 檔案", "揀一份本機 JSON 檔案", "揀一份本機 JSON 檔案去驗證", "揀一份本機 JSON 檔案，等驗證員望一望"],
  },
  "settings.personalVocabulary.replace": {
    english: ["Replace local JSON file", "Replace local JSON file", "Replace the local JSON file", "Replace the local JSON file after validation", "Replace the local JSON file; the old cache gets a tidy handover"],
    cantonese: ["更換本機 JSON 檔案", "更換本機 JSON 檔案", "更換本機 JSON 檔案", "驗證後更換本機 JSON 檔案", "更換本機 JSON 檔案；舊快取有交接，唔會突然失蹤"],
  },
  "settings.personalVocabulary.clear": {
    english: ["Clear local vocabulary", "Clear local vocabulary", "Clear the local vocabulary cache", "Clear the local vocabulary cache and restore original wording", "Clear the local vocabulary cache; the original wording gets its encore"],
    cantonese: ["清除本機詞彙", "清除本機詞彙", "清除本機詞彙快取", "清除本機詞彙快取並恢復原本文字", "清除本機詞彙快取；原本文字返場 encore"],
  },
  "settings.personalVocabulary.retry": {
    english: ["Retry cache cleanup", "Retry cache cleanup", "Retry malformed-cache cleanup", "Retry removing the malformed local cache", "Retry cache cleanup; the stubborn bytes get one more exit interview"],
    cantonese: ["重試清理快取", "重試清理快取", "重試清理格式錯誤快取", "重試移除格式錯誤嘅本機快取", "重試清理快取；頑固 bytes 再做一次離場面談"],
  },
  "settings.personalVocabulary.notice.loaded": {
    english: ["The complete bounded JSON file passed local validation and is now active. Displayed wording changed only after validation.", "The complete bounded JSON file passed local validation and is now active. Wording changed only after validation.", "The bounded JSON file passed locally and is now active; invalid input could not sneak through.", "The complete bounded JSON file passed local validation and is active; displayed wording changed only after the full check.", "The complete bounded JSON file passed local validation and is active; the wording waited politely until the whole check finished."],
    cantonese: ["完整有界 JSON 檔案通過本機驗證，現在已啟用。顯示文字只喺驗證後改變。", "完整有界 JSON 檔案通過本機驗證，現在已啟用。文字只喺驗證後改變。", "有界 JSON 檔案通過本機驗證並已啟用；無效輸入冇機會偷偷入場。", "完整有界 JSON 檔案通過本機驗證並已啟用；顯示文字等完整檢查後先改。", "完整有界 JSON 檔案通過本機驗證並已啟用；文字好有禮貌咁等完整檢查做完先換衫。"],
    dialogEmoji: "✅",
  },
  "settings.personalVocabulary.notice.rejected": {
    english: ["The selected file was not applied. It did not satisfy the bounded v1 JSON contract, so the previous cache and wording remain active.", "The selected file was not applied. It did not satisfy the bounded v1 JSON contract, so the previous cache and wording remain active.", "The selected file stayed out: the bounded v1 JSON contract was not satisfied, so nothing partially applied.", "The selected file was rejected before application; the previous cache and wording remain active.", "The selected file was rejected before application; the old cache keeps the wording from doing a surprise costume change."],
    cantonese: ["所選檔案未有套用。佢唔符合有界 v1 JSON 合約，所以之前嘅快取同文字仍然啟用。", "所選檔案未有套用。佢唔符合有界 v1 JSON 合約，所以之前嘅快取同文字保持原樣。", "所選檔案留喺門外：未符合有界 v1 JSON 合約，冇任何部分會偷偷套用。", "所選檔案喺套用前已拒絕；之前嘅快取同文字仍然啟用。", "所選檔案喺套用前已拒絕；舊快取幫文字避過一場突然換衫。"],
    dialogEmoji: "⚠️",
  },
  "settings.personalVocabulary.notice.cleared": {
    english: ["The local vocabulary cache was removed. Original shipped wording is active again.", "The local vocabulary cache was removed. Original shipped wording is active again.", "The local vocabulary cache was removed; original wording is back.", "The local vocabulary cache was removed and original shipped wording is active again.", "The local vocabulary cache was removed; original shipped wording has returned for its encore."],
    cantonese: ["本機詞彙快取已移除。原本出廠文字再次啟用。", "本機詞彙快取已移除。原本出廠文字再次啟用。", "本機詞彙快取已移除；原本文字返嚟喇。", "本機詞彙快取已移除，原本出廠文字再次啟用。", "本機詞彙快取已移除；原本出廠文字返場 encore。"],
    dialogEmoji: "🔄",
  },
  "settings.personalVocabulary.notice.clearFailed": {
    english: ["The local vocabulary cache could not be removed. The active cache and wording remain unchanged.", "The local vocabulary cache could not be removed. The active cache and wording remain unchanged.", "The local vocabulary cache could not be removed; the active wording stays put.", "The local vocabulary cache could not be removed, so the active cache and wording remain unchanged.", "The local vocabulary cache could not be removed; the cache declined its tidy exit and the wording stays put."],
    cantonese: ["本機詞彙快取未能移除。啟用中嘅快取同文字保持不變。", "本機詞彙快取未能移除。啟用中嘅快取同文字保持不變。", "本機詞彙快取未能移除；目前文字留返原位。", "本機詞彙快取未能移除，所以啟用中嘅快取同文字保持不變。", "本機詞彙快取未能移除；快取唔肯整齊退場，文字照樣留位。"],
    dialogEmoji: "⚠️",
  },
  "settings.personalVocabulary.notice.loadFailed": {
    english: ["The local vocabulary cache could not be restored. Original shipped wording remains active.", "The local vocabulary cache could not be restored. Original shipped wording remains active.", "The local vocabulary cache could not be restored; original wording remains active.", "The local vocabulary cache could not be restored, so original shipped wording remains active.", "The local vocabulary cache could not be restored; original shipped wording keeps the microphone."],
    cantonese: ["本機詞彙快取未能恢復。原本出廠文字保持啟用。", "本機詞彙快取未能恢復。原本出廠文字保持啟用。", "本機詞彙快取未能恢復；原本文字保持啟用。", "本機詞彙快取未能恢復，所以原本出廠文字保持啟用。", "本機詞彙快取未能恢復；原本出廠文字繼續拎住咪高峰。"],
    dialogEmoji: "⚠️",
  },
  "settings.personalVocabulary.notice.cacheRemovalFailed": {
    english: ["The malformed local vocabulary cache could not be removed. Original shipped wording is active and the persisted status is reset to empty.", "The malformed local vocabulary cache could not be removed. Original shipped wording is active and the persisted status is reset to empty.", "The malformed local vocabulary cache could not be removed; original wording is active and the status is empty.", "The malformed local vocabulary cache could not be removed, so original shipped wording is active and the persisted status is reset to empty.", "The malformed local vocabulary cache could not be removed; original wording is back and the status has been sent home empty-handed."],
    cantonese: ["格式錯誤嘅本機詞彙快取未能移除。原本出廠文字已啟用，儲存狀態已重設為空。", "格式錯誤嘅本機詞彙快取未能移除。原本出廠文字已啟用，儲存狀態已重設為空。", "格式錯誤嘅本機詞彙快取未能移除；原本文字啟用中，狀態係空。", "格式錯誤嘅本機詞彙快取未能移除，所以原本出廠文字已啟用，儲存狀態已重設為空。", "格式錯誤嘅本機詞彙快取未能移除；原本文字返場，狀態就兩手空空咁返屋企。"],
    dialogEmoji: "⚠️",
  },
  "settings.personalVocabulary.command.choose": {
    english: ["Choose local vocabulary JSON", "Choose local vocabulary JSON", "Choose local vocabulary JSON", "Choose local vocabulary JSON file", "Choose local vocabulary JSON; the validator is ready"],
    cantonese: ["揀本機詞彙 JSON", "揀本機詞彙 JSON", "揀本機詞彙 JSON", "揀本機詞彙 JSON 檔案", "揀本機詞彙 JSON；驗證員準備好喇"],
  },
  "settings.personalVocabulary.command.chooseDescription": {
    english: ["Open Settings and focus the local JSON picker.", "Open Settings and focus the local JSON picker.", "Open Settings and focus the bounded local JSON picker.", "Open Settings and focus the picker before validation changes anything.", "Open Settings and focus the picker; the bytes get checked before they join the party."],
    cantonese: ["開啟設定並聚焦本機 JSON 揀檔掣。", "開啟設定並聚焦本機 JSON 揀檔掣。", "開啟設定並聚焦有界本機 JSON 揀檔掣。", "開啟設定並聚焦揀檔掣，驗證前唔會改任何文字。", "開啟設定並聚焦揀檔掣；啲 bytes 要驗身先可以入場。"],
  },
  "settings.personalVocabulary.command.replace": {
    english: ["Replace local vocabulary JSON", "Replace local vocabulary JSON", "Replace local vocabulary JSON", "Replace local vocabulary JSON after validation", "Replace local vocabulary JSON; the cache gets a new understudy"],
    cantonese: ["更換本機詞彙 JSON", "更換本機詞彙 JSON", "更換本機詞彙 JSON", "驗證後更換本機詞彙 JSON", "更換本機詞彙 JSON；快取搵到新替身"],
  },
  "settings.personalVocabulary.command.replaceDescription": {
    english: ["Open Settings and focus the replace control without exposing the file path.", "Open Settings and focus the replace control without exposing the file path.", "Open Settings and focus the local replace control; the path stays privileged.", "Open Settings and focus the replace control; the complete file is checked first.", "Open Settings and focus replace; the file path stays backstage where it belongs."],
    cantonese: ["開啟設定並聚焦更換掣，唔會暴露檔案路徑。", "開啟設定並聚焦更換掣，唔會暴露檔案路徑。", "開啟設定並聚焦本機更換掣；路徑留喺特權邊界。", "開啟設定並聚焦更換掣；完整檔案會先驗證。", "開啟設定並聚焦更換掣；檔案路徑留喺後台，應有咁嘅禮貌。"],
  },
  "settings.personalVocabulary.command.status": {
    english: ["Review local vocabulary status", "Review local vocabulary status", "Review local vocabulary status", "Review local vocabulary status and entry count", "Review local vocabulary status; the tiny counter is on duty"],
    cantonese: ["查看本機詞彙狀態", "查看本機詞彙狀態", "查看本機詞彙狀態", "查看本機詞彙狀態同項目數量", "查看本機詞彙狀態；細細個計數員當值中"],
  },
  "settings.personalVocabulary.command.statusDescription": {
    english: ["Open Settings and focus the accessible local status.", "Open Settings and focus the accessible local status.", "Open Settings and focus the local vocabulary status.", "Open Settings and focus status without exposing file bytes or paths.", "Open Settings and focus status; the file itself stays off the stage."],
    cantonese: ["開啟設定並聚焦可存取嘅本機狀態。", "開啟設定並聚焦可存取嘅本機狀態。", "開啟設定並聚焦本機詞彙狀態。", "開啟設定並聚焦狀態，唔會暴露檔案 bytes 或路徑。", "開啟設定並聚焦狀態；檔案本身唔使上台。"],
  },
  "settings.personalVocabulary.command.clear": {
    english: ["Clear local vocabulary cache", "Clear local vocabulary cache", "Clear local vocabulary cache", "Clear local vocabulary cache and restore original wording", "Clear local vocabulary cache; let the original wording take the encore"],
    cantonese: ["清除本機詞彙快取", "清除本機詞彙快取", "清除本機詞彙快取", "清除本機詞彙快取並恢復原本文字", "清除本機詞彙快取；等原本文字返場 encore"],
  },
  "settings.personalVocabulary.command.clearDescription": {
    english: ["Open Settings and focus the clear control; it never runs from the palette.", "Open Settings and focus the clear control; it never runs from the palette.", "Open Settings and focus the clear control for an explicit local action.", "Open Settings and focus clear; a deliberate click is still required.", "Open Settings and focus clear; the palette points, the user decides."],
    cantonese: ["開啟設定並聚焦清除掣；唔會由命令面板直接執行。", "開啟設定並聚焦清除掣；唔會由命令面板直接執行。", "開啟設定並聚焦清除掣，明確進行本機動作。", "開啟設定並聚焦清除掣；仍然要用戶刻意撳掣。", "開啟設定並聚焦清除掣；命令面板只指路，用戶先決定。"],
  },
  "settings.personalVocabulary.command.retry": {
    english: ["Retry local vocabulary cleanup", "Retry local vocabulary cleanup", "Retry local vocabulary cleanup", "Retry removing the malformed local cache", "Retry local vocabulary cleanup; give the cache one last polite nudge"],
    cantonese: ["重試本機詞彙清理", "重試本機詞彙清理", "重試本機詞彙清理", "重試移除格式錯誤嘅本機快取", "重試本機詞彙清理；再客氣咁推快取一把"],
  },
  "settings.personalVocabulary.command.retryDescription": {
    english: ["Open Settings and focus the direct cache-cleanup retry.", "Open Settings and focus the direct cache-cleanup retry.", "Open Settings and focus the retry without changing wording until removal succeeds.", "Open Settings and retry cleanup; persisted status changes only after removal succeeds.", "Open Settings and retry cleanup; the stubborn cache must actually leave before the status changes."],
    cantonese: ["開啟設定並聚焦直接清理快取重試掣。", "開啟設定並聚焦直接清理快取重試掣。", "開啟設定並聚焦重試；移除成功前唔會改文字。", "開啟設定並重試清理；移除成功後先改儲存狀態。", "開啟設定並重試清理；快取真係離場先至改狀態，唔玩假動作。"],
  },
  "settings.personalVocabulary.picker.title": {
    english: ["Choose local personal vocabulary JSON", "Choose local personal vocabulary JSON", "Choose a local personal vocabulary JSON file", "Choose a bounded local personal vocabulary JSON file", "Choose a bounded local personal vocabulary JSON file; the bytes stay backstage"],
    cantonese: ["選擇本機個人詞彙 JSON", "選擇本機個人詞彙 JSON", "選擇本機個人詞彙 JSON 檔案", "選擇有界本機個人詞彙 JSON 檔案", "選擇有界本機個人詞彙 JSON 檔案；bytes 留喺後台"],
  },
  "settings.personalVocabulary.picker.filter": {
    english: ["Personal vocabulary JSON", "Personal vocabulary JSON", "Local personal vocabulary JSON", "Bounded local personal vocabulary JSON", "Bounded local personal vocabulary JSON; no mystery formats"],
    cantonese: ["個人詞彙 JSON", "個人詞彙 JSON", "本機個人詞彙 JSON", "有界本機個人詞彙 JSON", "有界本機個人詞彙 JSON；唔玩神秘格式"],
  },
  "palette.eyebrow": {
    english: ["Desktop navigation", "Desktop navigation", "Desktop navigation, locally", "Desktop navigation without hidden controls", "Desktop navigation; every result must earn its spotlight"],
    cantonese: ["桌面導覽", "桌面導覽", "本機桌面導覽", "桌面導覽，唔會推隱藏掣出場", "桌面導覽；每個結果都要真係有得撳"],
  },
  "palette.title": {
    english: ["Command palette", "Command palette", "Command palette", "Command palette for available desktop actions", "Command palette; no phantom buttons allowed"],
    cantonese: ["命令面板", "命令面板", "命令面板", "可用桌面動作命令面板", "命令面板；唔准幽靈掣冒牌"],
  },
  "palette.help": {
    english: ["Press Ctrl+Shift+F anywhere to reopen this palette. Results include only available desktop search surfaces and controls.", "Press Ctrl+Shift+F anywhere to reopen this palette. Results include only available desktop search surfaces and controls.", "Press Ctrl+Shift+F anywhere to reopen this palette. Hidden, filtered, and disabled controls stay out.", "Press Ctrl+Shift+F anywhere to reopen this palette. School mode and actual control state decide what appears.", "Press Ctrl+Shift+F anywhere to reopen this palette. If a control is hiding or disabled, the palette politely leaves it backstage."],
    cantonese: ["喺任何地方按 Ctrl+Shift+F 再開呢個面板；結果只包括可用嘅桌面搜尋頁面同控制項。", "喺任何地方按 Ctrl+Shift+F 再開呢個面板；結果只包括可用嘅桌面搜尋頁面同控制項。", "喺任何地方按 Ctrl+Shift+F 再開呢個面板；隱藏、篩走同停用嘅掣唔會出場。", "喺任何地方按 Ctrl+Shift+F 再開呢個面板；School mode 同實際控制狀態決定顯示乜。", "喺任何地方按 Ctrl+Shift+F 再開呢個面板；掣匿埋或者停用，面板就有禮貌咁留佢喺後台。"],
  },
  "palette.close": {
    english: ["Close", "Close", "Close palette", "Close command palette", "Close command palette; the controls remain where they were"],
    cantonese: ["關閉", "關閉", "關閉面板", "關閉命令面板", "關閉命令面板；控制項照樣留返原位"],
  },
  "palette.search.label": {
    english: ["Search desktop commands", "Search desktop commands", "Search available desktop commands", "Search available desktop commands locally", "Search available desktop commands before they start playing hide-and-seek"],
    cantonese: ["搜尋桌面命令", "搜尋桌面命令", "搜尋可用桌面命令", "本機搜尋可用桌面命令", "搜尋可用桌面命令，趁佢哋未玩捉迷藏"],
  },
  "palette.search.placeholder": {
    english: ["Search Docs or settings…", "Search Docs or settings…", "Search Docs or settings locally…", "Search available Docs or settings…", "Search available Docs or settings; invisible controls get no invitation…"],
    cantonese: ["搜尋文件或設定…", "搜尋文件或設定…", "本機搜尋文件或設定…", "搜尋可用文件或設定…", "搜尋可用文件或設定；匿埋嘅掣冇邀請函…"],
  },
  "palette.regex.dialogLabel": {
    english: ["Regex builder for desktop commands", "Regex builder for desktop commands", "Local Regex builder for desktop commands", "Bounded local Regex builder for desktop commands", "Bounded local Regex builder for desktop commands; no runaway patterns"],
    cantonese: ["桌面命令 Regex 建構器", "桌面命令 Regex 建構器", "桌面命令本機 Regex 建構器", "桌面命令有界本機 Regex 建構器", "桌面命令有界本機 Regex 建構器；唔俾模式失控"],
  },
  "palette.regex.tokensLabel": {
    english: ["Command palette regex pattern shortcuts", "Command palette regex pattern shortcuts", "Command palette Regex shortcuts", "Bounded command palette Regex shortcuts", "Bounded command palette Regex shortcuts; tiny buttons, sensible patterns"],
    cantonese: ["命令面板 Regex 模式快捷鍵", "命令面板 Regex 模式快捷鍵", "命令面板 Regex 快捷鍵", "有界命令面板 Regex 快捷鍵", "有界命令面板 Regex 快捷鍵；掣細細，模式要醒目"],
  },
  "palette.regex.patternLabel": {
    english: ["Bounded local pattern", "Bounded local pattern", "Bounded local pattern", "Bounded local pattern for available commands", "Bounded local pattern; no runaway regex party"],
    cantonese: ["有界本機模式", "有界本機模式", "有界本機模式", "可用命令用嘅有界本機模式", "有界本機模式；唔開 Regex 失控派對"],
  },
  "palette.regex.placeholder": {
    english: ["For example: ^Open|Search", "For example: ^Open|Search", "For example: ^Open|Search", "For example: ^Open|Search (bounded)", "For example: ^Open|Search; bounded means the regex behaves"],
    cantonese: ["例如：^Open|Search", "例如：^Open|Search", "例如：^Open|Search", "例如：^Open|Search（有界）", "例如：^Open|Search；有界先至唔會玩失控"],
  },
  "palette.regex.ignoreCase": {
    english: ["Ignore case", "Ignore case", "Ignore letter case", "Ignore letter case locally", "Ignore letter case; let capitals take a day off"],
    cantonese: ["忽略大小寫", "忽略大小寫", "忽略字母大小寫", "本機忽略字母大小寫", "忽略字母大小寫；大細階今日放假"],
  },
  "palette.regex.plainStatus": {
    english: ["Plain text search is active. Regex is an explicit local opt-in.", "Plain text search is active. Regex is an explicit local opt-in.", "Plain text search is active; Regex stays opt-in.", "Plain text search is active; Regex stays a bounded local opt-in.", "Plain text search is active; Regex waits politely for an explicit invitation."],
    cantonese: ["純文字搜尋已啟用；Regex 要明確喺本機開啟。", "純文字搜尋已啟用；Regex 要明確喺本機開啟。", "純文字搜尋已啟用；Regex 仍然要自己開。", "純文字搜尋已啟用；Regex 仍然係有界本機選擇。", "純文字搜尋已啟用；Regex 有禮貌咁等你明確邀請。"],
  },
  "palette.regex.ready": {
    english: ["Regex mode is ready. Add a bounded pattern or choose a token.", "Regex mode is ready. Add a bounded pattern or choose a token.", "Regex mode is ready; add a bounded pattern or choose a token.", "Regex mode is ready; add a bounded pattern or choose a token for available commands.", "Regex mode is ready; feed it a bounded pattern before it starts making abstract art."],
    cantonese: ["Regex 模式準備好；加入有界模式或者揀一個字元。", "Regex 模式準備好；加入有界模式或者揀一個字元。", "Regex 模式準備好；加入有界模式或者揀一個字元。", "Regex 模式準備好；喺可用命令加入有界模式或者揀一個字元。", "Regex 模式準備好；俾佢食有界模式，唔好等佢畫抽象畫。"],
  },
  "palette.regex.running": {
    english: ["Pattern runs locally against available desktop commands.", "Pattern runs locally against available desktop commands.", "Pattern runs locally against available desktop commands.", "Pattern runs locally against available desktop commands; no network request is made.", "Pattern runs locally against available desktop commands; no network request gets a backstage pass."],
    cantonese: ["模式會喺可用桌面命令度本機執行。", "模式會喺可用桌面命令度本機執行。", "模式會喺可用桌面命令度本機執行。", "模式會喺可用桌面命令度本機執行；唔會發出網絡請求。", "模式會喺可用桌面命令度本機執行；網絡請求冇後台通行證。"],
  },
  "palette.regex.invalid": {
    english: ["The local regex pattern is invalid.", "The local regex pattern is invalid.", "The local regex pattern is invalid for this search.", "The local regex pattern is invalid; fix it before filtering commands.", "The local regex pattern is invalid; it tripped over its own brackets."],
    cantonese: ["本機 Regex 模式無效。", "本機 Regex 模式無效。", "呢個搜尋嘅本機 Regex 模式無效。", "本機 Regex 模式無效；修正後先可以篩選命令。", "本機 Regex 模式無效；佢俾自己啲括號絆倒咗。"],
  },
  "palette.status.loading": {
    english: ["Loading available desktop search surfaces…", "Loading available desktop search surfaces…", "Loading available desktop search surfaces locally…", "Checking actual visibility and enabled state…", "Checking actual visibility and enabled state; phantom controls stay outside…"],
    cantonese: ["載入可用桌面搜尋頁面中…", "載入可用桌面搜尋頁面中…", "本機載入可用桌面搜尋頁面中…", "檢查實際可見同啟用狀態中…", "檢查實際可見同啟用狀態中；幽靈控制項留喺門外…"],
  },
  "palette.status.available": {
    english: ["{count} command(s) available.", "{count} command(s) available.", "{count} command(s) are available locally.", "{count} available command(s); hidden and disabled controls are excluded.", "{count} available command(s); the palette counted real controls, not decorative ghosts."],
    cantonese: ["有 {count} 個命令可用。", "有 {count} 個命令可用。", "本機有 {count} 個命令可用。", "有 {count} 個命令可用；隱藏同停用控制項已剔除。", "有 {count} 個命令可用；面板數真掣，唔數裝飾幽靈。"],
  },
  "palette.status.empty": {
    english: ["No available desktop search surface matches this query.", "No available desktop search surface matches this query.", "No available desktop search surface matches this local query.", "No visible and enabled desktop search surface matches this query.", "No visible and enabled desktop search surface matches this query; the hidden controls are not pretending."],
    cantonese: ["冇可用桌面搜尋頁面符合呢個搜尋。", "冇可用桌面搜尋頁面符合呢個搜尋。", "冇可用桌面搜尋頁面符合呢個本機搜尋。", "冇可見又啟用嘅桌面搜尋頁面符合呢個搜尋。", "冇可見又啟用嘅桌面搜尋頁面符合呢個搜尋；匿埋嘅掣冇扮嘢。"],
  },
  "palette.status.unavailable": {
    english: ["That command is no longer available; the palette stayed open and no control was focused.", "That command is no longer available; the palette stayed open and no control was focused.", "That command is no longer available in the current desktop state.", "That command is hidden, filtered, or disabled in the current state.", "That command has gone backstage; the palette refuses to focus a phantom."],
    cantonese: ["嗰個命令已經唔可用；面板保持開啟，冇聚焦任何控制項。", "嗰個命令已經唔可用；面板保持開啟，冇聚焦任何控制項。", "嗰個命令喺目前桌面狀態已經唔可用。", "嗰個命令喺目前狀態隱藏、篩走或者停用。", "嗰個命令去咗後台；面板唔肯聚焦幽靈。"],
  },
  "palette.results.label": {
    english: ["Available desktop command results", "Available desktop command results", "Available local desktop command results", "Visible and enabled desktop command results", "Visible and enabled desktop command results; no phantom rows"],
    cantonese: ["可用桌面命令結果", "可用桌面命令結果", "可用本機桌面命令結果", "可見又啟用嘅桌面命令結果", "可見又啟用嘅桌面命令結果；冇幽靈行"],
  },
  "palette.command.docsSearch": {
    english: ["Search offline documentation", "Search offline documentation", "Search offline documentation", "Search bundled offline documentation", "Search bundled offline documentation; the articles stay home"],
    cantonese: ["搜尋離線文件", "搜尋離線文件", "搜尋離線文件", "搜尋內置離線文件", "搜尋內置離線文件；文章留喺屋企"],
  },
  "palette.command.docsSearchDescription": {
    english: ["Open Docs and focus the local article search.", "Open Docs and focus the local article search.", "Open Docs and focus the local article search.", "Open Docs and focus its available local search.", "Open Docs and focus the local search; no browser treasure hunt."],
    cantonese: ["開啟文件並聚焦本機文章搜尋。", "開啟文件並聚焦本機文章搜尋。", "開啟文件並聚焦本機文章搜尋。", "開啟文件並聚焦可用本機搜尋。", "開啟文件並聚焦本機搜尋；唔使出門搵寶藏。"],
  },
  "palette.command.docsRegex": {
    english: ["Open documentation regex builder", "Open documentation regex builder", "Open documentation regex builder", "Open the bundled documentation Regex builder", "Open the bundled documentation Regex builder; bounded patterns only"],
    cantonese: ["開啟文件 Regex 建構器", "開啟文件 Regex 建構器", "開啟文件 Regex 建構器", "開啟內置文件 Regex 建構器", "開啟內置文件 Regex 建構器；只准有界模式"],
  },
  "palette.command.docsRegexDescription": {
    english: ["Open Docs and focus its anchored Regex builder.", "Open Docs and focus its anchored Regex builder.", "Open Docs and focus its anchored local Regex builder.", "Open Docs and focus its anchored bounded Regex builder.", "Open Docs and focus its anchored bounded Regex builder; the pattern stays in its lane."],
    cantonese: ["開啟文件並聚焦佢嘅錨定 Regex 建構器。", "開啟文件並聚焦佢嘅錨定 Regex 建構器。", "開啟文件並聚焦錨定本機 Regex 建構器。", "開啟文件並聚焦錨定有界 Regex 建構器。", "開啟文件並聚焦錨定有界 Regex 建構器；模式唔越界。"],
  },
  "palette.command.settingsSearch": {
    english: ["Search universal settings", "Search universal settings", "Search universal settings locally", "Search visible universal settings", "Search visible universal settings; the hidden shelf stays shut"],
    cantonese: ["搜尋通用設定", "搜尋通用設定", "本機搜尋通用設定", "搜尋可見通用設定", "搜尋可見通用設定；匿埋嗰格繼續關門"],
  },
  "palette.command.settingsSearchDescription": {
    english: ["Open Universal settings and focus its local search.", "Open Universal settings and focus its local search.", "Open Universal settings and focus its local settings search.", "Open Universal settings and focus the available settings search.", "Open Universal settings and focus the available settings search; no phantom teleport."],
    cantonese: ["開啟通用設定並聚焦本機搜尋。", "開啟通用設定並聚焦本機搜尋。", "開啟通用設定並聚焦本機設定搜尋。", "開啟通用設定並聚焦可用設定搜尋。", "開啟通用設定並聚焦可用設定搜尋；唔會傳送去幽靈位。"],
  },
  "palette.command.settingsRegex": {
    english: ["Open settings regex builder", "Open settings regex builder", "Open settings Regex builder", "Open the visible settings Regex builder", "Open the visible settings Regex builder; bounded and local"],
    cantonese: ["開啟設定 Regex 建構器", "開啟設定 Regex 建構器", "開啟設定 Regex 建構器", "開啟可見設定 Regex 建構器", "開啟可見設定 Regex 建構器；有界又本機"],
  },
  "palette.command.settingsRegexDescription": {
    english: ["Open Universal settings and focus its anchored Regex builder.", "Open Universal settings and focus its anchored Regex builder.", "Open Universal settings and focus its anchored local Regex builder.", "Open Universal settings and focus its anchored bounded Regex builder.", "Open Universal settings and focus its anchored bounded Regex builder; the settings stay in charge."],
    cantonese: ["開啟通用設定並聚焦佢嘅錨定 Regex 建構器。", "開啟通用設定並聚焦佢嘅錨定 Regex 建構器。", "開啟通用設定並聚焦錨定本機 Regex 建構器。", "開啟通用設定並聚焦錨定有界 Regex 建構器。", "開啟通用設定並聚焦錨定有界 Regex 建構器；設定話事。"],
  },
  "notifications.search.title": {
    english: ["Search desktop notifications", "Search desktop notifications", "Search desktop notifications locally", "Search desktop notifications without losing the evidence", "Search desktop notifications; the little audit trail gets a proper magnifying glass"],
    cantonese: ["搜尋桌面通知", "搜尋桌面通知", "本機搜尋桌面通知", "搜尋桌面通知，唔好整走證據", "搜尋桌面通知；細細條記錄都要有放大鏡"],
  },
  "notifications.search.label": {
    english: ["Search desktop notifications", "Search desktop notifications", "Search local desktop notifications", "Search local desktop notifications", "Search local desktop notifications before the records start hiding"],
    cantonese: ["搜尋桌面通知", "搜尋桌面通知", "搜尋本機桌面通知", "搜尋本機桌面通知", "搜尋本機桌面通知，趁記錄未開始匿埋"],
  },
  "notifications.search.placeholder": {
    english: ["Search notices…", "Search notices…", "Search local notices…", "Search notification records…", "Search notification records; facts stay factual…"],
    cantonese: ["搜尋通知…", "搜尋通知…", "本機搜尋通知…", "搜尋通知記錄…", "搜尋通知記錄；事實繼續係事實…"],
  },
  "notifications.regex.dialogLabel": {
    english: ["Regex builder for desktop notifications", "Regex builder for desktop notifications", "Local Regex builder for desktop notifications", "Bounded local Regex builder for desktop notifications", "Bounded local Regex builder for desktop notifications; no notification confetti"],
    cantonese: ["桌面通知 Regex 建構器", "桌面通知 Regex 建構器", "桌面通知本機 Regex 建構器", "桌面通知有界本機 Regex 建構器", "桌面通知有界本機 Regex 建構器；唔搞通知紙碎"],
  },
  "notifications.regex.tokensLabel": {
    english: ["Desktop notification regex pattern shortcuts", "Desktop notification regex pattern shortcuts", "Desktop notification Regex shortcuts", "Bounded desktop notification Regex shortcuts", "Bounded desktop notification Regex shortcuts; audit-friendly"],
    cantonese: ["桌面通知 Regex 模式快捷鍵", "桌面通知 Regex 模式快捷鍵", "桌面通知 Regex 快捷鍵", "有界桌面通知 Regex 快捷鍵", "有界桌面通知 Regex 快捷鍵；方便查數"],
  },
  "notifications.regex.patternLabel": {
    english: ["Bounded local pattern", "Bounded local pattern", "Bounded local pattern", "Bounded local pattern for notification records", "Bounded local pattern; no runaway notification regex"],
    cantonese: ["有界本機模式", "有界本機模式", "有界本機模式", "通知記錄用嘅有界本機模式", "有界本機模式；通知 Regex 唔准失控"],
  },
  "notifications.regex.placeholder": {
    english: ["For example: save|draft", "For example: save|draft", "For example: save|draft", "For example: save|draft (bounded)", "For example: save|draft; the records like a tidy pattern"],
    cantonese: ["例如：save|draft", "例如：save|draft", "例如：save|draft", "例如：save|draft（有界）", "例如：save|draft；記錄都鍾意整齊模式"],
  },
  "notifications.regex.ignoreCase": {
    english: ["Ignore case", "Ignore case", "Ignore letter case", "Ignore letter case locally", "Ignore letter case; let the notification capitals nap"],
    cantonese: ["忽略大小寫", "忽略大小寫", "忽略字母大小寫", "本機忽略字母大小寫", "忽略字母大小寫；通知大細階瞓陣先"],
  },
  "settings.appearance.title": {
    english: ["Theme, density, and accent", "Theme, density, and accent", "Theme, density, and accent", "Theme, density, and accent for the desktop shell", "Theme, density, and accent: the shell gets a wardrobe, not a new identity"],
    cantonese: ["主題、密度同強調色", "主題、密度同強調色", "主題、密度同強調色", "桌面外殼嘅主題、密度同強調色", "主題、密度同強調色：外殼換衫，身份唔換"],
  },
  "settings.appearance.description": {
    english: ["These values apply to the desktop shell and persist through the local settings store.", "These values apply to the desktop shell and persist in the local settings store.", "These values apply to the desktop shell and persist locally.", "These values apply to the desktop shell and persist locally; they do not change server files.", "These values apply to the desktop shell and persist locally; server files remain blissfully uninvolved."],
    cantonese: ["呢啲值套用到桌面外殼，並會經本機設定儲存。", "呢啲值套用到桌面外殼，並會留喺本機設定儲存。", "呢啲值套用到桌面外殼，並會本機保存。", "呢啲值套用到桌面外殼並本機保存；唔會改伺服器檔案。", "呢啲值套用到桌面外殼並本機保存；伺服器檔案可以安靜食花生。"],
  },
  "settings.appearance.theme": {
    english: ["Theme", "Theme", "Theme", "Theme", "Theme"],
    cantonese: ["主題", "主題", "主題", "主題", "主題"],
  },
  "settings.appearance.theme.dark": {
    english: ["Dark", "Dark", "Dark", "Dark", "Dark"],
    cantonese: ["深色", "深色", "深色", "深色", "深色"],
  },
  "settings.appearance.theme.light": {
    english: ["Light", "Light", "Light", "Light", "Light"],
    cantonese: ["淺色", "淺色", "淺色", "淺色", "淺色"],
  },
  "settings.appearance.density": {
    english: ["Density", "Density", "Density", "Density", "Density"],
    cantonese: ["密度", "密度", "密度", "密度", "密度"],
  },
  "settings.appearance.density.comfortable": {
    english: ["Comfortable", "Comfortable", "Comfortable", "Comfortable", "Comfortable"],
    cantonese: ["舒適", "舒適", "舒適", "舒適", "舒適"],
  },
  "settings.appearance.density.compact": {
    english: ["Compact", "Compact", "Compact", "Compact", "Compact"],
    cantonese: ["緊湊", "緊湊", "緊湊", "緊湊", "緊湊"],
  },
  "settings.appearance.accent": {
    english: ["Accent color", "Accent color", "Accent color", "Accent color", "Accent color"],
    cantonese: ["強調色", "強調色", "強調色", "強調色", "強調色"],
  },
  "settings.tabDock.title": {
    english: ["Tab docking", "Tab docking", "Tab docking position", "Tab docking position for the future tab strip", "Tab docking position; the future tabs are still waiting backstage"],
    cantonese: ["分頁停靠", "分頁停靠", "分頁停靠位置", "未來分頁列嘅停靠位置", "分頁停靠位置；未來分頁仲喺後台排隊"],
  },
  "settings.tabDock.description": {
    english: ["Choose the future tab strip edge. Full tab reorder, pin, group, and discovery work is still unverified.", "Choose the future tab strip edge. Full tab reorder, pin, group, and discovery remain unverified.", "Choose the future tab strip edge; the full tab contract remains unverified.", "Choose the future tab strip edge; reorder, pin, group, and discovery remain unverified.", "Choose the future tab strip edge; the tab furniture is still waiting for its proper delivery."],
    cantonese: ["選擇未來分頁列邊緣；完整分頁重排、釘選、分組同搜尋仍未驗證。", "選擇未來分頁列邊緣；完整分頁重排、釘選、分組同搜尋仲未驗證。", "選擇未來分頁列邊緣；完整分頁合約仍未驗證。", "選擇未來分頁列邊緣；重排、釘選、分組同搜尋仍未驗證。", "選擇未來分頁列邊緣；分頁傢俬仲等緊正式送貨。"],
  },
  "settings.tabDock.select": {
    english: ["Tab strip docking position", "Tab strip docking position", "Tab strip docking position", "Tab strip docking position", "Tab strip docking position"],
    cantonese: ["分頁列停靠位置", "分頁列停靠位置", "分頁列停靠位置", "分頁列停靠位置", "分頁列停靠位置"],
  },
  "settings.tabDock.left": {
    english: ["Left", "Left", "Left", "Left", "Left"],
    cantonese: ["左邊", "左邊", "左邊", "左邊", "左邊"],
  },
  "settings.tabDock.right": {
    english: ["Right", "Right", "Right", "Right", "Right"],
    cantonese: ["右邊", "右邊", "右邊", "右邊", "右邊"],
  },
  "settings.tabDock.top": {
    english: ["Top", "Top", "Top", "Top", "Top"],
    cantonese: ["頂部", "頂部", "頂部", "頂部", "頂部"],
  },
  "settings.tabDock.bottom": {
    english: ["Bottom", "Bottom", "Bottom", "Bottom", "Bottom"],
    cantonese: ["底部", "底部", "底部", "底部", "底部"],
  },
  "settings.actions.reset": {
    english: ["Reset universal settings", "Reset universal settings", "Reset universal settings locally", "Reset universal settings; server files stay untouched", "Reset universal settings; the server gets no surprise house move"],
    cantonese: ["重設通用設定", "重設通用設定", "喺本機重設通用設定", "重設通用設定；伺服器檔案保持原樣", "重設通用設定；伺服器唔會收到突然搬屋通知"],
  },
  "settings.footnote": {
    english: ["This panel excludes credentials, arbitrary commands, remote services, and vocabulary file contents. Full contract coverage is tracked in the repository inventory.", "This panel excludes credentials, arbitrary commands, remote services, and vocabulary file contents. The repository inventory tracks the wider contract.", "This panel excludes credentials, arbitrary commands, remote services, and vocabulary file contents. Wider coverage stays explicit in the inventory.", "This panel excludes credentials, arbitrary commands, remote services, and vocabulary file contents. The inventory names what is implemented and what remains.", "This panel excludes credentials, arbitrary commands, remote services, and vocabulary file contents. The inventory is the referee, not a decorative clipboard."],
    cantonese: ["呢個頁面唔包括憑證、任意指令、遠端服務同詞彙檔案內容；完整合約覆蓋記錄喺項目清單。", "呢個頁面唔包括憑證、任意指令、遠端服務同詞彙檔案內容；項目清單記錄更闊合約。", "呢個頁面唔包括憑證、任意指令、遠端服務同詞彙檔案內容；更闊覆蓋會清楚列喺清單。", "呢個頁面唔包括憑證、任意指令、遠端服務同詞彙檔案內容；清單會列明已做同未做。", "呢個頁面唔包括憑證、任意指令、遠端服務同詞彙檔案內容；清單係裁判，唔係裝飾用夾板。"],
  },
  "settings.status.loading": {
    english: ["Loading local universal settings…", "Loading local universal settings…", "Loading local universal settings locally…", "Loading local universal settings; no server action is involved…", "Loading local universal settings; the server is not invited to this bit…"],
    cantonese: ["載入本機通用設定中…", "載入本機通用設定中…", "本機載入通用設定中…", "本機載入通用設定中；唔會郁伺服器…", "本機載入通用設定中；伺服器今次冇被邀請…"],
    dialogEmoji: "⏳",
  },
  "settings.status.pending": {
    english: ["Universal setting changes pending…", "Universal setting changes pending…", "Universal setting changes are waiting to save…", "Universal setting changes are queued for local saving…", "Universal setting changes are queued; the tiny settings clerk is writing locally…"],
    cantonese: ["通用設定變更等緊處理…", "通用設定變更等緊處理…", "通用設定變更等緊本機保存…", "通用設定變更已排隊等本機保存…", "通用設定變更已排隊；小小設定文員正喺本機落筆…"],
    dialogEmoji: "⏳",
  },
  "settings.status.saved": {
    english: ["Universal settings saved locally.", "Universal settings saved locally.", "Universal settings saved locally; the facts survived.", "Universal settings saved locally; no server files changed.", "Universal settings saved locally; the server remains gloriously uninvolved."],
    cantonese: ["通用設定已保存喺本機。", "通用設定已保存喺本機。", "通用設定已保存喺本機；事實冇走樣。", "通用設定已保存喺本機；伺服器檔案冇改。", "通用設定已保存喺本機；伺服器繼續安靜，幾有禮貌。"],
    dialogEmoji: "✅",
  },
  "settings.status.saveFailed": {
    english: ["Universal settings could not be saved; the current window values remain visible.", "Universal settings could not be saved; the current window values remain visible.", "Universal settings could not be saved; this window keeps the current values visible.", "Universal settings could not be saved; the current values remain visible and no server state changed.", "Universal settings could not be saved; the current values remain visible while the settings file has a lie-down."],
    cantonese: ["通用設定未能保存；目前視窗值仍然顯示。", "通用設定未能保存；目前視窗值仍然顯示。", "通用設定未能保存；呢個視窗會保留目前值。", "通用設定未能保存；目前值仍顯示，伺服器狀態冇改。", "通用設定未能保存；目前值照樣顯示，設定檔先休息一陣。"],
    dialogEmoji: "⚠️",
  },
  "settings.status.resetSaved": {
    english: ["Universal settings reset and saved locally.", "Universal settings reset and saved locally.", "Universal settings reset and saved locally; server files were not changed.", "Universal settings reset and saved locally; server files and the draft stayed untouched.", "Universal settings reset and saved locally; the server avoided a surprise makeover."],
    cantonese: ["通用設定已重設並保存喺本機。", "通用設定已重設並保存喺本機。", "通用設定已重設並保存喺本機；伺服器檔案冇改。", "通用設定已重設並保存喺本機；伺服器檔案同草稿保持原樣。", "通用設定已重設並保存喺本機；伺服器避過一場突然大改造。"],
    dialogEmoji: "🔄",
  },
  "settings.status.resetFailed": {
    english: ["Universal settings reset in this window; the file could not be updated.", "Universal settings reset in this window; the file could not be updated.", "Universal settings reset in this window; the local file could not be updated.", "Universal settings reset in this window; the local file could not be updated, so persistence remains unverified.", "Universal settings reset in this window; the local file refused the encore, so persistence remains unverified."],
    cantonese: ["通用設定已喺視窗重設；檔案未能更新。", "通用設定已喺視窗重設；檔案未能更新。", "通用設定已喺視窗重設；本機檔案未能更新。", "通用設定已喺視窗重設；本機檔案未能更新，所以保存仍未驗證。", "通用設定已喺視窗重設；本機檔案唔肯再演，保存仍未驗證。"],
    dialogEmoji: "⚠️",
  },
  "settings.snackbar.saveFailed": {
    english: ["The universal settings file could not be saved. No server draft or process was changed.", "The universal settings file could not be saved. No server draft or process was changed.", "The universal settings file could not be saved. The server draft and process stayed untouched.", "The universal settings file could not be saved. The server draft and process stayed untouched; try again locally.", "The universal settings file could not be saved. The server draft and process stayed untouched while the file has a timeout tantrum."],
    cantonese: ["通用設定檔未能保存；伺服器草稿同程序都冇改。", "通用設定檔未能保存；伺服器草稿同程序都冇改。", "通用設定檔未能保存；伺服器草稿同程序保持原樣。", "通用設定檔未能保存；伺服器草稿同程序保持原樣，請喺本機再試。", "通用設定檔未能保存；伺服器草稿同程序保持原樣，檔案只係鬧緊小脾氣。"],
    dialogEmoji: "⚠️",
  },
  "settings.snackbar.reset": {
    english: ["Universal settings reset. Server files and the server draft were not changed.", "Universal settings reset. Server files and the server draft were not changed.", "Universal settings reset locally. Server files and the server draft were not changed.", "Universal settings reset locally. Server files and the server draft were not changed.", "Universal settings reset locally. Server files and the server draft were not changed; the server dodged the confetti."],
    cantonese: ["通用設定已重設；伺服器檔案同草稿冇改。", "通用設定已重設；伺服器檔案同草稿冇改。", "通用設定已喺本機重設；伺服器檔案同草稿冇改。", "通用設定已喺本機重設；伺服器檔案同草稿冇改。", "通用設定已喺本機重設；伺服器檔案同草稿冇改，伺服器避過紙碎。"],
    dialogEmoji: "🔄",
  },
  "settings.snackbar.resetFailed": {
    english: ["The universal settings reset could not be persisted.", "The universal settings reset could not be persisted.", "The universal settings reset could not be persisted locally.", "The universal settings reset could not be persisted locally; the current window was reset.", "The universal settings reset could not be persisted locally; the file declined its dramatic reset scene."],
    cantonese: ["通用設定重設未能保存。", "通用設定重設未能保存。", "通用設定重設未能喺本機保存。", "通用設定重設未能喺本機保存；目前視窗已重設。", "通用設定重設未能喺本機保存；檔案唔肯演呢場重設大戲。"],
    dialogEmoji: "⚠️",
  },
  "startup.settingsReady": {
    english: ["Universal settings ready locally.", "Universal settings ready locally.", "Universal settings are ready locally.", "Universal settings are ready locally; the desktop can use the chosen voice.", "Universal settings are ready locally; the desktop has put on the chosen voice."],
    cantonese: ["本機通用設定已準備好。", "本機通用設定已準備好。", "本機通用設定準備好喇。", "本機通用設定準備好喇；桌面可以用你揀嘅口吻。", "本機通用設定準備好喇；桌面已經換上你揀嘅口吻。"],
  },
  "startup.settingsDefaults": {
    english: ["Universal settings are using the bounded in-window defaults.", "Universal settings are using the bounded in-window defaults.", "Universal settings are using the bounded in-window defaults; persistence was unavailable.", "Universal settings are using the bounded in-window defaults; the local file was unavailable and no server state changed.", "Universal settings are using the bounded in-window defaults; the settings file took a day off and the server stayed untouched."],
    cantonese: ["通用設定正使用視窗內嘅有界預設值。", "通用設定正使用視窗內嘅有界預設值。", "通用設定正使用視窗內嘅有界預設值；保存功能未能使用。", "通用設定正使用視窗內嘅有界預設值；本機檔案未能使用，伺服器狀態冇改。", "通用設定正使用視窗內嘅有界預設值；設定檔放假，伺服器冇被郁到。"],
    dialogEmoji: "⚠️",
  },
  "notification.title": {
    english: ["Desktop notification", "Desktop notification", "Desktop message", "Desktop message box", "Desktop message box, wearing its tiny notification hat"],
    cantonese: ["桌面通知", "桌面通知", "桌面訊息", "桌面訊息框", "桌面訊息框，戴住頂細細通知帽"],
  },
};

function levelIndex(level: number): number {
  return Math.min(5, Math.max(1, Math.trunc(level))) - 1;
}

function selectedLanguageCopy(definition: DesktopCopyDefinition, languageMode: UniversalLanguageMode, englishLevel: number, cantoneseLevel: number): string {
  const parts = selectedLanguageParts(definition, languageMode, englishLevel, cantoneseLevel);
  if (parts.languageMode === "cantonese") return parts.cantonese;
  if (parts.languageMode === "bilingual") return `English: ${parts.english} · Cantonese: ${parts.cantonese}`;
  return parts.english;
}

export interface DesktopPresentationCopyParts {
  readonly languageMode: UniversalLanguageMode;
  readonly english: string;
  readonly cantonese: string;
}

function selectedLanguageParts(
  definition: DesktopCopyDefinition,
  languageMode: UniversalLanguageMode,
  englishLevel: number,
  cantoneseLevel: number,
): DesktopPresentationCopyParts {
  return {
    languageMode,
    english: definition.english[levelIndex(englishLevel)] ?? definition.english[0] ?? "",
    cantonese: definition.cantonese[levelIndex(cantoneseLevel)] ?? definition.cantonese[0] ?? "",
  };
}

export function presentDesktopCopyParts(
  key: DesktopPresentationKey,
  settings: Pick<UniversalSettingsV1, "languageMode" | "funnyLevelEnglish" | "funnyLevelCantonese">,
): DesktopPresentationCopyParts {
  return selectedLanguageParts(
    DESKTOP_COPY[key],
    settings.languageMode,
    settings.funnyLevelEnglish,
    settings.funnyLevelCantonese,
  );
}

export function presentDesktopCopy(key: DesktopPresentationKey, settings: Pick<UniversalSettingsV1, "languageMode" | "funnyLevelEnglish" | "funnyLevelCantonese">): string {
  return selectedLanguageCopy(DESKTOP_COPY[key], settings.languageMode, settings.funnyLevelEnglish, settings.funnyLevelCantonese);
}

export function presentDialogCopy(key: DesktopPresentationKey, settings: UniversalSettingsV1): string {
  const copy = presentDesktopCopy(key, settings);
  const decoration = DESKTOP_COPY[key].dialogEmoji;
  return settings.showEmojisInDialogs && decoration ? `${decoration} ${copy}` : copy;
}

export function decorateDialogMessage(message: string, settings: Pick<UniversalSettingsV1, "showEmojisInDialogs">): string {
  return settings.showEmojisInDialogs ? `💬 ${message}` : message;
}

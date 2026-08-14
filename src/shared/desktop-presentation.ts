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
    english: ["This panel excludes credentials, arbitrary commands, remote services, and private vocabulary values. Full contract coverage is tracked in the repository inventory.", "This panel excludes credentials, arbitrary commands, remote services, and private vocabulary values. The repository inventory tracks the wider contract.", "This panel excludes credentials, arbitrary commands, remote services, and private vocabulary values. Wider coverage stays explicit in the inventory.", "This panel excludes credentials, arbitrary commands, remote services, and private vocabulary values. The inventory names what is implemented and what remains.", "This panel excludes credentials, arbitrary commands, remote services, and private vocabulary values. The inventory is the referee, not a decorative clipboard."],
    cantonese: ["呢個頁面唔包括憑證、任意指令、遠端服務同私人詞彙值；完整合約覆蓋記錄喺項目清單。", "呢個頁面唔包括憑證、任意指令、遠端服務同私人詞彙值；項目清單記錄更闊合約。", "呢個頁面唔包括憑證、任意指令、遠端服務同私人詞彙值；更闊覆蓋會清楚列喺清單。", "呢個頁面唔包括憑證、任意指令、遠端服務同私人詞彙值；清單會列明已做同未做。", "呢個頁面唔包括憑證、任意指令、遠端服務同私人詞彙值；清單係裁判，唔係裝飾用夾板。"],
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
  const english = definition.english[levelIndex(englishLevel)] ?? definition.english[0] ?? "";
  const cantonese = definition.cantonese[levelIndex(cantoneseLevel)] ?? definition.cantonese[0] ?? "";
  if (languageMode === "cantonese") return cantonese;
  if (languageMode === "bilingual") return `${english} · ${cantonese}`;
  return english;
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

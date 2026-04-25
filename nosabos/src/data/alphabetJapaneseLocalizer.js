import { translateFlashcardConceptToJapanese } from "./flashcards/japaneseLocalizer.js";

/**
 * Adds Japanese support-language copy to alphabet bootcamp payloads.
 *
 * The bootcamp card face uses more than the page chrome: `letter.name`,
 * `sound*`, `tip*`, and `practiceWordMeaning.*` all render directly from the
 * alphabet payload. Japanese support language therefore needs a localizer layer
 * for every registered alphabet, not just the bootcamp headings/buttons.
 */

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const stripInstructionDecorator = (value) =>
  String(value || "")
    .trim()
    .replace(/^\[(?:sound|tip)\]\s*/i, "")
    .trim();

const containsJapanese = (value) => /[\u3040-\u30ff\u3400-\u9fff]/.test(String(value || ""));

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const replaceAllInsensitive = (text, source, replacement) =>
  text.replace(new RegExp(escapeRegExp(source), "gi"), replacement);

const PHONETIC_LANGUAGE_LABELS = {
  english: "英語",
  spanish: "スペイン語",
  german: "ドイツ語",
  french: "フランス語",
  dutch: "オランダ語",
  portuguese: "ポルトガル語",
  italian: "イタリア語",
  irish: "アイルランド語",
  japanese: "日本語",
  greek: "ギリシャ語",
  polish: "ポーランド語",
  nahuatl: "ナワトル語",
  maya: "マヤ語",
  latin: "ラテン語",
  american: "アメリカ英語",
  scottish: "スコットランド英語",
  scotland: "スコットランド",
  brazil: "ブラジル",
  portugal: "ポルトガル",
  spain: "スペイン",
  belgium: "ベルギー",
  rio: "リオ",
  argentina: "アルゼンチン",
  uruguay: "ウルグアイ",
};

const EXACT_NAME_TRANSLATIONS = {
  alpha: "アルファ",
  beta: "ベータ",
  gamma: "ガンマ",
  delta: "デルタ",
  epsilon: "イプシロン",
  zeta: "ゼータ",
  eta: "イータ",
  theta: "シータ",
  iota: "イオタ",
  kappa: "カッパ",
  lambda: "ラムダ",
  mu: "ミュー",
  nu: "ニュー",
  xi: "クサイ",
  omicron: "オミクロン",
  pi: "パイ",
  rho: "ロー",
  sigma: "シグマ",
  tau: "タウ",
  upsilon: "ユプシロン",
  phi: "ファイ",
  psi: "プサイ",
  omega: "オメガ",
  "soft sign": "軟音記号",
  "hard sign": "硬音記号",
  "silent letters": "発音しない文字",
  "word stress": "語の強勢",
  "flap t": "はじき音の T",
  "r (american)": "アメリカ英語の R",
  "th (voiced)": "有声 TH",
  "th (unvoiced)": "無声 TH",
  "sp & st (at start)": "語頭の SP / ST",
  "sc (before e/i)": "E または I の前の SC",
  "gl (before i)": "I の前の GL",
  "eu & äu": "EU と ÄU",
  "final -en": "語末の -en",
  "t (ending)": "語尾の T",
  "li (ending)": "語尾の -li",
  "in (ending)": "語尾の -in",
  "glottal stop (')": "声門閉鎖音",
  "signo de exclamación invertido": "逆さ感嘆符",
  "signo de interrogación invertido": "逆さ疑問符",
  liaison: "リエゾン",
  schwa: "シュワ",
  "clear l": "明るい L",
  "dark l": "暗い L",
  "double consonants": "二重子音",
  "nasal an/en": "アン／エンの鼻母音",
  "e aperta": "開いた E",
  "e chiusa": "閉じた E",
  "o aperta": "開いた O",
  "o chiusa": "閉じた O",
  "nasal in": "鼻母音 IN",
  "nasal on": "鼻母音 ON",
  "nasal un": "鼻母音 UN",
  "ach-laut": "アハ・ラウト",
  "ich-laut": "イヒ・ラウト",
};

const EXACT_INSTRUCTION_TRANSLATIONS = {
  "pronounced separately from previous vowel": "前の母音と分けて発音します。",
  "pronounced separately from adjacent vowel": "隣の母音と分けて発音します。",
  "trema shows e is separate syllable: 'geëerd' = ge-eerd (honored).":
    "トレマは E を別の音節として発音する印です。'geëerd' は ge-eerd のように区切って読みます。",
  "trema separates vowels: 'egoïst' = e-go-ist.":
    "トレマは母音を分けて発音する印です。'egoïst' は e-go-ist のように区切って読みます。",
  "hiragana and katakana share the same sound.":
    "ひらがなとカタカナは同じ音を表します。",
  "hiragana (あ) and katakana (ア) share the same sound.":
    "ひらがなの あ とカタカナの ア は同じ音です。",
  "keep it short—avoid the english 'yee'.":
    "短く発音しましょう。英語の 'yee' のように伸ばしません。",
  "lips stay relaxed; sometimes whispered between consonants.":
    "唇はリラックスさせたままにします。子音にはさまれると弱く聞こえることがあります。",
  "a clean mid-vowel; don't add a glide.":
    "はっきりした中舌母音です。余計な滑り音を加えません。",
  "rounded but short—avoid diphthonging to 'oh-oo'.":
    "唇は丸めますが短く発音します。'oh-oo' のような二重母音にはしません。",
  "'ka' with light, unaspirated k": "弱く短い無気音の k で 'ka' と発音します。",
  "'sa' (unvoiced s)": "無声音の s で 'sa' と発音します。",
  "'ta' with a dental t": "歯に近い位置で作る t で 'ta' と発音します。",
  "'na'": "'na' の音です。",
  "'ma'": "'ma' の音です。",
  "'ya'": "'ya' の音です。",
  "'wa'": "'wa' の音です。",
  "single-tap 'ra/la'": "r と l の中間のような音を一度だけ軽くはじきます。",
  "moraic nasal—varies by position": "位置によって響きが変わるモーラ鼻音です。",
  "one of the few remaining w-syllables; also a topic particle as 'は'.":
    "数少ない W 系の音節の一つです。助詞では 'は' が 'wa' と読まれる点も覚えましょう。",
  "can sound like m/n/ŋ depending on following sounds; counts as its own mora.":
    "後ろに来る音によって m / n / ŋ のように変わりますが、1モーラとして数えます。",
  "classic nasal—use it to feel the rhythm of japanese mora timing.":
    "基本的な鼻音です。日本語のモーラのリズムを感じながら練習しましょう。",
  "remember the particle exception: は is pronounced 'wa' in grammar.":
    "助詞の例外を覚えましょう。文法では は を 'wa' と発音します。",
  "light nasal; pairs with ま/も to practice length control.":
    "軽い鼻音です。ま / も と組み合わせると長さの練習になります。",
  "only ya/yu/yo exist—no yi/ye entries.":
    "YA / YU / YO だけがあり、YI / YE はありません。",
  "less puff than english; pair with が for voiced contrast.":
    "英語より息を弱めて出します。が と比べると有声・無声の違いがわかります。",
  "crisp s; pair with ざ for the voiced partner.":
    "はっきりした s の音です。ざ と比べると有声の対応がわかります。",
  "tongue touches upper teeth; softer than english.":
    "舌先を上の歯に近づけます。英語の t よりやわらかい音です。",
  "quick flap—between english r and l.":
    "素早いはじき音で、英語の r と l の中間のように聞こえます。",
  "like 'ay' in 'say' or 'eye'":
    "「say」の 'ay' や「eye」の音に近い発音です。",
  "both like 'ay' in 'say' - almost identical":
    "どちらも「say」の 'ay' に近い音で、ほぼ同じように聞こえます。",
  "a breath of air from the throat": "喉の奥から出る息の音です。",
  "like breathing on glasses to clean them. very light, no friction.":
    "眼鏡を曇らせる息のような音です。とても軽く、強い摩擦を作りません。",
  "round lips slightly, tongue behind the ridge. like telling someone to be quiet: 'shhh!'":
    "唇を少し丸め、舌を歯ぐきの後ろに置きます。静かにと言うときの 'shhh!' に近い音です。",
  "it's t + sh combined quickly. tongue starts at the ridge, then pulls back.":
    "T と SH を素早くつなげた音です。舌先を歯ぐきにつけてから後ろへ引きます。",
  "same position as ch, but add voice. feel your throat vibrate!":
    "CH と同じ位置で作り、そこに有声を加えます。喉の振動を感じてみましょう。",
  "like 'a' in 'father' but shorter":
    "「father」の 'a' に近い音ですが、もっと短く発音します。",
  "makes c sound like 's' before a, o, u: 'français' = 'fransay'.":
    "a / o / u の前で C を 's' の音にします。たとえば 'français' は 'fransay' のように聞こえます。",
  "dental d, tongue touches back of upper teeth.":
    "歯音の D です。舌先を上の歯の裏につけます。",
  "separates i from other vowels. 'naïf' = 'na-eef', not 'nife'.":
    "I をほかの母音から分けて発音させます。'naïf' は 'na-eef' のように読み、'nife' にはなりません。",
  "only appears in 'où' (where) to distinguish from 'ou' (or).":
    "'où'（どこ）と 'ou'（または）を区別するためにだけ使われます。",
  "traditionally distinct from in, now often sounds the same.":
    "伝統的には IN と区別されますが、今では同じように聞こえることも多いです。",
  "say 'eh' but round your lips. like a rounded 'uh'.":
    "「eh」の口の形のまま唇を丸めます。丸めた 'uh' のような音です。",
  "oi = 'wa' sound. 'moi' = 'mwa', 'toi' = 'twa'.":
    "OI は 'wa' に近い音になります。'moi' は 'mwa'、'toi' は 'twa' のように聞こえます。",
  "h after vowel = long vowel! 'sohn' (son) - h makes o long.":
    "母音の後ろの H は前の母音を長くします。'Sohn' では H が O を長母音にしています。",
  "long i often spelled ie: 'liebe' (love).":
    "長い I の音は IE と綴られることがよくあります。たとえば 'Liebe'（愛）です。",
  "ä is a with two dots (umlaut). sounds like e! 'männer' = men.":
    "Ä はウムラウト付きの A で、E に近い音です。'Männer' は「men」のような意味になります。",
  "ß = 'ss' but after long vowels. 'straße' has long a, 'masse' has short a.":
    "ß は 'ss' に相当しますが、長母音のあとで使われます。'Straße' は長い A、'Masse' は短い A の音です。",
  "soft 'ch' - like hissing cat, made at front of mouth":
    "やわらかい CH の音です。猫がシューッと言うような音で、口の前のほうで作ります。",
  "hard 'ch' - like clearing throat, made at back of mouth":
    "硬い CH の音です。喉を鳴らすような音で、口の奥で作ります。",
  "at word start: sp = 'shp', st = 'sht'. 'sprechen' = 'shprekhen', 'stein' = 'shtain'.":
    "語頭では SP が 'shp'、ST が 'sht' に近くなります。たとえば 'Sprechen' は 'shprekhen'、'Stein' は 'shtain' のように聞こえます。",
  "eu and äu both = 'oy' sound! 'deutsch' = 'doytsh', 'häuser' = 'hoyzer'.":
    "EU と ÄU はどちらも 'oy' に近い音です。'Deutsch' は 'doytsh'、'Häuser' は 'hoyzer' のように聞こえます。",
  "au = 'ow' sound. 'haus' = 'house'.":
    "AU は 'ow' に近い音です。'Haus' は 'house' のように聞こえます。",
  "let the sound come from the throat, not the lips.":
    "唇ではなく、喉の奥から音を出します。",
  "place the tongue lightly between the teeth.":
    "舌を軽く歯の間に置きます。",
  "short, crisp e sound.": "短くはっきりした E の音です。",
  "smile slightly for a bright vowel.": "少し口角を上げて、明るい母音で発音します。",
  "feel vibration in the lips.": "唇の振動を感じましょう。",
  "soft, clean n.": "やわらかく澄んだ N の音です。",
  "blend k + s smoothly.": "K と S をなめらかにつなげます。",
  "rolled or tapped 'r'": "巻き舌の R、または軽いはじき音です。",
  "tap the tongue lightly.": "舌先を軽くはじきます。",
  "upper teeth touch lower lip.": "上の歯を下唇に軽く当てます。",
  "a breathy, back-of-throat sound.": "息を伴う喉の奥の音です。",
  "short 'e' like in 'bet'": "「bet」の 'e' に近い短い音です。",
  "the fada (accent) always lengthens the vowel. á sounds like 'aw'.":
    "ファダ（アクセント）は常に母音を長くします。Á は 'aw' に近い音です。",
  "the fada lengthens e to an 'ay' sound.":
    "ファダが付くと E は 'ay' に近い長い音になります。",
  "the fada makes it a long 'ee' sound.":
    "ファダが付くと長い 'ee' の音になります。",
  "the fada lengthens o to a long 'oh' sound.":
    "ファダが付くと O は長い 'oh' の音になります。",
  "the fada lengthens u to a long 'oo' sound.":
    "ファダが付くと U は長い 'oo' の音になります。",
  "used as a toast. literally means 'health'.":
    "乾杯のあいさつとして使われます。文字どおりの意味は『健康』です。",
  "god be with you": "神のご加護がありますように。",
  "health!": "乾杯！",
  "considered one letter in dutch! 'ijsland' = iceland. both letters capitalize together.":
    "オランダ語では 1 文字として扱われることがあります。'IJsland' のように 2 文字まとめて大文字にします。",
  "ei and ij sound the same! spelling difference is historical.":
    "EI と IJ は同じように聞こえます。違いはつづりの歴史によるものです。",
  "in casual speech, 'lopen' sounds like 'lopuh'. very dutch!":
    "くだけた会話では 'lopen' が 'lopuh' のように聞こえることがあります。とてもオランダ語らしい発音です。",
  "final b becomes p: 'heb' sounds like 'hep'. called 'final devoicing'.":
    "語末の B は P のように聞こえます。'heb' は 'hep' に近くなります。これは語末の無声化です。",
  "slightly longer, back a": "少し長めで、舌を奥に引いた A の音です。",
  "usually in combinations: ch, ck, sch":
    "通常は CH / CK / SCH の組み合わせで使われます。",
  "like 'ss' - always voiceless 's'":
    "「ss」のような音で、常に無声音の s です。",
  "like 'shp' and 'sht' at beginning of words":
    "語頭では 'shp' や 'sht' のように聞こえます。",
  "like 'i' in 'mine' or 'eye'":
    "「mine」の 'i' や「eye」に近い音です。",
  "long 'aw' sound like in 'law'":
    "「law」の 'aw' に近い長い音です。",
  "long 'ay' sound like in 'say'":
    "「say」の 'ay' に近い長い音です。",
  "short 'i' like in 'bit'":
    "「bit」の 'i' に近い短い音です。",
  "long 'ee' sound like in 'see'":
    "「see」の 'ee' に近い長い音です。",
  "short 'o' like in 'hot'":
    "「hot」の 'o' に近い短い音です。",
  "long 'oh' sound like in 'go'":
    "「go」の 'oh' に近い長い音です。",
  "rolled r, or tap": "巻き舌の R、または軽いはじき音です。",
  "short 'u' like in 'put'":
    "「put」の 'u' に近い短い音です。",
  "long 'oo' sound like in 'moon'":
    "「moon」の 'oo' に近い長い音です。",
  "rolled/trilled r": "巻き舌の R です。",
  "like 'oo' in 'food' (unrounded)":
    "「food」の 'oo' に近い音ですが、唇は強く丸めません。",
  "'ha' (sometimes read 'wa' as a particle)":
    "'ha' の音ですが、助詞では 'wa' と読まれることがあります。",
  "like 'ee' in 'see' (short, pure)":
    "「see」の 'ee' に近い、短く澄んだ音です。",
  "rounded 'o' (never diphthong)":
    "唇を丸めた O の音で、二重母音にはしません。",
  "labialized k (like 'kw' in 'queen')":
    "「queen」の 'kw' に近い、唇を丸めた K の音です。",
  "voiceless lateral affricate": "無声の側面破擦音です。",
  "final -li after l (and in many nouns)":
    "L のあとや多くの名詞の語尾に付く -li です。",
  "animate noun ending": "有生名詞で使われる語尾です。",
  "soft 'ch' - like 'ch' in 'cheese' but softer":
    "「cheese」の 'ch' に近いですが、もっとやわらかい音です。",
  "soft 'sh' - between 's' and 'sh'":
    "S と SH の中間のような、やわらかい音です。",
  "a quick 'y' as in 'boy'":
    "「boy」の中の素早い 'y' のような音です。",
  "rolled/trill 'r'": "巻き舌の R です。",
  "like 'sh' in 'shore' (harder, no rounding)":
    "「shore」の 'sh' に近いですが、より硬く、唇は丸めません。",
  "between 'i' in 'bit' and 'oo' in 'book'":
    "「bit」の 'i' と「book」の 'oo' の中間のような音です。",
  "no sound—softens the consonant before it":
    "音そのものはなく、前の子音をやわらかくします。",
  "no sound—prevents softening and adds a break":
    "音そのものはなく、軟化を防いで区切りを作ります。",
  "like 'ny' in 'canyon' or 'ni' in 'onion'":
    "「canyon」の 'ny' や「onion」の 'ni' に近い音です。",
  "single tap of tongue (like 't' in american 'butter')":
    "舌先を一度だけ軽くはじきます。アメリカ英語の「butter」の t に近い音です。",
  "rolled/trilled r - multiple taps of tongue":
    "舌を何度か震わせる巻き舌の R です。",
  "like 'y' in 'yes' as consonant; like 'i' when alone":
    "子音としては「yes」の y に近く、単独では I のように発音します。",
  "dutch has short and long vowels. short a is different from english!":
    "オランダ語には短母音と長母音があります。短い A は英語の A とは少し違う音です。",
  "like 's' before e/i; like 'k' before a/o/u":
    "E / I の前では「s」のように、A / O / U の前では「k」のように発音します。",
  "mostly in borrowed words. native dutch uses k or s.":
    "主に外来語で使われます。オランダ語の固有語では K や S を使うことが多いです。",
  "final d becomes t: 'goed' sounds like 'goot'.":
    "語末の D は T のように発音されます。'goed' は 'goot' に近い音になります。",
  "short: like 'e' in 'bed'; long (ee): like 'ay' without glide":
    "短い音は「bed」の「e」に近く、長い EE は滑り音のない『ay』に近い音です。",
  "unstressed e often becomes schwa (uh). very common!":
    "無強勢の E は弱い『uh』のような音になることが多く、とてもよく出てきます。",
  "guttural sound from back of throat, like clearing throat":
    "喉の奥でこすって出す音で、軽く喉を払うときの音に近いです。",
  "not like english j! dutch j = english y sound.":
    "英語の J とは違い、オランダ語の J は英語の Y に近い音です。",
  "clear l, similar to spanish.":
    "明るい L の音で、スペイン語の L に近い響きです。",
  "short o is more open. long o (oo) has no diphthong.":
    "短い O は口をやや大きく開けて発音します。長い OO は二重母音にせず、まっすぐ伸ばします。",
  "like 'k' - always with u":
    "「k」に近い音で、常に U と組み合わせて使われます。",
  "only in borrowed words. native dutch uses kw.":
    "主に外来語で使われます。オランダ語の固有語では KW を使います。",
  "varies: uvular (back), rolling, or american-style":
    "地域や話し方によって、喉の奥の R、巻き舌の R、英語風の R などに変わります。",
  "dutch r varies by region! uvular (french-like) is common in the west.":
    "オランダ語の R は地域差が大きく、西部ではフランス語に近い喉の奥の R がよく使われます。",
  "always unvoiced, like english s in 'sun'.":
    "常に無声音で、『sun』の S のように澄んだ音になります。",
  "dental t, unaspirated.":
    "歯に近い位置で作る、息の弱い T の音です。",
  "short: like 'u' in french 'tu'; long (uu): same but longer":
    "短い音はフランス語の『tu』の U に近く、長い UU はその音を長く伸ばします。",
  "not like english 'oo'! say 'ee' with rounded lips. unique sound!":
    "英語の『oo』とは違います。『ee』の口の形のまま唇を丸めて出す、オランダ語らしい独特の音です。",
  "like 'v' in 'very' (or like 'f' in some dialects)":
    "『very』の V に近い音ですが、方言によっては F のように聞こえることもあります。",
  "in standard dutch = v sound. in southern dialects = f sound.":
    "標準的なオランダ語では V の音ですが、南部の方言では F に近く聞こえることがあります。",
  "like 'v' in 'very' but with rounded lips":
    "『very』の V に近い音ですが、唇を少し丸めて発音します。",
  "between english w and v. more like v than w.":
    "英語の W と V の中間のような音ですが、V により近い響きです。",
  "only in borrowed words.":
    "主に外来語で使われます。",
  "like 'ee' in borrowed words":
    "外来語では『ee』に近い音になることがあります。",
  "only in foreign words. native dutch uses ij.":
    "主に外来語で使われます。オランダ語の固有語では IJ を使います。",
  "like 'z' in 'zoo' (or like 's' in some dialects)":
    "『zoo』の Z に近い音ですが、方言によっては S のように聞こえることもあります。",
  "voiced like english z. in belgium often sounds like s.":
    "英語の Z のような有声音です。ベルギーでは S のように聞こえることもよくあります。",
  "unique dutch diphthong - 'ow' with rounded lips":
    "オランダ語に特有の二重母音で、唇を丸めたまま『ow』に近い音を作ります。",
  "start with 'ah', move to rounded 'u'. no english equivalent! 'huis' = house.":
    "最初は『ah』に近く始めて、そこから唇を丸めた U の位置へ動かします。英語にぴったり対応する音はありません。『huis』は『家』です。",
  "like german ö - rounded 'eh'":
    "ドイツ語の Ö に近く、唇を丸めた『eh』のような音です。",
  "say 'ay' but round your lips. like french 'eu'.":
    "『ay』に近い舌の位置のまま、唇を丸めて発音します。フランス語の『eu』に近い音です。",
  "like 'sg' with guttural g, or 's' in some regions":
    "喉の奥で作る G を含む『sg』のような音ですが、地域によっては S のように発音されます。",
  "standard: s + guttural g. belgium/some areas: just s.":
    "標準的には S と喉の奥の G を続けた音です。ベルギーや一部地域では S だけになることもあります。",
  "same guttural sound as g":
    "G と同じ、喉の奥でこすって出す音です。",
  "ch and g make the same guttural sound!":
    "CH と G はどちらも同じ喉の奥の摩擦音になります。",
  "same as english 'ng'. no separate g sound after.":
    "英語の『ng』に近い音で、そのあとに独立した G の音は出しません。",
  "like 'g' in 'go' before a/o/u; like 'zh' before e/i":
    "a / o / u の前では「go」の 'g' に近く、e / i の前では『zh』に近い音です。",
  "like 'zh' - same as 's' in 'measure'":
    "『measure』の s に近い『zh』の音です。",
  "upper teeth touch lower lip. different from b!":
    "上の歯を下唇に軽く当てます。B とは違う音です。",
  "place tongue between teeth and vibrate vocal cords. feel the buzz!":
    "舌を歯の間に軽く置き、声帯を振動させます。ブーンという響きを感じてみましょう。",
  "same tongue position as voiced th, but whisper it—no vocal cord vibration.":
    "有声 TH と同じ舌の位置ですが、声帯は振動させず、ささやくように出します。",
  "same tongue position as voiced th, but whisper it-no vocal cord vibration.":
    "有声 TH と同じ舌の位置ですが、声帯は振動させず、ささやくように出します。",
  "unlike spanish/italian r, never tap or trill. tongue floats in the middle of mouth.":
    "スペイン語やイタリア語の R のように弾いたり巻いたりしません。舌は口の中央あたりに浮かせたままです。",
  "start with lips rounded like saying 'oo', then open quickly. not like v!":
    "最初は『oo』のように唇を丸め、そこから素早く開きます。V の音にはしません。",
  "different from w! bite your lower lip gently and hum.":
    "W とは違います。下唇をやさしく軽くかみ、声をのせて出します。",
  "relax your tongue and jaw. it's between 'ee' and 'eh'. most common english vowel!":
    "舌とあごの力を抜きます。『ee』と『eh』の中間くらいの音で、英語でとてもよく出る母音です。",
  "smile wide and raise your tongue high. this is closer to spanish 'i'.":
    "口角を少し上げ、舌を高めに保ちます。スペイン語の I により近い音です。",
  "the most common sound in english! completely relax mouth. appears in unstressed syllables.":
    "英語で最もよく出る音の一つです。口全体の力を抜き、無強勢の音節でよく現れます。",
  "drop your jaw low and spread lips slightly. doesn't exist in spanish!":
    "あごを低く下げ、唇を少し横に広げます。スペイン語にはない音です。",
  "open mouth wide, tongue low and back. similar to spanish 'a' but deeper.":
    "口を大きく開き、舌を低く奥に引きます。スペイン語の A に少し似ていますが、もっと深い響きです。",
  "round your lips and pull tongue back. like saying 'oh' but more open.":
    "唇を丸め、舌をやや後ろに引きます。『oh』に近いですが、もっと口を開いて発音します。",
  "relax everything! mouth slightly open, tongue in middle. common in stressed syllables.":
    "口全体の力を抜き、口を少し開いて舌を中央に置きます。強勢のある音節でよく使われます。",
  "lips rounded but relaxed. shorter and less tense than 'oo' in 'moon'.":
    "唇は丸めますが力は入れすぎません。『moon』の oo より短く、緊張も弱い音です。",
  "round lips tightly into a small circle. this is closer to spanish 'u'.":
    "唇を小さくしっかり丸めます。スペイン語の U により近い音です。",
  "start with mouth open, then glide to a smile. two sounds in one!":
    "最初は口を開け、そこから笑顔の口の形へ滑らせます。二つの音がつながったような母音です。",
  "start with mouth wide open, end with a smile. say 'ah-ee' quickly.":
    "最初は口を大きく開け、最後は笑顔の口の形にします。『ah-ee』を素早くつなげる感じです。",
  "start with mouth open, round lips at the end. say 'ah-oo' quickly.":
    "最初は口を開き、最後に唇を丸めます。『ah-oo』を素早くつなげる感じです。",
  "round lips throughout, but they get tighter at the end.":
    "最初から最後まで唇を丸めますが、終わりに近づくほど少し強く丸めます。",
  "start with rounded lips, end with a smile.":
    "最初は唇を丸め、最後は少し笑顔の口の形にします。",
  "back of tongue touches soft palate. air goes through nose. never add a 'g' sound after!":
    "舌の奥を軟口蓋に近づけ、空気は鼻に抜けます。あとに独立した G の音は足しません。",
  "same as sh but with voice. rare in english, usually spelled with s or g.":
    "SH と同じ位置の音ですが、有声にします。英語ではあまり多くなく、つづりでは S や G で表されることが多いです。",
  "at the end of syllables, l becomes 'dark'. back of tongue rises toward soft palate.":
    "音節末では L が『暗い L』になります。舌の奥が軟口蓋のほうへ少し上がります。",
  "at the start of syllables, l is 'clear'. similar to spanish l.":
    "音節の先頭では L は『明るい L』になります。スペイン語の L に近い音です。",
  "in american english, t between vowels becomes a quick flap—like spanish r!":
    "アメリカ英語では、母音にはさまれた T がスペイン語の R のような軽いはじき音になることがあります。",
  "in american english, t between vowels becomes a quick flap-like spanish r!":
    "アメリカ英語では、母音にはさまれた T がスペイン語の R のような軽いはじき音になることがあります。",
  "english has many silent letters from historical spelling. k in 'knee', w in 'write', b in 'doubt'.":
    "英語には歴史的なつづり由来の発音しない文字が多くあります。たとえば 'knee' の K、'write' の W、'doubt' の B です。",
  "english is stress-timed. stressed syllables stand out. photograph vs photographer.":
    "英語は強勢拍リズムの言語です。強勢のある音節がはっきり目立ちます。たとえば「photograph」と「photographer」では強勢の位置が異なります。",
  "curl tongue back without touching roof of mouth":
    "舌先を少し後ろに反らせますが、上あごには触れません。",
  "upper teeth touch lower lip, voiced":
    "上の歯を下唇に軽く当て、有声音で出します。",
  "the 'uh' in 'about', 'banana', 'sofa' - neutral, unstressed":
    "「about」「banana」「sofa」の『uh』に近い、中立的で無強勢の音です。",
  "like 'oo' in 'moon', 'food', 'blue' - tense rounded":
    "「moon」「food」「blue」の『oo』に近い、しっかり張った丸唇の音です。",
  "like 'l' at end of 'ball', 'full', 'milk' - back of tongue raised":
    "「ball」「full」「milk」の語末の L に近い音で、舌の奥を少し持ち上げます。",
  "like 'l' at start of 'love', 'let', 'light' - tongue tip touches ridge":
    "「love」「let」「light」の語頭の L に近い音で、舌先を歯ぐきに軽く当てます。",
  "letters that aren't pronounced: knight, write, doubt":
    "発音しない文字の例です。たとえば「knight」「write」「doubt」などがあります。",
  "like 'k' before a/o/u; like 's' before e/i (latin america)":
    "中南米では、a / o / u の前で『k』、e / i の前で『s』に近い音です。",
  "like 'd' in 'dog', but softer between vowels (like 'th' in 'the')":
    "「dog」の D に近い音ですが、母音にはさまれると「the」の TH に少し近い、やわらかい音になります。",
  "like 'g' in 'go' before a/o/u; like 'h' in 'hot' before e/i":
    "a / o / u の前では「go」の G に近く、e / i の前では「hot」の H に近い音です。",
  "strong 'h' from back of throat, like 'ch' in german 'bach'":
    "喉の奥から出す強い H のような音で、ドイツ語「Bach」の CH に近いです。",
  "like 'y' in 'yes' (most regions) or 'j' in 'judge' (argentina)":
    "多くの地域では「yes」の Y、アルゼンチンでは「judge」の J に近い音です。",
  "like 'o' in 'more' but shorter - always consistent":
    "「more」の O に近い音ですが、もっと短く、常に同じ音です。",
  "like 'k' - always followed by u (que, qui)":
    "『k』に近い音で、「QUE」「QUI」のように常に U を伴います。",
  "like 't' in 'stop' (dental, unaspirated)":
    "「stop」の T に近い、歯音の無気音です。",
  "same as b in spanish! lips together.":
    "スペイン語では B と同じ音です。両唇を軽く閉じて発音します。",
  "like 'w' in 'water' (only in borrowed words)":
    "「water」の W に近い音で、主に外来語で使われます。",
  "like 'ks' or 's' or 'h' depending on word":
    "単語によって『ks』『s』『h』のように聞こえます。",
  "like 's' in latin america; like 'th' in spain":
    "中南米では『s』、スペインでは『th』に近い音です。",
  "same as a, but marks stressed syllable":
    "A と同じ音ですが、強勢のある音節を示します。",
  "same as e, but marks stressed syllable":
    "E と同じ音ですが、強勢のある音節を示します。",
  "same as i, but marks stressed syllable":
    "I と同じ音ですが、強勢のある音節を示します。",
  "same as o, but marks stressed syllable":
    "O と同じ音ですが、強勢のある音節を示します。",
  "same as u, but marks stressed syllable":
    "U と同じ音ですが、強勢のある音節を示します。",
  "pronounced u in güe, güi (normally u is silent)":
    "GÜE / GÜI では U をはっきり発音します。通常の GUE / GUI では U は発音しません。",
  "unstressed: often silent or 'uh'; stressed: 'eh'":
    "無強勢では発音しないか『uh』に近くなり、強勢があると『eh』に近い音になります。",
  "like 'ay' in 'say' but shorter, no diphthong":
    "「say」の『ay』に近いですが、もっと短く、二重母音にはしません。",
  "closed 'oh' sound":
    "閉じた『oh』の音です。",
  "like 'k' - almost always followed by u":
    "『k』に近い音で、ほとんど常に U が続きます。",
  "like 's' at start; like 'z' between vowels":
    "語頭では『s』、母音の間では『z』に近い音です。",
  "rounded 'ee' - like german ü":
    "唇を丸めた『ee』のような音で、ドイツ語の Ü に近いです。",
  "same as u - only used in 'où'":
    "U と同じ音で、『où』でだけ使われます。",
  "like 'v' or 'w' depending on word origin":
    "語源によって『v』または『w』に近い音になります。",
  "nasal 'ah' - air through nose, no n sound":
    "鼻に空気を抜きながら出す『ah』のような鼻母音で、N の音は出しません。",
  "nasal 'oh' - rounded lips, air through nose":
    "唇を丸め、鼻に空気を抜きながら出す『oh』のような鼻母音です。",
  "nasal 'eh' - like 'an' in 'sang' but nasal":
    "フランス語「sang」の『an』に近い、鼻に抜ける『eh』系の音です。",
  "nasal 'uh' - merging with in in modern french":
    "現代フランス語では IN と近づきつつある、『uh』に近い鼻母音です。",
  "rounded 'eh' - like german ö":
    "唇を丸めた『eh』のような音で、ドイツ語の Ö に近いです。",
  "many final consonants are silent":
    "語末の子音は発音しないことが多いです。",
  "silent consonant pronounced before vowel":
    "通常は発音しない子音が、次に母音が来ると発音されます。",
  "at start of word: like english b. between vowels: lips don't fully close.":
    "語頭では英語の B に近い音です。母音にはさまれると、唇を完全には閉じず、少しやわらかくなります。",
  "in spain, c before e/i sounds like 'th' in 'think' (distinción).":
    "スペインでは、E / I の前の C は「think」の TH に近い音になります。いわゆる区別発音です。",
  "formerly a separate letter. same as english ch in 'church'.":
    "以前は独立した文字として扱われていました。音は英語「church」の CH と同じです。",
  "between vowels, d sounds almost like english 'th' in 'the'.":
    "母音にはさまれると、D は英語「the」の TH に近いやわらかい音になります。",
  "spanish e is always the same sound, never silent. purer than english e.":
    "スペイン語の E は常に同じ音で、発音しないことはありません。英語の E よりもまっすぐで純粋な音です。",
  "same as english f. upper teeth touch lower lip.":
    "英語の F と同じで、上の歯を下唇に軽く当てます。",
  "g before e/i makes the same sound as j (spanish j sound).":
    "E / I の前の G は J と同じ、スペイン語の喉の摩擦音になります。",
  "h is always silent! 'hola' sounds like 'ola'. never pronounce it.":
    "H は常に発音しません。『hola』は『ola』のように聞こえます。H 自体は発音しません。",
  "pure sound, never changes. shorter than english 'ee'.":
    "まっすぐで変化しない音です。英語の『ee』より短く発音します。",
  "stronger than english h. friction from the back of throat.":
    "英語の H より強く、喉の奥で摩擦を作って発音します。",
  "only used in borrowed words (kilo, karate). usually spelled with c or qu.":
    "主に外来語（「kilo」「karate」など）で使われます。固有語ではたいてい C や QU で表します。",
  "always 'clear l' like at start of english words, never 'dark l'.":
    "常に語頭の英語 L のような『明るい L』で、語末の『暗い L』にはなりません。",
  "in most countries: like y. in argentina/uruguay: like 'sh' or 'zh'.":
    "多くの地域では Y に近い音です。アルゼンチンやウルグアイでは『sh』や『zh』に近くなります。",
  "same as english m. lips close together.":
    "英語の M と同じで、両唇を閉じて発音します。",
  "same as english n. tongue touches ridge behind upper teeth.":
    "英語の N と同じで、舌先を上の歯の後ろの歯ぐきに当てます。",
  "unique to spanish! middle of tongue touches roof of mouth. like 'ny' together.":
    "スペイン語らしい独特の音です。舌の中央を口蓋に近づけ、『ny』を一つにしたように発音します。",
  "pure rounded sound, never becomes 'oh-oo' like in english 'go'.":
    "丸みのある純粋な O の音で、英語『go』のような『oh-oo』にはなりません。",
  "less air than english p. no puff of breath.":
    "英語の P より息が少なく、強い破裂は出しません。",
  "always appears as que or qui. the u is silent. 'que' = 'ke'.":
    "常に QUE / QUI の形で現れ、U は発音しません。『que』は『ke』のように聞こえます。",
  "single r = one quick tap. like american 'butter' or 'water'.":
    "単独の R は一度だけ軽くはじく音です。アメリカ英語の『butter』『water』の T に近い感じです。",
  "tongue vibrates multiple times against the ridge. practice: 'butter-butter-butter' fast!":
    "舌先を歯ぐきに当てて何度か震わせます。『butter-butter-butter』を速く言う練習が役立ちます。",
  "always unvoiced like 's' in 'sun', never like 'z' in 'zoo'.":
    "常に『sun』の S のような無声音で、『zoo』の Z にはなりません。",
  "tongue touches back of upper teeth (dental). no puff of air.":
    "舌先を上の歯の裏に当てる歯音で、強い息は出しません。",
  "pure rounded sound. never changes. silent in que, qui, gue, gui.":
    "まっすぐな丸い U の音で変化しません。QUE / QUI / GUE / GUI では U を発音しないことがあります。",
  "in spanish, b and v sound identical! don't use english v sound.":
    "スペイン語では B と V は同じ音です。英語の V のような摩擦音にはしません。",
  "only in foreign words. pronounced like english w or spanish u.":
    "主に外来語で使われ、英語の W かスペイン語の U に近く発音されます。",
  "'méxico' = 'méjico', 'examen' = 'eksamen'. varies by word origin.":
    "『México』は『Mejico』のように、『examen』は『eksamen』のように聞こえることがあります。語源によって変わります。",
  "as consonant: like english y. the word 'y' (and) sounds like spanish 'i'.":
    "子音としては英語の Y に近く、単語『y』（そして）はスペイン語の I のように発音されます。",
  "in spain: tongue between teeth like 'th' in 'think'. latin america: like s.":
    "スペインでは『think』の TH のように舌を歯の間に置きます。中南米では S に近い音です。",
  "accent shows which syllable is stressed. sound doesn't change, just emphasis.":
    "アクセント記号はどの音節に強勢があるかを示します。音自体は変わらず、強調だけが加わります。",
  "used to mark stress or distinguish words: 'el' (the) vs 'él' (he).":
    "強勢を示したり、単語を区別したりするために使います。たとえば『el』（その）と『el』（彼）を区別します。",
  "also breaks diphthongs: 'día' has two syllables (dí-a), not one.":
    "二重母音を分ける役割もあります。『dia』は 1 音節ではなく『di-a』の 2 音節になります。",
  "common in past tense: 'habló' (he/she spoke), 'comió' (he/she ate).":
    "過去形でよく見られます。たとえば『hablo』『comio』のような語です。",
  "less common, but used in words like 'menú', 'perú'.":
    "出現頻度は低めですが、『menu』『peru』のような語で使われます。",
  "makes the u audible in güe/güi: 'pingüino' = pin-gwi-no, not 'pin-gi-no'.":
    "GUE / GUI では通常発音しない U を、GUE / GUI で発音させる記号です。『pinguino』は『pin-gwi-no』のように聞こえます。",
  "spanish uses ¿ at the start and ? at the end of questions.":
    "スペイン語では疑問文の最初に ¿、最後に ? を置きます。",
  "spanish uses ¡ at the start and ! at the end of exclamations.":
    "スペイン語では感嘆文の最初に ¡、最後に ! を置きます。",
  "french a is between english 'cat' and 'father'. keep it pure.":
    "フランス語の A は英語の『cat』と『father』の中間くらいの音で、まっすぐ保って発音します。",
  "same rules as spanish and portuguese.":
    "ルールはスペイン語やポルトガル語とほぼ同じです。",
  "the most complex french letter! often silent at end of words.":
    "フランス語の中でも特に変化が多い文字です。語末では発音しないことがよくあります。",
  "closed e. always pronounced, never silent. 'été' = 'ay-tay'.":
    "閉じた E の音です。常に発音し、消えることはありません。『ete』は『ay-tay』のように聞こえます。",
  "same sound as è. circumflex often marks a historical 's': 'forêt' was 'forest'.":
    "È と同じ音です。サーカムフレックスは、昔ここに S があったことを示すことがあります。",
  "tréma means 'pronounce me separately!' 'noël' = 'no-el', not 'noel'.":
    "トレマは『この母音を分けて読んでください』という合図です。『Noel』は『no-el』のように読みます。",
  "g before e/i = 'zh' sound (like 's' in 'measure'). same as portuguese!":
    "E / I の前の G は『measure』の S に近い『zh』の音になります。ポルトガル語と同じタイプです。",
  "two types: h muet allows liaison, h aspiré blocks it. both silent!":
    "フランス語には「アッシュ・ミュエ」と「アッシュ・アスピレ」の 2 種類があります。どちらも H 自体は発音しませんが、リエゾンできるかどうかが変わります。",
  "pure sound, like spanish i.":
    "スペイン語の I のような、まっすぐな音です。",
  "same sound as i. circumflex marks historical spelling change.":
    "I と同じ音です。サーカムフレックスは歴史的なつづりの名残を示すことがあります。",
  "clear l like spanish, not dark l like end of english words.":
    "スペイン語のような『明るい L』で、英語語末の『暗い L』にはなりません。",
  "open o before certain consonants, closed o at end of syllables.":
    "子音によっては開いた O になり、音節末では閉じた O になることがあります。",
  "always closed o. 'hôtel' has closed o sound.":
    "常に閉じた O の音です。『hotel』の O がその例です。",
  "qu sounds like 'k' (u is silent). 'que' = 'kuh'.":
    "QU は『k』に近い音で、U は発音しません。『que』は『kuh』のように聞こえます。",
  "french r is uvular—back of tongue near uvula. not rolled! like gargling gently.":
    "フランス語の R は喉の奥、口蓋垂の近くで作る音です。巻き舌にはせず、軽くうがいするような感じで出します。",
  "between vowels: s = 'z' sound. 'maison' = 'may-zohn'.":
    "母音にはさまれた S は『z』に近い音になります。『maison』ではその音になります。",
  "dental t. often silent at end of words: 'petit' = 'puh-tee'.":
    "歯音の T です。語末では発音しないことがよくあり、『petit』もその例です。",
  "say 'ee' but round your lips tightly. not like spanish u! this is uniquely french.":
    "『ee』の舌の位置のまま唇をしっかり丸めます。スペイン語の U とは違う、フランス語らしい音です。",
  "same sound as u. marks historical spelling.":
    "U と同じ音で、歴史的なつづりを示します。",
  "rare in french. separates u from other vowels.":
    "フランス語では珍しく、U をほかの母音から分けて読ませます。",
  "german origin = 'v' sound. english origin = 'w' sound.":
    "ドイツ語由来の語では『v』、英語由来の語では『w』に近い音になります。",
  "usually 'ks'. in 'examen' = 'gz'. at word end often silent.":
    "通常は『ks』のように聞こえますが、『examen』では『gz』に近く、語末では発音しないこともあります。",
  "voiced like english z. often silent at end of words.":
    "英語の Z のような有声音ですが、語末では発音しないことがよくあります。",
  "same sound as a. used to distinguish words: 'a' (has) vs 'à' (to/at).":
    "A と同じ音ですが、単語の区別に使われます。",
  "traditionally longer/deeper a. modern french: often same as a.":
    "伝統的には少し長く深い A とされますが、現代フランス語では A とほぼ同じ音になることが多いです。",
  "say 'ah' while air goes through nose. the n is not pronounced!":
    "『ah』の口の形で、空気を鼻に抜きながら発音します。N 自体は発音しません。",
  "say 'oh' with rounded lips while air goes through nose.":
    "唇を丸めて『oh』に近い口の形を作り、空気を鼻に抜きます。",
  "open mouth like saying 'eh', air through nose.":
    "『eh』のように口を開け、空気を鼻に抜きます。",
  "this is the sound spanish speakers expect from 'u'. french u is different!":
    "スペイン語話者が U に期待する音はこちらです。フランス語の U はこれとは別の音です。",
  "final s, t, d, x, z, p are usually silent: 'petit', 'vous', 'grand'.":
    "語末の s, t, d, x, z, p は発音しないことが多く、『petit』『vous』『grand』などが例です。",
  "connect words! 'les amis' = 'lay-za-mee'. final s becomes z.":
    "単語どうしをつなげて読みます。『les amis』では語末の S が Z のように聞こえます。",
  "short: like 'o' in 'pot'; long (oo): like 'oh' but pure":
    "短い音は「pot」の O に近く、長い OO は『oh』に近いですが二重母音にしません。",
  "the dutch sound! like german 'ch' in 'bach' but voiced. practice gargling!":
    "オランダ語らしい代表的な音です。ドイツ語『Bach』の CH に近いですが、有声で出します。うがいする感じで練習してみましょう。",
  "short i is very short. long i is spelled 'ie'.":
    "短い I はとても短く、長い I の音は IE とつづられます。",
  "this is the dutch way to write the 'oo' sound!":
    "これがオランダ語で『oo』の音を書く代表的なつづりです。",
  "both ou and au make the same sound in dutch.":
    "オランダ語では OU と AU は同じ音になります。",
  "like 'b' in 'boy', but 'v' when lenited (bh)":
    "通常は『boy』の B に近い音ですが、軟化した BH では V のように聞こえます。",
  "like 'd' in 'dog', or 'j' sound when slender":
    "通常は『dog』の D に近く、前寄りの形では J に近い音になります。",
  "like 'h' in 'hello', or modifies consonants (lenition)":
    "『hello』の H に近い音ですが、子音の軟化を示す働きもあります。",
  "like 'l' in 'love', or palatalized when slender":
    "通常は『love』の L に近く、前寄りの形では口蓋化した響きになります。",
  "like 's' in 'sun', or 'sh' when slender":
    "通常は『sun』の S に近く、前寄りの形では『sh』に近い音になります。",
  "like 't' in 'top', or 'ch' when slender":
    "通常は『top』の T に近く、前寄りの形では『ch』に近い音になります。",
  "short a is common. can be broad (back) or slender (front) depending on context.":
    "短い A はよく使われ、文脈によって後ろ寄りにも前寄りにもなります。",
  "b alone is like english b. with h (bh), it becomes 'v' or 'w' sound.":
    "B 単独では英語の B に近い音です。H が付いて BH になると、V や W に近い音になります。",
  "always hard like k, never soft. with h (ch), sounds like german 'ch'.":
    "常に K のような硬い音で、軟音にはなりません。H が付いて CH になると、ドイツ語の CH に近い音になります。",
  "broad d is like english. slender d (before e, i) has a 'j' quality.":
    "後ろ寄りの D は英語に近く、前寄りの D（E / I の前）では J のような響きが加わります。",
  "short e sound. one of the slender vowels (e, i).":
    "短い E の音で、前寄りの母音（E / I）の一つです。",
  "standard f sound. when lenited (fh), it's silent!":
    "通常は F の音ですが、軟化した FH では発音しません。",
  "always hard g. with h (gh), it's a guttural sound or silent.":
    "常に硬い G の音です。GH になると喉の奥の音になったり、発音しなくなったりします。",
  "h often follows consonants to show lenition (softening). changes the sound completely.":
    "H はよく子音の後ろに付き、軟化を示します。音が大きく変わることがあります。",
  "short i. a slender vowel that affects surrounding consonants.":
    "短い I の音で、まわりの子音を前寄りの響きへ引っぱる役割があります。",
  "broad l is like english. slender l is lighter, tongue higher.":
    "後ろ寄りの L は英語に近く、前寄りの L はもっと軽く、舌の位置も高くなります。",
  "standard m sound. with h (mh), becomes 'v' or 'w'.":
    "通常は M の音ですが、MH になると V や W に近い音になります。",
  "broad n is standard. slender n is lighter, almost like 'ny'.":
    "後ろ寄りの N は標準的な音で、前寄りの N はもっと軽く、『ny』に少し近い響きになります。",
  "short o. a broad vowel (a, o, u).":
    "短い O の音で、後ろ寄りの母音（A / O / U）の一つです。",
  "standard p. with h (ph), becomes 'f' sound.":
    "通常は P の音ですが、PH になると F のように聞こえます。",
  "can be rolled or tapped. slender r is lighter.":
    "巻き舌にしたり、軽くはじいたりできます。前寄りの R はより軽い響きです。",
  "broad s is like english s. slender s (before e, i) sounds like 'sh'!":
    "後ろ寄りの S は英語の S に近く、前寄りの S（E / I の前）は『sh』に近い音になります。",
  "broad t is standard. slender t (before e, i) has a 'ch' quality.":
    "後ろ寄りの T は標準的な音で、前寄りの T（E / I の前）は『ch』に近い響きになります。",
  "short u. a broad vowel.":
    "短い U の音で、後ろ寄りの母音です。",
  "the most common greeting. literally 'god to you'. response: 'dia is muire duit'.":
    "最もよく使われるあいさつです。文字どおりには『あなたに神を』という意味で、返事は『Dia is Muire duit』です。",
  "like 'k' before a/o/u; like 'ch' in 'church' before e/i":
    "A / O / U の前では『k』に近く、E / I の前では『church』の CH に近い音です。",
  "like 'g' in 'go' before a/o/u; like 'j' in 'jump' before e/i":
    "A / O / U の前では『go』の G に近く、E / I の前では『jump』の J に近い音です。",
  "like 'k' - always followed by u":
    "『k』に近い音で、常に U が続きます。",
  "like 's' (unvoiced) or 'z' (voiced) depending on position":
    "位置によって、無声の『s』または有声の『z』に近い音になります。",
  "like 'ts' (unvoiced) or 'dz' (voiced)":
    "無声では『ts』、有声では『dz』に近い音になります。",
  "open a, marks stress on final syllable":
    "開いた A の音で、語末音節の強勢を示します。",
  "open e like 'e' in 'bed', stressed":
    "『bed』の E に近い開いた音で、強勢があります。",
  "closed e like 'ay' without diphthong, stressed":
    "二重母音にしない『ay』に近い閉じた E で、強勢があります。",
  "stressed i, like 'ee' in 'see'":
    "『see』の『ee』に近い I の音で、強勢があります。",
  "open o like 'aw', stressed":
    "『aw』に近い開いた O の音で、強勢があります。",
  "stressed u, like 'oo' in 'moon'":
    "『moon』の『oo』に近い U の音で、強勢があります。",
  "like 'k' in 'kite' - keeps hard c before e/i":
    "『kite』の K に近い音で、E / I の前でも C を硬い音に保ちます。",
  "like 'g' in 'go' - keeps hard g before e/i":
    "『go』の G に近い音で、E / I の前でも G を硬い音に保ちます。",
  "like 'k' (in borrowed words)":
    "外来語では『k』に近い音です。",
  "like 'w' or 'v' (in borrowed words)":
    "外来語では『w』または『v』に近い音です。",
  "like 'ks' (in borrowed words)":
    "外来語では『ks』に近い音です。",
  "like 'ee' (in borrowed words)":
    "外来語では『ee』に近い音です。",
  "pure and open, like spanish a. never changes.":
    "スペイン語の A のように開いていて純粋な音で、変化しません。",
  "dental d, tongue touches back of teeth.":
    "歯音の D で、舌先を歯の裏に軽く当てます。",
  "only appears at end of words. 'città', 'papà', 'perché no? → sì!'":
    "語末にだけ現れます。『citta』『papa』などで見られます。",
  "open e at end of words. 'è' means 'is'. 'caffè' has open e.":
    "語末の開いた E です。『e』（is の意味）や『caffe』の E がその例です。",
  "closed e at end of words. 'perché' (why/because) has closed e.":
    "語末の閉じた E です。『perche』の E がその例です。",
  "only at end of words. 'così' (so/thus), 'lì' (there).":
    "語末にだけ現れます。『cosi』『li』のような語で見られます。",
  "open o at end of words. 'però' (but/however).":
    "語末の開いた O です。『pero』の O がその例です。",
  "closed o accent is rare. most words use ò.":
    "閉じた O のアクセントは珍しく、多くの語では O を使います。",
  "only at end of words. 'più' (more), 'gioventù' (youth).":
    "語末にだけ現れます。『piu』『gioventu』のような語で見られます。",
  "h makes c hard before e/i: 'che' = 'ke', 'chi' = 'ki'.":
    "H が付くことで、E / I の前でも C を硬い音に保ちます。",
  "h makes g hard before e/i: 'ghetto', 'spaghetti'.":
    "H が付くことで、E / I の前でも G を硬い音に保ちます。",
  "gli = palatal l sound. 'famiglia' = 'fa-mee-lya'. beautiful italian sound!":
    "GLI は口蓋化した L の音です。『famiglia』に見られる、イタリア語らしい美しい音です。",
  "sc before e/i = 'sh' sound. 'pesce' = 'peh-sheh'. add h for 'sk': 'schema'.":
    "E / I の前の SC は『sh』に近い音です。『sk』の音にしたいときは H を足します。",
  "italian doubles are pronounced longer! 'fatto' vs 'fato', 'nonna' vs 'nona'. meaning changes!":
    "イタリア語の二重子音は長めに発音します。子音の長さで意味が変わることがあります。",
  "only in foreign words: 'jeans', 'jazz'. native italian uses i or gi.":
    "主に外来語でだけ使われます。イタリア語の固有語では I や GI を使います。",
  "only in foreign words. native italian uses c or ch.":
    "主に外来語でだけ使われ、固有語では C や CH を使います。",
  "only in foreign words: 'weekend', 'web'. italians often say 'v' instead.":
    "主に外来語でだけ使われます。イタリア語話者は V に近く発音することもあります。",
  "only in foreign words: 'taxi', 'extra'.":
    "主に外来語でだけ使われます。",
  "only in foreign words: 'yoga', 'yogurt'.":
    "主に外来語でだけ使われます。",
  "'ye' like 'yes' (after vowels/soft signs) or 'e' like 'met'":
    "母音や軟音記号のあとでは『yes』の YE に近く、それ以外では『met』の E に近い音になります。",
  "between english light and dark l":
    "英語の明るい L と暗い L の中間くらいの音です。",
  "like 'o' in 'more' when stressed; like 'a' in 'car' when unstressed":
    "強勢があると『more』の O に近く、無強勢では『car』の A に近い音になります。",
  "like 'you' in english":
    "英語の『you』に近い音です。",
  "one of the first vowels learners hear; pair with o to notice stress.":
    "学習の初期に出会う代表的な母音です。O と比べると強勢の違いに気づきやすくなります。",
  "a voiced consonant; vibrate the vocal cords lightly.":
    "有声子音です。声帯を軽く振動させながら出します。",
  "hard g—avoid the english 'j' sound you get before e/i.":
    "硬い G の音です。英語で E / I の前に出る J のような音にしないようにします。",
  "after a consonant, it softens it slightly: 'me' → 'meh' with a glide.":
    "子音のあとでは、その子音を少しやわらかくし、軽い滑りを加えます。",
  "always stressed; dots are sometimes omitted in print—listen for the 'yo'.":
    "常に強勢があり、印刷では点が省かれることもありますが、『yo』の音を意識して聞き取ります。",
  "a buzzy 'zh' sound; keep it voiced and smooth.":
    "少し濁った『zh』の音です。有声のまま、なめらかに出します。",
  "pair with с (s) to feel the voiced vs. unvoiced contrast.":
    "無声音の С と比べると、有声・無声の違いがつかみやすくなります。",
  "often appears at the end of diphthongs: 'ой', 'ай', 'ей'.":
    "『oi』『ai』『ei』のような二重母音の終わりによく現れます。",
  "crisp and unaspirated—less puff of air than english.":
    "はっきりした無気音で、英語より息の破裂が弱い音です。",
  "russian o reduces in unstressed positions—listen for this shift early.":
    "ロシア語の O は無強勢で弱くなることがあるので、早い段階からこの変化に慣れておきましょう。",
  "less air than english 'p'; think of a softer tap.":
    "英語の P より息が少なく、やわらかく軽い当たりの音です。",
  "a light trill; practice with quick taps like in spanish 'pero'.":
    "軽い巻き舌です。スペイン語『pero』のような短いはじきで練習するとつかみやすいです。",
  "keep it unvoiced; contrast with з for voiced/unvoiced pairs.":
    "無声音のまま保ちます。有声の З と比べると違いがわかりやすいです。",
  "touch just behind the teeth; less air than english 't'.":
    "歯のすぐ後ろに軽く触れ、英語の T より息を少なくして発音します。",
  "keep lips rounded and tense; don't let it drift toward english 'you'.":
    "唇を丸めて緊張を保ち、英語の『you』のような二重母音に寄せないようにします。",
  "light touch of teeth to lip; pair with в to feel voiced/unvoiced.":
    "歯を唇に軽く当てて出します。有声の В と比べると違いがわかりやすいです。",
  "a throaty 'kh'; airflow is important, keep it unvoiced.":
    "喉の奥で作る『kh』の音です。息の流れを意識し、無声音で出します。",
  "softer than english 'ch'; tongue closer to teeth.":
    "英語の CH よりやわらかく、舌を歯に少し近づけて発音します。",
  "keep lips neutral; contrast with щ for a softer hiss.":
    "唇は自然なままに保ちます。より柔らかい Щ と比べると違いがつかみやすいです。",
  "unique russian sound—pull the tongue back; don't let it become 'ee'.":
    "ロシア語らしい独特の音で、舌を少し後ろに引いて作ります。『ee』のようにならないようにします。",
  "seen mostly in borrowed words; adds a tiny pause before 'yo/ye/yu/ya'.":
    "主に借用語で見られ、『yo / ye / yu / ya』の前に小さな切れ目を作ります。",
  "short: like 'e' in 'bed'; long: like 'ay' without glide":
    "短い音は「bed」の E に近く、長い音は滑りのない『ay』に近いです。",
  "like 'g' in 'go'; at end often like 'k' or 'ch'":
    "通常は「go」の G に近く、語末では『k』や『ch』のように聞こえることがあります。",
  "like 'h' in 'hello' at start; silent after vowels (lengthens them)":
    "語頭では「hello」の H に近く、母音の後では発音せず、その母音を長くします。",
  "like 'kv' - always with u":
    "『kv』に近い音で、常に U と一緒に現れます。",
  "uvular r from back of throat, or vocalized to 'uh'":
    "喉の奥で作る R で、状況によっては『uh』のように弱く聞こえます。",
  "like 'z' before vowels; like 's' at end or before consonants":
    "母音の前では『z』、語末や子音の前では『s』に近い音です。",
  "like 'f' in native words; like 'v' in foreign words":
    "固有語では『f』、外来語では『v』に近い音です。",
  "like german ü (rounded 'ee')":
    "ドイツ語の Ü のような、丸めた『ee』の音です。",
  "like 'e' but with rounded lips - french eu":
    "『e』に近い舌の位置で、唇を丸めて出す音です。フランス語の EU に近いです。",
  "like 'ee' but with rounded lips - french u":
    "『ee』の舌の位置で唇を丸めて出す音です。フランス語の U に近いです。",
  "like 'ee' in 'see' - long i":
    "「see」の『ee』に近い、長い I の音です。",
  "p and f together quickly":
    "P と F を素早く続けて出す音です。",
  "german has short and long vowels. length changes meaning!":
    "ドイツ語には短母音と長母音があり、長さの違いで意味が変わることがあります。",
  "final b becomes p: 'ab' sounds like 'ap'. called auslautverhärtung.":
    "語末の B は P のように聞こえます。語末の無声化と呼ばれる現象です。",
  "alone, c is rare in german. usually part of ch, ck, or in foreign words.":
    "C 単独はドイツ語では珍しく、たいてい CH / CK の一部か外来語で現れます。",
  "final d becomes t: 'hund' sounds like 'hunt'.":
    "語末の D は T のように聞こえます。『Hund』がその例です。",
  "unstressed e at end often sounds like schwa (uh): 'katze' = 'katz-uh'.":
    "語末の無強勢 E はシュワ（『uh』のような音）になることがよくあります。",
  "final g: 'k' in most dialects, 'ch' in some northern regions.":
    "語末の G は多くの方言で『k』に近く、一部の北部地域では『ch』に近くなります。",
  "not like english j! german j = english y sound.":
    "英語の J とは違い、ドイツ語の J は英語の Y に近い音です。",
  "same as english k, but unaspirated.":
    "英語の K に近い音ですが、息の破裂は弱めです。",
  "clear l, like spanish. never dark l like english 'full'.":
    "スペイン語のような『明るい L』で、英語『full』のような暗い L にはなりません。",
  "long o has no diphthong—keep it pure, unlike english 'go'.":
    "長い O は二重母音にせず、英語『go』のように滑らせません。",
  "qu = 'kv' sound, not 'kw' like english!":
    "QU は英語の『kw』ではなく、『kv』に近い音になります。",
  "standard german r is uvular (french-like). after vowels often becomes 'uh'.":
    "標準ドイツ語の R はフランス語に近い喉の奥の R で、母音の後では『uh』のように弱くなることがあります。",
  "s before vowels = 'z' sound! 'sonne' = 'zonne'. different from english!":
    "母音の前の S は『z』に近い音です。英語とは違うので注意します。",
  "both short and long u are like english 'oo', just different lengths.":
    "短い U も長い U も英語の『oo』に近い音で、違いは主に長さです。",
  "v in german words = f sound! 'vater' = 'fater'. foreign words keep v sound.":
    "ドイツ語の固有語では V は『f』のように聞こえますが、外来語では『v』に近い音を保ちます。",
  "german w = english v sound! 'wasser' = 'vasser'.":
    "ドイツ語の W は英語の V に近い音です。『Wasser』がその例です。",
  "in german words, y sounds like ü. in foreign words, varies.":
    "固有のドイツ語では Y は Ü に近く、外来語では発音が変わります。",
  "german z = 'ts' sound! not like english z. 'zeit' = 'tsait'.":
    "ドイツ語の Z は『ts』に近い音で、英語の Z とは違います。",
  "say 'ay' but round your lips! no english equivalent. like french 'deux'.":
    "『ay』に近い舌の位置のまま唇を丸めて出します。英語にはない音で、フランス語の『deux』に近いです。",
  "say 'ee' but round your lips tightly! like french 'tu'.":
    "『ee』の舌の位置のまま唇をしっかり丸めて出します。フランス語の『tu』に近いです。",
  "after e, i, ä, ö, ü, and consonants: soft ch. like a breathy 'sh' but further forward.":
    "E / I / Ä / Ö / Ü や子音の後では、前のほうで作るやわらかい CH の音になります。",
  "after a, o, u, au: hard ch. like scottish 'loch' or spanish j.":
    "A / O / U / AU の後では、喉の奥で作る硬い CH の音になります。スコットランド英語の『loch』やスペイン語の J に近いです。",
  "sch = english 'sh' sound. 'schule' = 'shoo-luh'.":
    "SCH は英語の『sh』に近い音です。『Schule』がその例です。",
  "ei always = 'eye' sound. 'mein' = 'mine'. very consistent!":
    "EI は常に『eye』に近い音で、非常に一貫しています。",
  "ie = long 'ee' sound. 'liebe' = 'lee-buh'. opposite of english 'ie'!":
    "IE は長い『ee』の音になります。英語の IE とは感覚が逆です。",
  "pronounce both sounds! 'pferd' = 'pf-erd'. tricky for english speakers!":
    "P と F の両方をきちんと出します。英語話者には少し難しい組み合わせです。",
  "same as english 'ng' in 'sing'. no separate g sound.":
    "英語『sing』の NG と同じで、あとに独立した G の音は出しません。",
  "unlike english, pronounce the k! 'knie' = 'k-nee' (knee).":
    "英語と違って K もはっきり発音します。『Knie』がその例です。",
  "like 'a' in 'father' when stressed; reduced when unstressed":
    "強勢があると『father』の A に近く、無強勢では弱く短い音になります。",
  "like 's' in 'sun' - always":
    "常に『sun』の S に近い音です。",
  "like 'd' in 'dog'; like 'j' in 'judge' before i/e in brazil":
    "通常は『dog』の D に近く、ブラジルでは I / E の前で『judge』の J に近くなります。",
  "open 'eh' or closed 'ay' depending on word; often 'ee' at end":
    "単語によって開いた『eh』または閉じた『ay』になり、語末では『ee』に近くなることもあります。",
  "like 'l' in 'love'; like 'w' at end of syllables in brazil":
    "通常は『love』の L に近く、ブラジルでは音節末で『w』のように聞こえることがあります。",
  "like 'lli' in 'million' or 'y' in spanish 'llamar'":
    "『million』の LLI や、スペイン語『llamar』の Y に近い音です。",
  "like 'm' in 'mother'; nasalizes vowel at end of syllable":
    "通常は『mother』の M に近く、音節末では前の母音を鼻母音化します。",
  "like 'n' in 'no'; nasalizes vowel at end of syllable":
    "通常は『no』の N に近く、音節末では前の母音を鼻母音化します。",
  "open 'aw' or closed 'oh'; often 'oo' when unstressed":
    "開いた『aw』または閉じた『oh』になり、無強勢では『oo』に近く聞こえることがあります。",
  "varies: 'h' sound at start/after consonant; tap between vowels":
    "位置によって変わり、語頭や子音の後では H に近く、母音の間では軽いはじき音になります。",
  "like 'h' in 'hello' or guttural in some regions":
    "『hello』の H に近い音ですが、地域によってはより喉の奥の音になります。",
  "like 's' at start; like 'z' between vowels; like 'sh' in rio":
    "語頭では『s』、母音の間では『z』、リオでは『sh』に近く聞こえることがあります。",
  "like 't' in 'stop'; like 'ch' before i/e in brazil":
    "通常は『stop』の T に近く、ブラジルでは I / E の前で『ch』に近くなります。",
  "like 'v' in 'very' - teeth touch lower lip":
    "『very』の V に近い音で、上の歯を下唇に軽く当てて作ります。",
  "can be 'sh', 'ks', 'z', or 's' depending on word":
    "単語によって『sh』『ks』『z』『s』のいずれかに近い音になります。",
  "like 'z' in 'zoo'; like 'sh' at end of word in rio":
    "通常は『zoo』の Z に近く、リオでは語末で『sh』のように聞こえることがあります。",
  "nasal 'a' - like 'ung' in 'sung' but with 'a' sound":
    "『sung』の鼻に抜ける感じを保ちつつ、A 系の響きで出す鼻母音です。",
  "nasal 'o' - like 'own' but with nasality":
    "『own』に近い O 系の音を、鼻に抜ける響きで出します。",
  "open stressed 'a' like 'a' in 'father'":
    "強勢のある開いた A で、『father』の A に近い音です。",
  "open 'e' like 'e' in 'bed'":
    "『bed』の E に近い、開いた E の音です。",
  "closed 'e' like 'ay' in 'say' without the glide":
    "滑りのない『say』の AY に近い、閉じた E の音です。",
  "stressed 'i' like 'ee' in 'see'":
    "強勢のある I で、『see』の『ee』に近い音です。",
  "open 'o' like 'aw' in 'law'":
    "『law』の『aw』に近い、開いた O の音です。",
  "closed 'o' like 'oh' but pure, no diphthong":
    "『oh』に近い閉じた O の音で、二重母音にはしません。",
  "stressed 'u' like 'oo' in 'moon'":
    "強勢のある U で、『moon』の『oo』に近い音です。",
  "reduced, closed 'a' - less open than á":
    "Á よりも口の開きが小さい、弱めの閉じた A の音です。",
  "stressed a is open. unstressed a in brazil often sounds like 'uh'.":
    "強勢のある A は開いた音です。ブラジルでは無強勢の A が『uh』に近くなることがよくあります。",
  "unlike spanish, b and v are distinct sounds in portuguese.":
    "スペイン語と違って、ポルトガル語では B と V は別の音です。",
  "same rules as spanish. use ç for 's' sound before a/o/u.":
    "基本ルールはスペイン語に近く、A / O / U の前で『s』の音にしたいときに Ç を使います。",
  "in brazil: d before i/e sounds like 'dj'. 'dia' = 'djia'.":
    "ブラジルでは、I / E の前の D が『dj』に近い音になることがあります。",
  "three sounds: open é (bed), closed ê (day without diphthong), final e often like 'ee'.":
    "開いた É、閉じた Ê、そして語末で『ee』に近くなる E の 3 パターンがあります。",
  "g before e/i = 'zh' sound (like 's' in 'measure'). very different from spanish!":
    "E / I の前の G は『measure』の S に近い『zh』の音になります。スペイン語とはかなり違います。",
  "silent like in spanish. only matters in digraphs: ch, lh, nh.":
    "H 自体はスペイン語のように発音しませんが、CH / LH / NH などの組み合わせでは重要です。",
  "pure sound like spanish i. consistent throughout.":
    "スペイン語の I のような、まっすぐで一貫した音です。",
  "only in borrowed words. native words use c or qu.":
    "主に外来語で使われ、固有語では C や QU を使います。",
  "in brazil, final l sounds like w: 'brasil' = 'brasiw'. portugal keeps the l.":
    "ブラジルでは語末の L が W に近くなりますが、ポルトガルでは L の響きを保ちます。",
  "palatal l. tongue middle touches roof of mouth. like italian 'gl' in 'famiglia'.":
    "口蓋化した L の音で、舌の中央を口蓋に近づけます。イタリア語『famiglia』の GL に近いです。",
  "at end of syllable, m nasalizes the vowel: 'bem' = 'bẽ' (nasal).":
    "音節末の M は前の母音を鼻母音化します。",
  "at end of syllable, n nasalizes the vowel. silent itself.":
    "音節末の N は前の母音を鼻母音化し、N 自体は強くは聞こえません。",
  "exactly like spanish ñ! 'amanhã' = 'amañá'.":
    "スペイン語の Ñ にとても近い音です。『amanha』のような語で現れます。",
  "three sounds: open ó (law), closed ô (go), unstressed often like 'oo'.":
    "開いた Ó、閉じた Ô、そして無強勢で『oo』に近くなる O の 3 パターンがあります。",
  "qu before e/i: u is usually silent. qu before a/o: u is pronounced.":
    "E / I の前の QU では U を発音しないことが多く、A / O の前では U を発音します。",
  "initial r or rr = 'h' sound (like english h). between vowels = tap like spanish.":
    "語頭の R や RR は H に近く、母音の間ではスペイン語のような軽いはじき音になります。",
  "in brazil: often like 'h'. in portugal: guttural. not a trill like spanish!":
    "ブラジルでは H に近く、ポルトガルでは喉の奥の音になることが多く、スペイン語の巻き舌とは違います。",
  "between vowels s = 'z' sound. in rio/portugal end of word s = 'sh'.":
    "母音の間の S は『z』に近く、リオやポルトガルでは語末の S が『sh』に近くなります。",
  "in brazil: t before i/e sounds like 'ch'. 'tia' = 'chia'.":
    "ブラジルでは、I / E の前の T が『ch』に近くなることがあります。",
  "pure sound like spanish u. consistent.":
    "スペイン語の U のような、まっすぐで安定した音です。",
  "unlike spanish, v is distinct from b! use english v sound.":
    "スペイン語と違って、V は B と別の音です。英語の V に近い音を使います。",
  "most common: 'sh' (xícara). also 'ks' (táxi), 'z' (exame), 's' (próximo).":
    "最もよくあるのは『sh』ですが、語によって『ks』『z』『s』にもなります。",
  "only in borrowed words. sounds like i.":
    "主に外来語で使われ、I に近い音になります。",
  "voiced like english z. in rio/portugal, final z = 'sh'.":
    "英語の Z のような有声音ですが、リオやポルトガルでは語末で『sh』に近くなることがあります。",
  "air goes through nose and mouth. unique portuguese sound! 'irmã' = sister.":
    "空気が鼻と口の両方に抜ける、ポルトガル語らしい鼻母音です。",
  "rounded lips + air through nose. common in plural: 'ões' (ções, ções).":
    "唇を丸め、空気を鼻に抜きながら発音する鼻母音です。複数形でよく現れます。",
  "acute accent marks stress and open quality. very open sound.":
    "アキュートアクセントは強勢と開いた響きを示します。かなり開いた音です。",
  "open e, mouth more open than ê. 'café' has open e.":
    "開いた E で、Ê より口を大きく開けます。『cafe』の E がその例です。",
  "closed e, mouth less open. 'você' has closed e.":
    "閉じた E で、口の開きは小さめです。『voce』の E がその例です。",
  "marks stress. same sound as unstressed i, just emphasized.":
    "強勢を示す記号で、音自体は I と同じですが強く読まれます。",
  "open o, more like 'aw'. mouth open wider than ô.":
    "開いた O で、『aw』に近い響きです。Ô より口を大きく開けます。",
  "closed o, lips more rounded. 'avô' (grandfather) vs 'avó' (grandmother).":
    "閉じた O で、唇をより丸めます。アクセントの違いで意味が変わる例があります。",
  "marks stress. same sound as unstressed u.":
    "強勢を示す記号で、音自体は U と同じです。",
  "closed a, less common. found in words like 'câmera'.":
    "やや閉じた A の音で、出現頻度は低めです。",
  "short: like 'o' in 'pot'; long: like 'oh' but pure":
    "短い音は「pot」の O に近く、長い音は『oh』に近いですが二重母音にはしません。",
  "dental t, unaspirated. tongue touches back of teeth.":
    "歯音の無気音 T で、舌先を歯の裏に軽く当てます。",
  "a soft 'gh', like the 'ch' in spanish 'lago'":
    "スペイン語『lago』の CH に近い、やわらかい喉の音です。",
  "keep the vowel open and steady.":
    "母音を開いたまま、安定して発音します。",
  "modern greek beta is a voiced v sound.":
    "現代ギリシャ語のベータは、有声の V の音です。",
  "keep it voiced; feel the vibration.":
    "有声のまま保ち、振動を感じながら発音します。",
  "unvoiced 'th' with a soft airflow.":
    "やわらかい息を伴う、無声の TH の音です。",
  "crisp, unaspirated k.":
    "はっきりした無気音の K です。",
  "final sigma uses the ς shape.":
    "語末のシグマは ς の形を使います。",
  "same vowel as eta/iota in modern greek.":
    "現代ギリシャ語ではイータやイオタと同じ母音です。",
  "blend p + s together.":
    "P と S をすばやく続けて一つの音のように出します。",
  "like 'h' in 'hello' or german 'ch'":
    "『hello』の H、またはドイツ語の CH に近い音です。",
  "like 'ny' in 'canyon' or spanish 'ñ'":
    "『canyon』の NY やスペイン語の Ñ に近い音です。",
  "rolled r - like spanish r":
    "スペイン語の R のような巻き舌の音です。",
  "soft 'zh' - voiced version of ś":
    "やわらかい『zh』の音で、Ś の有声音版です。",
  "open vowel, similar to english 'ah'.":
    "英語の『ah』に近い、開いた母音です。",
  "nasalized vowel. put tongue as if saying 'o', then add nasal resonance.":
    "鼻母音です。『o』を言うような舌の形で、鼻への響きを加えます。",
  "standard b sound, same as english.":
    "英語と同じ標準的な B の音です。",
  "always pronounced 'ts', never like 'k' or 's' alone.":
    "常に『ts』と読み、『k』単独や『s』単独にはなりません。",
  "softer than english 'ch'. tongue touches palate lightly.":
    "英語の CH よりやわらかく、舌を口蓋に軽く当てて発音します。",
  "standard d sound, tongue touches behind upper teeth.":
    "標準的な D の音で、舌先を上の歯の後ろに当てます。",
  "short, open 'e' sound.":
    "短く開いた E の音です。",
  "nasalized 'e'. at word end, often just sounds like regular 'e'.":
    "鼻母音の E です。語末では普通の E に近く聞こえることもあります。",
  "standard f sound.":
    "標準的な F の音です。",
  "always hard g, never soft like in 'gem'.":
    "常に硬い G の音で、『gem』のような軟音にはなりません。",
  "can be breathy like english h or slightly rougher.":
    "英語の H のように息を伴った音にも、少し粗い音にもなります。",
  "always a clear 'ee' sound.":
    "常に澄んだ『ee』の音です。",
  "polish j is always like english y, never like english j.":
    "ポーランド語の J は常に英語の Y に近く、英語の J にはなりません。",
  "standard k sound.":
    "標準的な K の音です。",
  "clear l sound, tongue touches upper teeth ridge.":
    "明るい L の音で、舌先を上の歯の後ろの歯ぐきに当てます。",
  "sounds like english w, not l. very common in polish.":
    "L ではなく英語の W に近い音です。ポーランド語でとてもよく出てきます。",
  "standard m sound.":
    "標準的な M の音です。",
  "standard n sound.":
    "標準的な N の音です。",
  "soft n, similar to spanish ñ.":
    "やわらかい N の音で、スペイン語の Ñ に少し似ています。",
  "open o sound, rounded lips.":
    "唇を丸めて出す、開いた O の音です。",
  "sounds like u, not o! same as polish u.":
    "O ではなく U のように聞こえる音で、ポーランド語の U と同じです。",
  "standard p sound.":
    "標準的な P の音です。",
  "trilled/rolled r, tongue vibrates against roof of mouth.":
    "巻き舌の R で、舌先を上あご付近で震わせます。",
  "standard s sound, always voiceless.":
    "標準的な S の音で、常に無声音です。",
  "standard t sound, tongue touches teeth.":
    "標準的な T の音で、舌先を歯に当てます。",
  "same sound as ó. rounded lips, 'oo' sound.":
    "Ó と同じ音で、唇を丸めた『oo』のような響きです。",
  "polish w sounds like english v, not w!":
    "ポーランド語の W は英語の V に近く、W の音にはなりません。",
  "short i sound, between 'ee' and 'i' in 'bit'.":
    "短い I の音で、『ee』と『bit』の I の中間くらいです。",
  "voiced s sound, like english z.":
    "英語の Z に近い、有声の S の音です。",
  "voiced version of ś. like 'zh' but softer.":
    "Ś の有声音版で、『zh』に近いですがもっとやわらかい音です。",
  "like the 's' in 'measure' or 'vision'.":
    "英語『measure』『vision』の S に近い音です。",
  "breathy 'h' (like spanish ‘j’ but lighter)":
    "スペイン語の J に少し似た、より軽い息の H のような音です。",
  "dental t, unaspirated":
    "歯音の無気音 T です。",
  "like 's' in 'sun' (always unvoiced)":
    "『sun』の S のような音で、常に無声音です。",
  "final -t after a vowel":
    "母音のあとに来る語末の -t です。",
  "pure sound; never silent.":
    "まっすぐな音で、発音しなくなることはありません。",
  "write **kw** (not cu/uc).":
    "つづりは **kw** を使い、cu / uc にはしません。",
  "lips together; unaspirated.":
    "唇を閉じて作る、無気音です。",
  "dental/alveolar, spanish-like.":
    "歯または歯ぐきに近い位置で作る、スペイン語に近い音です。",
  "less air than english.":
    "英語より息の量が少ない音です。",
  "iconic sound; some communities write final -t, but you’ll hear tl.":
    "この言語を象徴する音です。語末を -t と書くこともありますが、実際には TL として聞こえます。",
  "always /ʃ/ in náhuat.":
    "ナワトル語では常に /ʃ/ の音です。",
  "glides smoothly between vowels.":
    "母音の間をなめらかにつなぐ滑り音です。",
  "write with apostrophe (ʼ). changes meaning.":
    "アポストロフィ（ʼ）で書き、あるかないかで意味が変わります。",
  "common absolutive after vowels: a- + -t → at.":
    "母音のあとでよく使われる絶対語尾で、a- に -t が付くと『at』のようになります。",
  "kal- + -li → kali.":
    "たとえば『kal-』に『-li』が付くと『kali』のようになります。",
  "used with some animates: sitlal- + -in → sitlatin.":
    "一部の有生名詞で使われ、たとえば『sitlal-』に『-in』が付くと『sitlatin』のようになります。",
  "keep it open and steady.":
    "口を開いたまま、音を安定して保ちます。",
  "softer than english 'sh'. tongue closer to teeth.":
    "英語の『sh』よりやわらかく、舌を歯に少し近づけて発音します。",
  "open 'a' like in 'father'":
    "『father』の A に近い開いた音です。",
  "like 'e' in 'bed', but pure and steady":
    "『bed』の E に近いですが、もっとまっすぐで安定した音です。",
  "like 'o' in 'go' but without a glide":
    "『go』の O に近いですが、滑り音を加えません。",
  "voiced 'b' sound":
    "有声の B の音です。",
  "a brief catch or pause in the throat":
    "喉で一瞬せき止めるような、短い区切りの音です。",
  "keep the vowel steady and clear; it does not change.":
    "母音を安定してはっきり保ち、途中で変化させません。",
  "keep lips rounded and the vowel steady.":
    "唇を丸めたまま、母音を安定して保ちます。",
  "close both lips, then release with voice.":
    "両唇を閉じてから、有声で開放します。",
  "back of the tongue touches the soft palate.":
    "舌の奥を軟口蓋に軽く当てて作ります。",
  "air flows through a narrow channel then releases.":
    "空気を細い通り道に通してから解放する音です。",
  "blend a quick 't' and 's' together.":
    "素早い『t』と『s』をつなげて一つの音にします。",
  "same as english b. when doubled (bb), hold it longer.":
    "英語の B と同じ音です。BB のように重なると少し長めに保ちます。",
  "c before e/i = 'ch' sound. different from spanish!":
    "E / I の前の C は『ch』に近い音になります。スペイン語とは違います。",
  "two sounds: open e (bed) and closed e (say without diphthong). regional variation.":
    "開いた E と閉じた E の 2 種類があり、地域差もあります。",
  "g before e/i = 'j' sound (like english j). very different from spanish!":
    "E / I の前の G は英語の J に近い音になります。スペイン語とはかなり違います。",
  "silent! but changes c, g, sc sounds: 'che' = 'ke', 'ghe' = 'ge'.":
    "H 自体は発音しませんが、C / G / SC の音を変えます。たとえば『che』『ghe』のような形です。",
  "pure sound like spanish i.":
    "スペイン語の I のような、まっすぐな音です。",
  "two sounds: open o and closed o. regional variation exists.":
    "開いた O と閉じた O の 2 種類があり、地域差もあります。",
  "qu = 'kw' sound. the u is always pronounced: 'quando' = 'kwan-do'.":
    "QU は『kw』に近い音で、U も必ず発音します。『quando』がその例です。",
  "always trilled! single r = light trill, rr = strong trill. like spanish r.":
    "常に巻き舌系の R です。単独の R は軽く、RR はより強く震わせます。スペイン語の R に近いです。",
  "before voiced consonants: s = 'z'. between vowels: varies by region.":
    "有声子音の前では S は『z』に近くなります。母音の間では地域によって異なります。",
  "dental t, unaspirated. tongue touches teeth.":
    "歯音の無気音 T で、舌先を歯に当てます。",
  "pure sound like spanish u.":
    "スペイン語の U のような、まっすぐな音です。",
  "two sounds! 'pizza' = 'ts', 'zero' = 'dz'. regional variation.":
    "2 種類の読み方があり、『pizza』では『ts』、『zero』では『dz』に近い音になります。地域差もあります。",
  "no sound - marks beginning of question":
    "音はありませんが、疑問文の始まりを示します。",
  "no sound - marks beginning of exclamation":
    "音はありませんが、感嘆文の始まりを示します。",
};

const PHRASE_TRANSLATIONS = [
  ["never changes sound", "音が変わりません"],
  ["keep it open and consistent", "口を開いたまま、安定して発音します"],
  ["keep it pure", "まっすぐな音のまま発音します"],
  ["keep it rounded", "唇を丸めたまま保ちます"],
  ["keep the vowel steady and clear", "母音を安定してはっきり保ちます"],
  ["avoid diphthongs", "二重母音にしません"],
  ["keep the vowel short and clean", "母音を短く澄んだ音で保ちます"],
  ["smile slightly and keep the tongue high", "少し口角を上げ、舌を高めに保ちます"],
  ["round your lips and keep the sound short", "唇を丸め、短く発音します"],
  ["touch the tongue tip to the teeth or ridge", "舌先を歯または歯ぐきに軽く当てます"],
  ["keep the tongue high and the airflow soft", "舌を高めに保ち、息をやわらかく流します"],
  ["think of the pause in the middle of 'uh-oh'", "英語の『uh-oh』の真ん中にある小さな切れ目を思い浮かべてください"],
  ["tongue between teeth", "舌を歯の間に置いて"],
  ["no voice", "無声音で"],
  ["relaxed, short", "力を抜いた短い音です"],
  ["tense, long", "緊張のある長い音です"],
  ["mouth wide open", "口を大きく開けて"],
  ["rounded back vowel", "唇を丸めた後舌母音です"],
  ["relaxed central vowel", "力を抜いた中舌母音です"],
  ["relaxed rounded", "力を抜いて唇を丸めた音です"],
  ["glides from eh to ee", "eh から ee へ滑るように移る音です"],
  ["glides from ah to ee", "ah から ee へ滑るように移る音です"],
  ["glides from ah to oo", "ah から oo へ滑るように移る音です"],
  ["glides from oh to oo", "oh から oo へ滑るように移る音です"],
  ["glides from aw to ee", "aw から ee へ滑るように移る音です"],
  ["nasal back consonant", "鼻音の後舌子音です"],
  ["tongue pulled back", "舌を少し後ろに引いて発音します"],
  ["starts with t", "最初に T の成分が入る音です"],
  ["sounds like a quick d", "素早い D のように聞こえます"],
  ["but softer between vowels", "ただし母音にはさまれると少しやわらかくなります"],
  ["like a breathy 'sh' but further forward", "息を多めに含んだ『sh』に近いですが、もっと前の位置で作ります"],
  ["short and bright vowel", "短く明るい母音です"],
  ["tongue just behind the teeth", "舌先を歯のすぐ後ろに置きます"],
  ["short o sound", "短い O の音です"],
  ["crisp t without aspiration", "はっきりした T の音で、強い息は出しません"],
  ["long, rounded o sound", "長くて丸みのある O の音です"],
  ["feels familiar—keep lips soft, not explosive", "なじみやすい音ですが、唇に力を入れすぎず、強くはじかないようにします"],
  ["feels familiar-keep lips soft, not explosive", "なじみやすい音ですが、唇に力を入れすぎず、強くはじかないようにします"],
  ["tap the tongue just behind the teeth for a clean sound", "歯のすぐ後ろで舌先を軽くはじき、すっきりした音にします"],
  ["after a consonant, it softens it slightly", "子音のあとでは、その子音を少しやわらかくします"],
  ["smile slightly; it's a front vowel that softens nearby consonants", "少し口角を上げて発音する前舌母音で、近くの子音をやわらかくします"],
  ["touch the tongue tip to the ridge behind the teeth; keep it light", "歯の後ろの歯ぐきに舌先を軽く当てます"],
  ["humming helps—feel vibration in the lips", "ハミングすると唇の振動を感じやすくなります"],
  ["humming helps-feel vibration in the lips", "ハミングすると唇の振動を感じやすくなります"],
  ["place tongue at the ridge behind teeth; pairs with soft vowels to lighten it", "歯の後ろの歯ぐきに舌先を置き、やわらかい母音と合わせると軽い響きになります"],
  ["a quick 'ts' burst; avoid turning it into 'tsss'", "素早い『ts』の破裂音です。『tsss』と引き伸ばさないようにします"],
  ["a long, soft 'shch'; smile slightly to soften it", "長くやわらかい『shch』の音です。少し口角を上げるとやわらかくなります"],
  ["unlike е, it doesn't add a 'y' glide and doesn't soften consonants", "Е と違って『y』の滑り音を加えず、前の子音もやわらかくしません"],
  ["adds a light 'y' before the vowel; softens the preceding consonant", "母音の前に軽い『y』の滑りを加え、前の子音をやわらかくします"],
  ["glide + vowel; also softens the consonant before it", "滑り音と母音が一緒になった音で、前の子音もやわらかくします"],
  ["think of it as a softness marker; changes pronunciation but not a vowel", "母音ではなく、やわらかさを示す記号だと考えてください。発音は変わります"],
  ["only appears before a, o, u", "a / o / u の前にだけ現れます"],
  ["makes 's' sound", "『s』の音にします"],
  ["short and pure", "短く澄んだ音です"],
  ["represents the breathy h sound", "息を伴う H の音を表します"],
  ["tongue touches ridge behind teeth", "舌先を歯の後ろの歯ぐきに当てます"],
  ["tip of tongue at upper teeth", "舌先を上の歯に当てます"],
  ["replaces c/qu from classical spelling", "古い綴りの c / qu の代わりに使います"],
  ["replaces hu/uh", "hu / uh の代わりに使います"],
  ["replaces tz", "tz の代わりに使います"],
  ["replaces z and soft c", "z と軟音の c の代わりに使います"],
  ["at the start of syllables", "音節の先頭では"],
  ["at the start of words", "語頭では"],
  ["at the start of word", "語頭では"],
  ["at the end of syllables", "音節末では"],
  ["at the end of words", "語末では"],
  ["at the end of word", "語末では"],
  ["at the end of a word", "語末では"],
  ["at the end", "語末では"],
  ["before voiced consonants", "有声子音の前では"],
  ["before consonants", "子音の前では"],
  ["before vowels", "母音の前では"],
  ["before a vowel", "母音の前では"],
  ["before e/i", "e/i の前では"],
  ["before i/e", "i/e の前では"],
  ["before a/o/u", "a/o/u の前では"],
  ["between vowels", "母音の間では"],
  ["after vowels", "母音の後では"],
  ["after a vowel", "母音の後では"],
  ["borrowed words", "外来語"],
  ["foreign words", "外来語"],
  ["native words", "固有語"],
  ["native dutch", "オランダ語固有語"],
  ["native italian", "イタリア語固有語"],
  ["native japanese", "日本語固有語"],
  ["always followed by u", "常に U が続きます"],
  ["always with u", "常に U と一緒に使われます"],
  ["always silent", "常に発音しません"],
  ["never silent", "発音しないことはありません"],
  ["not silent", "発音します"],
  ["sometimes silent", "発音しないことがあります"],
  ["silent after vowels", "母音の後では発音しません"],
  ["silent itself", "文字自体は発音しません"],
  ["silent letters", "発音しない文字"],
  ["silent", "発音しない"],
  ["unaspirated", "無気音の"],
  ["unvoiced", "無声音の"],
  ["voiced", "有声音の"],
  ["nasalized", "鼻音化した"],
  ["nasal", "鼻音の"],
  ["rounded lips", "唇を丸める"],
  ["lips rounded", "唇を丸めて"],
  ["lips stay relaxed", "唇はリラックスさせます"],
  ["back of tongue", "舌の奥"],
  ["tongue touches upper teeth", "舌先を上の歯につけて"],
  ["tongue touches teeth", "舌先を歯につけて"],
  ["tongue touches roof behind teeth", "歯のすぐ後ろの口蓋に舌先をつけて"],
  ["tongue tip touches ridge", "舌先を歯ぐきのふくらみに軽く当てて"],
  ["tongue tip touches", "舌先を当てて"],
  ["back of throat", "喉の奥"],
  ["from back of throat", "喉の奥から"],
  ["guttural", "喉の奥で作る"],
  ["glottal stop", "声門閉鎖音"],
  ["brief catch", "短い詰まり"],
  ["brief pause", "短い間"],
  ["held longer", "少し長めに保って"],
  ["with brief pause", "短い間を入れて"],
  ["clear l", "明るい L"],
  ["dark l", "暗い L"],
  ["soft sign", "軟音記号"],
  ["hard sign", "硬音記号"],
  ["open back vowel", "開いた後舌母音"],
  ["mid-vowel", "中舌母音"],
  ["pure and steady", "純粋で安定した"],
  ["pure and clean", "純粋で澄んだ"],
  ["pure and short", "純粋で短い"],
  ["pure, no diphthong", "純粋な単母音で、二重母音にしません"],
  ["no diphthong", "二重母音にしません"],
  ["with rounded lips", "唇を丸めて"],
  ["with voice", "声を出して"],
  ["without the glide", "滑り音を加えずに"],
  ["without a glide", "滑り音を加えずに"],
  ["without much air", "息を出しすぎずに"],
  ["without touching roof of mouth", "口蓋には触れずに"],
  ["always hard", "常に硬音です"],
  ["always consistent", "常に同じ音です"],
  ["less common", "あまり一般的ではありません"],
  ["less puff than english", "英語より息が少なく"],
  ["more like v than w", "W より V に近い音です"],
  ["more rounded", "より丸めて"],
  ["more open", "より開いて"],
  ["more open than", "〜より口を開いて"],
  ["more closed", "より閉じて"],
  ["very consistent", "かなり安定しています"],
  ["very dutch", "とてもオランダ語らしい音です"],
  ["in casual speech", "くだけた会話では"],
  ["in standard dutch", "標準オランダ語では"],
  ["in southern dialects", "南部の方言では"],
  ["in some regions", "地域によっては"],
  ["in some dialects", "一部の方言では"],
  ["in most dialects", "多くの方言では"],
  ["in most countries", "多くの地域では"],
  ["in brazil", "ブラジルでは"],
  ["in portugal", "ポルトガルでは"],
  ["in spain", "スペインでは"],
  ["in belgium", "ベルギーでは"],
  ["in rio", "リオでは"],
  ["in argentina/uruguay", "アルゼンチンやウルグアイでは"],
  ["same sound as", "〜と同じ音です"],
  ["same as", "〜と同じです"],
  ["different from", "〜とは異なります"],
  ["like english", "英語のように"],
  ["like spanish", "スペイン語のように"],
  ["like french", "フランス語のように"],
  ["like german", "ドイツ語のように"],
  ["like portuguese", "ポルトガル語のように"],
  ["like italian", "イタリア語のように"],
  ["like scottish", "スコットランド英語のように"],
  ["english w", "英語の W"],
  ["english y", "英語の Y"],
  ["english j", "英語の J"],
  ["english ch", "英語の CH"],
  ["english th", "英語の TH"],
  ["english sh", "英語の SH"],
  ["english oo", "英語の OO"],
  ["english v", "英語の V"],
  ["english z", "英語の Z"],
  ["english s", "英語の S"],
  ["english h", "英語の H"],
  ["spanish ñ", "スペイン語の Ñ"],
  ["spanish j", "スペイン語の J"],
  ["spanish l", "スペイン語の L"],
  ["spanish r", "スペイン語の R"],
  ["spanish-like", "スペイン語に近い"],
  ["american english", "アメリカ英語"],
  ["stress-timed", "強勢拍リズム"],
  ["historical spelling", "歴史的なつづり"],
  ["historical", "歴史的な"],
  ["spelling difference is historical", "つづりの違いは歴史的なものです"],
  ["depends on word", "単語によって変わります"],
  ["depending on word", "単語によって変わります"],
  ["depending on following sounds", "後ろに来る音によって変わります"],
  ["depending on position", "位置によって変わります"],
  ["depends on position", "位置によって変わります"],
  ["depending on origin", "語源によって変わります"],
  ["depending on region", "地域によって変わります"],
  ["air goes through nose and mouth", "空気が鼻と口の両方に抜けます"],
  ["air goes through nose", "空気が鼻に抜けます"],
  ["pair with", "〜と比べてみましょう"],
  ["use it to", "〜の練習に使えます"],
  ["counts as its own mora", "1 モーラとして数えます"],
  ["touches back of teeth", "歯の裏に触れます"],
  ["soft palate", "軟口蓋"],
  ["vocal cords", "声帯"],
];

const WORD_TRANSLATIONS = [
  ["varies", "変化します"],
  ["becomes", "になります"],
  ["become", "になる"],
  ["called", "と呼ばれます"],
  ["pronounced", "発音されます"],
  ["pronounce", "発音します"],
  ["dropped in speech", "会話では省かれることがあります"],
  ["very common", "とても一般的です"],
  ["common", "一般的です"],
  ["neutral", "中立的な"],
  ["unstressed", "無強勢の"],
  ["stressed", "強勢のある"],
  ["open", "開いた"],
  ["closed", "閉じた"],
  ["rolling", "巻き舌の"],
  ["release", "離します"],
  ["together", "一緒に"],
  ["separately", "分けて"],
];

const EXACT_MEANING_TRANSLATIONS = {
  honored: "敬意を受けた",
  egoist: "利己主義者",
  naive: "世間知らず",
  french: "フランス語",
  german: "ドイツ語",
  "irish (language)": "アイルランド語",
  "nahuatl language": "ナワトル語",
  "maya (language/people)": "マヤ語 / マヤの人々",
  "cheers/health": "乾杯 / 健康",
  "hello!": "こんにちは！",
  "hello/goodbye": "こんにちは / さようなら",
  is: "です / 〜である",
  "is (location/state)": "ある / いる",
  "to be / his": "〜である / 彼の",
  "woman/mrs.": "女性 / 夫人",
  "measure": "計量 / measure",
  "about": "約 / について",
  "through/door": "〜を通って / 扉",
  "wind (root form)": "風（語幹）",
  "one/a": "一つ / ある",
  "what/that": "何 / あれ",
  "all/everything": "すべて",
  "earth/land": "大地 / 土地",
  "companion/friend": "仲間 / 友達",
  "flower/nose": "花 / 鼻",
  "but/however": "しかし / とはいえ",
  "time/weather": "時間 / 天気",
  "color/flower": "色 / 花",
  "flame / llama": "炎 / ラマ",
  "speech/language": "話し言葉 / 言語",
  "type/guy": "タイプ / 人",
  "well/good": "よい / うまく",
  "oh/alas": "おお / ああ",
  writing: "書くこと",
  wifi: "Wi-Fi",
  web: "ウェブ",
  weekend: "週末",
  screen: "画面",
  camera: "カメラ",
  quiz: "クイズ",
  menu: "メニュー",
  hotel: "ホテル",
  jeans: "ジーンズ",
  kiwi: "キウイ",
  yoga: "ヨガ",
  yogurt: "ヨーグルト",
  pizza: "ピザ",
  spaghetti: "スパゲッティ",
  subway: "地下鉄",
  photograph: "写真",
  photo: "写真",
  theater: "劇場",
  style: "スタイル",
  café: "カフェ",
  taxi: "タクシー",
  cheese: "チーズ",
  juice: "ジュース",
  avocado: "アボカド",
  butterfly: "蝶",
  hedgehog: "ハリネズミ",
  penguin: "ペンギン",
  eagle: "ワシ",
  jaguar: "ジャガー",
  moth: "ガ",
  flour: "小麦粉",
  law: "法律",
  source: "源",
  sacred: "神聖な",
};

const SIMPLE_NAME_HIDE_SET = new Set([
  "a",
  "be",
  "bee",
  "bé",
  "bê",
  "bi",
  "ce",
  "see",
  "cé",
  "cê",
  "de",
  "dee",
  "dé",
  "dê",
  "e",
  "ee",
  "ef",
  "efe",
  "effe",
  "fau",
  "ge",
  "gee",
  "gé",
  "gê",
  "ha",
  "hache",
  "héis",
  "i",
  "ie",
  "je",
  "jee",
  "ji",
  "jot",
  "jota",
  "ka",
  "ku",
  "kuu",
  "l",
  "el",
  "ele",
  "elle",
  "m",
  "em",
  "eme",
  "emme",
  "n",
  "en",
  "ene",
  "enne",
  "o",
  "oo",
  "p",
  "pe",
  "pee",
  "pé",
  "pê",
  "q",
  "cu",
  "quê",
  "r",
  "er",
  "erre",
  "ear",
  "ere",
  "s",
  "es",
  "ese",
  "esse",
  "t",
  "te",
  "tee",
  "té",
  "tê",
  "u",
  "uu",
  "v",
  "ve",
  "vee",
  "vé",
  "vê",
  "w",
  "we",
  "wee",
  "wu",
  "x",
  "xis",
  "ixe",
  "y",
  "ya",
  "ye",
  "yo",
  "yu",
  "z",
  "ze",
  "zet",
  "zi",
  "żet",
  "zède",
  "zê",
  "iota",
]);

const normalizeAlphabetMeaning = (value) => {
  if (value && typeof value === "object") {
    return value.ja || value.en || value.es || value.it || value.fr || "";
  }
  return String(value || "").trim();
};

const applyPhraseTranslations = (source) => {
  let translated = source;
  for (const [from, to] of PHRASE_TRANSLATIONS.sort(
    (a, b) => b[0].length - a[0].length,
  )) {
    translated = replaceAllInsensitive(translated, from, to);
  }
  return translated;
};

const applyWordTranslations = (source) => {
  let translated = source;
  for (const [from, to] of WORD_TRANSLATIONS.sort(
    (a, b) => b[0].length - a[0].length,
  )) {
    translated = replaceAllInsensitive(translated, from, to);
  }
  return translated;
};

const translateComparisonPattern = (source) => {
  let match = source.match(/^Like '([^']+)' in '([^']+)' \(([^)]+)\)$/i);
  if (match) {
    const [, sound, sampleWord, extra] = match;
    const extraText = translateInstructionSnippet(extra);
    const suffixText = extraText ? `。${extraText.replace(/。$/, "")}` : "";
    return `「${sampleWord}」の「${sound}」に近い音です${suffixText}。`;
  }

  match = source.match(
    /^Like '([^']+)' in '([^']+)'(?:,\s*'([^']+)')+(?:\s*[-,;]\s*(.+))?$/i,
  );
  if (match) {
    const quotedTokens = [...source.matchAll(/'([^']+)'/g)].map((entry) => entry[1]);
    const [sound, ...sampleWords] = quotedTokens;
    const suffix = source.includes(" - ")
      ? source.slice(source.indexOf(" - ") + 3)
      : source.includes("; ")
        ? source.slice(source.lastIndexOf("; ") + 2)
        : "";
    const suffixTranslation = suffix ? translateInstructionSnippet(suffix) : "";
    const suffixText = suffixTranslation
      ? `。${suffixTranslation.trim().replace(/。$/, "")}`
      : "";
    return `「${sampleWords.join("」「")}」の「${sound}」に近い音です${suffixText}。`;
  }

  const simpleLikeMatch = source.match(
    /^Like '([^']+)' in (?:(English|Spanish|German|French|Dutch|Portuguese|Italian|Irish|Greek|Japanese)\s+)?'([^']+)'(?:\s*[-,;]\s*(.+))?$/i,
  );
  if (simpleLikeMatch) {
    const [, sound, language, sampleWord, suffix] = simpleLikeMatch;
    const languageLabel =
      PHONETIC_LANGUAGE_LABELS[normalizeKey(language)] ||
      (language ? `${language} ` : "");
    const suffixTranslation = suffix ? translateInstructionSnippet(suffix) : "";
    const suffixText = suffixTranslation
      ? `。${suffixTranslation.trim().replace(/。$/, "")}`
      : "";
    return `${languageLabel}「${sampleWord}」の「${sound}」のような音です${suffixText}。`;
  }

  const quotedOnlyMatch = source.match(/^'([^']+)'(?:\s*[-,;]\s*(.+))?$/i);
  if (quotedOnlyMatch) {
    const [, sound, suffix] = quotedOnlyMatch;
    const suffixTranslation = suffix ? translateInstructionSnippet(suffix) : "";
    const suffixText = suffixTranslation
      ? `。${suffixTranslation.trim().replace(/。$/, "")}`
      : "";
    return `「${sound}」の音です${suffixText}。`;
  }

  return "";
};

const translateInstructionSnippet = (source) => {
  const trimmed = stripInstructionDecorator(source);
  if (!trimmed) return "";
  const normalized = normalizeKey(trimmed);
  if (EXACT_INSTRUCTION_TRANSLATIONS[normalized]) {
    return EXACT_INSTRUCTION_TRANSLATIONS[normalized];
  }
  const comparisonTranslation = translateComparisonPattern(trimmed);
  if (comparisonTranslation) {
    return cleanupTranslatedInstruction(comparisonTranslation);
  }
  return cleanupTranslatedInstruction(
    applyWordTranslations(applyPhraseTranslations(trimmed)),
  );
};

const translateStructuredInstruction = (source) => {
  source = stripInstructionDecorator(source);
  let match = source.match(/^Short:\s*(.+?);\s*Long(?:\s*\([^)]+\))?:\s*(.+)$/i);
  if (match) {
    return `短い音は ${translateInstructionSnippet(match[1])} 長い音は ${translateInstructionSnippet(match[2])}`;
  }

  match = source.match(/^Short\s+'([^']+)'\s+like\s+in\s+'([^']+)'\s+or\s+long\s+'([^']+)'\s+like\s+in\s+'([^']+)'$/i);
  if (match) {
    const [, shortSound, shortWord, longSound, longWord] = match;
    return `短い音は「${shortWord}」の「${shortSound}」に近く、長い音は「${longWord}」の「${longSound}」に近いです。`;
  }

  match = source.match(/^Final\s+([A-Z])\s+becomes\s+([A-Z]):\s*(.+)$/i);
  if (match) {
    const [, fromLetter, toLetter, rest] = match;
    return `語末の ${fromLetter} は ${toLetter} のように発音されます。${translateInstructionSnippet(rest)}`;
  }

  match = source.match(/^Like\s+'([^']+)'\s+in\s+'([^']+)';\s*at end of word sounds like\s+'([^']+)'$/i);
  if (match) {
    const [, sound, sampleWord, endingSound] = match;
    return `通常は「${sampleWord}」の「${sound}」に近い音で、語末では「${endingSound}」のように聞こえます。`;
  }

  match = source.match(/^Like\s+'([^']+)'\s+before\s+a\/o\/u;\s*like\s+'([^']+)'\s+before\s+e\/i$/i);
  if (match) {
    const [, firstSound, secondSound] = match;
    return `a / o / u の前では「${firstSound}」に近く、e / i の前では「${secondSound}」に近い音です。`;
  }

  match = source.match(/^Like\s+'([^']+)'\s+-\s+same as\s+'([^']+)'\s+in\s+'([^']+)'$/i);
  if (match) {
    const [, sound, comparisonSound, sampleWord] = match;
    return `「${sampleWord}」の「${comparisonSound}」と同じ種類の「${sound}」の音です。`;
  }

  match = source.match(/^Both\s+([A-Z]+)\s+and\s+([A-Z]+)\s+are\s+pronounced$/i);
  if (match) {
    const [, first, second] = match;
    return `${first} と ${second} の両方を発音します。`;
  }

  match = source.match(/^The\s+([A-Z]+)\s+is\s+often\s+dropped\s+in\s+speech$/i);
  if (match) {
    const [, letter] = match;
    return `会話では ${letter} が省かれることがあります。`;
  }

  match = source.match(/^Always\s+'([^']+)'\s+sound$/i);
  if (match) {
    return `常に「${match[1]}」の音です。`;
  }

  match = source.match(/^Like\s+'([^']+)'$/i);
  if (match) {
    return `「${match[1]}」のような音です。`;
  }

  match = source.match(/^Letters that aren't pronounced:\s*(.+)$/i);
  if (match) {
    return `発音しない文字の例: ${match[1]}`;
  }

  match = source.match(/^Stressed syllables are LOUDER, LONGER, and HIGHER in pitch$/i);
  if (match) {
    return "強勢のある音節は、より大きく、長く、高い音になります。";
  }

  match = source.match(/^Round lips into a tight circle, then release$/i);
  if (match) {
    return "唇をしっかり丸めてから、力を抜いて離します。";
  }

  match = source.match(/^Open\s+'([^']+)'\s+or\s+closed\s+'([^']+)'\s+depending on context$/i);
  if (match) {
    return `文脈によって、開いた「${match[1]}」の音にも閉じた「${match[2]}」の音にもなります。`;
  }

  return "";
};

const cleanupTranslatedInstruction = (value) =>
  String(value || "")
    .replace(/English/g, "英語")
    .replace(/Spanish/g, "スペイン語")
    .replace(/German/g, "ドイツ語")
    .replace(/French/g, "フランス語")
    .replace(/Portuguese/g, "ポルトガル語")
    .replace(/Italian/g, "イタリア語")
    .replace(/Dutch/g, "オランダ語")
    .replace(/Irish/g, "アイルランド語")
    .replace(/Greek/g, "ギリシャ語")
    .replace(/Japanese/g, "日本語")
    .replace(/Latin America/g, "中南米")
    .replace(/Latin/g, "ラテン語")
    .replace(/Brazil/g, "ブラジル")
    .replace(/Portugal/g, "ポルトガル")
    .replace(/Spain/g, "スペイン")
    .replace(/Belgium/g, "ベルギー")
    .replace(/Rio/g, "リオ")
    .replace(/Argentina/g, "アルゼンチン")
    .replace(/Uruguay/g, "ウルグアイ")
    .replace(/Scottish/g, "スコットランド語風")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\.\s*\./g, ".")
    .trim();

const stripPermittedLatinSegments = (value) =>
  String(value || "")
    .replace(/'[^']*'/g, " ")
    .replace(/"[^"]*"/g, " ")
    .replace(/「[^」]*」/g, " ")
    .replace(/『[^』]*』/g, " ")
    .replace(/\b[A-Z](?:\s*\/\s*[A-Z])+\b/g, " ")
    .replace(/\b[A-Z]{1,3}\b/g, " ")
    .replace(/\b[a-z]+(?:-[a-z]+)+\b/gi, " ")
    .replace(/\b[a-z]{1,2}\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasUnresolvedEnglishScaffolding = (value) =>
  /\b[a-z]{3,}\b/i.test(stripPermittedLatinSegments(cleanupTranslatedInstruction(value)));

const finalizeJapaneseInstruction = (translationResult, source) => {
  const candidate = cleanupTranslatedInstruction(
    typeof translationResult === "string"
      ? translationResult
      : translationResult?.text || "",
  );
  const confidence =
    typeof translationResult === "string"
      ? "derived"
      : translationResult?.confidence || "derived";
  const original = String(source || "").trim();
  if (!candidate) return "";
  if (confidence === "exact") return candidate;
  if (hasUnresolvedEnglishScaffolding(candidate)) return "";
  if (candidate === original && !containsJapanese(candidate)) return "";
  return candidate;
};

export function translateAlphabetNameToJapanese(value, letter = null) {
  const source = String(value || "").trim();
  if (!source || containsJapanese(source)) return source;

  if (letter?.type === "phrase") {
    return translateAlphabetMeaningToJapanese(letter.practiceWordMeaning);
  }

  const normalized = normalizeKey(source);
  if (EXACT_NAME_TRANSLATIONS[normalized]) return EXACT_NAME_TRANSLATIONS[normalized];

  const accentPattern = [
    [/^(.+)\s+met trema$/i, (base) => `トレマ付き${base.toUpperCase()}`],
    [/^(.+)\s+tréma$/i, (base) => `トレマ付き${base.toUpperCase()}`],
    [/^(.+)\s+accent aigu$/i, (base) => `アキュートアクセント付き${base.toUpperCase()}`],
    [/^(.+)\s+accent grave$/i, (base) => `グレーヴアクセント付き${base.toUpperCase()}`],
    [/^(.+)\s+accent circonflexe$/i, (base) => `サーカムフレックス付き${base.toUpperCase()}`],
    [/^(.+)\s+ogonek$/i, (base) => `オゴネク付き${base.toUpperCase()}`],
    [/^(.+)\s+fada$/i, (base) => `ファダ付き${base.toUpperCase()}`],
    [/^(.+)-umlaut$/i, (base) => `ウムラウト付き${base.toUpperCase()}`],
    [/^(.+)\s+agudo$/i, (base) => `アキュート付き${base.toUpperCase()}`],
    [/^(.+)\s+circunflexo$/i, (base) => `サーカムフレックス付き${base.toUpperCase()}`],
    [/^(.+)\s+aperta con accento$/i, (base) => `開いた音のアクセント付き${base.toUpperCase()}`],
    [/^(.+)\s+chiusa con accento$/i, (base) => `閉じた音のアクセント付き${base.toUpperCase()}`],
    [/^(.+)\s+con acento$/i, (base) => `アクセント付き${base.toUpperCase()}`],
    [/^(.+)\s+con accento$/i, (base) => `アクセント付き${base.toUpperCase()}`],
  ];

  for (const [pattern, formatter] of accentPattern) {
    const match = source.match(pattern);
    if (match) return formatter(match[1]);
  }

  const descriptorPatterns = [
    [/^short\s+(.+)$/i, (rest) => `短い ${rest.toUpperCase()}`],
    [/^long\s+(.+)$/i, (rest) => `長い ${rest.toUpperCase()}`],
    [/^nasal\s+(.+)$/i, (rest) => `鼻音の ${rest.toUpperCase()}`],
    [/^(.+)\s+\(voiced\)$/i, (rest) => `有声 ${rest.toUpperCase()}`],
    [/^(.+)\s+\(unvoiced\)$/i, (rest) => `無声 ${rest.toUpperCase()}`],
  ];

  for (const [pattern, formatter] of descriptorPatterns) {
    const match = source.match(pattern);
    if (match) return formatter(match[1]);
  }

  if (/^(?:[A-Z]{2,}|[A-Z]+\s*\/\s*[A-Z]+|[A-Z]+\s+vs\s+[A-Z]+)$/u.test(source)) {
    if (source === "SCH") return "";
    return source;
  }

  if (SIMPLE_NAME_HIDE_SET.has(normalized)) {
    return "";
  }

  return "";
}

export function translateAlphabetInstructionToJapanese(value) {
  const source = String(value || "").trim();
  const bareSource = stripInstructionDecorator(source);
  if (!bareSource) return { text: "", confidence: "empty" };
  if (containsJapanese(bareSource) && !/[A-Za-z]{2,}/.test(bareSource)) {
    return { text: bareSource, confidence: "exact" };
  }

  const normalized = normalizeKey(bareSource);
  if (EXACT_INSTRUCTION_TRANSLATIONS[normalized]) {
    return {
      text: EXACT_INSTRUCTION_TRANSLATIONS[normalized],
      confidence: "exact",
    };
  }

  const structuredTranslation = translateStructuredInstruction(bareSource);
  if (structuredTranslation) {
    return {
      text: cleanupTranslatedInstruction(structuredTranslation),
      confidence: "pattern",
    };
  }

  const snippetTranslation = translateInstructionSnippet(bareSource);
  if (snippetTranslation && snippetTranslation !== bareSource) {
    return {
      text: cleanupTranslatedInstruction(snippetTranslation),
      confidence: "pattern",
    };
  }

  return {
    text: bareSource,
    confidence: "derived",
  };
}

export function translateAlphabetMeaningToJapanese(value) {
  const source = normalizeAlphabetMeaning(value);
  if (!source) return "";
  if (containsJapanese(source)) return source;

  const normalized = normalizeKey(source);
  if (EXACT_MEANING_TRANSLATIONS[normalized]) {
    return EXACT_MEANING_TRANSLATIONS[normalized];
  }

  const flashcardTranslation = translateFlashcardConceptToJapanese(source);
  if (flashcardTranslation && flashcardTranslation !== source) {
    return flashcardTranslation;
  }

  return EXACT_MEANING_TRANSLATIONS[normalized] || "";
}

const addJapaneseAlphabetCopy = (letter) => {
  const sourceSound = letter.soundJa || letter.sound || letter.soundEs;
  const sourceTip = letter.tipJa || letter.tip || letter.tipEs;
  const meaning = letter.practiceWordMeaning || {};
  const translatedSound = letter.soundJa
    ? { text: letter.soundJa, confidence: "exact" }
    : translateAlphabetInstructionToJapanese(sourceSound);
  const translatedTip = letter.tipJa
    ? { text: letter.tipJa, confidence: "exact" }
    : translateAlphabetInstructionToJapanese(sourceTip);

  return {
    ...letter,
    nameJa: letter.nameJa || translateAlphabetNameToJapanese(letter.name, letter),
    soundJa:
      letter.soundJa || finalizeJapaneseInstruction(translatedSound, sourceSound),
    tipJa: letter.tipJa || finalizeJapaneseInstruction(translatedTip, sourceTip),
    practiceWordMeaning: {
      ...meaning,
      ja:
        meaning.ja ||
        translateAlphabetMeaningToJapanese(
          meaning.en || meaning.es || meaning.it || meaning.fr,
        ),
    },
  };
};

export const withJapaneseAlphabetSupport = (letters = []) =>
  letters.map(addJapaneseAlphabetCopy);

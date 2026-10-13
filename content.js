/* Speaking Room content. Updated after every lesson.
   Public repo: no personal details here. Personal sentences live in the
   private deck that is imported in the app (Settings) and kept on the sync server.

   Card shapes:
     translate: {id, d, he, en, alt?:[...], note?}   say the English for the Hebrew
     fix:       {id, d:"fix", bad, en, alt?, note?}   say the corrected sentence
     ask:       {id, d:"ask", q, en, note?}           answer freely; en is a sample answer
   Ids are permanent. Never reuse or renumber an id (progress is stored by id).
*/
window.CONTENT = {
  version: 1,
  lessons: [
    {n: 1, date: "2026-10-12", focus: "Present Simple: positive and negative",
     notes: "Habits, routines, facts and opinions. he/she/it + s. Negative: don't / doesn't + base verb."},
    {n: 2, date: "2026-10-13", focus: "Past Simple: positive and negative. good vs well. Vocabulary: Diaspora, persecution, heritage, migration, revival",
     notes: "Regular verbs + ed (three sounds: t, d, id). Negative: didn't + base verb (didn't go, not didn't went). Never was/were before a main verb in the past. good describes what something is, well describes how something is done."}
  ],

  decks: {
    lesson:   {name: "תיקונים מהשיעור", tag: "תיקון מהשיעור"},
    fix:      {name: "מצא ותקן",        tag: "יש טעות. אמור את המשפט הנכון"},
    whisky:   {name: "וויסקי ויין",      tag: "וויסקי ויין"},
    music:    {name: "מוזיקה קלאסית",   tag: "מוזיקה קלאסית"},
    lipchitz: {name: "ליפשיץ",           tag: "ז'אק ליפשיץ"},
    lecture:  {name: "משפטי הרצאה",      tag: "על הבמה"},
    ask:      {name: "ענה בקול",         tag: "שאלה פתוחה: ענה במשפט שלם"},
    past:     {name: "עבר פשוט",         tag: "עבר פשוט"},
    goodwell: {name: "good או well",     tag: "good או well"},
    vocab:    {name: "מילים מהשיעור",    tag: "אוצר מילים"},
    edsound:  {name: "הגיית ed",         tag: "שים לב לסוף הפועל: t, d או id"},
    personal: {name: "אישי",             tag: "עליך"}
  },

  cards: [
    /* Lesson 1 corrections, generalized */
    {id:"l1", d:"lesson", he:"החבר הכי ותיק שלי נשוי וגר קרוב.", en:"My oldest friend is married and lives nearby.", note:"oldest = הכי ותיק / הבכור. lives עם s, כי מדובר בו (he)."},
    {id:"l2", d:"lesson", he:"אני צריך לשפר את האנגלית שלי.", en:"I need to improve my English.", note:"need בא עם to. must בא בלי to: I must improve. אף פעם לא I must to."},
    {id:"l3", d:"lesson", he:"כישורי הקריאה שלי טובים יותר מכישורי הדיבור שלי.", en:"My reading skills are better than my speaking skills."},
    {id:"l4", d:"lesson", he:"יש הרבה מאמרים באנגלית על הנושא הזה.", en:"There are many articles in English on this subject.", alt:["There are a lot of articles in English on this subject."], note:"ברבים There are, ביחיד There is."},
    {id:"l5", d:"lesson", he:"זו הסיבה שהתחלתי שיעורים פרטיים.", en:"That's the reason I started private lessons."},
    {id:"l6", d:"lesson", he:"הייתי רוצה להיות מסוגל לתת הרצאות באנגלית.", en:"I'd like to be able to give lectures in English.", note:"I'd like = I would like. אל תבלע את like."},
    {id:"l7", d:"lesson", he:"אני מקווה לתת הרצאה באנגלית בסוף השנה האקדמית.", en:"I hope to give a lecture in English at the end of the academic year."},
    {id:"l8", d:"lesson", he:"זה צעד גדול בשבילי, להרצות באנגלית.", en:"It's a big step for me to lecture in English."},
    {id:"l9", d:"lesson", he:"אתה שומע אותי?", en:"Can you hear me?", note:"בשאלה can עובר לפני הנושא. You can hear me הוא משפט חיווי."},
    {id:"l10", d:"lesson", he:"וויסקי מעושן מגיע מאיילה.", en:"Smoky whisky comes from Islay.", note:"comes עם s. Islay נכתב עם s שקטה ונהגה אַיְלָה."},

    /* Present simple: find and fix */
    {id:"f1", d:"fix", bad:"I am love classical music.", en:"I love classical music.", note:"בפרזנט סימפל אין am לפני הפועל."},
    {id:"f2", d:"fix", bad:"She drink wine every Friday.", en:"She drinks wine every Friday.", note:"she מקבלת s."},
    {id:"f3", d:"fix", bad:"We are listening to Bach every evening.", en:"We listen to Bach every evening.", note:"every evening = הרגל, ולכן פרזנט סימפל."},
    {id:"f4", d:"fix", bad:"He not like smoky whisky.", en:"He doesn't like smoky whisky.", note:"שלילה: doesn't + פועל בלי s."},
    {id:"f5", d:"fix", bad:"The professor is read every chapter.", en:"The professor reads every chapter."},
    {id:"f6", d:"fix", bad:"I must to finish the chapter.", en:"I must finish the chapter.", alt:["I need to finish the chapter."]},
    {id:"f7", d:"fix", bad:"There is many letters in the archive.", en:"There are many letters in the archive."},
    {id:"f8", d:"fix", bad:"Lipchitz work in bronze.", en:"Lipchitz works in bronze."},
    {id:"f9", d:"fix", bad:"They doesn't speak Hebrew.", en:"They don't speak Hebrew.", note:"they מקבלים don't. רק he/she/it מקבלים doesn't."},
    {id:"f10", d:"fix", bad:"The concert start at eight.", en:"The concert starts at eight.", note:"אירוע בזמן קבוע: פרזנט סימפל עם s."},
    {id:"f11", d:"fix", bad:"You can hear me?", en:"Can you hear me?"},
    {id:"f12", d:"fix", bad:"I every morning drink coffee.", en:"I drink coffee every morning.", alt:["Every morning I drink coffee."], note:"ביטוי זמן בא בתחילת המשפט או בסופו."},
    {id:"f13", d:"fix", bad:"Doesn't he likes jazz?", en:"Doesn't he like jazz?", note:"אחרי does/doesn't הפועל חוזר לצורת הבסיס."},
    {id:"f14", d:"fix", bad:"My wife don't drink whisky.", en:"My wife doesn't drink whisky."},
    {id:"f15", d:"fix", bad:"Do she teach on Sunday?", en:"Does she teach on Sunday?"},

    /* Whisky and wine */
    {id:"w1", d:"whisky", he:"אני שותה וויסקי מעושן מאיילה.", en:"I drink smoky whisky from Islay."},
    {id:"w2", d:"whisky", he:"אני אף פעם לא מוסיף קרח לוויסקי שלי.", en:"I never add ice to my whisky.", note:"never בא אחרי הנושא ולפני הפועל."},
    {id:"w3", d:"whisky", he:"בורבון מגיע מקנטקי.", en:"Bourbon comes from Kentucky."},
    {id:"w4", d:"whisky", he:"הוויסקי הזה טעים כמו עשן ומלח ים.", en:"This whisky tastes like smoke and sea salt.", note:"tastes like = יש לו טעם של."},
    {id:"w5", d:"whisky", he:"אני בדרך כלל שותה כוס יין אחת בשבת.", en:"I usually drink one glass of wine on Shabbat."},
    {id:"w6", d:"whisky", he:"אני לא שותה וויסקי בבוקר.", en:"I don't drink whisky in the morning."},
    {id:"w7", d:"whisky", he:"החבר שלי לא אוהב וויסקי מעושן.", en:"My friend doesn't like smoky whisky.", note:"doesn't like, לא doesn't likes."},
    {id:"w8", d:"whisky", he:"יין אדום מתאים לבשר.", en:"Red wine goes well with meat.", note:"goes well with = מתאים ל."},
    {id:"w9", d:"whisky", he:"הסקוטים כותבים whisky, והאמריקאים כותבים whiskey.", en:"Scots write whisky, and Americans write whiskey."},
    {id:"w10", d:"whisky", he:"אתה מעדיף יין לבן או אדום?", en:"Do you prefer white or red wine?", note:"שאלה בפרזנט סימפל נפתחת ב-Do, או Does עם he/she."},
    {id:"w11", d:"whisky", he:"הוויסקי הזה מתיישן שתים עשרה שנה בחבית.", en:"This whisky ages twelve years in a cask.", alt:["This whisky ages 12 years in a cask."], note:"cask = חבית. ages = מתיישן."},
    {id:"w12", d:"whisky", he:"אני מוסיף כמה טיפות מים לוויסקי.", en:"I add a few drops of water to my whisky."},

    /* Classical music */
    {id:"m1", d:"music", he:"אני אוהב להקשיב למוזיקה קלאסית.", en:"I love listening to classical music.", alt:["I love to listen to classical music."], note:"listen to, תמיד עם to."},
    {id:"m2", d:"music", he:"אני מקשיב לבאך כשאני עובד.", en:"I listen to Bach when I work."},
    {id:"m3", d:"music", he:"הקונצרט מתחיל בשמונה בערב.", en:"The concert starts at eight in the evening.", alt:["The concert starts at 8 in the evening."]},
    {id:"m4", d:"music", he:"התזמורת מנגנת בטהובן הערב.", en:"The orchestra plays Beethoven tonight."},
    {id:"m5", d:"music", he:"הוא לא מנגן בפסנתר, אבל הוא אוהב מוזיקת פסנתר.", en:"He doesn't play the piano, but he loves piano music."},
    {id:"m6", d:"music", he:"מוזיקה עוזרת לי להתרכז.", en:"Music helps me concentrate.", alt:["Music helps me to concentrate."]},
    {id:"m7", d:"music", he:"אתה מכיר את הסימפוניה הזאת?", en:"Do you know this symphony?"},
    {id:"m8", d:"music", he:"המנצח עומד מול התזמורת.", en:"The conductor stands in front of the orchestra."},
    {id:"m9", d:"music", he:"אני מעדיף הקלטות ישנות.", en:"I prefer old recordings."},

    /* Lipchitz: public facts. Historical present, as in a lecture. */
    {id:"z1", d:"lipchitz", he:"ז'אק ליפשיץ הוא פסל קוביסטי.", en:"Jacques Lipchitz is a Cubist sculptor."},
    {id:"z2", d:"lipchitz", he:"הוא נולד בליטא ב-1891.", en:"He was born in Lithuania in 1891.", note:"was born תמיד בעבר. 1891: eighteen ninety-one."},
    {id:"z3", d:"lipchitz", he:"ב-1909 הוא מגיע לפריז.", en:"In 1909 he comes to Paris.", alt:["In 1909 he arrives in Paris."], note:"בהרצאה מותר לספר היסטוריה בהווה. זה Present Simple."},
    {id:"z4", d:"lipchitz", he:"בפריז הוא פוגש את פיקאסו ואת מודיליאני.", en:"In Paris he meets Picasso and Modigliani."},
    {id:"z5", d:"lipchitz", he:"ב-1941 הוא בורח לאמריקה.", en:"In 1941 he escapes to America.", alt:["In 1941 he flees to America."]},
    {id:"z6", d:"lipchitz", he:"הוא עובד בעיקר בברונזה.", en:"He mainly works in bronze.", alt:["He works mainly in bronze."]},
    {id:"z7", d:"lipchitz", he:"הפסלים שלו עומדים במוזיאונים ברחבי העולם.", en:"His sculptures stand in museums around the world."},
    {id:"z8", d:"lipchitz", he:"הוא מת ב-1973 ונקבר בירושלים.", en:"He died in 1973 and was buried in Jerusalem.", note:"died, was buried: עבר. 1973: nineteen seventy-three."},
    {id:"z9", d:"lipchitz", he:"רוב החוקרים לא מכירים את המכתבים האלה.", en:"Most researchers don't know these letters."},
    {id:"z10", d:"lipchitz", he:"המכתבים מראים קשר אישי.", en:"The letters show a personal relationship."},

    /* Lecture phrases */
    {id:"k1", d:"lecture", he:"היום אני רוצה לדבר על פסל אחד.", en:"Today I want to talk about one sculpture.", alt:["Today I'd like to talk about one sculpture."]},
    {id:"k2", d:"lecture", he:"כולם רואים את השקף?", en:"Can everyone see the slide?", alt:["Does everyone see the slide?"]},
    {id:"k3", d:"lecture", he:"הנה תמונה של הפסל.", en:"Here is a picture of the sculpture."},
    {id:"k4", d:"lecture", he:"השאלה המרכזית שלי פשוטה.", en:"My main question is simple."},
    {id:"k5", d:"lecture", he:"אני אענה על שאלות בסוף.", en:"I'll answer questions at the end.", alt:["I will answer questions at the end."]},
    {id:"k6", d:"lecture", he:"סליחה, אתה יכול לחזור על השאלה?", en:"Sorry, can you repeat the question?", alt:["Sorry, could you repeat the question?"]},
    {id:"k7", d:"lecture", he:"תודה רבה שבאתם.", en:"Thank you very much for coming."},
    {id:"k8", d:"lecture", he:"אני לא יודע את התשובה, אבל אבדוק.", en:"I don't know the answer, but I'll check.", alt:["I don't know the answer, but I will check."]},

    /* Open questions */
    {id:"q1", d:"ask", q:"What do you usually drink on Friday night?", en:"I usually drink red wine on Friday night."},
    {id:"q2", d:"ask", q:"Which whisky do you like best?", en:"I like smoky whisky from Islay best."},
    {id:"q3", d:"ask", q:"When do you listen to music?", en:"I listen to music when I work or when I drive."},
    {id:"q4", d:"ask", q:"Who is your favorite composer?", en:"My favorite composer is Bach."},
    {id:"q5", d:"ask", q:"Who is Jacques Lipchitz?", en:"He is a Cubist sculptor. He comes from Lithuania and works in Paris and later in New York."},
    {id:"q6", d:"ask", q:"What do you do in the evening?", en:"In the evening I read, I study, and sometimes I listen to music."},
    {id:"q7", d:"ask", q:"Does your friend like smoky whisky?", en:"No, he doesn't. He prefers bourbon.", note:"תשובה קצרה: Yes, he does. / No, he doesn't."},
    {id:"q8", d:"ask", q:"Why do you want to speak better English?", en:"I want to speak better English because I want to lecture in English."},
    {id:"q9", d:"ask", q:"What does a normal morning look like for you?", en:"I get up early, I pray, I drink coffee, and then I go to work."},
    {id:"q10", d:"ask", q:"What don't you like about your work?", en:"I don't like the paperwork."},
    /* ===== Lesson 2: past simple (positive, negative), good vs well, vocabulary ===== */
    {id:"l11", d:"lesson", he:"אני מתמקד בשני יהודים מפורסמים שנפגשו אחרי השואה בארצות הברית.", en:"I am focusing on two famous Jews who met after the Holocaust in the USA.", alt:["I'm focusing on two famous Jews who met after the Holocaust in the USA."], note:"I am focusing: משהו שאני עסוק בו עכשיו. met: עבר של meet."},
    {id:"l12", d:"lesson", he:"אני קורא אנגלית טוב מאוד.", en:"I read English very well.", note:"קורא איך? well. אחרי פועל של פעולה בא well, לא good."},
    {id:"l13", d:"lesson", he:"ההבנה שלי בהרצאות באנגלית טובה מאוד.", en:"My comprehension of lectures in English is very good.", note:"ההבנה היא מה? good. אחרי is בא good."},
    {id:"l14", d:"lesson", he:"לא הלכתי לחדר כושר אתמול.", en:"I didn't go to the gym yesterday.", alt:["I did not go to the gym yesterday."], note:"didn't go, אף פעם didn't went."},
    {id:"l15", d:"lesson", he:"היא לא אכלה ארוחת בוקר הבוקר.", en:"She didn't eat breakfast this morning.", alt:["She did not eat breakfast this morning."], note:"didn't eat, לא didn't ate."},
    {id:"l16", d:"lesson", he:"הם לא הרגישו עייפים אחרי הריצה.", en:"They didn't feel tired after the run.", alt:["They did not feel tired after the run."], note:"didn't feel, לא didn't felt."},
    {id:"l17", d:"lesson", he:"היא תלמידה טובה.", en:"She is a good student.", note:"good מתאר מה משהו הוא."},
    {id:"l18", d:"lesson", he:"היא כותבת היטב.", en:"She writes well.", note:"well מתאר איך עושים משהו."},

    /* Past simple: say it in English */
    {id:"ps1", d:"past", he:"עבדתי מהבית אתמול.", en:"I worked from home yesterday.", note:"worked נשמע וורקט: הסיומת t."},
    {id:"ps2", d:"past", he:"לא עבדתי אתמול.", en:"I didn't work yesterday.", alt:["I did not work yesterday."], note:"לא I was not work. בעבר אין was לפני פועל."},
    {id:"ps3", d:"past", he:"גרנו בחיפה פעם.", en:"We lived in Haifa once.", note:"lived נשמע ליווד: הסיומת d. לא We was live."},
    {id:"ps4", d:"past", he:"הקונצרט התחיל בשמונה.", en:"The concert started at eight.", alt:["The concert started at 8."], note:"started: אחרי t שומעים הברה נוספת, סטארטִד."},
    {id:"ps5", d:"past", he:"הקשבתי למוזיקה בבית.", en:"I listened to music at home.", note:"listened נשמע ליסנד."},
    {id:"ps6", d:"past", he:"לא הקשבתי למוזיקה בבית.", en:"I didn't listen to music at home."},
    {id:"ps7", d:"past", he:"טעמנו שלושה סוגי וויסקי.", en:"We tasted three kinds of whisky.", note:"tasted: אחרי t שומעים הברה נוספת."},
    {id:"ps8", d:"past", he:"לא אהבתי את היין הזה.", en:"I didn't like this wine.", alt:["I didn't like that wine."]},
    {id:"ps9", d:"past", he:"הסטודנטים למדו למבחן.", en:"The students studied for the test.", note:"study, studied: y הופכת ל-i."},
    {id:"ps10", d:"past", he:"הסטודנטים לא למדו למבחן.", en:"The students didn't study for the test."},
    {id:"ps11", d:"past", he:"ביקרתי במוזיאון בשבוע שעבר.", en:"I visited the museum last week.", alt:["I visited a museum last week."], note:"visited: אחרי t הברה נוספת."},
    {id:"ps12", d:"past", he:"האמן צייר יצירה חדשה.", en:"The artist painted a new work of art.", alt:["The artist painted a new piece."]},
    {id:"ps13", d:"past", he:"ירד גשם אתמול.", en:"It rained yesterday."},
    {id:"ps14", d:"past", he:"לא ירד שלג השנה.", en:"It didn't snow this year."},
    {id:"ps15", d:"past", he:"הפגישה הסתיימה לפני שעה.", en:"The meeting ended an hour ago.", note:"ago בא אחרי משך הזמן: an hour ago."},
    {id:"ps16", d:"past", he:"הוא לא שאל אותי.", en:"He didn't ask me.", note:"לא He was not ask me."},
    {id:"ps17", d:"past", he:"החלטנו לנסוע לסקוטלנד.", en:"We decided to travel to Scotland.", alt:["We decided to go to Scotland."], note:"decided: אחרי d הברה נוספת."},
    {id:"ps18", d:"past", he:"הם לא הסכימו על התוכניות.", en:"They didn't agree about the plans.", alt:["They didn't agree on the plans."]},
    {id:"ps19", d:"past", he:"התרגלתי אנגלית קודם.", en:"I practiced English earlier.", alt:["I practised English earlier."], note:"practiced נשמע פרקטיסט: הסיומת t."},
    {id:"ps20", d:"past", he:"הוא הגיע בזמן.", en:"He arrived on time."},
    /* irregular verbs he will need */
    {id:"ps21", d:"past", he:"הלכתי לקונצרט אתמול בערב.", en:"I went to a concert last night.", alt:["I went to a concert yesterday evening."], note:"go, went. פועל לא סדיר."},
    {id:"ps22", d:"past", he:"ליפשיץ הגיע לפריז ב-1909.", en:"Lipchitz came to Paris in 1909.", alt:["Lipchitz arrived in Paris in 1909."], note:"come, came."},
    {id:"ps23", d:"past", he:"הם נפגשו בניו יורק.", en:"They met in New York.", note:"meet, met."},
    {id:"ps24", d:"past", he:"הוא כתב הרבה מכתבים.", en:"He wrote many letters.", alt:["He wrote a lot of letters."], note:"write, wrote."},
    {id:"ps25", d:"past", he:"הוא לא כתב את המכתב הזה.", en:"He didn't write this letter.", alt:["He didn't write that letter."], note:"didn't write, לא didn't wrote."},
    {id:"ps26", d:"past", he:"שתיתי כוס וויסקי אחת.", en:"I drank one glass of whisky.", note:"drink, drank."},
    {id:"ps27", d:"past", he:"לא ראיתי את הסרט.", en:"I didn't see the movie.", alt:["I didn't see the film."], note:"didn't see, לא didn't saw."},
    {id:"ps28", d:"past", he:"היא נתנה לי ספר.", en:"She gave me a book.", note:"give, gave."},
    {id:"ps29", d:"past", he:"הוא עזב את פריז ב-1941.", en:"He left Paris in 1941.", note:"leave, left."},
    {id:"ps30", d:"past", he:"לא ידעתי את התשובה.", en:"I didn't know the answer.", note:"didn't know, לא didn't knew."},
    {id:"ps31", d:"past", he:"לימדתי אנגלית שנה שעברה.", en:"I taught English last year.", note:"teach, taught."},
    {id:"ps32", d:"past", he:"התחלנו את השיעור בתשע.", en:"We began the lesson at nine.", alt:["We started the lesson at nine.","We began the lesson at 9."], note:"begin, began."},

    /* Past simple: transform (from the lesson worksheets) */
    {id:"x1", d:"past", src:"We practiced math.", task:"אמור בשלילה", en:"We didn't practice math."},
    {id:"x2", d:"past", src:"Andy cooked a huge meal for her family.", task:"אמור בשלילה", en:"Andy didn't cook a huge meal for her family."},
    {id:"x3", d:"past", src:"The professors researched for their paper.", task:"אמור בשלילה", en:"The professors didn't research for their paper."},
    {id:"x4", d:"past", src:"The couple agreed about their plans.", task:"אמור בשלילה", en:"The couple didn't agree about their plans."},
    {id:"x5", d:"past", src:"My mother doesn't work from home.", task:"אמור בעבר", en:"My mother didn't work from home."},
    {id:"x6", d:"past", src:"The movie doesn't end well.", task:"אמור בעבר", en:"The movie didn't end well."},
    {id:"x7", d:"past", src:"I don't watch the news.", task:"אמור בעבר", en:"I didn't watch the news."},
    {id:"x8", d:"past", src:"They travel to Europe.", task:"אמור בעבר", en:"They traveled to Europe.", alt:["They travelled to Europe."]},
    {id:"x9", d:"past", src:"Jack is playing video games.", task:"אמור בעבר", en:"Jack played video games."},
    {id:"x10", d:"past", src:"My father finishes work at night.", task:"אמור בעבר", en:"My father finished work at night."},
    {id:"x11", d:"past", src:"I am traveling to Tokyo in May.", task:"אמור בעבר", en:"I traveled to Tokyo in May.", alt:["I travelled to Tokyo in May."]},
    {id:"x12", d:"past", src:"I listen to Bach every evening.", task:"אמור בעבר, עם last night", en:"I listened to Bach last night."},
    {id:"x13", d:"past", src:"She drinks wine on Friday.", task:"אמור בעבר, עם last Friday", en:"She drank wine last Friday."},
    {id:"x14", d:"past", src:"He doesn't like smoky whisky.", task:"אמור בעבר", en:"He didn't like smoky whisky."},
    {id:"x15", d:"past", src:"Lipchitz works in bronze.", task:"אמור בעבר", en:"Lipchitz worked in bronze."},
    {id:"x16", d:"past", src:"We visit the museum.", task:"אמור בעבר ובשלילה", en:"We didn't visit the museum."},

    /* Past simple: find and fix (the was/were trap) */
    {id:"f16", d:"fix", bad:"I was work yesterday.", en:"I worked yesterday.", note:"בעבר אין was לפני פועל. העבר נמצא בפועל: worked."},
    {id:"f17", d:"fix", bad:"We was live in Haifa.", en:"We lived in Haifa."},
    {id:"f18", d:"fix", bad:"I didn't worked yesterday.", en:"I didn't work yesterday.", note:"אחרי didn't הפועל חוזר לבסיס."},
    {id:"f19", d:"fix", bad:"Kelly wasn't live with us.", en:"Kelly didn't live with us."},
    {id:"f20", d:"fix", bad:"The show didn't aired last night.", en:"The show didn't air last night."},
    {id:"f21", d:"fix", bad:"You not realized what she asked you to do.", en:"You didn't realize what she asked you to do.", alt:["You didn't realise what she asked you to do."]},
    {id:"f22", d:"fix", bad:"He was not ask me.", en:"He didn't ask me.", alt:["He did not ask me."]},
    {id:"f23", d:"fix", bad:"I don't watch the news last night.", en:"I didn't watch the news last night.", note:"last night = עבר, ולכן didn't."},
    {id:"f24", d:"fix", bad:"My wife didn't called this morning.", en:"My wife didn't call this morning."},
    {id:"f25", d:"fix", bad:"The ball was not rolled down the street.", en:"The ball didn't roll down the street."},
    {id:"f26", d:"fix", bad:"I not looked up the word.", en:"I didn't look up the word.", alt:["I didn't look the word up."]},
    {id:"f27", d:"fix", bad:"We were played video games.", en:"We played video games."},
    {id:"f28", d:"fix", bad:"I listening to that album yesterday.", en:"I listened to that album yesterday."},
    {id:"f29", d:"fix", bad:"They were study for their test.", en:"They studied for their test."},
    {id:"f30", d:"fix", bad:"I am traveling to Milan last year.", en:"I traveled to Milan last year.", alt:["I travelled to Milan last year."]},
    {id:"f31", d:"fix", bad:"She change her clothes a minute ago.", en:"She changed her clothes a minute ago."},
    {id:"f32", d:"fix", bad:"I didn't went to the gym.", en:"I didn't go to the gym."},
    {id:"f33", d:"fix", bad:"She didn't ate breakfast.", en:"She didn't eat breakfast."},
    {id:"f34", d:"fix", bad:"They didn't felt tired.", en:"They didn't feel tired."},
    {id:"f35", d:"fix", bad:"Lipchitz was come to Paris in 1909.", en:"Lipchitz came to Paris in 1909."},
    /* good vs well */
    {id:"f36", d:"fix", bad:"He speaks English good.", en:"He speaks English well.", note:"מדבר איך? well."},
    {id:"f37", d:"fix", bad:"She is a well teacher.", en:"She is a good teacher.", note:"לפני שם עצם בא good."},
    {id:"f38", d:"fix", bad:"I slept good last night.", en:"I slept well last night."},
    {id:"f39", d:"fix", bad:"The lecture went good.", en:"The lecture went well.", note:"went well: הלך היטב."},
    {id:"f40", d:"fix", bad:"This whisky tastes well.", en:"This whisky tastes good.", note:"tastes, looks, sounds מתארים מה משהו הוא, ולכן good."},
    {id:"f41", d:"fix", bad:"You did a well job.", en:"You did a good job."},
    {id:"f42", d:"fix", bad:"The orchestra played very good.", en:"The orchestra played very well."},
    /* present simple, from the first lesson's rationale sheet */
    {id:"f43", d:"fix", bad:"I am understand you.", en:"I understand you.", note:"understand, know, love, like: לא עם am ולא עם ing."},
    {id:"f44", d:"fix", bad:"I reading every morning the newspaper.", en:"I read the newspaper every morning.", alt:["Every morning I read the newspaper."]},
    {id:"f45", d:"fix", bad:"The dog is want the bone.", en:"The dog wants the bone."},
    {id:"f46", d:"fix", bad:"I once a week eating with my family.", en:"I eat with my family once a week.", alt:["Once a week I eat with my family."]},
    {id:"f47", d:"fix", bad:"She is not study French.", en:"She doesn't study French.", alt:["She does not study French."]},
    {id:"f48", d:"fix", bad:"He not working out every day.", en:"He doesn't work out every day."},

    /* good or well: say it */
    {id:"g1", d:"goodwell", he:"הוא מורה טוב.", en:"He is a good teacher."},
    {id:"g2", d:"goodwell", he:"הוא מלמד היטב.", en:"He teaches well."},
    {id:"g3", d:"goodwell", he:"ההרצאה הייתה טובה.", en:"The lecture was good."},
    {id:"g4", d:"goodwell", he:"ההרצאה הלכה טוב.", en:"The lecture went well."},
    {id:"g5", d:"goodwell", he:"הוויסקי הזה טעים.", en:"This whisky tastes good.", note:"tastes good, לא tastes well."},
    {id:"g6", d:"goodwell", he:"לא ישנתי טוב בלילה.", en:"I didn't sleep well last night.", note:"עבר בשלילה + well."},
    {id:"g7", d:"goodwell", he:"התזמורת ניגנה היטב.", en:"The orchestra played well."},
    {id:"g8", d:"goodwell", he:"אתה מדבר אנגלית טוב.", en:"You speak English well.", note:"מדבר איך? well."},
    {id:"g9", d:"goodwell", he:"זה רעיון טוב.", en:"That's a good idea.", alt:["That is a good idea.","It's a good idea."]},
    {id:"g10", d:"goodwell", he:"הוא לא הסביר את זה טוב.", en:"He didn't explain it well."},

    /* Vocabulary from lesson 2 */
    {id:"v1", d:"vocab", he:"תפוצות", en:"Diaspora", note:"הטעמה: dai-AS-pra. בדרך כלל in the Diaspora."},
    {id:"v2", d:"vocab", he:"רדיפה", en:"persecution", note:"הטעמה: per-si-KYOO-shun. persecution of."},
    {id:"v3", d:"vocab", he:"מורשת", en:"heritage", note:"הטעמה: HER-i-tij."},
    {id:"v4", d:"vocab", he:"הגירה", en:"migration", note:"הטעמה: mai-GRAY-shun. migration to, migration from."},
    {id:"v5", d:"vocab", he:"תחייה", en:"revival", note:"הטעמה: ri-VAI-vul. a revival of."},
    {id:"v6", d:"vocab", he:"יהודים רבים חיו בתפוצות.", en:"Many Jews lived in the Diaspora.", note:"lived: עבר רגיל."},
    {id:"v7", d:"vocab", he:"הקהילה לא שכחה את המורשת שלה.", en:"The community didn't forget its heritage."},
    {id:"v8", d:"vocab", he:"ההגירה לאמריקה התחילה במאה התשע עשרה.", en:"The migration to America started in the nineteenth century.", alt:["Migration to America started in the nineteenth century.","The migration to America began in the nineteenth century."]},
    {id:"v9", d:"vocab", he:"הרדיפה לא עצרה את חיי הקהילה.", en:"The persecution didn't stop community life."},
    {id:"v10", d:"vocab", he:"אחרי המלחמה הייתה תחייה של הלימוד.", en:"After the war there was a revival of study.", alt:["After the war, there was a revival of learning."]},
    {id:"v11", d:"vocab", he:"המורשת היהודית כוללת טקסטים, מנהגים ושפות.", en:"Jewish heritage includes texts, customs and languages."},
    {id:"v12", d:"vocab", he:"התרבות היהודית בתפוצות מתפתחת אחרת בכל מקום.", en:"Jewish culture in the Diaspora develops differently in each place."},
    {id:"v13", d:"ask", q:"Use the word heritage in a sentence about your family.", en:"My family's heritage is very important to us."},
    {id:"v14", d:"ask", q:"Use the word migration in a sentence in the past.", en:"Their migration to Israel happened in 1950."},
    {id:"v15", d:"ask", q:"Use the word Diaspora in a sentence with didn't.", en:"Many Jews in the Diaspora didn't speak Hebrew."},
    {id:"v16", d:"ask", q:"Use the word revival in a sentence.", en:"There is a revival of Hebrew study around the world."},
    {id:"v17", d:"ask", q:"Use the word persecution in a sentence in the past.", en:"The persecution changed the community forever."},

    /* -ed sounds: say it, listen to the ending */
    {id:"e1", d:"edsound", he:"עבדתי ונחתי.", en:"I worked and rested.", note:"worked = t, rested = id."},
    {id:"e2", d:"edsound", he:"הוא שיחק וצפה.", en:"He played and watched.", note:"played = d, watched = t."},
    {id:"e3", d:"edsound", he:"היא רצתה והחליטה.", en:"She wanted and decided.", note:"שניהם id: הברה נוספת."},
    {id:"e4", d:"edsound", he:"עצרנו והקשבנו.", en:"We stopped and listened.", note:"stopped = t, listened = d."},
    {id:"e5", d:"edsound", he:"הם נסעו וביקרו.", en:"They traveled and visited.", alt:["They travelled and visited."], note:"traveled = d, visited = id."},
    {id:"e6", d:"edsound", he:"הוא תיקן ובדק.", en:"He fixed and checked.", note:"שניהם t."},
    {id:"e7", d:"edsound", he:"היא גרה ועבדה בפריז.", en:"She lived and worked in Paris.", note:"lived = d, worked = t."},
    {id:"e8", d:"edsound", he:"הקונצרט התחיל והסתיים בזמן.", en:"The concert started and ended on time.", note:"שניהם id."},

    /* Open questions in the past */
    {id:"q11", d:"ask", q:"What did you do yesterday evening?", en:"Yesterday evening I studied and listened to music."},
    {id:"q12", d:"ask", q:"What didn't you do last week?", en:"I didn't go to the gym last week."},
    {id:"q13", d:"ask", q:"Did you sleep well last night?", en:"Yes, I slept well. / No, I didn't sleep well.", note:"תשובה קצרה: Yes, I did. / No, I didn't."},
    {id:"q14", d:"ask", q:"When did you start to learn English?", en:"I started to learn English in school."},
    {id:"q15", d:"ask", q:"What was the last whisky you tasted? Did you like it?", en:"I tasted a whisky from Islay. I liked it very much."},
    {id:"q16", d:"ask", q:"Tell me about the last concert you went to.", en:"I went to a concert last month. The orchestra played Beethoven, and they played very well."},
    {id:"q17", d:"ask", q:"What did you teach last week?", en:"Last week I taught a lesson about history."},
    {id:"q18", d:"ask", q:"When did Lipchitz come to Paris, and who did he meet there?", en:"He came to Paris in 1909, and he met Picasso and Modigliani."},
    {id:"q19", d:"ask", q:"Is your English good? What do you do well, and what not?", en:"My reading is good. I read well, but I don't speak well yet."},
    {id:"q20", d:"ask", q:"What did you do well today?", en:"I taught well today, and I finished my work."}

  ],

  topics: [
    {en:"Describe your favorite whisky. Where does it come from, and how does it taste?", he:"וויסקי: מאיפה, איך הטעם, מתי שותים."},
    {en:"Tell me about a piece of classical music you love. When do you listen to it?", he:"יצירה קלאסית שאתה אוהב."},
    {en:"A guest from abroad asks: who is Jacques Lipchitz? Answer in one minute.", he:"ליפשיץ לאורח מחו\"ל."},
    {en:"What does your research deal with? Explain it simply.", he:"המחקר שלך בשפה פשוטה."},
    {en:"Describe a normal Thursday in your life, from morning to night.", he:"יום חמישי רגיל, משגרה."},
    {en:"Introduce yourself at the start of a lecture.", he:"פתיחה של הרצאה: מי אתה ומה אתה עושה."},
    {en:"Which wine do you prefer for Shabbat, and why?", he:"יין לשבת ולמה."},
    {en:"What do you like and what don't you like about your work?", he:"מה אתה אוהב ומה לא. תרגול don't ו-doesn't."},
    {en:"What did you do yesterday, from morning to night?", he:"אתמול, מהבוקר עד הלילה. עבר פשוט."},
    {en:"Tell me about a trip you took. Where did you go, and what didn't you like?", he:"טיול שעשית: מה היה, ומה לא אהבת."},
    {en:"Tell me about the last lecture you heard. Was it good? Did the speaker speak well?", he:"ההרצאה האחרונה ששמעת. good ו-well."},
    {en:"Tell the story of Lipchitz's life in the past tense, in one minute.", he:"חייו של ליפשיץ בעבר, בדקה."},
    {en:"Use all five new words in one minute: Diaspora, persecution, heritage, migration, revival.", he:"חמש המילים החדשות בדקה אחת."}
  ],

  /* Conversation scenarios for the AI partner */
  chats: [
    {id:"c1", title:"בבר וויסקי באדינבורו", he:"אתה מזמין וויסקי ומדבר עם הברמן.", role:"a friendly bartender in a whisky bar in Edinburgh", opener:"Good evening! What can I get you tonight?"},
    {id:"c2", title:"בהפסקה של קונצרט", he:"אתה פוגש מישהו בהפסקה ומדברים על המוזיקה.", role:"a music lover you meet at the interval of a classical concert", opener:"Wonderful first half, wasn't it? Do you come to concerts often?"},
    {id:"c3", title:"אורח מחו\"ל בכנס", he:"חוקר מאמריקה שואל אותך על המחקר.", role:"a friendly American art historian at an academic conference, curious about Jacques Lipchitz", opener:"Hi, nice to meet you! I hear you work on Jacques Lipchitz. What do you study exactly?"},
    {id:"c4", title:"שאלות אחרי הרצאה", he:"סיימת הרצאה, והקהל שואל.", role:"an audience member asking polite questions after a short lecture about a sculptor and a rabbi", opener:"Thank you for the talk. Can I ask a question? Why is this story important?"},
    {id:"c5", title:"שיחה על שגרה", he:"שיחה פשוטה על היום שלך.", role:"a friendly English teacher making small talk about daily routines", opener:"So, tell me, what do you usually do on a weekday?"},
    {id:"c6", title:"מה עשית בסוף השבוע", he:"שיחה בעבר: מה עשית, מה לא עשית.", role:"a friendly colleague on Sunday morning asking about the weekend, who asks follow-up questions that need past simple answers (did, didn't, went, saw)", opener:"Good morning! How was your weekend? What did you do?"},
    {id:"c7", title:"ראיון על ההיסטוריה המשפחתית", he:"מישהו מתעניין במורשת ובהגירה של המשפחה שלך.", role:"a curious interviewer for a community oral history project, asking about family heritage and migration, using the words Diaspora, heritage, migration", opener:"Thank you for joining me. Where did your family live before they came to Israel?"}
  ]
};

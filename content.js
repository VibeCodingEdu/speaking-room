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
     notes: "Habits, routines, facts and opinions. he/she/it + s. Negative: don't / doesn't + base verb."}
  ],

  decks: {
    lesson:   {name: "תיקונים מהשיעור", tag: "תיקון מהשיעור"},
    fix:      {name: "מצא ותקן",        tag: "יש טעות. אמור את המשפט הנכון"},
    whisky:   {name: "וויסקי ויין",      tag: "וויסקי ויין"},
    music:    {name: "מוזיקה קלאסית",   tag: "מוזיקה קלאסית"},
    lipchitz: {name: "ליפשיץ",           tag: "ז'אק ליפשיץ"},
    lecture:  {name: "משפטי הרצאה",      tag: "על הבמה"},
    ask:      {name: "ענה בקול",         tag: "שאלה פתוחה: ענה במשפט שלם"},
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
    {id:"q10", d:"ask", q:"What don't you like about your work?", en:"I don't like the paperwork."}
  ],

  topics: [
    {en:"Describe your favorite whisky. Where does it come from, and how does it taste?", he:"וויסקי: מאיפה, איך הטעם, מתי שותים."},
    {en:"Tell me about a piece of classical music you love. When do you listen to it?", he:"יצירה קלאסית שאתה אוהב."},
    {en:"A guest from abroad asks: who is Jacques Lipchitz? Answer in one minute.", he:"ליפשיץ לאורח מחו\"ל."},
    {en:"What does your research deal with? Explain it simply.", he:"המחקר שלך בשפה פשוטה."},
    {en:"Describe a normal Thursday in your life, from morning to night.", he:"יום חמישי רגיל, משגרה."},
    {en:"Introduce yourself at the start of a lecture.", he:"פתיחה של הרצאה: מי אתה ומה אתה עושה."},
    {en:"Which wine do you prefer for Shabbat, and why?", he:"יין לשבת ולמה."},
    {en:"What do you like and what don't you like about your work?", he:"מה אתה אוהב ומה לא. תרגול don't ו-doesn't."}
  ],

  /* Conversation scenarios for the AI partner */
  chats: [
    {id:"c1", title:"בבר וויסקי באדינבורו", he:"אתה מזמין וויסקי ומדבר עם הברמן.", role:"a friendly bartender in a whisky bar in Edinburgh", opener:"Good evening! What can I get you tonight?"},
    {id:"c2", title:"בהפסקה של קונצרט", he:"אתה פוגש מישהו בהפסקה ומדברים על המוזיקה.", role:"a music lover you meet at the interval of a classical concert", opener:"Wonderful first half, wasn't it? Do you come to concerts often?"},
    {id:"c3", title:"אורח מחו\"ל בכנס", he:"חוקר מאמריקה שואל אותך על המחקר.", role:"a friendly American art historian at an academic conference, curious about Jacques Lipchitz", opener:"Hi, nice to meet you! I hear you work on Jacques Lipchitz. What do you study exactly?"},
    {id:"c4", title:"שאלות אחרי הרצאה", he:"סיימת הרצאה, והקהל שואל.", role:"an audience member asking polite questions after a short lecture about a sculptor and a rabbi", opener:"Thank you for the talk. Can I ask a question? Why is this story important?"},
    {id:"c5", title:"שיחה על שגרה", he:"שיחה פשוטה על היום שלך.", role:"a friendly English teacher making small talk about daily routines", opener:"So, tell me, what do you usually do on a weekday?"}
  ]
};

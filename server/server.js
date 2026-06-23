// server/server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const clientDistPath = path.join(__dirname, 'public');

// 啟用跨網域與 JSON 解析
app.use(cors());
app.use(express.json());

// 連接 SQLite 資料庫（若檔案不存在會自動建立）
const DB_PATH = path.join(__dirname, 'fcu_clubs_v4.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ 資料庫連接失敗:', err.message);
    } else {
        console.log('📦 [SQLite]: 成功連接至逢甲社團資料庫檔案！');
    }
});

// 初始化資料庫結構並預灌 13 個社團的 39 筆精采大事記
db.serialize(() => {
    // 1. 大事記時間軸資料表
    db.run(`CREATE TABLE IF NOT EXISTS timeline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        club TEXT NOT NULL,
        year TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        content TEXT NOT NULL
    )`);

    // 2. 社團近期焦點活動表
    db.run(`CREATE TABLE IF NOT EXISTS club_info (
        club TEXT PRIMARY KEY,
        recent_activity TEXT NOT NULL,
        activity_date TEXT NOT NULL
    )`);

    // 🌟 預灌 39 筆大歷史大事記（若表內無資料才灌入，避免重複）
    db.get("SELECT COUNT(*) AS count FROM timeline", [], (err, row) => {
        if (row && row.count === 0) {
            const defaultTimeline = [
                // gdsc (Google 資訊研究社)
                { club: "gdsc", year: "2022", category: "活動", title: "首屆逢甲黑客松跨界挑戰賽", content: "聯合中部五所大專院校在大書齋舉辦48小時不斷電黑客松，吸引超過百位頂尖極客共襄盛舉。" },
                { club: "gdsc", year: "2024", category: "榮譽", title: "榮獲 Google 官方認證年度優秀社群", content: "因在校園推廣開源技術與AI應用，獲得Google Developer Groups官方頒發亞太區卓越社群獎。" },
                { club: "gdsc", year: "2025", category: "學術", title: "AI智慧校園導覽系統正式上線", content: "社員獨立開發結合大語言模型的逢甲校園導覽App，獲得資訊處採納並於新生週推廣使用。" },
                
                // dance (熱流現代舞蹈社)
                { club: "dance", year: "2018", category: "榮譽", title: "全國大專舞展現代舞組優等", content: "全體社員北上參賽，以融合現代社會議題的舞碼《追光者》奪得全國優等殊榮。" },
                { club: "dance", year: "2021", category: "活動", title: "育樂館終極街舞發表會", content: "首次引進環繞燈光音響舞台，在校內育樂館創下單場破千人進場觀選的歷史紀錄。" },
                { club: "dance", year: "2024", category: "學術", title: "與國際知名舞團進行跨界大師導師合作", content: "邀請來自街舞發源地的專業頂尖舞者蒞校，舉辦為期三天的密集肢體開發工作坊。" },

                // guitar (弦音吉他音樂社)
                { club: "guitar", year: "2019", category: "活動", title: "福星校區星光草地不插電音樂會", content: "在福星男宿大草皮舉辦秋季快閃音樂會，數百位同學齊聚草地用燭光與吉他共度溫馨夜晚。" },
                { club: "guitar", year: "2022", category: "榮譽", title: "第十五屆逢韻獎全國吉他大賽勇奪雙料冠軍", content: "在競爭激烈的獨唱組與創作組中脫穎而出，一舉摘下兩座冠軍獎座。" },
                { club: "guitar", year: "2025", category: "行政", title: "全面翻新學會社辦並建立數位錄音工作站", content: "向學校爭取預算補助，成功導入隔音工程與數位編曲軟體硬體，提升社員創作環境。" },

                // photo (光影校園攝影社)
                { club: "photo", year: "2016", category: "活動", title: "《西屯日常》人文紀實街頭攝影聯展", content: "社員深入逢甲夜市與西屯老街，用鏡頭捕捉在地居民與攤商最真實的生命光影，於人言大樓展出。" },
                { club: "photo", year: "2020", category: "學術", title: "傳統暗房沖印工藝復興計畫", content: "購置二手放大機與全套化學沖洗設備，開設全校性黑白底片沖印工作坊，傳承經典銀鹽魅力。" },
                { club: "photo", year: "2023", category: "榮譽", title: "台灣青年攝影大賽勇奪金牌獎", content: "指導老師帶領社員參賽，最終以作品《忠勤樓的暮色》榮獲大專組紀實類年度金獎。" },

                // drink (微醺美學調酒社)
                { club: "drink", year: "2018", category: "活動", title: "創立全校首屆《逢甲微醺大賽》", content: "於學思園廣場舉辦無酒精雞尾酒特調比賽，吸引近二十組跨院系隊伍登台爭奪調酒師頭銜。" },
                { club: "drink", year: "2022", category: "榮譽", title: "MONIN 全國大專盃調酒挑戰賽特優", content: "以結合台中在地大甲芋頭風味的創意特調，榮獲全國評審一致青睞與銀牌殊榮。" },
                { club: "drink", year: "2024", category: "行政", title: "修訂社團全新章程與專業證照輔導機制", content: "正式將國際吧檯調酒師認證課程導入社課進度，協助多位社員畢業前順利取得專業證照。" },

                // volunteer (綠浪社會志工社)
                { club: "volunteer", year: "2015", category: "活動", title: "啟動西屯區獨居老人週末關懷長青計畫", content: "每週六號召社員深入周邊鄰里，為清寒獨居長者進行環境打掃、物資發放與血壓量測關懷。" },
                { club: "volunteer", year: "2021", category: "榮譽", title: "榮獲教育部全國大專校院優秀學生社團服務獎", content: "因長期深耕社區服務與偏鄉遠征營隊，榮獲教育部頒發年度績優社團優等殊榮。" },
                { club: "volunteer", year: "2024", category: "學術", title: "數位多元課輔系統導入西屯弱勢學童班", content: "結合線上視訊平台，針對弱勢學童建立一對一線上即時解題與心理輔導陪伴機制。" },

                // mountain (野性呼喚登山社)
                { club: "mountain", year: "2014", category: "榮譽", title: "逢甲校旗首度成功登頂玉山主峰", content: "歷經嚴格的負重與高山適應訓練，全隊15名隊員在清晨金黃曙光中將逢甲校旗飄揚於台灣最高巔。" },
                { club: "mountain", year: "2019", category: "學術", title: "舉辦《安全登山與野外急救》全校講座", content: "邀請雪巴嚮導與山難搜救隊專家蒞校演講，建立正確的入山無痕(LNT)觀念與急救處置技能。" },
                { club: "mountain", year: "2023", category: "活動", title: "完成中央山脈南二段縱走偉業", content: "歷時九天八夜，克服極端惡劣氣候，成功橫跨數座中央山脈核心百岳名山，寫下社史新頁。" },

                // bake (麥香滿屋烘焙社)
                { club: "bake", year: "2017", category: "活動", title: "冬至聖誕暖心薑餅屋愛心義賣活動", content: "社員手工製作百組創意薑餅屋與歐式麵包，於噴水池廣場舉辦快閃義賣，所得全數捐贈給育幼院。" },
                { club: "bake", year: "2020", category: "行政", title: "全面爭取升級多功能專業歐式烘焙烤箱", content: "獲得課外活動組特別預算支持，汰換舊型設備，全面引進符合丙級檢定標準之商用蒸氣烤箱。" },
                { club: "bake", year: "2023", category: "榮譽", title: "全國大專烘焙創意大賽奪得銅牌", content: "以結合傳統茶文化與法式慕斯的創意甜點《東方美人》，在全國高手環伺下突圍奪牌。" },

                // board (策略方塊桌遊社)
                { club: "board", year: "2020", category: "活動", title: "舉辦首屆全校百人阿瓦隆與狼人殺破冰爭霸賽", content: "在人言大樓地下沙龍舉辦超大型桌遊對抗賽，吸引超過200名新生參與，成為最熱門的破冰盛事。" },
                { club: "board", year: "2022", category: "學術", title: "引進德式重度策略桌遊分級教學系統", content: "針對複雜經濟與政治體系桌遊（如電力公司、歷史巨輪）建立專人導師制與積分評分賽制。" },
                { club: "board", year: "2025", category: "活動", title: "與台灣原創桌遊設計團隊跨界合作測試", content: "邀請多位國內獨立桌遊設計師，來校舉辦新創劇本與機制盲測會，提供最硬核的專業反饋。" },

                // esport (風暴戰堂電競社)
                { club: "esport", year: "2021", category: "活動", title: "第四屆逢甲盃校園電競大賽全面線上化", content: "克服疫情改採專業線上電競轉播系統，決賽吸引線上超過五千名觀眾同時點閱觀看高燃對決。" },
                { club: "esport", year: "2023", category: "榮譽", title: "勇奪 LSC 全國大專聯賽《英雄聯盟》組殿軍", content: "社團代表隊一路過關斬將，在台北電競館擊敗多所體育強校，創下成軍以來全國最佳戰績。" },
                { club: "esport", year: "2025", category: "學術", title: "建立高規格電競播報與幕後導播培訓班", content: "邀請業界電競主播與知名賽事導播，開設為期半年的專業選片、賽評、轉播設備實作課。" },

                // anime (幻象同人動漫社)
                { club: "anime", year: "2015", category: "活動", title: "第一屆逢甲夏日同人動漫嘉年華", content: "在校本部噴水池廣場舉辦動漫外拍聯誼與痛車展示，吸引中部數百位愛好者前來朝聖共鳴。" },
                { club: "anime", year: "2019", category: "行政", title: "社刊《幻象誌》創刊號正式獨立出版", content: "匯集社內頂尖繪師與同人小說創作者的心血結晶，正式獨立印刷出版並在各大動漫同人展設攤。" },
                { club: "anime", year: "2024", category: "學術", title: "日本知名聲優與原畫大師跨海視訊講座", content: "透過跨海即時視訊，邀請日本第一線動畫業界原畫師分享動畫製程與數位分鏡創作技巧。" },

                // skate (極速風行滑板社)
                { club: "skate", year: "2018", category: "學術", title: "引進全新街頭花式滑板安全防護教學", content: "特別制定了完整的滑板初學者安全講義，由資深社員指導如何安全推板、下階梯與豚跳基礎。" },
                { club: "skate", year: "2022", category: "榮譽", title: "台中大專街頭滑板花式交流邀請賽亞軍", content: "於台中滑板場與多校高手進行一對一技術對抗(GAME OF SKATE)，社員以高難度翻板榮獲亞軍。" },
                { club: "skate", year: "2025", category: "活動", title: "福星路校區夜滑聖誕變裝嘉年華快閃", content: "聖誕夜全體社員身穿聖誕裝，踩著滑板沿福星校區外圍進行安全快閃，發放糖果傳遞青春活力。" },

                // judo (鐵血武魂柔道社)
                { club: "judo", year: "2013", category: "行政", title: "柔道專用高規格安全道館落成啟用", content: "在學校體育組全力協助下，將體育館角落重新鋪設全新高密度防撞道墊，提供社員安全環境。" },
                { club: "judo", year: "2018", category: "榮譽", title: "全國大專校院運動會公開男子組金牌", content: "主將在第一量級決賽中，以精彩絕倫的「一本」摔倒國家隊常客，勇奪全大運金牌，威震全場。" },
                { club: "judo", year: "2023", category: "學術", title: "開設全校性《女子防身術與實戰關節技》", content: "免費開放給全校女同學報名，結合理論與一對一動作拆解，傳授遭遇校園危險時的防身借力技巧。" }
            ];

            const stmt = db.prepare("INSERT INTO timeline (club, year, category, title, content) VALUES (?, ?, ?, ?, ?)");
            defaultTimeline.forEach(item => stmt.run(item.club, item.year, item.category, item.title, item.content));
            stmt.finalize();
            console.log("✨ [SQLite]: 39筆社團輝煌大事記資料全新預灌成功！");
        }
    });

    // 預灌近期公告焦點活動
    db.get("SELECT COUNT(*) AS count FROM club_info", [], (err, row) => {
        if (row && row.count === 0) {
            const defaultActivities = [
                { club: "gdsc", activity: "24hr 不斷電智慧校園 AI 應用挑戰賽", date: "2026-06-25" },
                { club: "dance", activity: "逢甲大專街舞大師菁英盃", date: "2026-07-15" },
                { club: "guitar", activity: "星光草地不插電音樂會", date: "2026-06-28" },
                { club: "photo", activity: "《逢甲夜色微光》紀實攝影展", date: "2026-07-02" },
                { club: "drink", activity: "夏日清新 mocktail 品鑑會", date: "2026-06-24" },
                { club: "volunteer", activity: "獨居老人週末關懷物資募集", date: "2026-06-27" },
                { club: "mountain", activity: "合歡群峰兩天一夜登山新手體驗營", date: "2026-07-20" },
                { club: "bake", activity: "草莓芙蓉塔快閃甜點市集", date: "2026-06-30" },
                { club: "board", activity: "全校阿瓦隆與狼人殺百人破冰爭霸聯賽", date: "2026-07-05" },
                { club: "esport", activity: "第七屆逢甲盃大專電競總決賽", date: "2026-07-10" },
                { club: "anime", activity: "逢甲夏日同人動漫 Cosplay 嘉年華", date: "2026-07-12" },
                { club: "skate", activity: "新手夜滑體驗與滑板基礎花式交流賽", date: "2026-06-26" },
                { club: "judo", activity: "大專盃模擬內部排名對抗邀請賽", date: "2026-07-08" }
            ];
            const stmt = db.prepare("INSERT INTO club_info (club, recent_activity, activity_date) VALUES (?, ?, ?)");
            defaultActivities.forEach(item => stmt.run(item.club, item.activity, item.date));
            stmt.finalize();
            console.log("✨ [SQLite]: 初始近期活動與截止日期注入成功。");
        }
    });
});

// --- API 路由設計 ---

// 1. 取得所有大事記（依年份由新到舊排序）
app.get('/api/timeline', (req, res) => {
    db.all("SELECT * FROM timeline ORDER BY year DESC, id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. 新增單筆大事記
app.post('/api/timeline', (req, res) => {
    const { club, year, title, category, content } = req.body;
    if (!club || !year || !title || !category || !content) {
        return res.status(400).json({ error: "所有欄位皆為必填！" });
    }
    const sql = "INSERT INTO timeline (club, year, title, category, content) VALUES (?, ?, ?, ?, ?)";
    db.run(sql, [club, year, title, category, content], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, club, year, title, category, content });
    });
});

// 3. 取得所有社團的活動看板資訊
app.get('/api/club-info', (req, res) => {
    db.all("SELECT * FROM club_info", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 4. 更新特定社團的活動公告內容與辦理日期
app.post('/api/club-info/update', (req, res) => {
    const { club, recent_activity, activity_date } = req.body;
    if (!club || !recent_activity || !activity_date) {
        return res.status(400).json({ error: "缺少更新必要參數！" });
    }
    const sql = "INSERT INTO club_info (club, recent_activity, activity_date) ON CONFLICT(club) DO UPDATE SET recent_activity=chosen.recent_activity, activity_date=chosen.activity_date";
    
    db.run(`INSERT INTO club_info (club, recent_activity, activity_date) 
            VALUES (?, ?, ?) 
            ON CONFLICT(club) DO UPDATE SET 
            recent_activity = excluded.recent_activity, 
            activity_date = excluded.activity_date`, 
    [club, recent_activity, activity_date], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "success", club, recent_activity, activity_date });
    });
});

// 提供前端建置後的靜態檔案
app.use(express.static(clientDistPath));

// SPA fallback，讓重新整理前端路由時仍回到 index.html
app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

// 啟動伺服器並監聽 Port 3000
app.listen(PORT, () => {
    console.log(`\n🎉 逢甲社團資訊欄後端完美啟動！`);
    console.log(`📡 監聽本機連接埠：http://localhost:${PORT}`);
    console.log(`💡 提示：若需刷新 39 筆初始大事記，請先刪除 db 檔案後重啟此服務。\n`);
});
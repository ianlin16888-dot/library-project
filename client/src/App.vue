<template>
  <div class="portal-wrapper">
    
    <header class="main-header" @click="currentClub = null">
      <h1>🏛️ 逢甲社團資訊欄</h1>
      <p>點擊下方社團專區進入專欄，查看近期活動、詳細介紹與精采歷史時間軸</p>
    </header>

    <div v-if="!currentClub" class="club-grid-container">
      
      <section v-if="upcomingActivities.length > 0" class="upcoming-banner-box">
        <div class="banner-title">⚡ 逢甲即時活動高燃預告 (最迫近活動)</div>
        <div class="banner-list">
          <div v-for="(act, idx) in upcomingActivities" :key="act.club" class="banner-item" @click="selectClub(act.club)">
            <span class="rank-badge">NO.{{ idx + 1 }}</span>
            <span class="club-tag">{{ clubRegistry[act.club]?.icon }} {{ clubRegistry[act.club]?.name }}</span>
            <span class="act-name">【{{ act.recent_activity }}】</span>
            <span class="date-countdown">📅 活動日期：{{ act.activity_date }}</span>
          </div>
        </div>
      </section>

      <h2 class="section-title">🏫 逢甲大學 13 大活躍社團總覽</h2>
      <div class="club-grid">
        <div v-for="(info, id) in clubRegistry" :key="id" class="club-card" @click="selectClub(id)">
          <img :src="info.image" :alt="info.name" class="club-card-img" />
          <div class="club-card-body">
            <h3 class="card-name">{{ info.icon }} {{ info.name }}</h3>
            <p class="card-short">{{ info.shortDesc }}</p>
            <span class="enter-badge">進入社團專欄 →</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="club-column-page">
      <button class="btn-back" @click="currentClub = null">← 返回社團大廳</button>

      <section class="club-intro-panel" :style="{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0.8)), url(' + clubRegistry[currentClub].image + ')' }">
        <div class="intro-header">
          <span class="intro-icon">{{ clubRegistry[currentClub].icon }}</span>
          <div>
            <h2>{{ clubRegistry[currentClub].name }} 專欄看板</h2>
            <p class="tagline">創立年份：西元 {{ clubRegistry[currentClub].established }} 年 | 基地：逢甲大學校本部</p>
          </div>
        </div>
        <div class="intro-body">
          <h4>💡 社團詳細介紹：</h4>
          <p class="desc-text">{{ clubRegistry[currentClub].fullDesc }}</p>
          
          <h4 class="recent-title">🔥 近期焦點活動：</h4>
          <p class="recent-text">
            🔔 <b>活動內容：</b>{{ dynamicActivities[currentClub]?.text || '暫無公告' }} <br>
            📅 <b>預計日期：</b>{{ dynamicActivities[currentClub]?.date || '未定' }}
          </p>
        </div>
      </section>

      <section class="form-box update-activity-box">
        <h3 class="green-title">📢 更新該社團「近期焦點活動與日期」</h3>
        <div class="form-row">
          <div class="form-group style-input-text">
            <label>最新活動名稱/內容：</label>
            <input v-model="inputRecentActivity" type="text" placeholder="例如：期末大型成果發表公演" />
          </div>
          <div class="form-group style-input-date">
            <label>活動辦理日期：</label>
            <input v-model="inputActivityDate" type="date" />
          </div>
        </div>
        <button class="btn-update-activity" @click="updateClubActivity">🔄 立即更新並同步至首頁橫幅</button>
      </section>

      <section class="form-box">
        <h3>✨ 紀錄 {{ clubRegistry[currentClub].name }} 新歷史里程碑</h3>
        <div class="form-row">
          <div class="form-group half">
            <label>發生年份：</label>
            <input v-model="newEvent.year" type="text" placeholder="例如：2026" />
          </div>
          <div class="form-group half">
            <label>事件分類：</label>
            <select v-model="newEvent.category">
              <option value="" disabled selected>請選擇分類</option>
              <option value="行政">行政</option>
              <option value="活動">活動</option>
              <option value="榮譽">榮譽</option>
              <option value="學術">學術</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>事件標題：</label>
          <input v-model="newEvent.title" type="text" placeholder="例如：於人言大樓舉辦成果發表會" />
        </div>
        <div class="form-group">
          <label>詳細內容描述：</label>
          <textarea v-model="newEvent.content" placeholder="請詳細記錄此筆歷史印記..."></textarea>
        </div>
        <button class="btn-submit" @click="addEvent">💾 寫入該社團歷史紀錄</button>
      </section>

      <section class="timeline-section">
        <div class="list-header">
          <h3>📅 {{ clubRegistry[currentClub].name }} 歷史活動時間軸</h3>
          <span class="badge">共 {{ filteredEvents.length }} 筆歷史紀錄</span>
        </div>
        
        <div v-if="filteredEvents.length === 0" class="no-data">
          📭 該社團目前尚無大事記紀錄，歡迎在上方寫入第一筆輝煌歷史！
        </div>

        <div v-else class="timeline">
          <div v-for="event in filteredEvents" :key="event.id" class="timeline-card">
            <div class="timeline-badge" :class="getCategoryClass(event.category)">
              {{ event.category }}
            </div>
            <div class="timeline-content">
              <div class="timeline-year">{{ event.year }} 年</div>
              <h4 class="timeline-title">{{ event.title }}</h4>
              <p class="timeline-desc">{{ event.content }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const clubRegistry = {
  gdsc: { name: "Google 資訊研究社", icon: "💻", established: "2021", image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=500&q=80", shortDesc: "玩轉全端開發、AI 人工智慧與資訊安全的逢甲極客基地。", fullDesc: "熱愛寫程式、研究演算法的工程師天堂。每週於資電館提供實作工作坊，並與黑客松接軌，利用代碼解決逢甲商圈周邊生活痛點。" },
  dance: { name: "熱流現代舞蹈社", icon: "💃", established: "2015", image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=500&q=80", shortDesc: "融合街舞、Jazz、韓流 MV 舞風，燃燒校園熱血的舞台霸主。", fullDesc: "逢甲最具代表性的表演性社團。致力於推廣排舞與街頭文化，每年在育樂館體育場及文華路街頭的成果發表皆吸引大批人潮圍觀。" },
  guitar: { name: "弦音吉他音樂社", icon: "🎸", established: "2018", image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=500&q=80", shortDesc: "用一把民謠木吉他與清澈人聲，溫暖逢甲大草皮的文青搖籃。", fullDesc: "推廣民謠彈唱、Fingerstyle、樂理與編曲創作。是一個溫馨如家庭的音樂社團，經常在校園各處隨興快閃彈唱。" },
  photo: { name: "光影校園攝影社", icon: "📷", established: "2014", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=500&q=80", shortDesc: "定格忠勤樓暮色、記錄逢甲夜市百態的人文之眼。", fullDesc: "專注於單眼相機、微單、底片機的使用技巧與暗房實作。帶領社員走出教室，紀錄文華路商圈的煙火氣與福星校區的四季晨昏。" },
  drink: { name: "微醺美學調酒社", icon: "🍸", established: "2017", image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=500&q=80", shortDesc: "探尋經典調酒調配、融合逢甲夜市小吃風味的味覺魔術師。", fullDesc: "理性飲酒、品味生活。學習英式與花式調酒技巧、酒類歷史文化，並嘗試將台中在地元素與逢甲商圈的特色飲品做跨界融合研發。" },
  volunteer: { name: "綠浪社會志工社", icon: "🤝", established: "2012", image: "https://picsum.photos/id/1012/600/400", shortDesc: "深耕西屯社區扶弱、在福星校區發散溫暖的服務先鋒。", fullDesc: "以關懷社會、回饋西屯社區為核心。長期與周邊鄰里長合作，為弱勢學童提供免費課後輔導，並在寒暑假發起偏鄉部落陪伴營隊。" },
  mountain: { name: "野性呼喚登山社", icon: "🏔️", established: "2011", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=500&q=80", shortDesc: "征服台灣百岳、讓逢甲校旗在主峰絕頂飄揚的冒險家。", fullDesc: "熱愛山林、挑戰自我的大自然冒險社團。強調負重登山、地圖判讀、野外求生與攀岩技巧，每學期皆有規劃中級山野露營與大霸尖山等遠征計畫。" },
  bake: { name: "麥香滿屋烘焙社", icon: "🧁", established: "2016", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80", shortDesc: "手作法式甜點與德式麵包，香氣瀰漫文華路大門的幸福製造所。", fullDesc: "擁有設備齊全的烘焙專業教室，每週邀請職人甜點師指導可麗露、肉桂捲及各類歐式麵包製程，並經常舉辦校園烘焙義賣集資活動。" },
  board: { name: "策略方塊桌遊社", icon: "🎲", established: "2019", image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=500&q=80", shortDesc: "劇本殺推理、德式策略桌遊對奕，考驗逢甲學子大腦運算極限。", fullDesc: "燒腦、交友與邏輯思維的碰撞！館藏超過兩百款知名德式硬核策略桌遊、派對桌遊與陣營劇本，提供課後舒壓與拓展社交的絕佳去處。" },
  esport: { name: "風暴戰堂電競社", icon: "🎮", established: "2020", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=500&q=80", shortDesc: "資電館高燃對決、征戰全國大專電競聯賽的指尖王者。", fullDesc: "逢甲電競國手的搖籃。與各大知名硬體大廠合作，提供電競實況轉播、賽事講評培訓與團隊戰術剖析，常態舉辦《英雄聯盟》與《傳說對決》逢甲校園盃。" },
  anime: { name: "幻象同人動漫社", icon: "🎨", established: "2013", image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=500&q=80", shortDesc: "Cosplay 同人創作、動漫 ACG 樂曲演奏的二次元聖地。", fullDesc: "二次元文化研究與同人創作交流. 社團涵蓋聲優配音體驗、動漫繪畫教學及 Cosplay 道具製作，每年在噴水池廣場舉辦的同人祭皆為熱門打卡景點。" },
  skate: { name: "極速風行滑板社", icon: "🛹", established: "2016", image: "https://images.unsplash.com/photo-1547447134-cd3f5c716030?auto=format&fit=crop&w=500&q=80", shortDesc: "穿梭福星校區柏油道、挑戰花式豚跳的街頭極限風暴。", fullDesc: "熱愛速度與技巧的極限運動團體。從零基礎的推板、轉彎，到高難度的 Ollie 豚跳、桿上滑行教學，滑板社讓熱血的街頭運動精神融入校園風景。" },
  judo: { name: "鐵血武魂柔道社", icon: "🥋", established: "2012", image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=500&q=80", shortDesc: "以柔克剛、在全國大專體育錦錦標賽屢創金牌的鐵血戰隊。", fullDesc: "專注於柔道護身倒法、摔技與寢技鍛鍊。強調武德與精神修養，不管是用於防身或是鍛鍊體魄，柔道社皆提供專業、安全的國家級道館地墊練習環境。" }
};

const currentClub = ref(null);
const allEvents = ref([]);
const rawActivitiesList = ref([]); 
const dynamicActivities = ref({}); 
const newEvent = ref({ year: '', title: '', category: '', content: '' });

const inputRecentActivity = ref('');
const inputActivityDate = ref('');

const filteredEvents = computed(() => {
  return allEvents.value.filter(event => event.club === currentClub.value);
});

const upcomingActivities = computed(() => {
  const todayStr = new Date().toISOString().split('T')[0]; 
  return rawActivitiesList.value
    .filter(act => act.activity_date >= todayStr) 
    .sort((a, b) => a.activity_date.localeCompare(b.activity_date)) 
    .slice(0, 3); 
});

const initializeData = async () => {
  try {
    const resTimeline = await fetch(`${API_BASE}/api/timeline`);
    allEvents.value = await resTimeline.json();
    
    const resInfo = await fetch(`${API_BASE}/api/club-info`);
    const infoArray = await resInfo.json();
    rawActivitiesList.value = infoArray; 

    const activityMap = {};
    infoArray.forEach(item => { 
      activityMap[item.club] = { text: item.recent_activity, date: item.activity_date }; 
    });
    dynamicActivities.value = activityMap;
  } catch (err) {
    console.error("資料載入失敗", err);
  }
};

const selectClub = (clubId) => {
  currentClub.value = clubId;
  inputRecentActivity.value = dynamicActivities.value[clubId]?.text || '';
  inputActivityDate.value = dynamicActivities.value[clubId]?.date || '';
  newEvent.value = { year: '', title: '', category: '', content: '' };
};

const updateClubActivity = async () => {
  if (!inputRecentActivity.value.trim() || !inputActivityDate.value) {
    return alert('請填寫活動公告名稱與辦理日期！');
  }
  try {
    const res = await fetch(`${API_BASE}/api/club-info/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        club: currentClub.value,
        recent_activity: inputRecentActivity.value,
        activity_date: inputActivityDate.value
      })
    });
    
    if (res.ok) {
      alert('📢 焦點活動與到期時效已成功同步至資料庫！');
      await initializeData(); 
    }
  } catch (err) {
    console.error("更新活動失敗", err);
  }
};

const addEvent = async () => {
  if (!newEvent.value.year || !newEvent.value.title || !newEvent.value.category || !newEvent.value.content) {
    return alert('請完整填寫大事記欄位資訊！');
  }
  try {
    const res = await fetch(`${API_BASE}/api/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ club: currentClub.value, ...newEvent.value })
    });
    const savedEvent = await res.json();
    allEvents.value.unshift(savedEvent);
    allEvents.value.sort((a, b) => b.year.localeCompare(a.year));
    newEvent.value = { year: '', title: '', category: '', content: '' };
    alert(`🎉 成功寫入大事記！`);
  } catch (err) {
    console.error("新增失敗", err);
  }
};

const getCategoryClass = (category) => {
  const mapping = { '行政': 'cat-admin', '活動': 'cat-activity', '榮譽': 'cat-honor', '學術': 'cat-academic' };
  return mapping[category] || '';
};

onMounted(initializeData);
</script>

<style>
body { background-color: #f1f5f9; font-family: 'Segoe UI', Arial, 'Microsoft JhengHei', sans-serif; margin:0; padding:0; }
.portal-wrapper { max-width: 950px; margin: 40px auto; padding: 0 20px; }

/* 逢甲風格大橫幅 */
.main-header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #0f172a, #1e3a8a); color: white; padding: 35px; border-radius: 20px; box-shadow: 0 10px 25px rgba(30, 58, 138, 0.15); cursor: pointer; }
.main-header h1 { margin: 0 0 10px 0; font-size: 30px; letter-spacing: 1px; }
.main-header p { margin: 0; font-size: 14px; color: #cbd5e1; }

/* 🔥 近期即將到期活動專屬橫幅面板樣式 */
.upcoming-banner-box { background: linear-gradient(to right, #fef2f2, #fff7ed); border: 2px solid #fca5a5; border-radius: 16px; padding: 20px; margin-bottom: 35px; box-shadow: 0 5px 15px rgba(220, 38, 38, 0.05); }
.banner-title { font-weight: bold; color: #dc2626; font-size: 15px; margin-bottom: 12px; display: flex; align-items: center; }
.banner-list { display: flex; flex-direction: column; gap: 10px; }
.banner-item { background: white; border: 1px solid #fee2e2; padding: 12px 16px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.01); }
.banner-item:hover { transform: scale(1.01); border-color: #ef4444; background: #fff5f5; }
.rank-badge { background: #ef4444; color: white; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 6px; }
.club-tag { font-weight: bold; color: #1e3a8a; font-size: 14px; margin-left: 10px; min-width: 140px; }
.act-name { color: #334155; font-size: 14px; flex-grow: 1; text-align: left; font-weight: 500; }
.date-countdown { font-size: 13px; color: #b45309; font-weight: bold; background: #fef3c7; padding: 4px 10px; border-radius: 6px; font-family: monospace; }

.section-title { color: #1e293b; font-size: 22px; margin-bottom: 25px; text-align: center; }

/* 13個社團網格 */
.club-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px; margin-bottom: 60px; }
.club-card { background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; }
.club-card:hover { transform: translateY(-6px); box-shadow: 0 20px 25px rgba(0,0,0,0.08); border-color: #2563eb; }
.club-card-img { width: 100%; height: 160px; object-fit: cover; background-color: #cbd5e1; }
.club-card-body { padding: 20px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; }
.card-name { margin: 0 0 8px 0; color: #0f172a; font-size: 18px; font-weight: bold; }
.card-short { font-size: 13.5px; color: #475569; line-height: 1.5; margin: 0 0 15px 0; }
.enter-badge { font-size: 13px; color: #2563eb; font-weight: bold; align-self: flex-start; }

/* 內頁專欄 */
.btn-back { background: #475569; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; margin-bottom: 25px; }
.club-intro-panel { background-size: cover; background-position: center; padding: 30px; border-radius: 20px; border-left: 8px solid #2563eb; box-shadow: 0 4px 15px rgba(0,0,0,0.03); margin-bottom: 35px; }
.intro-header { display: flex; align-items: center; gap: 18px; margin-bottom: 20px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 15px; }
.intro-icon { font-size: 45px; }
.intro-header h2 { margin: 0; color: #0f172a; font-size: 24px; }
.tagline { margin: 6px 0 0 0; color: #475569; font-size: 13px; font-weight: bold; }
.desc-text { color: #334155; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0; }
.recent-title { margin: 0 0 6px 0; color: #dc2626; font-size: 15px; font-weight: bold; }
.recent-text { margin: 0; background: #fff5f5; border: 1px solid #fee2e2; padding: 14px; border-radius: 8px; color: #991b1b; font-size: 14px; line-height: 1.6; }

/* 表單欄位 */
.form-box { padding: 25px; background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; margin-bottom: 40px; }
.green-title { border-left: 5px solid #10b981 !important; padding-left: 12px; }
.form-row { display: flex; gap: 15px; }
.form-group { margin-bottom: 15px; flex: 1; }
.form-group.half { flex: 0 0 calc(50% - 7.5px); }
.style-input-text { flex: 0 0 70%; }
.style-input-date { flex: 0 0 30%; }
label { display: block; font-size: 13px; font-weight: bold; color: #334155; margin-bottom: 6px; }
input, select, textarea { width: 100%; padding: 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
textarea { height: 80px; resize: none; }
.btn-submit { background: #10b981; color: white; border: none; padding: 13px; font-size: 15px; font-weight: bold; border-radius: 8px; cursor: pointer; width: 100%; }
.btn-update-activity { background: #2563eb; color: white; border: none; padding: 12px; font-size: 14px; font-weight: bold; border-radius: 8px; cursor: pointer; width: 100%; }

.list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.list-header h3 { margin: 0; color: #0f172a; border-left: 5px solid #10b981; padding-left: 12px; font-size: 19px; }
.badge { background: #e2e8f0; color: #1e293b; padding: 5px 14px; font-size: 12px; font-weight: bold; border-radius: 20px; }
.no-data { text-align: center; padding: 40px; color: #64748b; background: white; border-radius: 16px; border: 2px dashed #e2e8f0; }

.timeline { position: relative; border-left: 3px solid #e2e8f0; padding-left: 25px; margin-left: 15px; }
.timeline-card { position: relative; margin-bottom: 30px; background: #fff; border: 1px solid #f1f5f9; padding: 20px; border-radius: 14px; }
.timeline-card::before { content: ''; position: absolute; left: -34px; top: 24px; width: 12px; height: 12px; border-radius: 50%; background: #2563eb; border: 3px solid #fff; box-shadow: 0 0 0 2px #cbd5e1; }
.timeline-badge { display: inline-block; padding: 3px 10px; font-size: 11px; font-weight: bold; border-radius: 5px; margin-bottom: 10px; }

.cat-admin { background: #dbeafe; color: #1e40af; }
.cat-activity { background: #d1fae5; color: #065f46; }
.cat-honor { background: #fef3c7; color: #92400e; }
.cat-academic { background: #f3e8ff; color: #6b21a8; }

.timeline-year { font-size: 13.5px; font-weight: bold; color: #2563eb; }
.timeline-title { margin: 5px 0 10px 0; color: #0f172a; font-size: 18px; }
.timeline-desc { margin: 0; color: #334155; font-size: 14px; line-height: 1.6; }
</style>
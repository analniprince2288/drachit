(() => {
  'use strict';

  const KEY = 'drachit-infinity-save-v3';
  const KEY_V2 = 'drachit-infinity-save-v2';
  const KEY_V1 = 'drachit-infinity-count-v1';
  const MAX = Number.MAX_SAFE_INTEGER;
  const $ = id => document.getElementById(id);
  const fmt = new Intl.NumberFormat('ru-RU');
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const safeNumber = (value, max = MAX) => Number.isFinite(value) && value > 0 ? Math.min(max, Math.floor(value)) : 0;
  const isObject = x => x && typeof x === 'object' && !Array.isArray(x);
  const modes = new Set(['manual', 'auto', 'turbo', 'chaos']);
  const slots = { weapon: 'ОРУЖИЕ', armor: 'ДОСПЕХ', relic: 'РЕЛИКВИЯ' };
  const classes = [
    { id: 'knight', name: 'РЫЦАРЬ НАЖИМА', short: 'РЫЦАРЬ', glyph: '⚔', desc: '+25% к ручной силе', click: 1.25, flow: 1, crit: 0, hp: 0, attack: 3 },
    { id: 'archon', name: 'АРХОНТ ЦИКЛА', short: 'АРХОНТ', glyph: '✧', desc: '+30% к автопотоку', click: 1, flow: 1.3, crit: 0, hp: 5, attack: 1 },
    { id: 'berserker', name: 'БЕРСЕРК ПЕЧАТИ', short: 'БЕРСЕРК', glyph: '☩', desc: '+8% к крит. удару', click: 1, flow: 1, crit: .08, hp: 0, attack: 6 }
  ];
  const zones = [
    { id: 0, name: 'Пепельные врата', short: 'ВРАТА', level: 1, subtitle: 'Там, где начинается цикл.', enemy: 'Страж Пепельных врат', glyph: '♜', description: 'Древний защитник первого порога.', hp: 72, damage: 7, gold: 115, xp: 80 },
    { id: 1, name: 'Обитель теней', short: 'ОБИТЕЛЬ', level: 4, subtitle: 'Тьма здесь обрела собственную волю.', enemy: 'Безликий хранитель', glyph: '♝', description: 'Он питается нерешительностью.', hp: 185, damage: 13, gold: 290, xp: 225 },
    { id: 2, name: 'Трон безмолвия', short: 'ТРОН', level: 8, subtitle: 'Последний зал не имеет выхода.', enemy: 'Вестник последней черты', glyph: '♛', description: 'Он не признаёт завершения.', hp: 390, damage: 22, gold: 730, xp: 600 }
  ];
  const items = {
    sword0: { name: 'Клинок посвящённого', slot: 'weapon', tier: 'ОБЫЧНЫЙ', atk: 2, hp: 0, flow: 0, click: 0 },
    sword1: { name: 'Острие бесконечного пути', slot: 'weapon', tier: 'РЕДКИЙ', atk: 6, hp: 0, flow: 0, click: 1 },
    sword2: { name: 'Каратель последнего часа', slot: 'weapon', tier: 'ЭПИЧЕСКИЙ', atk: 13, hp: 0, flow: 0, click: 2 },
    chest1: { name: 'Панцирь обета', slot: 'armor', tier: 'РЕДКИЙ', atk: 1, hp: 35, flow: 0, click: 0 },
    chest2: { name: 'Доспех неугасимой воли', slot: 'armor', tier: 'ЭПИЧЕСКИЙ', atk: 3, hp: 85, flow: 0, click: 0 },
    relic1: { name: 'Осколок вечного пламени', slot: 'relic', tier: 'РЕДКИЙ', atk: 0, hp: 0, flow: 5, click: 1 },
    relic2: { name: 'Печать автономии', slot: 'relic', tier: 'ЭПИЧЕСКИЙ', atk: 1, hp: 15, flow: 13, click: 2 }
  };
  const upgradeDefs = [
    { id: 'click', glyph: '⚔', name: 'ЖЕЛЕЗНАЯ ВОЛЯ', desc: '+1 к ручному действию за уровень.', base: 50, scale: 1.65, cap: 300 },
    { id: 'engine', glyph: '✧', name: 'ВЕЧНЫЙ МЕХАНИЗМ', desc: '+3 единицы в секунду к автоматическому циклу.', base: 100, scale: 1.7, cap: 300 },
    { id: 'crit', glyph: '☩', name: 'МЕТКА ПРЕДЕЛА', desc: '+5% к критическому шансу (максимум 60%).', base: 180, scale: 1.8, cap: 11 },
    { id: 'bonus', glyph: '✴', name: 'ВЛАСТЬ НАД УДАРОМ', desc: '+1 к множителю критического действия.', base: 340, scale: 2.1, cap: 7 }
  ];
  const questDefs = [
    { id: 'first10', icon: '⚔', name: 'ПЕРВЫЙ ОБЕТ', desc: 'Совершить 10 ручных действий.', target: 10, stat: s => s.clicks, gold: 80, xp: 60 },
    { id: 'auto300', icon: '✧', name: 'СИЛА МЕХАНИЗМА', desc: 'Накопить 300 единиц автоматическим способом.', target: 300, stat: s => s.auto, gold: 130, xp: 90 },
    { id: 'combo12', icon: '☩', name: 'НЕПРЕРЫВНЫЙ НАТИСК', desc: 'Достичь серии из 12 последовательных действий.', target: 12, stat: s => s.bestCombo, gold: 150, xp: 90 },
    { id: 'shop2', icon: '◈', name: 'СТАЛЬ И ВОЛЯ', desc: 'Приобрести два улучшения в кузнице.', target: 2, stat: s => Object.values(s.upgrades).reduce((a,b)=>a+b,0), gold: 200, xp: 100 },
    { id: 'total2000', icon: '✦', name: 'ПУТЬ ДВУХ ТЫСЯЧ', desc: 'Достигнуть 2 000 единиц действия.', target: 2000, stat: s => s.total, gold: 300, xp: 170 },
    { id: 'boss1', icon: '♛', name: 'РАЗРУШИТЬ ПРЕДЕЛ', desc: 'Одержать первую победу над владыкой.', target: 1, stat: s => s.bossWins, gold: 400, xp: 220, potions: 1 },
    { id: 'class1', icon: '♜', name: 'ВЫБРАННЫЙ ПУТЬ', desc: 'Утвердить свой боевой класс.', target: 1, stat: s => s.classChosen ? 1 : 0, gold: 65, xp: 65 },
    { id: 'victory3', icon: '⚑', name: 'ХРОНИКИ ПЕРВЫХ ПОБЕД', desc: 'Одолеть трёх противников.', target: 3, stat: s => s.victories, gold: 200, xp: 125, potions: 1 },
    { id: 'loot1', icon: '◇', name: 'ТРОФЕЙ ВОИНА', desc: 'Получить первый трофей в бою.', target: 1, stat: s => s.lootFound, gold: 170, xp: 120 }
  ];
  const achievementDefs = [
    { id: 'one', glyph: '⚔', name: 'ПЕРВЫЙ ШАГ', desc: 'Первое ручное действие', test: s => s.clicks >= 1 },
    { id: 'thousand', glyph: '✧', name: 'ТЫСЯЧА ДЕЯНИЙ', desc: '1 000 единиц действия', test: s => s.total >= 1000 },
    { id: 'tenk', glyph: '✴', name: 'ДЕСЯТЬ ТЫСЯЧ', desc: '10 000 единиц действия', test: s => s.total >= 10000 },
    { id: 'boss', glyph: '♛', name: 'УБИЙЦА ВЛАДЫК', desc: 'Первая победа над владыкой', test: s => s.bossWins >= 1 },
    { id: 'rich', glyph: '◈', name: 'ЗОЛОТОЙ ПОТОК', desc: '5 000 единиц действия', test: s => s.total >= 5000 },
    { id: 'warrior', glyph: '♜', name: 'ИЗБРАННЫЙ ПУТЬ', desc: 'Выбран боевой класс', test: s => s.classChosen },
    { id: 'victory', glyph: '⚑', name: 'СТРАЖ ГРАНИЦЫ', desc: 'Пять побед в экспедициях', test: s => s.victories >= 5 },
    { id: 'equipment', glyph: '◇', name: 'АРСЕНАЛ', desc: 'Занять все три ячейки снаряжения', test: s => Object.values(s.equipment).every(Boolean) }
  ];

  function fresh() {
    return {
      version: 3, total: 0, coins: 0, xp: 0, manual: 0, auto: 0,
      clicks: 0, skullClicks: 0, bestCombo: 0, mode: 'auto', speed: 12,
      upgrades: { click: 0, engine: 0, crit: 0, bonus: 0 },
      claimed: [], achievements: [], bossWins: 0, victories: 0, lootFound: 0,
      classId: 'knight', classChosen: false, zone: 0,
      inventory: [{ id: 1, type: 'sword0' }], equipment: { weapon: 1, armor: null, relic: null },
      nextItemId: 2, potions: 2, health: 120, energy: 50, autobattle: false,
      journal: [], lastSeen: Date.now()
    };
  }
  function validatedSave(raw) {
    if (!isObject(raw) || raw.version !== 3) return null;
    const s = fresh();
    for (const k of ['total','coins','xp','manual','auto','clicks','skullClicks','bestCombo','bossWins','victories','lootFound','nextItemId','potions','health','energy','lastSeen']) s[k] = safeNumber(raw[k]);
    for (const d of upgradeDefs) s.upgrades[d.id] = safeNumber(raw.upgrades?.[d.id], d.cap);
    s.mode = modes.has(raw.mode) ? raw.mode : 'auto';
    s.speed = clamp(safeNumber(raw.speed) || 12,1,100);
    s.classId = classes.some(c=>c.id===raw.classId) ? raw.classId : 'knight';
    s.classChosen = !!raw.classChosen;
    s.zone = clamp(safeNumber(raw.zone),0,zones.length-1);
    s.autobattle = !!raw.autobattle;
    s.claimed = [...new Set(Array.isArray(raw.claimed) ? raw.claimed.filter(id=>questDefs.some(q=>q.id===id)) : [])];
    s.achievements = [...new Set(Array.isArray(raw.achievements) ? raw.achievements.filter(id=>achievementDefs.some(a=>a.id===id)) : [])];
    s.inventory = Array.isArray(raw.inventory) ? raw.inventory.filter(x=>isObject(x)&&Number.isSafeInteger(x.id)&&x.id>0&&items[x.type]).slice(0,40).map(x=>({id:x.id,type:x.type})) : [];
    const ids = new Set();s.inventory=s.inventory.filter(x=>!ids.has(x.id)&&ids.add(x.id));
    const eq=isObject(raw.equipment)?raw.equipment:{};
    s.equipment = { weapon: null, armor: null, relic: null };
    for (const slot of Object.keys(slots)) if(s.inventory.some(x=>x.id===eq[slot]&&items[x.type].slot===slot))s.equipment[slot]=eq[slot];
    s.nextItemId = Math.max(2,s.nextItemId,...s.inventory.map(x=>x.id+1));
    if(!s.inventory.length){s.inventory=[{id:s.nextItemId++,type:'sword0'}];s.equipment.weapon=s.inventory[0].id;}
    s.journal = Array.isArray(raw.journal) ? raw.journal.filter(x=>isObject(x)&&typeof x.msg==='string'&&typeof x.at==='string').slice(0,30).map(x=>({msg:x.msg.slice(0,180),at:x.at.slice(0,25)})) : [];
    s.health=clamp(s.health||1,1,500000);
    s.energy=clamp(s.energy,0,100);
    if(!s.lastSeen || s.lastSeen>Date.now()+60000) s.lastSeen=Date.now();
    return s;
  }
  function migrateV2(raw) {
    if (!isObject(raw) || raw.version !== 2) return null;
    const s = fresh();
    for(const key of ['total','coins','xp','manual','auto','clicks','skullClicks','bestCombo','bossWins']) s[key]=safeNumber(raw[key]);
    s.victories=s.bossWins;
    for (const d of upgradeDefs) s.upgrades[d.id]=safeNumber(raw.upgrades?.[d.id],d.cap);
    s.mode=modes.has(raw.mode)?raw.mode:'auto';s.speed=clamp(safeNumber(raw.speed)||12,1,100);
    s.claimed=Array.isArray(raw.claimed)?[...new Set(raw.claimed.filter(x=>questDefs.some(q=>q.id===x)))]:[];
    s.achievements=Array.isArray(raw.achievements)?[...new Set(raw.achievements.filter(x=>achievementDefs.some(a=>a.id===x)))]:[];
    s.lastSeen=safeNumber(raw.lastSaved)||Date.now();
    s.journal=[{at:new Date().toLocaleTimeString('ru-RU'),msg:'Хроники II перенесены в главу III.'}];
    return s;
  }
  function parseStorage(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch(_){return null;}}
  function load(){
    const v3=validatedSave(parseStorage(KEY));if(v3)return v3;
    const v2=migrateV2(parseStorage(KEY_V2));if(v2)return v2;
    const s=fresh();try{const v=Number(localStorage.getItem(KEY_V1));if(Number.isSafeInteger(v)&&v>0){s.total=v;s.auto=v;}}catch(_){}return s;
  }

  let state=load();
  let battle=null,combo=0,lastHit=0,accumulator=0,autoAttackTimer=0,sound=false,audio=null;
  let lastFrame=performance.now(), lastDraw=0, lastSave=0, lastPanel=0, activeTab='quests';
  let panelDirty=true, frameTick=0, zoneDirty=true;
  const number=n=>fmt.format(Math.floor(n));
  const charClass=()=>classes.find(c=>c.id===state.classId)||classes[0];
  function levelInfo(){
    let remaining=state.xp,level=1,need=100;
    while(remaining>=need&&level<125){remaining-=need;level++;need=Math.round(100*Math.pow(1.18,Math.min(level-1,110)));}
    return {level,progress:remaining,need,rank:level>=25?'Владыка цикла':level>=14?'Магистр ордена':level>=8?'Хранитель печати':level>=4?'Адепт':'Посвящённый'};
  }
  function equippedStats(){
    const result={atk:0,hp:0,flow:0,click:0};
    for(const id of Object.values(state.equipment)){const type=state.inventory.find(x=>x.id===id)?.type;const item=items[type];if(!item)continue;for(const k of Object.keys(result))result[k]+=item[k]||0;}return result;
  }
  function stats(){
    const cl=charClass(),eq=equippedStats(),lv=levelInfo().level;
    const maxHp=120+(lv-1)*5+cl.hp+eq.hp;
    const click=Math.max(1,Math.floor((1+state.upgrades.click+eq.click)*cl.click));
    const baseRate=(state.speed+state.upgrades.engine*3+eq.flow)*cl.flow;
    const rate=state.mode==='manual'?0:baseRate*(state.mode==='turbo'?4:state.mode==='chaos'?1.6:1);
    return {maxHp,click,rate,attack:9+(lv-1)*2+cl.attack+eq.atk,crit:clamp(.05+state.upgrades.crit*.05+cl.crit,0,.6),critMult:3+state.upgrades.bonus};
  }
  function earn(n,source){
    n=safeNumber(n);if(!n)return;
    const actual=Math.min(n,MAX-state.total);if(!actual)return;
    state.total+=actual;state.coins=Math.min(MAX,state.coins+actual);
    state.xp=Math.min(MAX,state.xp+(source==='manual'?Math.max(1,Math.floor(actual/2)):Math.floor(actual/10)));
    if(source==='manual')state.manual=Math.min(MAX,state.manual+actual);
    else state.auto=Math.min(MAX,state.auto+actual);
    panelDirty=true;
  }
  function log(msg){state.journal.unshift({at:new Date().toLocaleTimeString('ru-RU'),msg});state.journal=state.journal.slice(0,30);if(activeTab==='journal')panelDirty=true;}
  function toast(title,subtitle=''){
    const elem=document.createElement('div');elem.className='toast';elem.textContent=title;
    if(subtitle){const sub=document.createElement('small');sub.textContent=subtitle;elem.appendChild(sub);}
    $('toasts').appendChild(elem);setTimeout(()=>elem.remove(),3500);
    while($('toasts').children.length>3)$('toasts').firstChild.remove();
  }
  function chime(){if(!sound)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audio=audio||new AC();const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(370,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(195,audio.currentTime+.11);gain.gain.setValueAtTime(.035,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+.13);}catch(_){}
  }
  function floatHit(text,crit){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const rect=$('sigilButton').getBoundingClientRect();const el=document.createElement('span');el.className='damage-number'+(crit?' crit':'');el.textContent=text;
    el.style.left=(rect.left+rect.width*.5+(Math.random()-.5)*75)+'px';el.style.top=(rect.top+rect.height*.25)+'px';$('floatLayer').append(el);setTimeout(()=>el.remove(),850);
  }
  function updateLevel(previous){
    const next=levelInfo().level;if(next>previous){const st=stats();state.health=st.maxHp;state.energy=100;toast('НОВЫЙ УРОВЕНЬ',`Вы достигли уровня ${next}. Здоровье и энергия восстановлены.`);log('Уровень персонажа повышен до '+next);}
  }
  function attack(damage,fromSkill=false){
    if(!battle)return;
    battle.hp=Math.max(0,battle.hp-safeNumber(damage,1e9));
    floatHit((fromSkill?'✴ ':'−')+number(damage),fromSkill);
    if(battle.hp===0)victory();
  }
  function manualAction(fromSigil=false){
    const now=performance.now(),oldLevel=levelInfo().level;
    combo=now-lastHit<1500?combo+1:1;lastHit=now;
    state.clicks=Math.min(MAX,state.clicks+1);
    if(fromSigil)state.skullClicks=Math.min(MAX,state.skullClicks+1);
    state.bestCombo=Math.max(combo,state.bestCombo);
    const st=stats();const isCrit=Math.random()<st.crit;
    const multiplier=isCrit?st.critMult:1;
    const gain=st.click*multiplier*(1+Math.floor(combo/10));
    earn(gain,'manual');
    state.energy=clamp(state.energy+5,0,100);
    if(battle){const damage=Math.round(st.attack*(isCrit?2:1)*(1+Math.floor(combo/12)*.2));attack(damage);}
    else floatHit((isCrit?'✦ ':'+')+number(gain),isCrit);
    if(!battle) {$('sigilButton').classList.add('hit-flash');setTimeout(()=>$('sigilButton').classList.remove('hit-flash'),120);}
    chime();updateLevel(oldLevel);panelDirty=true;
  }
  function useSkill(){
    if(!battle){toast('ЦЕЛЬ НЕ ОБНАРУЖЕНА','Начните экспедицию.');return;}
    if(state.energy<25){toast('НЕДОСТАТОЧНО ЭНЕРГИИ','Необходимо 25 единиц.');return;}
    const oldLevel=levelInfo().level;state.energy-=25;
    const damage=Math.round(stats().attack*3.2);
    attack(damage,true);state.xp=Math.min(MAX,state.xp+5);updateLevel(oldLevel);
    log('Применён Пробой печати: '+damage+' урона');panelDirty=true;
  }
  function usePotion(){const max=stats().maxHp;if(state.potions<1){toast('ЭЛИКСИРОВ НЕТ','Пополните запас в кузнице.');return;}if(state.health>=max){toast('ЗДОРОВЬЕ ПОЛНОЕ','Восстановление не требуется.');return;}state.potions--;state.health=Math.min(max,state.health+45);toast('ЭЛИКСИР ИСПОЛЬЗОВАН','Здоровье восстановлено.');panelDirty=true;}
  function startEncounter(isBoss){
    if(battle){toast('СРАЖЕНИЕ УЖЕ ИДЁТ','Завершите текущий бой.');return;}
    const z=zones[state.zone],lv=levelInfo().level;
    if(lv<z.level){toast('ОБЛАСТЬ ЗАКРЫТА',`Требуется уровень ${z.level}.`);return;}
    if(isBoss&&state.victories<2){toast('ПЕЧАТЬ ВЛАДЫКИ ЗАКРЫТА','Для призыва одержите две победы.');return;}
    battle={isBoss,zone:state.zone,name:isBoss?'Владыка Остановки':z.enemy,glyph:isBoss?'♚':z.glyph,
      hp:Math.round(z.hp*(isBoss?3.2:1)),maxHp:Math.round(z.hp*(isBoss?3.2:1)),
      damage:Math.round(z.damage*(isBoss?1.65:1)),gold:Math.round(z.gold*(isBoss?4:1)),xp:Math.round(z.xp*(isBoss?3.5:1)),
      started:performance.now(),nextAttack:performance.now()+2800};
    autoAttackTimer=0;
    log(`Начато сражение: ${battle.name}`);toast(isBoss?'ВЛАДЫКА ПРИЗВАН':'ЭКСПЕДИЦИЯ НАЧАТА',battle.name);renderAll();
  }
  function addLoot(isBoss,zone){
    if(!isBoss&&state.victories!==1&&Math.random()>.48)return;
    const pool=zone===0?['sword1','chest1','relic1']:zone===1?['sword1','sword2','chest1','chest2','relic1']:['sword2','chest2','relic2'];
    const type=pool[Math.floor(Math.random()*pool.length)];
    if(state.inventory.length>=30){state.coins=Math.min(MAX,state.coins+180);log('Инвентарь заполнен. Трофей преобразован в 180 золота.');return;}
    const id=state.nextItemId++;state.inventory.push({id,type});state.lootFound++;
    log('Получен трофей: '+items[type].name);toast('НОВЫЙ ТРОФЕЙ',items[type].name);panelDirty=true;
  }
  function victory(){
    if(!battle)return;
    const b=battle;battle=null;
    const oldLevel=levelInfo().level;
    state.victories++;if(b.isBoss)state.bossWins++;
    state.coins=Math.min(MAX,state.coins+b.gold);state.xp=Math.min(MAX,state.xp+b.xp);
    state.health=Math.min(stats().maxHp,state.health+18);
    if(b.isBoss||Math.random()<.28)state.potions++;
    addLoot(b.isBoss,b.zone);updateLevel(oldLevel);
    log(`Победа над ${b.name}: +${b.gold} золота, +${b.xp} опыта`);
    toast('ВРАГ ПОВЕРЖЕН',`+${number(b.gold)} золота · +${number(b.xp)} опыта`);
    autoAttackTimer=0;panelDirty=true;save();renderAll();
  }
  function defeat(){
    if(!battle)return;const name=battle.name;battle=null;
    const loss=Math.min(state.coins,Math.floor(state.coins*.03));state.coins-=loss;
    state.health=Math.max(1,Math.ceil(stats().maxHp*.5));state.energy=35;
    log(`Отступление после поражения от ${name}. Потеряно ${loss} золота.`);
    toast('ВЫ ПОВЕРЖЕНЫ',`Отдых восстановил часть сил. Потеряно ${number(loss)} золота.`);
    panelDirty=true;save();renderAll();
  }
  function flee(){if(!battle)return;log('Экспедиция прервана.');battle=null;autoAttackTimer=0;toast('ЭКСПЕДИЦИЯ ПРЕРВАНА');renderAll();}
  function tickBattle(now,delta){
    const st=stats();state.energy=Math.min(100,state.energy+delta*1.8);
    if(!battle){state.health=Math.min(st.maxHp,state.health+delta*2.2);return;}
    if(now>=battle.nextAttack){const dmg=battle.damage;state.health=Math.max(0,state.health-dmg);battle.nextAttack=now+2800;log(`Атака противника: −${dmg} здоровья`);if(state.health<=0){defeat();return;}}
    if(state.autobattle){autoAttackTimer+=delta;if(autoAttackTimer>=.8){autoAttackTimer-=.8;attack(stats().attack);}}
  }
  function buyUpgrade(id){const d=upgradeDefs.find(x=>x.id===id);if(!d)return;const lvl=state.upgrades[id];if(lvl>=d.cap)return;const cost=Math.min(MAX,Math.ceil(d.base*Math.pow(d.scale,lvl)));if(state.coins<cost){toast('НЕДОСТАТОЧНО ЗОЛОТА');return;}state.coins-=cost;state.upgrades[id]++;log('Кузница: '+d.name+' · уровень '+state.upgrades[id]);toast('УЛУЧШЕНИЕ ПОЛУЧЕНО',d.name);panelDirty=true;save();renderAll();}
  function equip(id){const item=state.inventory.find(x=>x.id===id);if(!item)return;const slot=items[item.type].slot;if(state.equipment[slot]===id)return;state.equipment[slot]=id;state.health=Math.min(state.health,stats().maxHp);log('Экипировано: '+items[item.type].name);toast('СНАРЯЖЕНИЕ ИЗМЕНЕНО',items[item.type].name);panelDirty=true;save();renderAll();}
  function chooseClass(id){const cl=classes.find(x=>x.id===id);if(!cl)return;state.classId=id;state.classChosen=true;state.health=Math.min(state.health,stats().maxHp);log('Выбран путь: '+cl.name);toast('ПУТЬ УТВЕРЖДЁН',cl.name);panelDirty=true;save();renderAll();}
  function claimQuest(id){const q=questDefs.find(x=>x.id===id);if(!q||state.claimed.includes(id)||q.stat(state)<q.target)return;const oldLevel=levelInfo().level;state.claimed.push(id);state.coins=Math.min(MAX,state.coins+q.gold);state.xp=Math.min(MAX,state.xp+q.xp);state.potions+=q.potions||0;updateLevel(oldLevel);log('Поручение исполнено: '+q.name);toast('ПОРУЧЕНИЕ ИСПОЛНЕНО',`+${q.gold} золота · +${q.xp} опыта`);panelDirty=true;save();renderAll();}
  function checkAchievements(){for(const a of achievementDefs){if(!state.achievements.includes(a.id)&&a.test(state)){state.achievements.push(a.id);log('Новая печать: '+a.name);toast('ПЕЧАТЬ ПОЛУЧЕНА',a.name);panelDirty=true;}}}
  function applyOffline(){const now=Date.now(),seconds=clamp((now-state.lastSeen)/1000,0,86400);if(seconds>=2&&state.mode!=='manual'){
    const old=levelInfo().level, st=stats(), earned=Math.floor(st.rate*seconds);
    if(earned){earn(earned,'auto');updateLevel(old);log(`Автономный цикл: +${number(earned)} за отсутствие.`);toast('ЦИКЛ ПРОДОЛЖАЛСЯ',`+${number(earned)} единиц`);}
  }state.lastSeen=now;
  }
  function save(forceTimestamp=false){if(!document.hidden||forceTimestamp)state.lastSeen=Date.now();try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){} }

  function make(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
  function renderClassChoices(){const root=$('classOptions');root.replaceChildren();for(const cl of classes){const btn=make('button','class-choice'+(cl.id===state.classId?' active':''));btn.type='button';btn.dataset.class=cl.id;btn.setAttribute('aria-pressed',String(cl.id===state.classId));btn.append(make('span','class-icon',cl.glyph));const body=make('span');body.append(make('strong','',cl.short),make('small','',cl.desc));btn.append(body);root.append(btn);}}
  function renderZones(){const root=$('zones');root.replaceChildren();const lv=levelInfo().level;for(const z of zones){const locked=lv<z.level;const btn=make('button','zone-btn'+(z.id===state.zone?' active':''));btn.type='button';btn.dataset.zone=z.id;btn.disabled=locked||!!battle;btn.append(make('span','',z.short),make('small','',locked?`УР. ${z.level}`:z.id===state.zone?'АКТИВНА':'ДОСТУПНА'));root.append(btn);}}
  function renderBattle(){
    const z=zones[state.zone];$('zoneTitle').textContent=z.name;$('zoneSubtitle').textContent=z.subtitle;
    $('enemyName').textContent=battle?.name||z.enemy;
    $('enemyDescription').textContent=battle?(battle.isBoss?'Высшая сущность, связанная с пределом цикла.':z.description):'Начните экспедицию, чтобы вступить в бой.';
    $('enemyKind').textContent=battle?(battle.isBoss?'ВЕРХОВНЫЙ ВЛАДЫКА':'СТРАЖ ЗЕМЕЛЬ'):'ПОТЕНЦИАЛЬНАЯ УГРОЗА';
    $('enemyGlyph').textContent=battle?.glyph||z.glyph;
    $('enemyHPText').textContent=battle?`${number(battle.hp)} / ${number(battle.maxHp)}`:'—';
    $('enemyHPFill').style.width=battle?(battle.hp/battle.maxHp*100)+'%':'0%';
    $('battleState').textContent=battle?'БОЙ ПРОДОЛЖАЕТСЯ':'ОЖИДАНИЕ ПРИКАЗА';
    $('battleTime').textContent=battle?`УРОН: ${battle.damage} / 2,8 сек`:'—';
    $('encounterBtn').textContent=battle?'ПОКИНУТЬ СРАЖЕНИЕ':'НАЧАТЬ ЭКСПЕДИЦИЮ';
    $('bossBtn').disabled=!!battle||state.victories<2;
    $('bossBtn').textContent=state.victories<2?`ПРИЗВАТЬ ВЛАДЫКУ (${Math.min(2,state.victories)}/2)`:'ПРИЗВАТЬ ВЛАДЫКУ';
    $('skillBtn').disabled=!battle||state.energy<25;
    $('potionBtn').disabled=state.potions<=0||state.health>=stats().maxHp;
    $('potionCount').textContent=number(state.potions);
    $('combatHint').textContent=battle?'Каждое ручное действие наносит урон противнику.':'Каждое действие укрепляет персонажа и питает цикл.';
  }
  function renderCore(){
    const lv=levelInfo(),st=stats(),cl=charClass();
    $('stateLabel').textContent=state.mode==='manual'?'РУЧНОЙ ЦИКЛ':'РИТУАЛ АКТИВЕН';
    for(const id of ['headerCoins'])$(id).textContent=number(state.coins);
    $('heroTotal').textContent=$('mainCounter').textContent=number(state.total);
    $('heroRate').textContent=st.rate.toFixed(st.rate%1?1:0)+'/сек';$('heroKills').textContent=number(state.victories);
    $('classTitle').textContent=cl.name;$('heroLevel').textContent=number(lv.level);$('rankText').textContent=lv.rank;
    $('xpText').textContent=number(lv.progress)+' / '+number(lv.need);$('xpFill').style.width=Math.min(100,lv.progress/lv.need*100)+'%';
    $('healthText').textContent=Math.floor(state.health)+' / '+number(st.maxHp);$('healthFill').style.width=clamp(state.health/st.maxHp*100,0,100)+'%';
    $('energyText').textContent=Math.floor(state.energy)+' / 100';$('energyFill').style.width=clamp(state.energy,0,100)+'%';
    $('statAtk').textContent=number(st.attack);$('statCrit').textContent=Math.round(st.crit*100)+'%';
    $('statClick').textContent='+'+number(st.click);$('statFlow').textContent=st.rate.toFixed(st.rate%1?1:0)+'/сек';
    $('manualText').textContent=number(state.manual);$('autoText').textContent=number(state.auto);$('comboText').textContent='×'+number(combo);
    $('speed').value=state.speed;$('speedValue').textContent=state.speed+' / сек';
    $('ritualModeLabel').textContent={manual:'РУЧНОЙ ЦИКЛ',auto:'АВТОНОМНЫЙ ЦИКЛ',turbo:'УСИЛЕННЫЙ ЦИКЛ',chaos:'НЕСТАБИЛЬНЫЙ ЦИКЛ'}[state.mode];
    document.querySelectorAll('[data-mode]').forEach(btn=>{const on=btn.dataset.mode===state.mode;btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',String(on));});
    $('autobattle').checked=state.autobattle;
    renderBattle();
    $('questsBadge').textContent=state.claimed.length+'/'+questDefs.length;
    $('inventoryBadge').textContent=state.inventory.length;
  }
  function renderQuests(){const root=$('questsGrid');root.replaceChildren();for(const q of questDefs){const progress=Math.min(q.target,safeNumber(q.stat(state))),claimed=state.claimed.includes(q.id),ready=progress>=q.target;
    const el=make('article','tile'+(claimed?' completed':'')),head=make('div','tile-head');head.append(make('span','tile-icon',q.icon),make('span','tile-tag',claimed?'ИСПОЛНЕНО':'ПОРУЧЕНИЕ'));el.append(head,make('h4','',q.name),make('p','',q.desc));
    const prog=make('div','progress');const fill=make('i');fill.style.width=progress/q.target*100+'%';prog.append(fill);el.append(prog);
    const foot=make('div','tile-foot'),reward=make('span','tile-reward',`◈ ${q.gold} · ${q.xp} ОПЫТ`),btn=make('button','',claimed?'ГОТОВО':ready?'ЗАБРАТЬ':`${number(progress)}/${number(q.target)}`);
    btn.disabled=claimed||!ready;btn.dataset.claim=q.id;foot.append(reward,btn);el.append(foot);root.append(el);
  }}
  function upgradeCost(d){return Math.min(MAX,Math.ceil(d.base*Math.pow(d.scale,state.upgrades[d.id])));}
  function renderShop(){const root=$('shopGrid');root.replaceChildren();for(const d of upgradeDefs){const lv=state.upgrades[d.id],price=upgradeCost(d),cap=lv>=d.cap;
    const el=make('article','tile'),head=make('div','tile-head');head.append(make('span','tile-icon',d.glyph),make('span','tile-tag','УРОВЕНЬ '+lv));el.append(head,make('h4','',d.name),make('p','',d.desc));
    const foot=make('div','tile-foot'),btn=make('button','',cap?'МАКСИМУМ':`◈ ${number(price)} · УЛУЧШИТЬ`);btn.disabled=cap||state.coins<price;btn.dataset.buy=d.id;foot.append(btn);el.append(foot);root.append(el);
  }$('buyPotion').disabled=state.coins<90;}
  function itemBonuses(item){return [`АТК +${item.atk}`,`HP +${item.hp}`,`ПОТОК +${item.flow}`,`НАЖИМ +${item.click}`].filter((text,index)=>Object.values({atk:item.atk,hp:item.hp,flow:item.flow,click:item.click})[index]>0).join(' · ');}
  function renderInventory(){
    const root=$('equipped');root.replaceChildren();for(const [slot,label] of Object.entries(slots)){
      const id=state.equipment[slot],found=state.inventory.find(x=>x.id===id),item=items[found?.type];const el=make('div','equip-slot');el.append(make('span','',label),make('strong','',item?.name||'Не занято'),make('small','',item?itemBonuses(item):'Нет предмета'));root.append(el);
    }
    const inv=$('inventoryList');inv.replaceChildren();
    if(!state.inventory.length){inv.append(make('p','empty-inventory','Ваш инвентарь пуст.'));return;}
    for(const owned of state.inventory){const item=items[owned.type],equipped=state.equipment[item.slot]===owned.id;const el=make('div','inventory-card');el.append(make('small','',`${slots[item.slot]} · ${item.tier}`),make('strong','',item.name),make('small','',itemBonuses(item)));const btn=make('button','',equipped?'ЭКИПИРОВАНО':'ЭКИПИРОВАТЬ');btn.disabled=equipped;btn.dataset.equip=owned.id;el.append(btn);inv.append(el);}
  }
  function renderAchievements(){const root=$('achievementsGrid');root.replaceChildren();for(const a of achievementDefs){const unlocked=state.achievements.includes(a.id);const el=make('div','tile achieve '+(unlocked?'unlocked':'locked'));
    const head=make('div','tile-head');head.append(make('span','tile-icon',unlocked?a.glyph:'◇'),make('span','tile-tag',unlocked?'ПОЛУЧЕНО':'ЗАПЕЧАТАНО'));el.append(head,make('h4','',a.name),make('p','',a.desc));root.append(el);
  }}
  function renderJournal(){const root=$('journalList');root.replaceChildren();if(!state.journal.length)root.append(make('li','','Записи появятся после первого действия.'));for(const e of state.journal){const li=make('li');li.append(make('time','',e.at),make('span','',e.msg));root.append(li);}}
  function renderPanel(){if(activeTab==='quests')renderQuests();else if(activeTab==='shop')renderShop();else if(activeTab==='inventory')renderInventory();else if(activeTab==='achievements')renderAchievements();else renderJournal();panelDirty=false;}
  function renderAll(){checkAchievements();renderClassChoices();renderZones();renderCore();renderPanel();}
  function setTab(id){if(!['quests','shop','inventory','achievements','journal'].includes(id))return;activeTab=id;document.querySelectorAll('[data-tab]').forEach(btn=>{let on=btn.dataset.tab===id;btn.classList.toggle('active',on);btn.setAttribute('aria-selected',String(on));});document.querySelectorAll('.tab-pane').forEach(p=>p.hidden=p.id!=='pane-'+id);renderPanel();}
  function changeMode(mode){if(!modes.has(mode))return;state.mode=mode;accumulator=0;log('Установлен режим: '+mode);save();renderCore();}
  function downloadSave(){save();const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='drachit-iii-save.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('СОХРАНЕНИЕ ЭКСПОРТИРОВАНО');}
  async function importSave(file){if(!file)return;try{if(file.size>200000){toast('ФАЙЛ СЛИШКОМ БОЛЬШОЙ');return;}const txt=await file.text(),parsed=validatedSave(JSON.parse(txt));if(!parsed){toast('НЕВЕРНЫЙ ФОРМАТ','Ожидается сохранение ДРАЧИТЬ III.');return;}if(!confirm('Заменить текущий прогресс загруженным сохранением?'))return;state=parsed;battle=null;combo=0;accumulator=0;save();renderAll();toast('СОХРАНЕНИЕ ВОССТАНОВЛЕНО');}catch(_){toast('ОШИБКА ИМПОРТА','Не удалось прочитать сохранение.');}finally{$('importSave').value='';}}

  $('hitBtn').addEventListener('click',()=>manualAction());
  $('sigilButton').addEventListener('click',()=>manualAction(true));
  $('skillBtn').addEventListener('click',useSkill);
  $('potionBtn').addEventListener('click',usePotion);
  $('encounterBtn').addEventListener('click',()=>battle?flee():startEncounter(false));
  $('bossBtn').addEventListener('click',()=>startEncounter(true));
  $('autobattle').addEventListener('change',()=>{state.autobattle=$('autobattle').checked;log('Автобой: '+(state.autobattle?'включён':'выключен'));save();});
  $('speed').addEventListener('input',()=>{state.speed=clamp(safeNumber(Number($('speed').value)),1,100);$('speedValue').textContent=state.speed+' / сек';});
  $('speed').addEventListener('change',()=>{log('Скорость: '+state.speed+'/сек');save();renderCore();});
  $('soundBtn').addEventListener('click',()=>{sound=!sound;$('soundBtn').textContent=sound?'ЗВУК: ВКЛ.':'ЗВУК: ВЫКЛ.';$('soundBtn').setAttribute('aria-pressed',String(sound));if(sound)chime();});
  $('buyPotion').addEventListener('click',()=>{if(state.coins<90){toast('НЕДОСТАТОЧНО ЗОЛОТА');return;}state.coins-=90;state.potions++;log('Эликсир приобретён за 90 золота');toast('ЭЛИКСИР ПОЛУЧЕН');panelDirty=true;save();renderAll();});
  $('exportSave').addEventListener('click',downloadSave);
  $('importSave').addEventListener('change',e=>importSave(e.target.files?.[0]));
  $('resetBtn').addEventListener('click',()=>{if(!confirm('Безвозвратно сбросить прогресс ДРАЧИТЬ III?'))return;try{localStorage.removeItem(KEY);localStorage.removeItem(KEY_V2);localStorage.removeItem(KEY_V1);}catch(_){}state=fresh();battle=null;combo=0;accumulator=0;log('Начало нового пути.');save();setTab('quests');renderAll();toast('ПУТЬ НАЧАТ ЗАНОВО');});
  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-class],[data-mode],[data-zone],[data-tab],[data-buy],[data-claim],[data-equip]');if(!target)return;
    if(target.dataset.class)chooseClass(target.dataset.class);
    else if(target.dataset.mode)changeMode(target.dataset.mode);
    else if(target.dataset.zone!==undefined){if(battle){toast('ВО ВРЕМЯ БОЯ ПЕРЕХОД ЗАКРЫТ');return;}state.zone=Number(target.dataset.zone);renderZones();renderBattle();save();}
    else if(target.dataset.tab)setTab(target.dataset.tab);
    else if(target.dataset.buy)buyUpgrade(target.dataset.buy);
    else if(target.dataset.claim)claimQuest(target.dataset.claim);
    else if(target.dataset.equip)equip(Number(target.dataset.equip));
  });
  document.addEventListener('keydown',e=>{
    if(e.code!=='Space'||e.repeat||e.altKey||e.ctrlKey||e.metaKey)return;
    const current=document.activeElement?.tagName;if(['BUTTON','INPUT','TEXTAREA','SELECT'].includes(current))return;
    e.preventDefault();manualAction();
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)save(true);
    else{applyOffline();lastFrame=performance.now();save();renderAll();}
  });
  window.addEventListener('pagehide',()=>save(true));
  applyOffline();log('ДРАЧИТЬ III: Врата открыты.');renderAll();save();
  function frame(now){
    if(!document.hidden){
      const dt=clamp((now-lastFrame)/1000,0,.25);lastFrame=now;
      if(combo && now-lastHit>1500)combo=0;
      const oldLevel=levelInfo().level;
      const st=stats();
      if(st.rate>0){let r=st.rate;if(state.mode==='chaos')r*=.65+Math.random()*1.35;accumulator+=r*dt;const n=Math.floor(accumulator);if(n){earn(n,'auto');accumulator-=n;}}
      tickBattle(now,dt);
      updateLevel(oldLevel);
      if(now-lastDraw>150){checkAchievements();renderCore();lastDraw=now;}
      if(now-lastPanel>750){if(['quests','shop'].includes(activeTab)||panelDirty)renderPanel();lastPanel=now;}
      if(now-lastSave>1700){save();lastSave=now;}
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

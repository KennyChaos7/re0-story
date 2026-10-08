const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const readingKeywords = new Map([
  ...[...CHARACTER_NAMES.keys()].map(word=>[word,'character']),
  ...['恐惧','害怕','孤独','绝望','委屈','羞辱','羞耻','难堪','自责','不安','痛苦','疼痛','疲惫','悲伤','心酸','遗憾','失落','温柔','信任','喜悦','宽慰','希望','依恋','珍惜','眷恋','渴望','舍不得','关怀','眷顾'].map(word=>[word,'emotion']),
  ...['死亡回归','回归点','记忆恢复','失忆','死者之书','诅咒','不可视之手','魔女因子','权能','试炼','封印','监视塔','大灾厄','魔女教','白鲸','大兔','大罪司教'].map(word=>[word,'mechanism'])
]);
const readingKeywordPattern = new RegExp([...readingKeywords.keys()].sort((a,b)=>b.length-a.length).join('|'),'g');
const readingText = value => esc(value).replace(readingKeywordPattern,word=>readingKeywords.get(word)==='character'
  ? `<button type="button" class="character-mention text-character" data-character="${CHARACTER_NAMES.get(word)}" aria-label="${word}：查看本章角色简介">${word}</button>`
  : `<span class="text-${readingKeywords.get(word)}">${word}</span>`);
const readingColorKey = '<div class="reading-color-key" aria-label="正文颜色含义"><span class="text-character">人物</span><span class="text-emotion">情绪与感受</span><span class="text-mechanism">机制与线索</span></div>';
const sections = [['premise','起点与目标'],['plot','剧情详解'],['loops','回归与因果'],['people','人物变化'],['mechanism','关键机制'],['questions','伏笔与疑问'],['sources','原文来源']];
const paragraphs = value => String(value).split(/\n\n+/).map(p=>`<p>${readingText(p)}</p>`).join('');
const section = (id,title,body) => `<section class="chapter-section" id="${id}"><h2>${title}</h2>${body}</section>`;
const readingTools = (id,subaru) => `<nav class="reading-tools" aria-label="阅读视角"><a href="#home">返回首页</a><div><a href="#chapter-${id}" ${!subaru?'aria-current="page"':''}>世界视角</a><a href="#subaru-${id}" ${subaru?'aria-current="page"':''}>昴的视角</a></div></nav>`;
const analysis = text => `<details class="analysis-disclosure"><summary>因果解读<span class="analysis-expand">展开</span><span class="analysis-collapse">收起</span></summary><div class="analysis-body">${paragraphs(text)}</div></details>`;
const characterTooltip = document.getElementById('character-tooltip');
let characterAnchor = null;
let characterChapter;
let characterHideTimer;
function hideCharacterTooltip(){
  clearTimeout(characterHideTimer);
  if(characterAnchor)characterAnchor.removeAttribute('aria-describedby');
  characterAnchor=null;
  characterTooltip.hidden=true;
}
function showCharacterTooltip(anchor,chapter){
  clearTimeout(characterHideTimer);
  if(characterAnchor && characterAnchor!==anchor)characterAnchor.removeAttribute('aria-describedby');
  characterAnchor=anchor;
  const id=anchor.dataset.character;
  const profile=CHARACTER_PROFILES[id];
  const name=profile.name || ANIME_CHARACTERS[id][0];
  characterTooltip.innerHTML=`<h3>${esc(name)}</h3><p class="character-tooltip-chapter">第 ${String(chapter.id).padStart(2,'0')} 章 · ${esc(chapter.title)}</p><p>${esc(profile.bio)}</p><p class="character-tooltip-context"><strong>本章经历与状态</strong>${esc(characterIntro(chapter,id))}</p>`;
  characterTooltip.hidden=false;
  anchor.setAttribute('aria-describedby','character-tooltip');
  const rect=anchor.getBoundingClientRect();
  const width=characterTooltip.offsetWidth;
  const height=characterTooltip.offsetHeight;
  const left=Math.max(16,Math.min(rect.left,window.innerWidth-width-16));
  const top=window.matchMedia('(max-width:650px)').matches
    ? Math.max(16,window.innerHeight-height-16)
    : rect.bottom+8+height<=window.innerHeight-16 ? rect.bottom+8 : Math.max(16,rect.top-height-8);
  characterTooltip.style.left=`${left}px`;
  characterTooltip.style.top=`${top}px`;
}
function bindCharacterTooltips(chapter){
  characterChapter=chapter;
  const reading=document.getElementById('reading');
  reading.onpointerover=event=>{
    const anchor=event.target.closest('.character-mention');
    if(anchor && event.pointerType==='mouse')showCharacterTooltip(anchor,chapter);
  };
  reading.onpointerout=event=>{
    const anchor=event.target.closest('.character-mention');
    if(anchor===characterAnchor && event.pointerType==='mouse' && document.activeElement!==anchor)
      characterHideTimer=setTimeout(hideCharacterTooltip,150);
  };
  reading.onclick=event=>{
    const anchor=event.target.closest('.character-mention');
    if(anchor)showCharacterTooltip(anchor,chapter);
  };
}
characterTooltip.onpointerenter=()=>clearTimeout(characterHideTimer);
characterTooltip.onpointerleave=()=>{
  if(document.activeElement!==characterAnchor)hideCharacterTooltip();
};
document.addEventListener('pointerdown',event=>{
  if(characterAnchor && !characterAnchor.contains(event.target) && !characterTooltip.contains(event.target))hideCharacterTooltip();
});
document.addEventListener('focusin',event=>{
  const anchor=event.target.closest('.character-mention');
  if(anchor)showCharacterTooltip(anchor,characterChapter);
  else if(characterAnchor && !characterTooltip.contains(event.target))hideCharacterTooltip();
});
document.addEventListener('keydown',event=>{if(event.key==='Escape')hideCharacterTooltip();});
window.addEventListener('scroll',hideCharacterTooltip,{passive:true});
window.addEventListener('resize',hideCharacterTooltip);
const chapterDrawer=document.getElementById('chapter-drawer');
const drawerMedia=window.matchMedia('(max-width:850px), (max-width:1100px) and (orientation:portrait)');
document.getElementById('directory-toggle').addEventListener('click',()=>{
  hideCharacterTooltip();
  chapterDrawer.showModal();
  chapterDrawer.querySelector('[aria-current="page"]').focus();
});
document.getElementById('directory-close').addEventListener('click',()=>chapterDrawer.close());
document.getElementById('drawer-chapter-nav').addEventListener('click',event=>{
  if(event.target.closest('a'))chapterDrawer.close();
});
chapterDrawer.addEventListener('click',event=>{
  if(event.target!==chapterDrawer)return;
  const rect=chapterDrawer.getBoundingClientRect();
  if(event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom)chapterDrawer.close();
});
drawerMedia.addEventListener('change',event=>{if(!event.matches)chapterDrawer.close();});
function renderHome(){
  hideCharacterTooltip();
  document.body.classList.add('home-page');
  document.title = 'Re:Zero · 章节回廊';
  document.getElementById('reading').innerHTML = `<div class="home-reader"><span class="eyebrow">Re:Zero · WEB 小说篇章</span><h1>选择你的阅读视角</h1><p class="home-intro">从世界的变化，或从菜月昴的认识与感受，走过同一段旅程。</p><div class="perspective-entries"><div class="perspective-entry"><span class="entry-number">01 / WORLD</span><h2>世界视角</h2><p>事件如何发生，人物为何行动。按篇章梳理故事、死亡回归路线、人物关系与伏笔。</p><a class="entry-button" href="#chapter-1">世界视角</a></div><div class="perspective-entry subaru-entry"><img class="entry-portrait" src="assets/anime/1.webp" width="100" height="100" alt="菜月昴的动画官方头像"><span class="entry-number">02 / SUBARU</span><h2>昴的视角</h2><p>他看见什么，误解什么，又为什么继续。围绕有限认知、恐惧、关系与选择深入解读。</p><a class="entry-button" href="#subaru-1">昴的视角</a></div></div><p class="home-note">两种视角均按十个大篇章阅读，含对应篇章剧透。昴视角为原创心理与行动解读，不是原作独白或逐场景复述；第十章为连载中的阶段性整理。</p></div>`;
  window.scrollTo({top:0,behavior:'instant'});
}
function renderSubaru(current){
  const lens = SUBARU_CHAPTERS.find(c=>c.id===current.id);
  const anime = ANIME_ARCS[current.id];
  const lensSections = [['premise','他此刻的处境'],...(anime?[['anime','动画角色对照']]:[]),['plot','认知与感受'],['loops','心理变化脉络'],['people','他与身边的人'],['ending','走出这一章'],['sources','原文来源']];
  document.getElementById('section-nav').innerHTML = lensSections.map(([id,label])=>`<button type="button" data-scroll="${id}">${label}</button>`).join('');
  const sources = current.sources.map(([title,url])=>`<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a></li>`).join('');
  document.getElementById('reading').innerHTML = `<article class="subaru-reader">${readingTools(current.id,true)}<header class="chapter-head"><span class="eyebrow">昴的视角 · 第 ${String(current.id).padStart(2,'0')} 章</span><h1>${readingText(current.title)}</h1><p class="deck">${readingText(lens.deck)}</p><div class="meta"><span>${esc(current.place)}</span><span>${esc(current.range)}</span><span>${current.id===10?'连载中 · 阶段性整理':'本章完整剧透'}</span></div><p class="perspective-note">以昴当时能够知道的事为界。心理判断为解读，不是原作独白；未在场的事件不写成他的亲历。</p>${readingColorKey}${!anime?'<p class="anime-unadapted">本章尚未动画化 · 暂无动画角色对照。</p>':''}</header>${section('premise','他此刻的处境',`<div class="premise">${paragraphs(lens.premise)}</div>`)}${animeSection(anime)}${section('plot','认知与感受',lens.moments.map(([title,body,meaning],i)=>`<div class="scene"><span class="scene-index">${String(i+1).padStart(2,'0')}</span><div><h3>${readingText(title)}</h3>${paragraphs(body)}${analysis(meaning)}</div></div>`).join(''))}${section('loops','心理变化脉络',`<ol class="flow" aria-label="昴本章的心理变化">${lens.flow.map(([label,detail])=>`<li>${readingText(label)}<small>${readingText(detail)}</small></li>`).join('')}</ol><p class="diagram-caption">沿着本章的重要心理转折阅读；这不是逐次死亡或逐话事件的时间表。</p>`)}${section('people','他与身边的人',lens.people.map(([name,body])=>`<div class="character"><h3>${readingText(name)}</h3>${paragraphs(body)}</div>`).join(''))}${section('ending','走出这一章',`<div class="premise">${paragraphs(lens.ending)}</div>`)}${section('sources','原文来源',`<p class="diagram-caption">原作事件与心理解读分开阅读。以下为对应篇章的原文目录与参考节点。</p><ul class="source-list">${sources}</ul>`)}${chapterEnd(current.id,'subaru')}</article>`;
  finishReading(current);
}
function chapterEnd(id,prefix){
  return `<nav class="chapter-end" aria-label="前后章节">${id>1?`<a href="#${prefix}-${id-1}"><small>上一章</small>${esc(CHAPTERS[id-2].title)}</a>`:'<span></span>'}${id<CHAPTERS.length?`<a href="#${prefix}-${id+1}"><small>下一章</small>${esc(CHAPTERS[id].title)}</a>`:''}</nav>`;
}
function finishReading(current){
  bindCharacterTooltips(current);
  document.querySelectorAll('[data-scroll]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.scroll).scrollIntoView({block:'start'})));
  window.scrollTo({top:0,behavior:'instant'});
}
function animeSection(anime){
  if(!anime) return '';
  const cards = anime.cast.map(([id,role])=>{
    const [name,japanese,alias] = ANIME_CHARACTERS[id];
    const portrait = typeof id === 'number' ? `<img src="assets/anime/${id}.webp" alt="${esc(name)}的动画官方头像" width="300" height="300" loading="lazy">` : `<div class="cast-text" aria-hidden="true">${esc(name.slice(0,1))}</div>`;
    return `<div class="cast-card">${portrait}<div class="cast-info"><h3>${readingText(name)}</h3><p class="cast-japanese" lang="ja">${esc(japanese)}</p><p class="cast-alias">${esc(alias)}</p><p class="cast-role">${readingText(role)}</p>${typeof id !== 'number'?'<span class="cast-no-image">文字对照 · 官方角色目录暂无独立头像</span>':''}</div></div>`;
  }).join('');
  return section('anime','动画角色对照',`<p class="anime-coverage">动画对应：${esc(anime.coverage)}</p><p class="diagram-caption">本章主要角色的小说称呼与动画形象。头像采用官方角色目录现行立绘；服装、年龄与状态以对应季正片为准。身份说明包含本章剧透。</p><div class="cast-grid">${cards}</div><p class="cast-credit">头像来源：<a href="https://re-zero-anime.jp/tv/character/" target="_blank" rel="noopener noreferrer">动画官方角色目录</a> · <a href="https://re-zero-anime.jp/tv/story/" target="_blank" rel="noopener noreferrer">动画各季剧情目录</a><br>©長月達平・株式会社KADOKAWA刊／Re:ゼロから始める異世界生活製作委員会</p>`);
}
function renderChapter(){
  hideCharacterTooltip();
  document.body.classList.remove('home-page');
  const match = location.hash.match(/^#(chapter|subaru)-(\d+)$/);
  const subaru = match?.[1]==='subaru';
  const current = CHAPTERS.find(c=>c.id === Number(match?.[2])) || CHAPTERS[0];
  const i = CHAPTERS.indexOf(current);
  const anime = ANIME_ARCS[current.id];
  document.title = `${subaru?'昴的视角':'世界视角'} · 第${current.id}章 ${current.title} · Re:Zero 章节回廊`;
  const chapterLinks = CHAPTERS.map(c=>`<a class="chapter-link" href="#${subaru?'subaru':'chapter'}-${c.id}" ${c.id===current.id?'aria-current="page"':''}><span class="number">${String(c.id).padStart(2,'0')}</span><span>${esc(c.title)}</span></a>`).join('');
  document.getElementById('chapter-nav').innerHTML=chapterLinks;
  document.getElementById('drawer-chapter-nav').innerHTML=chapterLinks;
  if(subaru){renderSubaru(current);return;}
  const chapterSections = anime ? [sections[0],['anime','动画角色对照'],...sections.slice(1)] : sections;
  document.getElementById('section-nav').innerHTML = chapterSections.map(([id,label])=>`<button type="button" data-scroll="${id}">${label}</button>`).join('');
  const sources = current.sources.map(([title,url])=>`<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a></li>`).join('');
  document.getElementById('reading').innerHTML = `<article>${readingTools(current.id,false)}
    <header class="chapter-head"><span class="eyebrow">世界视角 · 第 ${String(current.id).padStart(2,'0')} 章</span><h1>${readingText(current.title)}</h1><p class="deck">${readingText(current.deck)}</p><div class="meta"><span>${esc(current.place)}</span><span>${esc(current.range)}</span><span>${current.id===10?'连载中 · 阶段性整理':'本章完整剧透'}</span></div>${readingColorKey}${!anime?'<p class="anime-unadapted">本章尚未动画化 · 动画主线截至第六章，暂不列动画角色对照。</p>':''}</header>
    ${section('premise','起点与目标',`<div class="premise"><p>${readingText(current.premise)}</p></div>`)}
    ${animeSection(anime)}
    ${section('plot','剧情详解',current.scenes.map(([title,story,meaning],index)=>`<div class="scene"><span class="scene-index">${String(index+1).padStart(2,'0')}</span><div><h3>${readingText(title)}</h3>${paragraphs(story)}<details class="analysis-disclosure"><summary>因果解读<span class="analysis-expand">展开</span><span class="analysis-collapse">收起</span></summary><div class="analysis-body">${paragraphs(meaning)}</div></details></div></div>`).join(''))}
    ${section('loops','回归与因果',`<ol class="flow" aria-label="本章主要因果流程">${current.flow.map(([label,detail])=>`<li>${readingText(label)}<small>${readingText(detail)}</small></li>`).join('')}</ol><p class="diagram-caption">${readingText(current.flowNote)}</p><div class="loop-list">${current.loops.map(([name,event,result,success])=>`<div class="loop ${success?'success':''}"><span class="loop-name">${esc(name)}</span><div><p>${readingText(event)}</p><p class="result">${readingText(result)}</p></div></div>`).join('')}</div>`)}
    ${section('people','人物变化',current.people.map(([name,story])=>`<div class="character"><h3>${readingText(name)}</h3><p>${readingText(story)}</p></div>`).join(''))}
    ${section('mechanism','关键机制',current.mechanics.map(([title,detail])=>`<div class="question"><h3>${readingText(title)}</h3><p>${readingText(detail)}</p></div>`).join(''))}
    ${section('questions','伏笔与疑问',current.questions.map(([title,detail])=>`<div class="question"><h3>${readingText(title)}</h3><p>${readingText(detail)}</p></div>`).join(''))}
    ${current.note?`<p class="status-note">${readingText(current.note)}</p>`:''}
    ${section('sources','原文来源',`<p class="diagram-caption">下列链接对应本章的原文目录、关键段落或官方书籍简介。正文为中文概述与解读，不是逐话翻译。</p><ul class="source-list">${sources}</ul>`)}
    <nav class="chapter-end" aria-label="前后章节">${i>0?`<a href="#chapter-${CHAPTERS[i-1].id}"><small>上一章</small>${esc(CHAPTERS[i-1].title)}</a>`:'<span></span>'}${i<CHAPTERS.length-1?`<a href="#chapter-${CHAPTERS[i+1].id}"><small>下一章</small>${esc(CHAPTERS[i+1].title)}</a>`:''}</nav>
  </article>`;
  finishReading(current);
}
function renderRoute(){
  chapterDrawer.close();
  if(/^#(chapter|subaru)-\d+$/.test(location.hash)) renderChapter();
  else renderHome();
}
window.addEventListener('hashchange',()=>{
  if(!location.hash || location.hash==='#home' || /^#(chapter|subaru)-\d+$/.test(location.hash))renderRoute();
});
renderRoute();

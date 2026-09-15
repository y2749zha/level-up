(function () {
  'use strict';

  var STORAGE_LANG = 'shengji-academy-lang';
  var STORAGE_PROGRESS = 'shengji-academy-progress';

  var STR = {
    en: {
      brand: 'Shengji Academy',
      heroTitle: 'Learn to play <span class="accent">Shengji</span>',
      heroBody: 'Nine short lessons on the rules of Shengji (升级), each capped with a quick quiz. No account needed — your progress is saved right in this browser.',
      heroTerms: 'Also known as <span class="cjk">拖拉机</span> (Tuolaji), or "Tractor"',
      demoLabel: 'Trump of the hand',
      demoCaption: 'The <b>2 of Spades</b> is trump this hand',
      lessonsSuffix: 'lessons',
      starsEarnedSuffix: '★ earned',
      backToPath: 'Back to path',
      startQuiz: 'Start quiz',
      questionCount: function (i, n) { return 'Question ' + i + ' of ' + n; },
      next: 'Next',
      seeResults: 'See results',
      correctLabel: 'Correct!',
      explainLabel: 'Not quite',
      retryQuiz: 'Retry quiz',
      continueLabel: 'Continue',
      resultTitlePerfect: 'Perfect score!',
      resultTitleGood: 'Nice work!',
      resultTitleOk: 'Good effort',
      resultTitleRetry: "Let's review that",
      resultBody: function (c, n) { return 'You got ' + c + ' out of ' + n + ' correct.'; },
      resetProgress: 'Reset progress',
      resetConfirm: "Reset all progress? This can't be undone.",
      footNote: 'No account, no server — your progress stays in this browser.',
      lockedTitle: 'Complete the previous lesson to unlock',
      capstoneLockedTitle: 'Complete all lessons to unlock the final challenge',
      loadError: 'Could not load lesson data. If you opened this file directly from disk, serve it over http:// instead — see the README.'
    },
    zh: {
      brand: '升级学堂',
      heroTitle: '轻松学会<span class="accent">升级</span>',
      heroBody: '九节简短课程，带你掌握升级（Shengji）的规则，每节课后都有一个小测验。无需注册 —— 学习进度会保存在本浏览器中。',
      heroTerms: '也被称为<span class="cjk">拖拉机</span>（Tuolaji）',
      demoLabel: '本局主牌',
      demoCaption: '本局的主牌是<b>黑桃 2</b>',
      lessonsSuffix: '课程',
      starsEarnedSuffix: '★ 已获得',
      backToPath: '返回路径',
      startQuiz: '开始测验',
      questionCount: function (i, n) { return '第 ' + i + ' / ' + n + ' 题'; },
      next: '下一题',
      seeResults: '查看结果',
      correctLabel: '回答正确！',
      explainLabel: '差一点',
      retryQuiz: '重新测验',
      continueLabel: '继续',
      resultTitlePerfect: '满分！',
      resultTitleGood: '做得好！',
      resultTitleOk: '还不错',
      resultTitleRetry: '再复习一下吧',
      resultBody: function (c, n) { return '你答对了 ' + n + ' 题中的 ' + c + ' 题。'; },
      resetProgress: '重置进度',
      resetConfirm: '确定要重置全部学习进度吗？此操作无法撤销。',
      footNote: '无需账号，无需服务器 —— 学习进度保存在本浏览器中。',
      lockedTitle: '完成上一课以解锁',
      capstoneLockedTitle: '完成所有课程以解锁最终挑战',
      loadError: '无法加载课程数据。如果你直接从磁盘打开了此文件，请改用 http:// 服务来访问 —— 详见 README。'
    }
  };

  var state = {
    modules: [],
    lang: loadLang(),
    progress: loadProgress(),
    view: 'home',
    moduleId: null,
    qIndex: 0,
    qAnswers: [],
    qCorrectCount: 0
  };

  var app = document.getElementById('app');

  function loadLang() {
    try {
      var v = localStorage.getItem(STORAGE_LANG);
      return v === 'zh' ? 'zh' : 'en';
    } catch (e) { return 'en'; }
  }

  function saveLang(lang) {
    try { localStorage.setItem(STORAGE_LANG, lang); } catch (e) {}
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_PROGRESS);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function saveProgress() {
    try { localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(state.progress)); } catch (e) {}
  }

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function t(field) { return field[state.lang]; }
  function L() { return STR[state.lang]; }

  function qs(sel) { return app.querySelector(sel); }
  function qsa(sel) { return Array.prototype.slice.call(app.querySelectorAll(sel)); }

  function isModuleDone(id) { return !!(state.progress[id] && state.progress[id].done); }

  function isUnlocked(index) {
    if (index === 0) return true;
    var m = state.modules[index];
    if (m.capstone) {
      return state.modules.filter(function (mm) { return !mm.capstone; })
        .every(function (mm) { return isModuleDone(mm.id); });
    }
    return isModuleDone(state.modules[index - 1].id);
  }

  function starsForScore(correct, total) {
    var pct = total ? correct / total : 0;
    if (pct >= 1) return 3;
    if (pct >= 0.75) return 2;
    if (pct >= 0.5) return 1;
    return 0;
  }

  function starsHTML(n, max) {
    max = max || 3;
    var html = '';
    for (var i = 0; i < max; i++) {
      html += '<span class="s' + (i < n ? '' : ' off') + '">★</span>';
    }
    return html;
  }

  var SUIT_COLOR = { '♠': 'black', '♣': 'black', '♥': 'red', '♦': 'red' };

  function cardHTML(rank, suit, opts) {
    opts = opts || {};
    var color = SUIT_COLOR[suit] === 'red' ? ' red' : '';
    var hl = opts.hl ? ' trump-hl' : '';
    var size = opts.tiny ? ' tiny' : '';
    return '<div class="pcard' + color + hl + size + '">' +
      '<div class="rank">' + rank + '</div>' +
      '<div class="center">' + suit + '</div>' +
      '<div class="rank" style="align-self:flex-end;transform:rotate(180deg)">' + rank + '</div>' +
      '</div>';
  }

  function jokerCardHTML(big, opts) {
    opts = opts || {};
    var kind = big ? 'big-joker' : 'small-joker';
    var cjk = big ? '大王' : '小王';
    var size = opts.tiny ? ' tiny' : '';
    var hl = opts.hl ? ' trump-hl' : '';
    var label = opts.tiny ? 'JOKER' : (big ? 'BIG JOKER' : 'SMALL JOKER');
    return '<div class="pcard joker ' + kind + hl + size + '">' +
      '<div class="center"><span class="cjk">' + cjk + '</span>' +
      '<span class="en">' + label + '</span></div>' +
      '</div>';
  }

  function cardsRow(html) { return '<div class="cards-row">' + html + '</div>'; }

  function demoCardsHTML() {
    return jokerCardHTML(true) +
      cardHTML('2', '♠', { hl: true }) +
      cardHTML('A', '♥') +
      cardHTML('K', '♣');
  }

  // ---------- lesson diagrams (rendered from {{DIAGRAM:...}} placeholders in data.json) ----------

  var DIAGRAMS = {
    pointsTable: function () {
      var zh = state.lang === 'zh';
      var head = zh ? ['牌', '每张分值', '张数', '小计'] : ['Card', 'Points each', 'Copies', 'Subtotal'];
      var totalLabel = zh ? '牌堆总分' : 'Total points in the deck';
      return '<div class="diagram"><div class="diagram-title">' + (zh ? '分牌一览' : 'Point cards') + '</div>' +
        '<table class="points-table"><thead><tr><th>' + head[0] + '</th><th>' + head[1] + '</th><th class="num">' + head[2] + '</th><th class="num">' + head[3] + '</th></tr></thead><tbody>' +
        '<tr><td>' + cardsRow(cardHTML('5', '♥', { tiny: true })) + '</td><td>5</td><td class="num">8</td><td class="num">40</td></tr>' +
        '<tr><td>' + cardsRow(cardHTML('10', '♠', { tiny: true })) + '</td><td>10</td><td class="num">8</td><td class="num">80</td></tr>' +
        '<tr><td>' + cardsRow(cardHTML('K', '♦', { tiny: true })) + '</td><td>10</td><td class="num">8</td><td class="num">80</td></tr>' +
        '<tr><td colspan="3">' + totalLabel + '</td><td class="num">200</td></tr>' +
        '</tbody></table></div>';
    },

    rankLadder: function () {
      var zh = state.lang === 'zh';
      var top = zh ? '<b>A</b> —— 阶梯顶点。攻方在这个等级打赢一局，就赢得整场比赛。' : '<b>Ace</b> — the top of the ladder. Clearing a hand here as the host team wins the match.';
      var mid = zh ? '每打赢一局攻方局，就向上攀升一级或几级……' : 'climbing one or more steps per successful hosting hand…';
      var bot = zh ? '比赛开始时，每支队伍都从这里起步' : 'every team starts here at the beginning of the match';
      return '<div class="ladder">' +
        '<div class="ladder-row"><div class="ladder-rank">A</div><div class="ladder-label">' + top + '</div></div>' +
        '<div class="ladder-row"><div class="ladder-rank">⋮</div><div class="ladder-label">' + mid + '</div></div>' +
        '<div class="ladder-row"><div class="ladder-rank">2</div><div class="ladder-label">' + bot + '</div></div></div>';
    },

    trumpLadder: function (rankLabel, suitSym) {
      var zh = state.lang === 'zh';
      var others = ['♠', '♥', '♦', '♣'].filter(function (s) { return s !== suitSym; });
      var l1 = zh ? '<b>大王</b>——永远是单张里最大的牌' : '<b>Big Joker</b> — always the single highest card';
      var l2 = zh ? '<b>小王</b>' : '<b>Small Joker</b>';
      var l3 = zh ? ('<b>' + rankLabel + suitSym + '</b>——主牌花色里的本级点数牌本身') : ('<b>' + rankLabel + suitSym + '</b> — the rank card in the main suit itself');
      var l4 = zh ? '另外三个花色里同样点数的牌——彼此大小相同' : 'the same rank in the other three suits — all equal to each other';
      var l5 = zh ? ('主牌花色剩下的牌，按正常大小排列（A最大）——跳过已被提升上去的' + rankLabel) : ('the rest of the main suit, ranked normally (A high) — skipping ' + rankLabel + ', which was promoted above');
      return '<div class="ladder">' +
        '<div class="ladder-row"><div class="ladder-cards">' + jokerCardHTML(true, { tiny: true }) + '</div><div class="ladder-label">' + l1 + '</div></div>' +
        '<div class="ladder-row"><div class="ladder-cards">' + jokerCardHTML(false, { tiny: true }) + '</div><div class="ladder-label">' + l2 + '</div></div>' +
        '<div class="ladder-row"><div class="ladder-cards">' + cardHTML(rankLabel, suitSym, { tiny: true, hl: true }) + '</div><div class="ladder-label">' + l3 + '</div></div>' +
        '<div class="ladder-row"><div class="ladder-cards">' + others.map(function (s) { return cardHTML(rankLabel, s, { tiny: true }); }).join('') + '</div><div class="ladder-label">' + l4 + '</div></div>' +
        '<div class="ladder-row"><div class="ladder-cards">' + cardHTML('A', suitSym, { tiny: true }) + cardHTML('K', suitSym, { tiny: true }) + cardHTML('Q', suitSym, { tiny: true }) + '</div><div class="ladder-label">' + l5 + '</div></div>' +
        '</div>';
    },

    declarationLadder: function () {
      var zh = state.lang === 'zh';
      var l1 = zh ? '<b>单张本级点数牌</b>——最弱的宣告，初步定下一个主牌花色' : '<b>A single main-rank card</b> — weakest declaration, sets a provisional main suit';
      var l2 = zh ? '<b>一对</b>本级点数牌，同一花色——压过任何单张宣告' : '<b>A matching pair</b> of the main rank, same suit — beats any single';
      var l3 = zh ? '<b>一对相同的大小王</b>——最强的宣告；直接把这一局定成无将' : '<b>A pair of matching jokers</b> — the strongest possible declaration; forces a no-main hand';
      return '<div class="diagram"><div class="diagram-title">' + (zh ? '亮主的强弱顺序（从弱到强）' : 'Declaration strength, weakest to strongest') + '</div>' +
        '<div class="ladder">' +
        '<div class="ladder-row"><div class="ladder-cards">' + cardHTML('7', '♦', { tiny: true }) + '</div><div class="ladder-label">' + l1 + '</div></div>' +
        '<div class="ladder-row"><div class="ladder-cards">' + cardHTML('7', '♠', { tiny: true }) + cardHTML('7', '♠', { tiny: true }) + '</div><div class="ladder-label">' + l2 + '</div></div>' +
        '<div class="ladder-row"><div class="ladder-cards">' + jokerCardHTML(false, { tiny: true }) + jokerCardHTML(false, { tiny: true }) + '</div><div class="ladder-label">' + l3 + '</div></div>' +
        '</div></div>';
    },

    dealTable: function () {
      var zh = state.lang === 'zh';
      var r1 = zh ? '4位玩家 × 25张' : '4 players × 25 cards';
      var r2 = zh ? '底牌（底牌）' : 'Bottom cards (底牌)';
      var r3 = zh ? '合计' : 'Total';
      return '<div class="diagram"><div class="diagram-title">' + (zh ? '108张牌的去向' : 'Where the 108 cards go') + '</div>' +
        '<table class="points-table"><tbody>' +
        '<tr><td>' + r1 + '</td><td class="num">100</td></tr>' +
        '<tr><td>' + r2 + '</td><td class="num">8</td></tr>' +
        '<tr><td>' + r3 + '</td><td class="num">108</td></tr>' +
        '</tbody></table></div>';
    },

    combosLadder: function () {
      var zh = state.lang === 'zh';
      var l1 = zh ? '<b>单张</b>——任意一张牌' : '<b>Single</b> — any one card';
      var l2 = zh ? '<b>对子</b>——两张完全相同的牌：点数相同，花色也相同' : '<b>Pair</b> — two identical cards: same rank, same suit';
      var l3 = zh ? '<b>拖拉机（拖拉机）</b>——同一花色里两组或更多<i>连续</i>的对子' : '<b>Tractor (拖拉机)</b> — two or more <i>consecutive</i> pairs, all one suit';
      return '<div class="diagram"><div class="diagram-title">' + (zh ? '可以打头出的牌型' : 'Leadable combinations') + '</div>' +
        '<div class="ladder">' +
        '<div class="ladder-row"><div class="ladder-cards">' + cardHTML('9', '♥', { tiny: true }) + '</div><div class="ladder-label">' + l1 + '</div></div>' +
        '<div class="ladder-row"><div class="ladder-cards">' + cardHTML('9', '♥', { tiny: true }) + cardHTML('9', '♥', { tiny: true }) + '</div><div class="ladder-label">' + l2 + '</div></div>' +
        '<div class="ladder-row"><div class="ladder-cards">' + cardHTML('8', '♥', { tiny: true }) + cardHTML('8', '♥', { tiny: true }) + cardHTML('9', '♥', { tiny: true }) + cardHTML('9', '♥', { tiny: true }) + '</div><div class="ladder-label">' + l3 + '</div></div>' +
        '</div></div>';
    },

    bandTable: function () {
      var zh = state.lang === 'zh';
      var head = zh ? ['守方分数', '结果'] : ['Defenders scored', 'Result'];
      var rows = zh ? [
        ['0', '光头——攻方跳升 <b>3</b> 级，继续担任攻方', true],
        ['5–35', '攻方跳升2级', false],
        ['40–75', '攻方跳升1级', false],
        ['80–115', '等级不变——下一局角色互换', false],
        ['120–155', '新攻方（原守方）跳升1级', false],
        ['160–195', '新攻方跳升2级', false],
        ['200', '新攻方跳升3级', false]
      ] : [
        ['0', 'Shutout — the host team advances <b>+3</b> ranks and hosts again', true],
        ['5–35', 'The host team advances +2 ranks', false],
        ['40–75', 'The host team advances +1 rank', false],
        ['80–115', 'No rank change — roles swap for next hand', false],
        ['120–155', 'The new host team (former defenders) advances +1 rank', false],
        ['160–195', 'The new host team advances +2 ranks', false],
        ['200', 'The new host team advances +3 ranks', false]
      ];
      var body = rows.map(function (r) {
        return '<tr' + (r[2] ? ' class="zero"' : '') + '><td>' + r[0] + '</td><td class="desc">' + r[1] + '</td></tr>';
      }).join('');
      return '<div class="diagram"><div class="diagram-title">' + (zh ? '根据守方的分数，这一局如何收场' : 'How the hand resolves — based on the defenders’ points') + '</div>' +
        '<table class="band-table"><thead><tr><th>' + head[0] + '</th><th>' + head[1] + '</th></tr></thead><tbody>' + body + '</tbody></table></div>';
    }
  };

  function renderDiagrams(html) {
    return html.replace(/\{\{DIAGRAM:([^}]+)\}\}/g, function (_, spec) {
      var parts = spec.split(':');
      var fn = DIAGRAMS[parts[0]];
      return fn ? fn.apply(null, parts.slice(1)) : '';
    });
  }

  // ---------- header (shared across views) ----------

  function headerHTML() {
    var strings = L();
    var doneCount = state.modules.filter(function (m) { return isModuleDone(m.id); }).length;
    var totalStars = state.modules.reduce(function (sum, m) {
      return sum + ((state.progress[m.id] && state.progress[m.id].stars) || 0);
    }, 0);
    var maxStars = state.modules.length * 3;

    return '' +
      '<header class="topbar">' +
      '<div class="brand"><span class="brand-mark">♠ ' + esc(strings.brand) + '</span></div>' +
      '<div class="topbar-right">' +
      '<div class="lang-toggle">' +
      '<button type="button" data-lang="en" class="' + (state.lang === 'en' ? 'active' : '') + '">EN</button>' +
      '<button type="button" data-lang="zh" class="' + (state.lang === 'zh' ? 'active' : '') + '">中文</button>' +
      '</div>' +
      '<div class="stat-pill">' +
      '<div class="stat"><b>' + doneCount + '</b><span>/' + state.modules.length + ' ' + esc(strings.lessonsSuffix) + '</span></div>' +
      '<div class="divider"></div>' +
      '<div class="stat"><b>' + totalStars + '</b><span>/' + maxStars + ' ' + esc(strings.starsEarnedSuffix) + '</span></div>' +
      '</div>' +
      '</div>' +
      '</header>';
  }

  function bindHeader() {
    qsa('.lang-toggle button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var lang = btn.getAttribute('data-lang');
        if (lang !== state.lang) {
          state.lang = lang;
          saveLang(lang);
          render();
        }
      });
    });
  }

  // ---------- home ----------

  function homeHTML() {
    var strings = L();

    var nodesHTML = state.modules.map(function (m, i) {
      var unlocked = isUnlocked(i);
      var done = isModuleDone(m.id);
      var stars = (state.progress[m.id] && state.progress[m.id].stars) || 0;
      var classes = ['node'];
      if (!unlocked) classes.push('locked');
      if (done) classes.push('done');
      if (m.capstone) classes.push('capstone');
      var lockTitle = m.capstone ? strings.capstoneLockedTitle : strings.lockedTitle;

      return '' +
        '<div class="node-row">' +
        '<button type="button" class="' + classes.join(' ') + '" data-module="' + m.id + '"' +
        (unlocked ? '' : ' disabled title="' + esc(lockTitle) + '"') + '>' +
        '<span class="node-badge">' + (done ? '✓' : esc(m.icon)) + '</span>' +
        '<span>' +
        '<span class="node-title">' + esc(t(m.title)) +
        (done ? '<span class="stars">' + starsHTML(stars) + '</span>' : '') + '</span>' +
        '<div class="node-meta">' + esc(t(m.meta)) + '</div>' +
        '</span>' +
        '</button>' +
        '</div>';
    }).join('');

    return '' +
      '<section class="hero">' +
      '<div>' +
      '<h1>' + strings.heroTitle + '</h1>' +
      '<p>' + esc(strings.heroBody) + '</p>' +
      '<div class="hero-terms">' + strings.heroTerms + '</div>' +
      '</div>' +
      '<div class="demo">' +
      '<div class="demo-label">' + esc(strings.demoLabel) + '</div>' +
      '<div class="demo-row">' + demoCardsHTML() + '</div>' +
      '<div class="demo-caption">' + strings.demoCaption + '</div>' +
      '</div>' +
      '</section>' +
      '<div class="path">' + nodesHTML + '</div>' +
      '<footer class="foot">' +
      '<span>' + esc(strings.footNote) + '</span>' +
      '<button type="button" id="reset-progress">' + esc(strings.resetProgress) + '</button>' +
      '</footer>';
  }

  function bindHome() {
    qsa('.node').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        goLesson(btn.getAttribute('data-module'));
      });
    });
    var resetBtn = qs('#reset-progress');
    if (resetBtn) resetBtn.addEventListener('click', onResetProgress);
  }

  function onResetProgress() {
    if (window.confirm(L().resetConfirm)) {
      state.progress = {};
      saveProgress();
      render();
    }
  }

  // ---------- lesson ----------

  function currentModule() {
    return state.modules.find(function (m) { return m.id === state.moduleId; });
  }

  function lessonHTML() {
    var strings = L();
    var m = currentModule();
    return '' +
      '<button type="button" class="backlink" id="back-home">← ' + esc(strings.backToPath) + '</button>' +
      '<div class="lesson-head">' +
      '<div class="lesson-eyebrow">' + esc(t(m.meta)) + '</div>' +
      '<h2>' + esc(t(m.title)) + '</h2>' +
      '<p class="lesson-sub">' + esc(t(m.subtitle)) + '</p>' +
      '</div>' +
      '<div class="lesson-body">' + renderDiagrams(t(m.content)) + '</div>' +
      '<button type="button" class="start-btn" id="start-quiz">' + esc(strings.startQuiz) + ' →</button>';
  }

  function bindLesson() {
    qs('#back-home').addEventListener('click', goHome);
    qs('#start-quiz').addEventListener('click', function () { goQuiz(state.moduleId); });
  }

  // ---------- quiz ----------

  function quizHTML() {
    var strings = L();
    var m = currentModule();
    var total = m.questions.length;
    var idx = state.qIndex;
    var q = m.questions[idx];
    var chosen = state.qAnswers[idx];
    var answered = chosen !== null && chosen !== undefined;

    var dots = m.questions.map(function (_, i) {
      var cls = 'dot';
      if (i < idx || (i === idx && answered)) cls += ' done';
      else if (i === idx) cls += ' current';
      return '<div class="' + cls + '"></div>';
    }).join('');

    var optionsHTML = t(q.options).map(function (opt, i) {
      var cls = 'option';
      if (answered) {
        if (i === q.correct) cls += ' correct';
        else if (i === chosen) cls += ' wrong';
        else cls += ' dim';
      }
      return '<button type="button" class="' + cls + '" data-idx="' + i + '"' +
        (answered ? ' disabled' : '') + '>' + esc(opt) + '</button>';
    }).join('');

    var isLast = idx === total - 1;

    return '' +
      '<button type="button" class="backlink" id="back-home">← ' + esc(strings.backToPath) + '</button>' +
      '<div class="quiz-progress">' + dots + '</div>' +
      '<div class="q-card">' +
      '<div class="q-count">' + esc(strings.questionCount(idx + 1, total)) + '</div>' +
      '<div class="q-text">' + esc(t(q.q)) + '</div>' +
      '<div class="options">' + optionsHTML + '</div>' +
      (answered ? '<div class="explain"><b>' + esc(chosen === q.correct ? strings.correctLabel : strings.explainLabel) +
        '</b>' + esc(t(q.explain)) + '</div>' : '') +
      (answered ? '<div class="q-actions"><button type="button" class="next-btn" id="next-q">' +
        esc(isLast ? strings.seeResults : strings.next) + '</button></div>' : '') +
      '</div>';
  }

  function bindQuiz() {
    qs('#back-home').addEventListener('click', goHome);
    var options = qsa('.option');
    if (options.length && !options[0].disabled) {
      options.forEach(function (btn) { btn.addEventListener('click', onOptionClick); });
    }
    var nextBtn = qs('#next-q');
    if (nextBtn) nextBtn.addEventListener('click', onNextQuestion);
  }

  function onOptionClick(e) {
    var i = Number(e.currentTarget.getAttribute('data-idx'));
    var m = currentModule();
    var q = m.questions[state.qIndex];
    state.qAnswers[state.qIndex] = i;
    if (i === q.correct) state.qCorrectCount++;
    render();
  }

  function onNextQuestion() {
    var m = currentModule();
    if (state.qIndex < m.questions.length - 1) {
      state.qIndex++;
      render();
    } else {
      finishQuiz();
    }
  }

  function finishQuiz() {
    var m = currentModule();
    var total = m.questions.length;
    var stars = starsForScore(state.qCorrectCount, total);
    var prev = state.progress[m.id] || {};
    state.progress[m.id] = {
      done: true,
      stars: Math.max(stars, prev.stars || 0),
      bestCorrect: Math.max(state.qCorrectCount, prev.bestCorrect || 0),
      total: total
    };
    saveProgress();
    state.view = 'result';
    render();
  }

  // ---------- result ----------

  function resultHTML() {
    var strings = L();
    var m = currentModule();
    var total = m.questions.length;
    var correct = state.qCorrectCount;
    var stars = starsForScore(correct, total);

    var title;
    if (stars === 3) title = strings.resultTitlePerfect;
    else if (stars === 2) title = strings.resultTitleGood;
    else if (stars === 1) title = strings.resultTitleOk;
    else title = strings.resultTitleRetry;

    return '' +
      '<div class="result">' +
      '<div class="result-stars">' + starsHTML(stars) + '</div>' +
      '<h2>' + esc(title) + '</h2>' +
      '<p>' + esc(strings.resultBody(correct, total)) + '</p>' +
      '<div class="result-actions">' +
      '<button type="button" class="ghost-btn" id="retry">' + esc(strings.retryQuiz) + '</button>' +
      '<button type="button" class="start-btn" id="continue">' + esc(strings.continueLabel) + '</button>' +
      '</div>' +
      '</div>';
  }

  function bindResult() {
    qs('#retry').addEventListener('click', function () { goQuiz(state.moduleId); });
    qs('#continue').addEventListener('click', goHome);
  }

  // ---------- navigation ----------

  function goHome() {
    state.view = 'home';
    state.moduleId = null;
    render();
  }

  function goLesson(id) {
    state.moduleId = id;
    state.view = 'lesson';
    render();
  }

  function goQuiz(id) {
    var m = state.modules.find(function (mm) { return mm.id === id; });
    state.moduleId = id;
    state.qIndex = 0;
    state.qAnswers = new Array(m.questions.length).fill(null);
    state.qCorrectCount = 0;
    state.view = 'quiz';
    render();
  }

  // ---------- render dispatch ----------

  function render() {
    var body;
    if (state.view === 'lesson') body = lessonHTML();
    else if (state.view === 'quiz') body = quizHTML();
    else if (state.view === 'result') body = resultHTML();
    else body = homeHTML();

    app.innerHTML = headerHTML() + body;

    bindHeader();
    if (state.view === 'lesson') bindLesson();
    else if (state.view === 'quiz') bindQuiz();
    else if (state.view === 'result') bindResult();
    else bindHome();
  }

  // ---------- boot ----------

  fetch('./data.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      state.modules = data.modules;
      render();
    })
    .catch(function (err) {
      app.innerHTML = '<div style="padding:60px 20px;text-align:center;color:#B23B3B;' +
        'font-family:system-ui,sans-serif;line-height:1.6;">' + esc(L().loadError) +
        '<br><span style="opacity:0.7;font-size:0.85em;">(' + esc(err.message) + ')</span></div>';
    });
})();

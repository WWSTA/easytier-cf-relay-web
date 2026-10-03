/**
 * main.js — 站点通用交互
 *  1. 移动端导航折叠
 *  2. 代码块：自动补语言栏 + 复制按钮
 *  3. 标签页（客户端接入方式）
 *  4. 文档页「完整 / 精炼」视图切换（localStorage 记忆）
 *  5. 文档侧栏目录滚动定位
 */
(function () {
  'use strict';

  var COPY_ICON =
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">' +
    '<path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/>' +
    '<path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/>' +
    '</svg>';
  var CHECK_ICON =
    '<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">' +
    '<path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>' +
    '</svg>';

  /* ------------------------------------------------------------------
     剪贴板（file:// 兼容回退）
     ------------------------------------------------------------------ */
  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      try {
        if (document.execCommand('copy')) resolve();
        else reject(new Error('execCommand copy failed'));
      } catch (e) {
        reject(e);
      }
      document.body.removeChild(ta);
    });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // 权限被拒等情况下回退到 execCommand
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  /* ------------------------------------------------------------------
     1. 移动端导航
     ------------------------------------------------------------------ */
  function initNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('.site-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) nav.classList.remove('open');
    });
  }

  /* ------------------------------------------------------------------
     2. 代码块语言栏 / 复制按钮
     ------------------------------------------------------------------ */
  function initCodeBlocks() {
    var blocks = document.querySelectorAll('.code-block');
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      if (block.querySelector('.code-head')) continue;
      var lang = block.getAttribute('data-lang') || '';
      var head = document.createElement('div');
      head.className = 'code-head';
      head.innerHTML =
        '<span class="code-lang">' +
        lang +
        '</span>' +
        '<button class="copy-btn" type="button" aria-label="复制代码">' +
        COPY_ICON +
        '<span>复制</span></button>';
      block.insertBefore(head, block.firstChild);
    }
  }

  function initCopyButtons() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.copy-btn');
      if (!btn) return;
      var block = btn.closest('.code-block, .tabs, .doc-article, body');
      var pre = block ? block.querySelector('pre code') : null;
      if (!pre) return;
      copyText(pre.textContent).then(
        function () {
          btn.classList.add('copied');
          var label = btn.querySelector('span');
          var old = label ? label.textContent : '';
          if (label) label.textContent = '已复制';
          btn.innerHTML = CHECK_ICON + '<span>已复制</span>';
          setTimeout(function () {
            btn.classList.remove('copied');
            btn.innerHTML = COPY_ICON + '<span>' + (old || '复制') + '</span>';
          }, 1600);
        },
        function () {
          var label = btn.querySelector('span');
          if (label) label.textContent = '复制失败';
          setTimeout(function () {
            btn.innerHTML = COPY_ICON + '<span>复制</span>';
          }, 1600);
        }
      );
    });
  }

  /* ------------------------------------------------------------------
     3. 标签页
     ------------------------------------------------------------------ */
  function initTabs() {
    var containers = document.querySelectorAll('[data-tabs]');
    for (var i = 0; i < containers.length; i++) {
      (function (container) {
        var buttons = container.querySelectorAll('[data-tab]');
        var panels = container.querySelectorAll('[data-panel]');
        container.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-tab]');
          if (!btn) return;
          var name = btn.getAttribute('data-tab');
          for (var j = 0; j < buttons.length; j++) {
            buttons[j].classList.toggle('active', buttons[j] === btn);
            buttons[j].setAttribute('aria-selected', buttons[j] === btn ? 'true' : 'false');
          }
          for (var k = 0; k < panels.length; k++) {
            panels[k].classList.toggle('active', panels[k].getAttribute('data-panel') === name);
          }
        });
      })(containers[i]);
    }
  }

  /* ------------------------------------------------------------------
     4. 文档「完整 / 精炼」视图
     ------------------------------------------------------------------ */
  var VIEW_KEY = 'etcf-doc-view';

  function applyDocView(view) {
    var refined = view === 'refined';
    document.body.classList.toggle('view-refined', refined);
    var buttons = document.querySelectorAll('[data-doc-view] [data-view]');
    for (var i = 0; i < buttons.length; i++) {
      var active = buttons[i].getAttribute('data-view') === view;
      buttons[i].classList.toggle('active', active);
      buttons[i].setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  }

  function initDocView() {
    var switcher = document.querySelector('[data-doc-view]');
    if (!switcher) return;
    var saved = null;
    try {
      saved = localStorage.getItem(VIEW_KEY);
    } catch (e) {
      /* ignore */
    }
    applyDocView(saved === 'refined' ? 'refined' : 'full');
    switcher.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-view]');
      if (!btn) return;
      var view = btn.getAttribute('data-view');
      applyDocView(view);
      try {
        localStorage.setItem(VIEW_KEY, view);
      } catch (err) {
        /* ignore */
      }
    });
  }

  /* ------------------------------------------------------------------
     5. 侧栏目录滚动定位
     ------------------------------------------------------------------ */
  function initScrollSpy() {
    var links = document.querySelectorAll('.doc-sidebar a[href^="#"]');
    if (!links.length) return;

    var map = {};
    var list = [];
    for (var i = 0; i < links.length; i++) {
      var id = decodeURIComponent(links[i].getAttribute('href').slice(1));
      var el = document.getElementById(id);
      if (el) {
        map[id] = { link: links[i], el: el };
        list.push(map[id]);
      }
    }
    if (!list.length) return;

    var currentId = null;

    function update() {
      var offset = 96;
      var active = list[0];
      for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if (item.el.getBoundingClientRect().top <= offset) active = item;
        else break;
      }
      // 页面触底时高亮最后一项
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
        active = list[list.length - 1];
      }
      var id = active.el.id;
      if (id === currentId) return;
      currentId = id;
      for (var k = 0; k < list.length; k++) list[k].link.classList.remove('active');
      active.link.classList.add('active');
    }

    // 用时间戳节流而非 rAF：后台标签页中 rAF 不触发，会导致目录高亮失联
    var lastRun = 0;

    function onScroll() {
      var now = Date.now();
      if (now - lastRun < 80) return;
      lastRun = now;
      update();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ------------------------------------------------------------------
     初始化
     ------------------------------------------------------------------ */
  window.etcfCopy = copyText;

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initCodeBlocks();
    initCopyButtons();
    initTabs();
    initDocView();
    initScrollSpy();
  });
})();
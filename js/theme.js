/**
 * theme.js — 明暗主题切换
 * 在 <head> 中同步加载：首屏渲染前写入 <html data-theme>，避免闪烁。
 * 优先级：localStorage 记忆 > 系统 prefers-color-scheme。
 */
(function () {
  'use strict';

  var KEY = 'etcf-theme';
  var root = document.documentElement;

  function systemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function storedTheme() {
    try {
      var v = localStorage.getItem(KEY);
      return v === 'dark' || v === 'light' ? v : null;
    } catch (e) {
      return null;
    }
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
  }

  function current() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  // 首屏前立即应用
  apply(storedTheme() || systemTheme());

  // 系统主题变化：仅在用户未手动选择时跟随
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function () {
      if (!storedTheme()) apply(systemTheme());
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  function syncButtons(theme) {
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      var isDark = theme === 'dark';
      buttons[i].setAttribute('aria-pressed', isDark ? 'true' : 'false');
      var label = isDark ? '切换到浅色主题' : '切换到深色主题';
      buttons[i].setAttribute('title', label);
      buttons[i].setAttribute('aria-label', label);
    }
  }

  function toggle() {
    var next = current() === 'dark' ? 'light' : 'dark';
    apply(next);
    try {
      localStorage.setItem(KEY, next);
    } catch (e) {
      /* 隐私模式下忽略 */
    }
    syncButtons(next);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', toggle);
    }
    syncButtons(current());
  });

  // 供其他脚本使用
  window.etcfTheme = { toggle: toggle, current: current };
})();
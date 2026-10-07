/**
 * generator.js — wrangler.toml 配置生成器
 *
 *  读取 js/data/config-items.js 的配置定义 → 渲染表单
 *  → 实时校验 + 生成完整 wrangler.toml（含中文注释）+ 语法高亮预览
 *  → 复制 / 下载 / 恢复默认 / 预设（默认、严格纯 P2P、完整运维）
 *
 *  表单状态自动保存到 localStorage，刷新不丢失；「恢复默认」可清空。
 */
(function () {
  'use strict';

  var CONFIG = window.ETCF_CONFIG;
  var STORAGE_KEY = 'etcf-generator-state';
  var form = document.getElementById('gen-form');
  var preview = document.getElementById('gen-preview');
  if (!CONFIG || !form || !preview) return;

  /* ================================================================
     状态
     ================================================================ */
  function defaults() {
    var s = {
      values: {},
      enabled: {},
      deploy: {
        name: CONFIG.deploy.name.default,
        date: CONFIG.deploy.compatibilityDate.default,
        domain: {
          enabled: CONFIG.deploy.domain.enabled,
          pattern: CONFIG.deploy.domain.pattern,
          mode: CONFIG.deploy.domain.mode,
          zone: CONFIG.deploy.domain.zone,
        },
      },
    };
    CONFIG.groups.forEach(function (g) {
      (g.items || []).forEach(function (item) {
        if (item.kind === 'single') {
          s.values[item.key] = item.default;
          s.enabled[item.key] = !item.optional;
        } else if (item.kind === 'pair') {
          item.fields.forEach(function (f) {
            s.values[f.key] = f.default;
          });
          s.enabled[item.id] = false;
        }
      });
      if (g.toggle) s.enabled[g.toggle.id] = false;
    });
    return s;
  }

  function mergeSaved(s, saved) {
    if (!saved || typeof saved !== 'object') return s;
    if (saved.values) {
      Object.keys(saved.values).forEach(function (k) {
        if (Object.prototype.hasOwnProperty.call(s.values, k)) {
          s.values[k] = String(saved.values[k]);
        }
      });
    }
    if (saved.enabled) {
      Object.keys(saved.enabled).forEach(function (k) {
        if (Object.prototype.hasOwnProperty.call(s.enabled, k)) {
          s.enabled[k] = !!saved.enabled[k];
        }
      });
    }
    if (saved.deploy) {
      if (typeof saved.deploy.name === 'string') s.deploy.name = saved.deploy.name;
      if (typeof saved.deploy.date === 'string') s.deploy.date = saved.deploy.date;
      if (saved.deploy.domain && typeof saved.deploy.domain === 'object') {
        var d = saved.deploy.domain;
        if (typeof d.enabled === 'boolean') s.deploy.domain.enabled = d.enabled;
        if (typeof d.pattern === 'string') s.deploy.domain.pattern = d.pattern;
        if (typeof d.mode === 'string') s.deploy.domain.mode = d.mode;
        if (typeof d.zone === 'string') s.deploy.domain.zone = d.zone;
      }
    }
    return s;
  }

  var state = mergeSaved(defaults(), readSaved());

  // 旧版本默认值为非补零日期（2026-10-1），已存本地的旧值自动迁移为标准 YYYY-MM-DD 格式
  if (state.deploy.date === '2026-10-1') state.deploy.date = '2026-10-01';

  function readSaved() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (e) {
      return null;
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* ignore */
    }
  }

  /* ================================================================
     工具
     ================================================================ */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** TOML 字符串转义 */
  function q(v) {
    return '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }

  function randHex(bytes) {
    var arr = new Uint8Array(bytes);
    (window.crypto || window.msCrypto).getRandomValues(arr);
    return Array.prototype.map
      .call(arr, function (b) {
        return ('0' + b.toString(16)).slice(-2);
      })
      .join('');
  }

  function getItemByKey(key) {
    for (var i = 0; i < CONFIG.groups.length; i++) {
      var items = CONFIG.groups[i].items || [];
      for (var j = 0; j < items.length; j++) {
        if (items[j].kind === 'single' && items[j].key === key) return items[j];
        if (items[j].kind === 'pair') {
          for (var k = 0; k < items[j].fields.length; k++) {
            if (items[j].fields[k].key === key) return items[j].fields[k];
          }
        }
      }
    }
    return null;
  }

  /* ================================================================
     校验
     ================================================================ */
  var VALIDATORS = {
    int: function (v) {
      if (!/^\d+$/.test(v.trim())) return { level: 'error', msg: '必须为非负整数' };
      return null;
    },
    peerId: function (v) {
      if (!/^\d+$/.test(v.trim()) || Number(v) === 0) {
        return { level: 'error', msg: '必须为正整数（建议使用不易冲突的小数值）' };
      }
      return null;
    },
    peerIdle: function (v) {
      if (!/^\d+$/.test(v.trim())) return { level: 'error', msg: '必须为非负整数' };
      if (Number(v) <= 32000) {
        return { level: 'error', msg: '必须大于客户端 ping 最大间隔 32s（32000），否则正常客户端会被误清理' };
      }
      return null;
    },
    path: function (v) {
      var t = v.trim();
      if (!t) return { level: 'warn', msg: '为空时该模块不会启用' };
      if (t[0] !== '/') return { level: 'error', msg: '路径必须以 / 开头' };
      if (t.length < 8) return { level: 'warn', msg: '建议使用随机长路径（≥ 8 字符），防路径扫描' };
      return null;
    },
    token: function (v) {
      var t = v.trim();
      if (!t) return { level: 'warn', msg: '为空时该模块不会启用' };
      if (t.length < 16) return { level: 'warn', msg: '建议使用长随机字符串（≥ 16 字符）' };
      return null;
    },
    networkSecrets: function (v) {
      var t = v.trim();
      if (!t) return { level: 'warn', msg: '为空时不做服务端密钥校验' };
      var obj;
      try {
        obj = JSON.parse(t);
      } catch (e) {
        return { level: 'error', msg: '不是合法的 JSON：' + e.message };
      }
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return { level: 'error', msg: '必须是 JSON 对象，形如 {"网络名":"密钥"}' };
      }
      var bad = Object.keys(obj).filter(function (k) {
        return typeof obj[k] !== 'string';
      });
      if (bad.length) return { level: 'error', msg: '所有值必须是字符串（网络密钥）' };
      return null;
    },
    workerName: function (v) {
      var t = v.trim();
      if (!t) return { level: 'error', msg: '不能为空' };
      if (!/^[a-z0-9][a-z0-9-]*$/.test(t)) {
        return { level: 'error', msg: '只能包含小写字母、数字与连字符，且以字母或数字开头' };
      }
      return null;
    },
    accountId: function (v) {
      if (!v.trim()) return { level: 'warn', msg: '为空时该模块不会启用' };
      if (/your-cloudflare/i.test(v)) {
        return { level: 'warn', msg: '请把占位符换成真实的 Cloudflare 账号 ID（Dashboard 右侧 / Workers 概览页可见）' };
      }
      return null;
    },
    date: function (v) {
      var t = v.trim();
      // wrangler 要求补零的 ISO 日期格式 YYYY-MM-DD（如 2026-10-01）
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
        return { level: 'error', msg: '格式应为补零的 YYYY-MM-DD（如 2026-10-01，月份与日期不足两位需补 0）' };
      }
      var p = t.split('-').map(Number);
      var d = new Date(p[0], p[1] - 1, p[2]);
      if (d.getFullYear() !== p[0] || d.getMonth() !== p[1] - 1 || d.getDate() !== p[2]) {
        return { level: 'error', msg: '不是真实存在的日期' };
      }
      return null;
    },
  };

  /** 校验全部字段，返回 { key: {level, msg} } */
  function validateAll() {
    var out = {};

    // 顶层
    var nameRes = VALIDATORS.workerName(state.deploy.name);
    if (nameRes) out['@name'] = nameRes;
    var dateRes = VALIDATORS.date(state.deploy.date);
    if (dateRes) out['@date'] = dateRes;
    if (state.deploy.domain.enabled) {
      if (!state.deploy.domain.pattern.trim()) {
        out['@domain'] = { level: 'error', msg: '请填写域名' };
      } else if (state.deploy.domain.mode === 'zone' && !state.deploy.domain.zone.trim()) {
        out['@domain'] = { level: 'error', msg: 'Route 模式需要填写 zone_name（如 example.com）' };
      }
    }

    // 字段
    CONFIG.groups.forEach(function (g) {
      (g.items || []).forEach(function (item) {
        if (item.kind === 'single') {
          if (item.optional && !state.enabled[item.key]) return; // 未启用不校验
          var res = item.validate ? VALIDATORS[item.validate](state.values[item.key] || '') : null;
          if (res) out[item.key] = res;
        } else if (item.kind === 'pair') {
          if (!state.enabled[item.id]) return;
          var emptyKeys = [];
          item.fields.forEach(function (f) {
            var v = (state.values[f.key] || '').trim();
            var r = f.validate ? VALIDATORS[f.validate](state.values[f.key] || '') : null;
            if (!v) emptyKeys.push(f.key);
            else if (r) out[f.key] = r;
          });
          if (emptyKeys.length) {
            emptyKeys.forEach(function (k) {
              out[k] = { level: 'error', msg: '已启用该模块，路径与 Token 需同时填写（或关闭模块）' };
            });
          }
        }
      });
    });

    // 跨字段
    if (state.values['MAX_MESSAGE_BYTES'] && /^\d+$/.test(state.values['MAX_MESSAGE_BYTES']) &&
        Number(state.values['MAX_MESSAGE_BYTES']) < 1500) {
      out['MAX_MESSAGE_BYTES'] = { level: 'warn', msg: '小于 EasyTier MTU 1380，可能丢弃正常数据包' };
    }
    // 资源滥用防线自洽不变量：MAX_ROUTES_PER_GROUP × MAX_ROUTE_INFO_BYTES 须 < MAX_MESSAGE_BYTES
    var routeCap = Number(state.values['MAX_ROUTES_PER_GROUP'] || 0);
    var routeBytes = Number(state.values['MAX_ROUTE_INFO_BYTES'] || 0);
    var maxMsgBytes = Number(state.values['MAX_MESSAGE_BYTES'] || 0);
    if (routeCap && routeBytes && maxMsgBytes && routeCap * routeBytes >= maxMsgBytes) {
      out['MAX_ROUTES_PER_GROUP'] = {
        level: 'warn',
        msg: '不自洽：' + routeCap + ' × ' + routeBytes + ' ≥ MAX_MESSAGE_BYTES（' + maxMsgBytes +
          '），合法全量推送可能被出站硬闸丢弃（服务端启动日志也会 warn）',
      };
    }
    if (state.enabled['auditKv'] && !(state.values['AUDIT_KV_ID'] || '').trim()) {
      out['AUDIT_KV_ID'] = { level: 'warn', msg: '未填写 id：部署前需运行 wrangler kv namespace create AUDIT_KV 补全' };
    }
    if (state.enabled['rooms'] && state.enabled['auditKv']) {
      out['@roomsAudit'] = {
        level: 'warn',
        msg: 'KV 审计键为全局共享，多房间分片下不建议启用 AUDIT_KV（见部署手册 5.6）',
      };
    }
    return out;
  }

  /* ================================================================
     TOML 生成
     ================================================================ */
  function generate() {
    var L = [];
    var v = state.values;

    L.push('# EasyTier Cloudflare Relay — Durable Object 配置');
    L.push('# 由站点配置生成器生成 · 完整变量说明见《部署手册》');
    L.push('# https://github.com/WWSTA/easytier-cf-relay');
    L.push('');
    L.push('name = ' + q(state.deploy.name));
    L.push('main = "src/index.js"');
    L.push('compatibility_date = ' + q(state.deploy.date));
    L.push('compatibility_flags = ["nodejs_compat"]');
    L.push('');
    L.push('# WebSocket Hibernation 需要的最低兼容日期为 2024-04-03');

    var dom = state.deploy.domain;
    if (dom.enabled && dom.pattern.trim()) {
      L.push('');
      if (dom.mode === 'custom_domain') {
        L.push('# 自定义域名（Custom Domain）：Cloudflare 自动创建 DNS 记录并签发/轮换 TLS 证书');
        L.push('routes = [');
        L.push('  { pattern = ' + q(dom.pattern.trim()) + ', custom_domain = true }');
        L.push(']');
      } else {
        L.push('# 自定义域名（Route + 手动 DNS）：需在 DNS 面板为该域名添加任意 A/AAAA 记录');
        L.push('routes = [');
        L.push('  { pattern = ' + q(dom.pattern.trim() + '/*') + ', zone_name = ' + q(dom.zone.trim()) + ' }');
        L.push(']');
      }
    }

    /* ---- [vars] ---- */
    L.push('');
    L.push('[vars]');

    /** 注释逐字对应 wrangler.toml：可多行（\n 分行），空串不输出。
     *  以 # 开头的行视为已带前缀——用于 `#（…` 这种 # 后不空格的原文写法 */
    function pushComment(text) {
      if (text === undefined || text === null || text === '') return;
      String(text).split('\n').forEach(function (line) {
        L.push(line.charAt(0) === '#' ? line : '# ' + line);
      });
    }

    CONFIG.groups.forEach(function (g) {
      // 组级 header = wrangler.toml 里的分节注释块（KV 审计 / 监控与管理端 / 额度观测等）
      (g.header || []).forEach(pushComment);
      var groupDisabled = g.toggle && g.toggle.scope === 'items' && !state.enabled[g.toggle.id];
      if (groupDisabled && !(g.header || []).length) {
        L.push('# 可选：' + g.title + '。' + '默认未启用，配置后生效');
      }
      (g.items || []).forEach(function (item) {
        if (item.kind === 'note') {
          // 纯说明项：只输出注释块（如 CF_API_TOKEN，只允许 secret 注入）
          pushComment(item.comment);
          return;
        }
        if (item.kind === 'single') {
          if (item.noEmit) return; // 仅用于绑定 id（KV namespace），不进 [vars]
          if (item.blankBefore) L.push(''); // wrangler.toml 里该变量注释块前有一个空行
          var enabled;
          if (item.optional) enabled = !!state.enabled[item.key] && !groupDisabled;
          else enabled = !groupDisabled;
          pushComment(item.comment);
          L.push((enabled ? '' : '# ') + item.key + ' = ' + q(v[item.key] || ''));
        } else if (item.kind === 'pair') {
          var on = !!state.enabled[item.id];
          pushComment(item.comment);
          item.fields.forEach(function (f) {
            var val = v[f.key] || '';
            pushComment(f.comment);
            L.push((on ? '' : '# ') + f.key + ' = ' + q(val));
          });
        }
      });
    });

    /* ---- Durable Object ---- */
    L.push('');
    L.push('[durable_objects]');
    L.push('bindings = [');
    L.push('  { name = "RELAY_ROOM", class_name = "RelayRoom" }');
    L.push(']');

    /* ---- KV 绑定 ---- */
    L.push('');
    if (state.enabled['auditKv']) {
      L.push('# KV 审计绑定（记录 + 黑名单），由 AUDIT_KV_ID 生成');
      L.push('[[kv_namespaces]]');
      L.push('binding = "AUDIT_KV"');
      L.push('id = ' + q((v['AUDIT_KV_ID'] || '').trim()));
    } else {
      L.push('# KV 审计绑定（记录 + 黑名单）。创建后取消注释并填入 id：');
      L.push('#   npx wrangler kv namespace create AUDIT_KV');
      L.push('# [[kv_namespaces]]');
      L.push('# binding = "AUDIT_KV"');
      L.push('# id = "<你的 KV namespace id>"');
    }

    /* ---- Analytics Engine 绑定（v1.6 趋势打点，可选） ---- */
    L.push('');
    [
      'Analytics Engine 绑定（v1.6：趋势打点，免费计划含 100,000 数据点/天；',
      '本方案每分钟 1 点 ≈ 1,440/天）。绑定即自动建数据集，无需额外创建步骤',
      '⚠️ 注意：本绑定要求账号先在 Dashboard 一次性开通 Analytics Engine',
      '  （Workers & Pages → Analytics Engine → Enable，免费、无需绑卡）；',
      '  未开通时 `wrangler deploy` 会报错 10089「You need to enable Analytics',
      '  Engine」，整个部署失败（线上不受影响，开通后重跑即可）。',
      '打开 https://dash.cloudflare.com/{CF_ACCOUNT_ID}/workers/analytics-engine',
    ].forEach(function (line) { L.push('# ' + line); });
    if (state.enabled['aeBinding']) {
      L.push('[[analytics_engine_datasets]]');
      L.push('binding = "AE"');
      L.push('dataset = ' + q((v['AE_DATASET'] || '').trim() || 'easytier-cf-relay'));
    } else {
      L.push('# 不需要趋势图可注释掉下面 3 行——代码自动降级，其余功能不受影响。');
      L.push('# [[analytics_engine_datasets]]');
      L.push('# binding = "AE"');
      L.push('# dataset = ' + q((v['AE_DATASET'] || '').trim() || 'easytier-cf-relay'));
    }

    /* ---- migrations ---- */
    L.push('');
    L.push('[[migrations]]');
    L.push('tag = "v1"');
    L.push('new_sqlite_classes = ["RelayRoom"]');
    L.push('');
    L.push('# 说明：');
    L.push('# - 使用 new_sqlite_classes（存储后端为 SQLite，免费额度内即支持 Hibernation API）');
    L.push('# - 若已有旧部署（new_classes），不要重复添加迁移，参考部署手册「迁移」章节');
    L.push('# - 生产敏感变量（METRICS_TOKEN / ADMIN_TOKEN / CF_API_TOKEN 等）建议用 npx wrangler secret put 注入');
    L.push('');

    return L.join('\n');
  }

  /* ================================================================
     TOML 语法高亮
     ================================================================ */
  function span(cls, s) {
    return '<span class="' + cls + '">' + esc(s) + '</span>';
  }

  function hlValue(raw) {
    var out = '';
    var i = 0;
    var re = /"(?:\\.|[^"\\])*"|\b\d+\b|\b(?:true|false)\b|#.*$/g;
    var m;
    while ((m = re.exec(raw))) {
      out += esc(raw.slice(i, m.index));
      var tok = m[0];
      if (tok.charAt(0) === '"') out += span('tok-s', tok);
      else if (tok === 'true' || tok === 'false') out += span('tok-b', tok);
      else if (tok.charAt(0) === '#') out += span('tok-c', tok);
      else out += span('tok-n', tok);
      i = m.index + tok.length;
    }
    out += esc(raw.slice(i));
    return out;
  }

  function highlightToml(src) {
    return src
      .split('\n')
      .map(function (raw) {
        if (/^\s*#/.test(raw)) return span('tok-c', raw);
        var sec = /^(\s*)(\[\[?[^\]]+\]?\])(\s*)$/.exec(raw);
        if (sec) return esc(sec[1]) + span('tok-h', sec[2]) + esc(sec[3]);
        var kv = /^(\s*)([A-Za-z_][A-Za-z0-9_.-]*)(\s*=\s*)(.*)$/.exec(raw);
        if (!kv) return esc(raw);
        return esc(kv[1]) + span('tok-k', kv[2]) + esc(kv[3]) + hlValue(kv[4]);
      })
      .join('\n');
  }

  /* ================================================================
     表单渲染
     ================================================================ */
  function inputHtml(item, key, value, placeholder) {
    var attrs =
      'class="gen-input" data-key="' + key + '" id="f-' + key + '"' +
      (placeholder ? ' placeholder="' + esc(placeholder) + '"' : '');
    if (item.type === 'select') {
      return (
        '<select ' + attrs + '>' +
        (item.options || [])
          .map(function (o) {
            return (
              '<option value="' + esc(o.value) + '"' +
              (String(value) === String(o.value) ? ' selected' : '') +
              '>' + esc(o.label) + '</option>'
            );
          })
          .join('') +
        '</select>'
      );
    }
    if (item.type === 'json') {
      return '<textarea ' + attrs + ' rows="2" spellcheck="false">' + esc(value) + '</textarea>';
    }
    return (
      '<input ' + attrs + ' type="text"' +
      (item.type === 'number' ? ' inputmode="numeric" autocomplete="off"' : '') +
      ' value="' + esc(value) + '">'
    );
  }

  function switchHtml(id, checked, label) {
    return (
      '<label class="switch" title="' + esc(label) + '">' +
      '<input type="checkbox" data-toggle="' + id + '"' + (checked ? ' checked' : '') + '>' +
      '<span class="switch-track" aria-hidden="true"></span>' +
      '<span class="switch-text">' + esc(label) + '</span>' +
      '</label>'
    );
  }

  function renderForm() {
    var html = '';

    /* 部署元信息 */
    html +=
      '<details class="gen-group" open>' +
      '<summary><span class="gen-group-title">部署元信息</span>' +
      '<span class="gen-group-desc">Worker 名称、兼容日期与自定义域名</span></summary>' +
      '<div class="gen-items">' +
      '<div class="gen-item" data-key="@name">' +
      '<div class="gen-item-head"><label class="gen-label" for="f-@name"><code>name</code><span>Worker 名称</span></label></div>' +
      '<input class="gen-input" data-key="@name" id="f-@name" type="text" value="' + esc(state.deploy.name || '') + '">' +
      '<p class="gen-help">Worker 名称，也是默认的 *.workers.dev 子域。</p>' +
      '<p class="gen-msg" data-msg-for="@name"></p>' +
      '</div>' +
      '<div class="gen-item" data-key="@date">' +
      '<div class="gen-item-head"><label class="gen-label" for="f-@date"><code>compatibility_date</code><span>兼容日期</span></label></div>' +
      '<input class="gen-input" data-key="@date" id="f-@date" type="text" value="' + esc(state.deploy.date || '') + '">' +
      '<p class="gen-help">WebSocket Hibernation 需要的最低兼容日期为 2024-04-03。</p>' +
      '<p class="gen-msg" data-msg-for="@date"></p>' +
      '</div>' +
      '<div class="gen-item" data-key="@domain">' +
      '<div class="gen-item-head"><span class="gen-label"><code>routes</code><span>自定义域名（可选）</span></span>' +
      switchHtml('@domain', state.deploy.domain.enabled, '启用') +
      '</div>' +
      '<div class="gen-domain ' + (state.deploy.domain.enabled ? '' : 'is-off') + '" id="gen-domain-fields">' +
      '<div class="gen-subfield">' +
      '<label for="f-@domain-pattern">域名</label>' +
      '<input class="gen-input" data-key="@domain-pattern" id="f-@domain-pattern" type="text" placeholder="et.example.com" value="' + esc(state.deploy.domain.pattern) + '">' +
      '</div>' +
      '<div class="gen-subfield">' +
      '<label for="f-@domain-mode">绑定方式</label>' +
      '<select class="gen-input" data-key="@domain-mode" id="f-@domain-mode">' +
      '<option value="custom_domain"' + (state.deploy.domain.mode === 'custom_domain' ? ' selected' : '') + '>Custom Domain（推荐，自动签发 TLS）</option>' +
      '<option value="zone"' + (state.deploy.domain.mode === 'zone' ? ' selected' : '') + '>Route + 手动 DNS</option>' +
      '</select>' +
      '</div>' +
      '<div class="gen-subfield' + (state.deploy.domain.mode === 'zone' ? '' : ' hidden') + '" id="gen-zone-field">' +
      '<label for="f-@domain-zone">zone_name</label>' +
      '<input class="gen-input" data-key="@domain-zone" id="f-@domain-zone" type="text" placeholder="example.com" value="' + esc(state.deploy.domain.zone) + '">' +
      '</div>' +
      '</div>' +
      '<p class="gen-help">域名需托管在 Cloudflare；不启用则使用默认 *.workers.dev 域名。WebSocket 路径任意（/、/ws、/easytier 均可）。</p>' +
      '<p class="gen-msg" data-msg-for="@domain"></p>' +
      '</div>' +
      '</div></details>';

    /* 配置分组 */
    CONFIG.groups.forEach(function (g) {
      html +=
        '<details class="gen-group" data-group="' + g.id + '"' + (g.open ? ' open' : '') + '>' +
        '<summary><span class="gen-group-title">' + esc(g.title) + '</span>' +
        '<span class="gen-group-desc">' + esc(g.desc) + '</span></summary>' +
        '<div class="gen-items">';

      if (g.toggle) {
        html +=
          '<div class="gen-group-toggle">' +
          switchHtml(g.toggle.id, !!state.enabled[g.toggle.id], g.toggle.label) +
          (g.toggleHelp ? '<p class="gen-help">' + esc(g.toggleHelp) + '</p>' : '') +
          '</div>';
      }

      (g.items || []).forEach(function (item) {
        if (item.kind === 'single') {
          var on = item.optional ? !!state.enabled[item.key] : true;
          html +=
            '<div class="gen-item' + (item.optional && !on ? ' is-off' : '') + '" data-key="' + item.key + '">' +
            '<div class="gen-item-head">' +
            '<label class="gen-label" for="f-' + item.key + '"><code>' + item.key + '</code><span>' + esc(item.label) + '</span></label>' +
            (item.optional ? switchHtml(item.key, on, '启用') : '') +
            '</div>' +
            inputHtml(item, item.key, state.values[item.key] || '', item.placeholder) +
            '<p class="gen-help">' + esc(item.help) + '</p>' +
            '<p class="gen-msg" data-msg-for="' + item.key + '"></p>' +
            '</div>';
        } else if (item.kind === 'note') {
          // 纯说明项（无输入框）：TOML 里只输出注释块，如 CF_API_TOKEN
          html +=
            '<div class="gen-item gen-note" data-key="' + item.key + '">' +
            '<div class="gen-item-head">' +
            '<span class="gen-label"><code>' + item.key + '</code><span>' + esc(item.label) + '</span></span>' +
            '</div>' +
            '<p class="gen-help">' + esc(item.help) + '</p>' +
            '</div>';
        } else if (item.kind === 'pair') {
          var pairOn = !!state.enabled[item.id];
          html +=
            '<div class="gen-item gen-pair' + (pairOn ? '' : ' is-off') + '" data-pair="' + item.id + '">' +
            '<div class="gen-item-head">' +
            '<span class="gen-label"><code>' + item.fields.map(function (f) { return f.key; }).join(' + ') + '</code><span>' + esc(item.label) + '</span></span>' +
            switchHtml(item.id, pairOn, '启用') +
            '</div>' +
            '<div class="gen-pair-fields">' +
            item.fields
              .map(function (f) {
                return (
                  '<div class="gen-subfield">' +
                  '<label for="f-' + f.key + '">' + f.key + ' · ' + esc(f.label) + '</label>' +
                  inputHtml(f, f.key, state.values[f.key] || '', f.placeholder) +
                  '<p class="gen-msg" data-msg-for="' + f.key + '"></p>' +
                  '</div>'
                );
              })
              .join('') +
            '</div>' +
            '<p class="gen-help">' + esc(item.help) + '</p>' +
            '</div>';
        }
      });

      html += '</div></details>';
    });

    form.innerHTML = html;
  }

  /* ================================================================
     刷新（预览 + 校验 + 状态样式）
     ================================================================ */
  var previewCode = null;

  function refresh() {
    var toml = generate();
    previewCode.innerHTML = highlightToml(toml);
    updateValidation();
    save();
  }

  function updateValidation() {
    var results = validateAll();
    var msgs = form.querySelectorAll('.gen-msg[data-msg-for]');
    for (var i = 0; i < msgs.length; i++) {
      var key = msgs[i].getAttribute('data-msg-for');
      var res = results[key];
      msgs[i].textContent = res ? res.msg : '';
      msgs[i].className = 'gen-msg' + (res ? ' is-' + res.level : '') + (!res ? '' : '');
      var item = msgs[i].closest('.gen-item');
      if (item) {
        item.classList.toggle('has-error', !!(res && res.level === 'error'));
        item.classList.toggle('has-warn', !!(res && res.level === 'warn'));
      }
    }
    // 跨字段提示（房间分片 + KV 审计）
    var extra = document.getElementById('gen-extra-msgs');
    if (extra) {
      if (results['@roomsAudit']) {
        extra.innerHTML = '<div class="alert alert-warning"><p class="alert-title">注意</p><p>' + esc(results['@roomsAudit'].msg) + '</p></div>';
        extra.classList.remove('hidden');
      } else {
        extra.innerHTML = '';
        extra.classList.add('hidden');
      }
    }
  }

  /* ================================================================
     事件
     ================================================================ */
  form.addEventListener('input', function (e) {
    var el = e.target;
    var key = el.getAttribute('data-key');
    if (!key) return;
    if (key === '@name') state.deploy.name = el.value;
    else if (key === '@date') state.deploy.date = el.value;
    else if (key === '@domain-pattern') state.deploy.domain.pattern = el.value;
    else if (key === '@domain-zone') state.deploy.domain.zone = el.value;
    else state.values[key] = el.value;
    scheduleRefresh();
  });

  form.addEventListener('change', function (e) {
    var el = e.target;
    var key = el.getAttribute('data-key');
    if (key === '@domain-mode') {
      state.deploy.domain.mode = el.value;
      var zoneField = document.getElementById('gen-zone-field');
      if (zoneField) zoneField.classList.toggle('hidden', el.value !== 'zone');
    } else if (key) {
      // select 变更
      if (key === '@name') state.deploy.name = el.value;
      else if (key === '@date') state.deploy.date = el.value;
      else if (key === '@domain-pattern') state.deploy.domain.pattern = el.value;
      else if (key === '@domain-zone') state.deploy.domain.zone = el.value;
      else state.values[key] = el.value;
    }

    var toggle = el.getAttribute('data-toggle');
    if (toggle) {
      var on = el.checked;
      if (toggle === '@domain') {
        state.deploy.domain.enabled = on;
        var wrap = document.getElementById('gen-domain-fields');
        if (wrap) wrap.classList.toggle('is-off', !on);
      } else {
        state.enabled[toggle] = on;
        // 更新对应条目的禁用样式
        var item = el.closest('.gen-item');
        if (item) item.classList.toggle('is-off', !on);
        var groupToggle = el.closest('.gen-group-toggle');
        if (groupToggle) {
          var group = groupToggle.closest('.gen-group');
          if (group) group.classList.toggle('group-off', !on);
        }
      }
    }
    scheduleRefresh();
  });

  var refreshTimer = null;
  function scheduleRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refresh, 120);
  }

  /* ================================================================
     操作：复制 / 下载 / 重置 / 预设
     ================================================================ */
  function copy(text) {
    if (window.etcfCopy) return window.etcfCopy(text);
    return Promise.reject(new Error('copy unavailable'));
  }

  function flashButton(btn, okText) {
    var old = btn.getAttribute('data-label') || btn.textContent;
    btn.setAttribute('data-label', old);
    btn.textContent = okText;
    setTimeout(function () {
      btn.textContent = btn.getAttribute('data-label');
    }, 1600);
  }

  var btnCopy = document.getElementById('gen-copy');
  if (btnCopy) {
    btnCopy.addEventListener('click', function () {
      copy(generate()).then(
        function () {
          flashButton(btnCopy, '已复制 ✓');
        },
        function () {
          flashButton(btnCopy, '复制失败');
        }
      );
    });
  }

  var btnDownload = document.getElementById('gen-download');
  if (btnDownload) {
    btnDownload.addEventListener('click', function () {
      var blob = new Blob([generate()], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'wrangler.toml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 2000);
    });
  }

  var btnReset = document.getElementById('gen-reset');
  if (btnReset) {
    btnReset.addEventListener('click', function () {
      if (!window.confirm('恢复默认配置？当前修改将丢失。')) return;
      state = defaults();
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        /* ignore */
      }
      renderForm();
      refresh();
    });
  }

  var PRESETS = {
    default: function (s) {
      return s;
    },
    strictP2P: function (s) {
      s.values['AVOID_RELAY_DATA'] = '1';
      s.values['RELAY_DATA'] = '0';
      return s;
    },
    opsFull: function (s) {
      s.values['LOG_LEVEL'] = 'info';
      s.enabled['auditKv'] = true;
      if (!(s.values['AUDIT_KV_ID'] || '').trim()) s.values['AUDIT_KV_ID'] = '';
      s.enabled['HEALTH_PATH'] = true;
      s.values['HEALTH_PATH'] = '/h-' + randHex(6);
      s.enabled['metrics'] = true;
      s.values['METRICS_PATH'] = '/m-' + randHex(6);
      s.values['METRICS_TOKEN'] = randHex(24);
      s.enabled['admin'] = true;
      s.values['ADMIN_PATH'] = '/console-' + randHex(6);
      s.values['ADMIN_TOKEN'] = randHex(24);
      return s;
    },
  };

  Array.prototype.forEach.call(document.querySelectorAll('[data-preset]'), function (btn) {
    btn.addEventListener('click', function () {
      var name = btn.getAttribute('data-preset');
      var fn = PRESETS[name];
      if (!fn) return;
      state = fn(defaults());
      renderForm();
      refresh();
      Array.prototype.forEach.call(document.querySelectorAll('[data-preset]'), function (b) {
        b.classList.toggle('active', b === btn);
      });
    });
  });

  /* ================================================================
     启动
     ================================================================ */
  previewCode = preview.querySelector('code');
  renderForm();
  refresh();
})();
/* 首页「功能特性」气泡图谱 — 由 demo/features-bubbles.html 适配而来 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     数据驱动：新增功能球只需在数组末尾追加一条。
     字段：id（唯一）、cat（net/sec/ops/quota）、title、desc、link、href、icon。
     数量、连线、中心计数、移动端网格都会自动生成；标题长度会自动决定半径。
     新增分类时在上方 CSS 加 --cat-xxx / --cat-xxx-soft 和对应 [data-cat]
     映射；即使暂未配置分类色，也会回退到默认品牌色。

     11 条内容与原 #features 卡片逐字一致；链接使用站点根路径。
     ------------------------------------------------------------------ */
  var FEATURES = [
    {
      id: 'protocol', cat: 'net', title: '协议兼容',
      desc: '字节级对齐官方实现：握手 / OSPF 路由同步 / PeerCenter / 包转发，已用 easytier-core 2.6.4 官方客户端实测验证。',
      link: '协议实现详解 →', href: 'technical.html#4-协议实现详解',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h13"/><path d="M14 5l3 3-3 3"/><path d="M20 16H7"/><path d="M10 13l-3 3 3 3"/></svg>'
    },
    {
      id: 'p2p', cat: 'net', title: '纯 P2P 优先',
      desc: '宣告 <code>avoid_relay_data</code>，客户端优先直连打洞，中继只做兜底——可配置为完全关闭数据面（严格纯 P2P）。',
      link: '纯 P2P 模式 →', href: 'technical.html#5-纯-p2p-模式',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5" cy="12" r="2.2"/><circle cx="19" cy="6" r="2.2"/><circle cx="19" cy="18" r="2.2"/><path d="M7.1 11.1l9.8-4.2"/><path d="M7.1 12.9l9.8 4.2"/></svg>'
    },
    {
      id: 'isolation', cat: 'net', title: '网络隔离',
      desc: '网络名 + 密钥摘要（SipHash-1-3，与官方同算法）分组隔离，支持 <code>NETWORK_SECRETS</code> 服务端密钥校验。',
      link: '配置参考 →', href: 'deploy.html#54-安全',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><circle cx="12" cy="11" r="2.4"/></svg>'
    },
    {
      id: 'ghost-defense', cat: 'sec', title: '幽灵节点六重防线',
      desc: '握手超时 / 空闲超时 / 主动探活 + direct 覆盖与 reporter 追踪 / 路由老化 / 空分组自动删除，彻底解决幽灵路由条目。',
      link: '六重防线 →', href: 'technical.html#6-幽灵节点六重防线',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M8.5 11.5l2.3 2.3 4.7-4.7"/></svg>'
    },
    {
      id: 'security', cat: 'sec', title: '安全加固',
      desc: '零指纹 <code>/health</code>、fail-closed 双门禁、三层事前限流、未知路径 tar pit、转发校验源身份、防路由投毒与摘要抢占。',
      link: '拦截层次说明 →', href: 'technical.html#94-黑名单拦截双层免费额度优化',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/><circle cx="12" cy="15" r="1.4"/></svg>'
    },
    {
      id: 'web-admin', cat: 'ops', title: 'Web 管理端',
      desc: '侧边栏九大功能页：总览 / 节点 / 路由 / 互联 / 连接 / 分组 / 摘要注册 / 记录 / 黑名单；服务端分页、各块统计、单个与批量操作。',
      link: '管理端说明 →', href: 'deploy.html#82-web-管理端',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/><path d="M9 9h12"/></svg>'
    },
    {
      id: 'kv-audit', cat: 'ops', title: 'KV 审计记录',
      desc: '六类事件记录进 Workers KV（每类只占一条键，全生命周期共 11 条），支持「全部」跨类型合并查询；管理员登录与操作为硬审计。v1.6 起可选 IP 打码（<code>AUDIT_IP_MASK</code>）与按天留存清理（<code>AUDIT_RETENTION_DAYS</code>）。',
      link: 'KV 审计设计 →', href: 'technical.html#9-kv-审计与管理端黑名单',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>'
    },
    {
      id: 'blocklist', cat: 'sec', title: '管理端黑名单',
      desc: '四类黑名单（节点 / 分组 / 摘要 / IP），操作自动拉黑；IP 拦截在 Worker 入口边缘层直接拒绝，重连风暴不唤醒 DO。',
      link: '黑名单行为 →', href: 'deploy.html#56-kv-审计记录-黑名单',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/></svg>'
    },
    {
      id: 'free-tier', cat: 'quota', title: '免费额度内稳定运行',
      desc: 'Hibernation + alarm 自适应排程，典型小网络日请求量约为限额的 5%，空房间低至 288 请求/天，空闲成本趋零。',
      link: '成本与额度 →', href: 'deploy.html#7-成本与额度',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14a8 8 0 1 1 16 0"/><path d="M12 14l4-4"/><circle cx="12" cy="14" r="1.6"/></svg>'
    },
    {
      id: 'observability', cat: 'ops', title: '观测升级（v1.6）',
      desc: '<code>/metrics?format=prometheus</code> 输出 25 个 <code>easytier_</code> 指标可接 Grafana；可选配置账号级真实额度（GraphQL，token 只在服务端）；绑定 Analytics Engine 后总览新增近 24h / 7 天趋势折线（纯 SVG，零图表库）。',
      link: '额度观测与趋势 →', href: 'deploy.html#581-额度观测与趋势v16可选',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20h18"/><path d="M4 16l4.5-4.5 3 3L16 9l4 4"/></svg>'
    },
    {
      id: 'abuse-defense', cat: 'quota', title: '资源滥用防线（v1.6）',
      desc: '路由洪泛 / 请求放大 / 出站与状态总量多维上限（全部 env 可调，0 = 关闭），均为处理途中同步检查——正常用户免费额度零开销；管理端新增防线计数与摘要抢占嫌疑记录（含来源 IP）。',
      link: '防线设计 →', href: 'technical.html#61-资源滥用防线v160',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M12 8v4"/><path d="M12 15h.01"/></svg>'
    }
  ];

  var graph = document.getElementById('feature-graph');
  var stage = document.getElementById('feature-stage');
  var layer = document.getElementById('feature-layer');
  var hub = document.getElementById('feature-hub');
  var links = document.getElementById('feature-links');
  if (!graph || !stage || !layer || !hub || !links) return;

  var SVGNS = 'http://www.w3.org/2000/svg';
  var bubbles = [];
  var active = null;
  var busy = false;
  var animToken = 0;
  var paused = false;
  var staticMode = false;
  var W = 0;
  var H = 0;
  var hubR = 110;
  var last = 0;
  var restoring = false;
  var hubHomeX = 0, hubHomeY = 0;
  var hubX = 0, hubY = 0;
  var hubVX = 0, hubVY = 0;
  var hubTargetX = 0, hubTargetY = 0;
  var hubMaxOffset = 46;
  var hubDragging = false;
  var mobileMQ = window.matchMedia('(max-width: 640px)');

  /* d3-force 风格参数：碰撞只修正速度，不做弹性反弹。
     link 弹簧 + charge 斥力 + center 向心 + collide 让位。 */
  var STEP = 1 / 60;
  var simAcc = 0;
  var alpha = 0.35;
  var alphaTarget = 0.015;
  var SIM = {
    alphaDecay: 0.0228,
    velocityDecay: 0.6,
    linkStrength: 0.025,
    linkPad: 30,
    chargeStrength: -180,
    chargeMin: 48,
    chargeMax: 560,
    collideStrength: 0.9,
    orbit: 0.03,
    wallPad: 8,
    maxSpeed: 8
  };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function radiusFor(title) {
    var n = title.replace(/\s/g, '').length;
    if (n <= 5) return 64;
    if (n <= 8) return 72;
    return 82;
  }

  function densityScale() {
    return clamp(14 / Math.max(11, bubbles.length), 0.82, 1);
  }

  function positionHub() {
    if (!hub) return;
    hub.style.setProperty('--hub-dx', (hubX - W / 2) + 'px');
    hub.style.setProperty('--hub-dy', (hubY - H / 2) + 'px');
  }

  function setHubHome() {
    hubHomeX = W / 2;
    hubHomeY = H / 2;
    hubX = hubHomeX;
    hubY = hubHomeY;
    hubTargetX = hubX;
    hubTargetY = hubY;
    hubVX = 0;
    hubVY = 0;
    hubDragging = false;
    if (hub) hub.classList.remove('is-dragging');
    hubMaxOffset = clamp(Math.min(W, H) * 0.07, 28, 52);
    positionHub();
  }

  function updateHub() {
    if (staticMode || !W || !H) return;
    if (hubDragging) {
      hubVX += (hubTargetX - hubX) * 0.12;
      hubVY += (hubTargetY - hubY) * 0.12;
      hubVX *= 0.78;
      hubVY *= 0.78;
    } else {
      hubVX *= 0.95;
      hubVY *= 0.95;
    }

    var dx = hubX - hubHomeX;
    var dy = hubY - hubHomeY;
    var d = Math.hypot(dx, dy) || 1;
    var soft = hubMaxOffset * 0.85;
    if (d > soft) {
      var over = d - soft;
      hubVX -= (dx / d) * over * 0.01;
      hubVY -= (dy / d) * over * 0.01;
    }

    hubX += hubVX;
    hubY += hubVY;

    dx = hubX - hubHomeX;
    dy = hubY - hubHomeY;
    d = Math.hypot(dx, dy) || 1;
    var hard = hubMaxOffset * 1.6;
    if (d > hard) {
      hubX = hubHomeX + (dx / d) * hard;
      hubY = hubHomeY + (dy / d) * hard;
      hubVX *= 0.35;
      hubVY *= 0.35;
    }
    positionHub();
  }

  function bindHub() {
    if (!hub) return;
    var drag = null;

    hub.addEventListener('pointerdown', function (e) {
      if (staticMode || active || busy || e.button !== 0) return;
      var rect = stage.getBoundingClientRect();
      drag = {
        id: e.pointerId,
        ox: hubX - (e.clientX - rect.left),
        oy: hubY - (e.clientY - rect.top)
      };
      hubDragging = true;
      hubTargetX = hubX;
      hubTargetY = hubY;
      hubVX = 0;
      hubVY = 0;
      hub.classList.add('is-dragging');
      wake(0.06);
      try { hub.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      e.preventDefault();
    });

    hub.addEventListener('pointermove', function (e) {
      if (!drag || drag.id !== e.pointerId) return;
      var rect = stage.getBoundingClientRect();
      var tx = e.clientX - rect.left + drag.ox;
      var ty = e.clientY - rect.top + drag.oy;
      var dx = tx - hubHomeX;
      var dy = ty - hubHomeY;
      var d = Math.hypot(dx, dy);
      if (d > hubMaxOffset) {
        var softDist = hubMaxOffset * Math.tanh(d / hubMaxOffset);
        tx = hubHomeX + (dx / d) * softDist;
        ty = hubHomeY + (dy / d) * softDist;
      }
      hubTargetX = tx;
      hubTargetY = ty;
      e.preventDefault();
    });

    function endDrag(e) {
      if (!drag || drag.id !== e.pointerId) return;
      drag = null;
      hubDragging = false;
      hub.classList.remove('is-dragging');
      wake(0.05);
    }
    hub.addEventListener('pointerup', endDrag);
    hub.addEventListener('pointercancel', endDrag);
  }

  /* ------------------------------------------------------------------
     建 DOM 与连线
     ------------------------------------------------------------------ */
  function build() {
    FEATURES.forEach(function (f) {
      var el = document.createElement('div');
      el.className = 'bubble';
      el.setAttribute('data-id', f.id);
      el.setAttribute('data-cat', f.cat);
      el.innerHTML =
        '<div class="bubble-scale">' +
          '<button class="bubble-toggle" type="button" aria-expanded="false" aria-controls="detail-' + f.id + '" aria-label="展开：' + esc(f.title) + '">' +
            '<span class="bubble-icon">' + f.icon + '</span>' +
            '<span class="bubble-title">' + esc(f.title) + '</span>' +
          '</button>' +
          '<div class="bubble-detail" id="detail-' + f.id + '" aria-hidden="true">' +
            '<div class="detail-inner">' +
              '<span class="bubble-icon">' + f.icon + '</span>' +
              '<h3 class="detail-title">' + esc(f.title) + '</h3>' +
              '<p class="detail-desc">' + f.desc + '</p>' +
              '<a class="detail-link" href="' + f.href + '" target="_blank" rel="noopener noreferrer">' + esc(f.link) + '</a>' +
            '</div>' +
          '</div>' +
          '<button class="bubble-close" type="button" aria-label="关闭详情">×</button>' +
        '</div>';
      layer.appendChild(el);

      var path = document.createElementNS(SVGNS, 'path');
      links.appendChild(path);

      var toggle = el.querySelector('.bubble-toggle');
      var detail = el.querySelector('.bubble-detail');
      var close = el.querySelector('.bubble-close');
      var b = {
        el: el, f: f, toggle: toggle, detail: detail, close: close, path: path,
        baseR: radiusFor(f.title), r: 64, x: 0, y: 0, vx: 0, vy: 0,
        expanded: false, dragging: false, suppressClick: false
      };
      bubbles.push(b);
      bindBubble(b);
    });
    var count = document.getElementById('feature-hub-count');
    if (count) count.textContent = FEATURES.length + ' 项能力';
  }

  /* ------------------------------------------------------------------
     初始布局：中心放射的椭圆环
     ------------------------------------------------------------------ */
  function resetPositions() {
    if (staticMode) return;
    setHubHome();
    var cx = hubX;
    var cy = hubY;
    var seed = 0x9e3779b9;
    function rnd() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    var baseX = Math.max(W * 0.34, hubR + 130);
    var baseY = Math.max(H * 0.36, hubR + 145);
    bubbles.forEach(function (b, i) {
      var angle = (i * Math.PI * 2) / bubbles.length + (rnd() - 0.5) * 0.12;
      var ring = 0.76 + (i % 2) * 0.24 + rnd() * 0.03;
      b.x = cx + Math.cos(angle) * baseX * ring;
      b.y = cy + Math.sin(angle) * baseY * ring;
      b.x = clamp(b.x, b.r + 8, W - b.r - 8);
      b.y = clamp(b.y, b.r + 8, H - b.r - 8);
      var dir = angle + Math.PI / 2;
      var speed = 0.25 + rnd() * 0.15;
      var radial = 14 + rnd() * 6;
      b.vx = Math.cos(dir) * speed + Math.cos(angle) * radial;
      b.vy = Math.sin(dir) * speed + Math.sin(angle) * radial;
      b.fixed = false;
      b.dragging = false;
    });
    alpha = 1;
    alphaTarget = 0.015;
    simAcc = 0;
    relax(110);
    renderAll();
  }

  function relax(iterations, fixed) {
    for (var k = 0; k < iterations; k++) {
      for (var i = 0; i < bubbles.length; i++) {
        for (var j = i + 1; j < bubbles.length; j++) {
          var a = bubbles[i];
          var b = bubbles[j];
          if (a === fixed && b === fixed) continue;
          var dx = b.x - a.x;
          var dy = b.y - a.y;
          var d = Math.hypot(dx, dy) || 0.001;
          var min = a.r + b.r + 8;
          if (d < min) {
            var nx = dx / d;
            var ny = dy / d;
            var push = min - d;
            var wa = 0.5;
            var wb = 0.5;
            if (a === fixed) { wa = 0; wb = 1; }
            else if (b === fixed) { wa = 1; wb = 0; }
            else {
              var ra2 = a.r * a.r;
              var rb2 = b.r * b.r;
              wa = rb2 / (ra2 + rb2);
              wb = 1 - wa;
            }
            a.x -= nx * push * wa;
            a.y -= ny * push * wa;
            b.x += nx * push * wb;
            b.y += ny * push * wb;
          }
        }
      }
      for (var m = 0; m < bubbles.length; m++) {
        var bub = bubbles[m];
        if (bub === fixed) continue;
        keepOutsideHub(bub);
        bub.x = clamp(bub.x, bub.r + SIM.wallPad, W - bub.r - SIM.wallPad);
        bub.y = clamp(bub.y, bub.r + SIM.wallPad, H - bub.r - SIM.wallPad);
      }
    }
  }

  /* ------------------------------------------------------------------
     d3-force 风格物理：link + charge + center + collide
     碰撞只给速度做修正，按 r² 分配，不施加弹性冲量。
     ------------------------------------------------------------------ */
  function keepOutsideHub(b) {
    var dx = b.x - hubX;
    var dy = b.y - hubY;
    var d = Math.hypot(dx, dy) || 1;
    var min = hubR + b.r + 4;
    if (d < min) {
      var nx = dx / d;
      var ny = dy / d;
      b.x = hubX + nx * min;
      b.y = hubY + ny * min;
      var vn = b.vx * nx + b.vy * ny;
      if (vn < 0) { b.vx -= vn * nx; b.vy -= vn * ny; }
    }
  }

  function wake(level) {
    if (level > alpha) alpha = level;
  }

  function tick() {
    updateHub();
    alpha += (alphaTarget - alpha) * SIM.alphaDecay;
    var cx = hubX;
    var cy = hubY;
    var i, j, a, b, dx, dy, d, d2, f;

    /* link：弱弹簧把节点拉回 hub 外圈；center：轻微向心 */
    for (i = 0; i < bubbles.length; i++) {
      b = bubbles[i];
      if (b.fixed || b.dragging) continue;
      dx = cx - b.x;
      dy = cy - b.y;
      d = Math.hypot(dx, dy) || 1;
      var target = hubR + b.r + SIM.linkPad;
      f = ((d - target) / d) * SIM.linkStrength * alpha;
      b.vx += dx * f;
      b.vy += dy * f;
      f = 0.0004 * alpha;
      b.vx += dx * f;
      b.vy += dy * f;
      b.vx += (-dy / d) * SIM.orbit;
      b.vy += (dx / d) * SIM.orbit;
    }

    /* charge：节点间弱斥力，避免扎堆 */
    for (i = 0; i < bubbles.length; i++) {
      a = bubbles[i];
      for (j = i + 1; j < bubbles.length; j++) {
        b = bubbles[j];
        dx = b.x - a.x;
        dy = b.y - a.y;
        d2 = dx * dx + dy * dy;
        if (d2 > SIM.chargeMax * SIM.chargeMax) continue;
        var dd = Math.max(d2, SIM.chargeMin * SIM.chargeMin);
        f = SIM.chargeStrength * alpha / dd;
        if (!a.fixed && !a.dragging) { a.vx += dx * f; a.vy += dy * f; }
        if (!b.fixed && !b.dragging) { b.vx -= dx * f; b.vy -= dy * f; }
      }
    }

    collide(busy ? 4 : 2);
    collideHub();

    /* velocityDecay + 积分；固定节点（拖动/展开中）不参与积分 */
    for (i = 0; i < bubbles.length; i++) {
      b = bubbles[i];
      if (b.fixed || b.dragging) { b.vx = 0; b.vy = 0; continue; }
      b.vx *= SIM.velocityDecay;
      b.vy *= SIM.velocityDecay;
      var sp = Math.hypot(b.vx, b.vy);
      if (sp > SIM.maxSpeed) {
        b.vx = (b.vx / sp) * SIM.maxSpeed;
        b.vy = (b.vy / sp) * SIM.maxSpeed;
      }
      b.x += b.vx;
      b.y += b.vy;
      keepOutsideHub(b);
      if (b.x < b.r + SIM.wallPad) {
        b.x = b.r + SIM.wallPad;
        if (b.vx < 0) b.vx = 0;
      } else if (b.x > W - b.r - SIM.wallPad) {
        b.x = W - b.r - SIM.wallPad;
        if (b.vx > 0) b.vx = 0;
      }
      if (b.y < b.r + SIM.wallPad) {
        b.y = b.r + SIM.wallPad;
        if (b.vy < 0) b.vy = 0;
      } else if (b.y > H - b.r - SIM.wallPad) {
        b.y = H - b.r - SIM.wallPad;
        if (b.vy > 0) b.vy = 0;
      }
    }
    resolveActiveOverlaps();
  }

  function collide(iterations) {
    for (var k = 0; k < iterations; k++) {
      for (var i = 0; i < bubbles.length; i++) {
        for (var j = i + 1; j < bubbles.length; j++) {
          var a = bubbles[i];
          var b = bubbles[j];
          if ((a.fixed || a.dragging) && (b.fixed || b.dragging)) continue;
          var ax = a.x + a.vx;
          var ay = a.y + a.vy;
          var bx = b.x + b.vx;
          var by = b.y + b.vy;
          var dx = bx - ax;
          var dy = by - ay;
          var d = Math.sqrt(dx * dx + dy * dy);
          var r = a.r + b.r + 2;
          if (d >= r) continue;
          var ux, uy;
          if (d < 0.001) {
            var ang = Math.random() * Math.PI * 2;
            ux = Math.cos(ang);
            uy = Math.sin(ang);
          } else {
            ux = dx / d;
            uy = dy / d;
          }
          var push = (r - Math.max(d, 0.001)) * SIM.collideStrength;
          var wa, wb;
          if (a.fixed || a.dragging) { wa = 0; wb = 1; }
          else if (b.fixed || b.dragging) { wa = 1; wb = 0; }
          else {
            var ra2 = a.r * a.r;
            var rb2 = b.r * b.r;
            wa = rb2 / (ra2 + rb2);
            wb = 1 - wa;
          }
          if (!a.fixed && !a.dragging) {
            a.vx -= ux * push * wa;
            a.vy -= uy * push * wa;
          }
          if (!b.fixed && !b.dragging) {
            b.vx += ux * push * wb;
            b.vy += uy * push * wb;
          }
        }
      }
    }
  }

  function collideHub() {
    var cx = hubX;
    var cy = hubY;
    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      if (b.fixed || b.dragging) continue;
      var dx = b.x + b.vx - cx;
      var dy = b.y + b.vy - cy;
      var d = Math.sqrt(dx * dx + dy * dy);
      var r = hubR + b.r + 4;
      if (d >= r) continue;
      var ux, uy;
      if (d < 0.001) {
        var ang = Math.random() * Math.PI * 2;
        ux = Math.cos(ang);
        uy = Math.sin(ang);
      } else {
        ux = dx / d;
        uy = dy / d;
      }
      var push = (r - Math.max(d, 0.001)) * SIM.collideStrength;
      b.vx += ux * push;
      b.vy += uy * push;
    }
  }

  function resolveDragCollisions(a) {
    for (var pass = 0; pass < 6; pass++) {
      var moved = false;
      for (var i = 0; i < bubbles.length; i++) {
        var b = bubbles[i];
        if (b === a) continue;
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var d = Math.hypot(dx, dy);
        var r = a.r + b.r + 2;
        if (d >= r) continue;
        var ux, uy;
        if (d < 0.001) {
          var ang = Math.random() * Math.PI * 2;
          ux = Math.cos(ang);
          uy = Math.sin(ang);
        } else {
          ux = dx / d;
          uy = dy / d;
        }
        b.x = a.x + ux * r;
        b.y = a.y + uy * r;
        var vn = b.vx * ux + b.vy * uy;
        if (vn < 0) { b.vx -= vn * ux; b.vy -= vn * uy; }
        var pushV = Math.min(SIM.maxSpeed, (r - d) * 0.18);
        b.vx += ux * pushV;
        b.vy += uy * pushV;
        keepOutsideHub(b);
        b.x = clamp(b.x, b.r + SIM.wallPad, W - b.r - SIM.wallPad);
        b.y = clamp(b.y, b.r + SIM.wallPad, H - b.r - SIM.wallPad);
        var ex = b.x - a.x;
        var ey = b.y - a.y;
        var ed = Math.hypot(ex, ey);
        if (ed < r) {
          var need = r - ed;
          var nx = ed < 0.001 ? ux : ex / ed;
          var ny = ed < 0.001 ? uy : ey / ed;
          a.x -= nx * need;
          a.y -= ny * need;
          keepOutsideHub(a);
          a.x = clamp(a.x, a.r + SIM.wallPad, W - a.r - SIM.wallPad);
          a.y = clamp(a.y, a.r + SIM.wallPad, H - a.r - SIM.wallPad);
        }
        moved = true;
      }
      if (!moved) break;
    }
  }

  function resolveActiveOverlaps() {
    if (!active || !active.fixed || staticMode) return;
    var a = active;
    for (var pass = 0; pass < 6; pass++) {
      var moved = false;
      for (var i = 0; i < bubbles.length; i++) {
        var b = bubbles[i];
        if (b === a) continue;
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var d = Math.hypot(dx, dy);
        var r = a.r + b.r + 2;
        if (d >= r) continue;
        var ux, uy;
        if (d < 0.001) {
          var ang = Math.random() * Math.PI * 2;
          ux = Math.cos(ang);
          uy = Math.sin(ang);
        } else {
          ux = dx / d;
          uy = dy / d;
        }
        b.x = a.x + ux * r;
        b.y = a.y + uy * r;
        var vn = b.vx * ux + b.vy * uy;
        if (vn < 0) { b.vx -= vn * ux; b.vy -= vn * uy; }
        var pushV = Math.min(SIM.maxSpeed, (r - d) * 0.18);
        b.vx += ux * pushV;
        b.vy += uy * pushV;
        keepOutsideHub(b);
        b.x = clamp(b.x, b.r + SIM.wallPad, W - b.r - SIM.wallPad);
        b.y = clamp(b.y, b.r + SIM.wallPad, H - b.r - SIM.wallPad);
        moved = true;
      }
      if (!moved) break;
    }
  }

  function renderBubble(b) {
    b.el.style.width = (b.r * 2) + 'px';
    b.el.style.height = (b.r * 2) + 'px';
    b.el.style.transform = 'translate3d(' + (b.x - b.r) + 'px,' + (b.y - b.r) + 'px,0)';
  }

  function updateLinks() {
    if (!W || !H) return;
    links.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var cx = hubX, cy = hubY;
    bubbles.forEach(function (b, i) {
      var dx = b.x - cx, dy = b.y - cy;
      var d = Math.hypot(dx, dy) || 1;
      var ux = dx / d, uy = dy / d;
      var sx = cx + ux * (hubR + 3);
      var sy = cy + uy * (hubR + 3);
      var ex = b.x - ux * (b.r + 3);
      var ey = b.y - uy * (b.r + 3);
      var mx = (sx + ex) / 2, my = (sy + ey) / 2;
      var bend = (i % 2 ? 1 : -1) * Math.min(46, d * 0.10);
      var qx = mx - uy * bend;
      var qy = my + ux * bend;
      b.path.setAttribute('d', 'M' + sx + ' ' + sy + ' Q' + qx + ' ' + qy + ' ' + ex + ' ' + ey);
    });
  }

  function renderAll() {
    bubbles.forEach(renderBubble);
    updateLinks();
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (!last) last = now;
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (paused || restoring) return;
    simAcc += dt;
    var steps = 0;
    while (simAcc >= STEP && steps < 3) {
      tick();
      simAcc -= STEP;
      steps++;
    }
    if (simAcc > STEP * 3) simAcc = 0;
    if (steps) renderAll();
  }

  /* ------------------------------------------------------------------
     拖动与点击
     ------------------------------------------------------------------ */
  function bindBubble(b) {
    var toggle = b.toggle;
    var drag = null;

    toggle.addEventListener('pointerenter', function () {
      if (!b.expanded) b.path.classList.add('is-hot');
    });
    toggle.addEventListener('pointerleave', function () {
      b.path.classList.remove('is-hot');
    });

    toggle.addEventListener('pointerdown', function (e) {
      if (b.expanded || busy || staticMode || e.button !== 0) return;
      b.suppressClick = false;
      var rect = stage.getBoundingClientRect();
      drag = {
        id: e.pointerId,
        sx: e.clientX, sy: e.clientY,
        ox: b.x - (e.clientX - rect.left),
        oy: b.y - (e.clientY - rect.top),
        moved: false,
        hist: [{ x: b.x, y: b.y, t: performance.now() }]
      };
      b.dragging = true;
      b.el.classList.add('is-dragging');
      b.vx = 0; b.vy = 0;
      wake(0.04);
      try { toggle.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });

    toggle.addEventListener('pointermove', function (e) {
      if (!drag || drag.id !== e.pointerId) return;
      var rect = stage.getBoundingClientRect();
      var nx = e.clientX - rect.left + drag.ox;
      var ny = e.clientY - rect.top + drag.oy;
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
      b.x = clamp(nx, b.r + SIM.wallPad, W - b.r - SIM.wallPad);
      b.y = clamp(ny, b.r + SIM.wallPad, H - b.r - SIM.wallPad);
      keepOutsideHub(b);
      var px = b.x;
      var py = b.y;
      resolveDragCollisions(b);
      drag.ox += b.x - px;
      drag.oy += b.y - py;
      drag.hist.push({ x: b.x, y: b.y, t: performance.now() });
      if (drag.hist.length > 6) drag.hist.shift();
      renderAll();
    });

    function endDrag(e) {
      if (!drag || drag.id !== e.pointerId) return;
      var hist = drag.hist;
      var first = hist[0];
      var lastPoint = hist[hist.length - 1];
      var elapsed = (lastPoint.t - first.t) / 1000;
      if (elapsed > 0.02) {
        var vx = (lastPoint.x - first.x) / elapsed / 60;
        var vy = (lastPoint.y - first.y) / elapsed / 60;
        var sp = Math.hypot(vx, vy);
        if (sp > SIM.maxSpeed) {
          vx = (vx / sp) * SIM.maxSpeed;
          vy = (vy / sp) * SIM.maxSpeed;
        }
        b.vx = vx; b.vy = vy;
        wake(0.12);
      }
      if (drag.moved) {
        b.suppressClick = true;
        setTimeout(function () { b.suppressClick = false; }, 80);
      }
      b.dragging = false;
      b.el.classList.remove('is-dragging');
      drag = null;
    }

    toggle.addEventListener('pointerup', endDrag);
    toggle.addEventListener('pointercancel', endDrag);
    toggle.addEventListener('click', function (e) {
      if (b.suppressClick) {
        b.suppressClick = false;
        e.preventDefault();
        return;
      }
      if (b.expanded || active || busy) return;
      expand(b);
    });

    b.close.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (b.expanded) closeActive();
    });
  }

  /* ------------------------------------------------------------------
     原位放大 / 收起
     ------------------------------------------------------------------ */
  function syncPause() {
    paused = !!staticMode || document.hidden;
    alphaTarget = active ? 0.006 : 0.015;
  }

  function animateBubble(b, tx, ty, tr, dur, grow, done) {
    var token = ++animToken;
    var x0 = b.x, y0 = b.y, r0 = b.r;
    b.fixed = true;
    b.vx = 0; b.vy = 0;
    wake(0.05);

    function finish() {
      b.fixed = !!grow;
      if (done) done();
    }

    if (dur <= 0) {
      b.x = tx; b.y = ty; b.r = tr;
      if (grow) relax(48, b);
      renderAll();
      finish();
      return;
    }

    var start = performance.now();
    function frame(now) {
      if (token !== animToken) return;
      var t = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - t, 3);
      b.x = x0 + (tx - x0) * e;
      b.y = y0 + (ty - y0) * e;
      b.r = r0 + (tr - r0) * e;
      b.x = clamp(b.x, b.r + SIM.wallPad, W - b.r - SIM.wallPad);
      b.y = clamp(b.y, b.r + SIM.wallPad, H - b.r - SIM.wallPad);
      renderAll();
      if (t < 1) requestAnimationFrame(frame);
      else finish();
    }
    requestAnimationFrame(frame);
  }

  function expand(b) {
    if (active || busy || b.expanded) return;
    active = b;
    busy = true;
    b.expanded = true;
    b.home = { x: b.x, y: b.y, r: b.r };
    b.preExpand = bubbles.map(function (o) { return { x: o.x, y: o.y }; });
    hubVX = 0; hubVY = 0;
    hubDragging = false;
    if (hub) hub.classList.remove('is-dragging');
    b.el.classList.add('is-active');
    b.toggle.setAttribute('aria-expanded', 'true');
    b.detail.setAttribute('aria-hidden', 'false');
    stage.classList.add('has-active');
    bubbles.forEach(function (o) {
      if (o !== b) {
        o.el.classList.add('is-dimmed');
        o.toggle.tabIndex = -1;
        o.el.setAttribute('aria-hidden', 'true');
      }
    });

    if (staticMode) {
      paused = true;
      busy = false;
      setTimeout(function () {
        var r = b.el.getBoundingClientRect();
        var top = window.scrollY + r.top - Math.max(16, (window.innerHeight - r.height) / 2);
        window.scrollTo(0, Math.max(0, top));
      }, 120);
      requestAnimationFrame(function () { b.close.focus({ preventScroll: true }); });
      return;
    }

    b.fixed = true;
    alphaTarget = 0.006;
    wake(0.05);
    var tr = Math.min(230, (Math.min(W, H) - 56) / 2);
    var tx = clamp(b.x, tr + 16, W - tr - 16);
    var ty = clamp(b.y, tr + 16, H - tr - 16);
    animateBubble(b, tx, ty, tr, 360, true, function () {
      busy = false;
      syncPause();
      b.close.focus({ preventScroll: true });
    });
  }

  function restoreLayout(b, immediate) {
    var snapshot = b.preExpand;
    if (!snapshot || snapshot.length !== bubbles.length) {
      snapshot = bubbles.map(function (o) { return { x: o.x, y: o.y }; });
    }
    var homeR = b.home ? b.home.r : b.baseR;
    var starts = bubbles.map(function (o) { return { x: o.x, y: o.y }; });
    var startR = b.r;
    var token = ++animToken;
    restoring = true;

    function finish() {
      restoring = false;
      b.fixed = false;
      b.expanded = false;
      busy = false;
      stage.classList.remove('has-active');
      b.toggle.focus({ preventScroll: true });
      syncPause();
      wake(0.08);
    }

    if (immediate) {
      bubbles.forEach(function (o, i) {
        o.x = snapshot[i].x;
        o.y = snapshot[i].y;
        o.vx = 0;
        o.vy = 0;
      });
      b.r = homeR;
      renderAll();
      finish();
      return;
    }

    var start = performance.now();
    function frame(now) {
      if (token !== animToken) return;
      var t = Math.min(1, (now - start) / 320);
      var e = 1 - Math.pow(1 - t, 3);
      bubbles.forEach(function (o, i) {
        o.x = starts[i].x + (snapshot[i].x - starts[i].x) * e;
        o.y = starts[i].y + (snapshot[i].y - starts[i].y) * e;
        o.vx = 0;
        o.vy = 0;
      });
      b.r = startR + (homeR - startR) * e;
      renderAll();
      if (t < 1) requestAnimationFrame(frame);
      else finish();
    }
    requestAnimationFrame(frame);
  }

  function closeActive(immediate) {
    if (!active) return;
    var b = active;
    active = null;
    animToken++;
    b.el.classList.remove('is-active');
    b.toggle.setAttribute('aria-expanded', 'false');
    b.detail.setAttribute('aria-hidden', 'true');
    b.close.blur();
    b.path.classList.remove('is-hot');
    bubbles.forEach(function (o) {
      o.el.classList.remove('is-dimmed');
      o.toggle.tabIndex = 0;
      o.el.removeAttribute('aria-hidden');
    });

    if (staticMode) {
      b.expanded = false;
      b.fixed = false;
      busy = false;
      stage.classList.remove('has-active');
      b.toggle.focus({ preventScroll: true });
      syncPause();
      return;
    }

    busy = true;
    alphaTarget = 0.015;
    wake(0.08);
    restoreLayout(b, immediate);
  }

  /* ------------------------------------------------------------------
     尺寸 / 状态
     ------------------------------------------------------------------ */
  function layout() {
    var wasStatic = staticMode;
    if (restoring) {
      bubbles.forEach(function (o) {
        o.expanded = false;
        o.fixed = false;
        o.dragging = false;
        o.el.classList.remove('is-active', 'is-dragging');
      });
      restoring = false;
    }
    if (!active) {
      animToken++;
      stage.classList.remove('has-active');
    }
    staticMode = mobileMQ.matches;
    graph.classList.toggle('is-mobile', staticMode);
    stage.classList.toggle('is-static', staticMode);
    if (staticMode !== wasStatic && active) closeActive(true);

    if (staticMode) {
      paused = true;
      bubbles.forEach(function (b) {
        b.r = Math.round(b.baseR * 0.8);
        b.el.style.width = (b.r * 2) + 'px';
        b.el.style.height = (b.r * 2) + 'px';
      });
      syncPause();
      return;
    }

    stage.classList.remove('is-static');
    W = stage.clientWidth;
    H = stage.clientHeight;
    hubR = Math.max(hub.offsetWidth, hub.offsetHeight) / 2 || 110;
    var scale = clamp(W / 1100, 0.8, 1) * densityScale();
    bubbles.forEach(function (b) {
      b.r = Math.round(b.baseR * scale);
      b.el.style.width = (b.r * 2) + 'px';
      b.el.style.height = (b.r * 2) + 'px';
    });
    resetPositions();
    syncPause();
  }

  var resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (active) closeActive(true);
      layout();
    }, 120);
  }

  /* ------------------------------------------------------------------
     启动
     ------------------------------------------------------------------ */
  build();
  bindHub();
  staticMode = mobileMQ.matches;
  graph.classList.toggle('is-mobile', staticMode);
  stage.classList.toggle('is-static', staticMode);
  if (!staticMode) {
    W = stage.clientWidth;
    H = stage.clientHeight;
    hubR = Math.max(hub.offsetWidth, hub.offsetHeight) / 2 || 110;
    var scale = clamp(W / 1100, 0.8, 1) * densityScale();
    bubbles.forEach(function (b) {
      b.r = Math.round(b.baseR * scale);
      b.el.style.width = (b.r * 2) + 'px';
      b.el.style.height = (b.r * 2) + 'px';
    });
    resetPositions();
  } else {
    bubbles.forEach(function (b) {
      b.r = Math.round(b.baseR * 0.8);
      b.el.style.width = (b.r * 2) + 'px';
      b.el.style.height = (b.r * 2) + 'px';
    });
  }
  syncPause();
  requestAnimationFrame(loop);

  window.addEventListener('resize', onResize);
  mobileMQ.addEventListener ? mobileMQ.addEventListener('change', onResize) : mobileMQ.addListener(onResize);
  
  stage.addEventListener('click', function (e) {
    if (active && !e.target.closest('.bubble')) closeActive();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && active) {
      e.preventDefault();
      closeActive();
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      paused = true;
    } else {
      last = 0;
      simAcc = 0;
      syncPause();
    }
  });
})();

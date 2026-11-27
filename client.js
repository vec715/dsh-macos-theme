/**
 * macOS style for DSH.
 *
 * Restyles the whole app to follow macOS (AppKit) design: system grays and
 * label colors, the user's accent color on primary actions, links, focus
 * rings, selection and menu highlights, macOS corner radii, overlay-style
 * scrollbars, and neutral sidebars. Everything goes through the theme
 * service's token override layer (light and dark pairs), plus a few rules
 * that address elements by ARIA role only. No hashed host class is touched.
 *
 * Settings > General gets a "macOS style" switch and an accent color picker.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-macos-theme',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useSyncExternalStore } = React

    const NS = 'macos-theme'
    const SOURCE = '@local/dsh-macos-theme'
    const STORAGE_KEY = 'dsh-macos-theme:v1'

    /** macOS accent colors (System Settings > Appearance), light and dark variants. */
    const ACCENTS = {
      blue: { light: '#007AFF', dark: '#0A84FF', on: '#FFFFFF' },
      purple: { light: '#953D96', dark: '#A550A7', on: '#FFFFFF' },
      pink: { light: '#E6418F', dark: '#F74F9E', on: '#FFFFFF' },
      red: { light: '#E0383E', dark: '#FF5257', on: '#FFFFFF' },
      orange: { light: '#E0700B', dark: '#F7821B', on: '#FFFFFF' },
      yellow: { light: '#FCB827', dark: '#FFC600', on: '#1D1D1F' },
      green: { light: '#4E9F35', dark: '#62BA46', on: '#FFFFFF' },
      graphite: { light: '#737373', dark: '#8C8C8C', on: '#FFFFFF' },
    }
    const ACCENT_IDS = Object.keys(ACCENTS)

    const DICTS = {
      en: {
        title: 'macOS style',
        description: 'Native macOS look: system colors, accent color, macOS corners, menus, and scrollbars.',
        'bubbles.title': 'Message bubbles',
        'bubbles.description': 'Show assistant answers in gray bubbles, like Messages. Tool calls and reasoning stay outside.',
        'capsule.title': 'Single-line composer',
        'capsule.description': 'One capsule like Messages: add button, text, and send on one line. Falls back to two rows in narrow panes.',
        'accent.title': 'Accent color',
        'accent.description': 'Used for buttons, links, selection, focus rings, and menu highlights.',
        'accent.blue': 'Blue', 'accent.purple': 'Purple', 'accent.pink': 'Pink', 'accent.red': 'Red',
        'accent.orange': 'Orange', 'accent.yellow': 'Yellow', 'accent.green': 'Green', 'accent.graphite': 'Graphite',
      },
      ru: {
        title: 'Стиль macOS',
        description: 'Нативный вид macOS: системные цвета, акцентный цвет, скругления, меню и полосы прокрутки как в macOS.',
        'bubbles.title': 'Пузыри сообщений',
        'bubbles.description': 'Ответы ассистента в серых пузырях, как в Сообщениях. Вызовы инструментов и рассуждения остаются снаружи.',
        'capsule.title': 'Однострочное поле ввода',
        'capsule.description': 'Одна капсула, как в Сообщениях: кнопка добавления, текст и отправка в одной строке. В узких панелях остаются две строки.',
        'accent.title': 'Акцентный цвет',
        'accent.description': 'Для кнопок, ссылок, выделения, рамки фокуса и подсветки в меню.',
        'accent.blue': 'Синий', 'accent.purple': 'Фиолетовый', 'accent.pink': 'Розовый', 'accent.red': 'Красный',
        'accent.orange': 'Оранжевый', 'accent.yellow': 'Жёлтый', 'accent.green': 'Зелёный', 'accent.graphite': 'Графит',
      },
      zh: {
        title: 'macOS 风格',
        description: '原生 macOS 外观：系统颜色、强调色，以及 macOS 圆角、菜单和滚动条。',
        'bubbles.title': '消息气泡',
        'bubbles.description': '像“信息”应用一样，用灰色气泡显示助手回复。工具调用和推理过程不放入气泡。',
        'capsule.title': '单行输入框',
        'capsule.description': '像“信息”一样的胶囊输入框：添加按钮、文本和发送在同一行。窄窗格中恢复两行。',
        'accent.title': '强调色',
        'accent.description': '用于按钮、链接、选中、焦点环和菜单高亮。',
        'accent.blue': '蓝色', 'accent.purple': '紫色', 'accent.pink': '粉色', 'accent.red': '红色',
        'accent.orange': '橙色', 'accent.yellow': '黄色', 'accent.green': '绿色', 'accent.graphite': '石墨色',
      },
    }

    function load() {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
        if (parsed && typeof parsed.enabled === 'boolean' && ACCENT_IDS.includes(parsed.accent)) {
          return { enabled: parsed.enabled, accent: parsed.accent, bubbles: parsed.bubbles !== false, capsule: parsed.capsule !== false }
        }
      } catch (_error) { /* fall through */ }
      return { enabled: true, accent: 'blue', bubbles: true, capsule: true }
    }

    function createStore(initial) {
      let value = initial
      const listeners = new Set()
      return {
        getSnapshot: () => value,
        subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener) } },
        set(next) {
          if (next === value) return
          value = next
          for (const listener of [...listeners]) listener()
        },
      }
    }

    const pair = (light, dark = light) => ({ light, dark })
    const mix = (color, pct, other = 'transparent') => `color-mix(in srgb, ${color} ${pct}%, ${other})`

    /** AppKit-like semantic palette mapped onto DSH alias tokens. */
    function macTokens(accentId) {
      const a = ACCENTS[accentId] || ACCENTS.blue
      const A = pair(a.light, a.dark)
      const tint = (pctLight, pctDark, baseLight, baseDark) =>
        pair(mix(a.light, pctLight, baseLight), mix(a.dark, pctDark, baseDark))
      return {
        // Surfaces: content is textBackground, chrome is windowBackground.
        '--dsw-alias-bg-base': pair('#FFFFFF', '#1E1E1E'),
        '--dsw-alias-bg-layer-1': pair('#FFFFFF', '#262626'),
        '--dsw-alias-bg-layer-2': pair('#FFFFFF', '#2C2C2C'),
        '--dsw-alias-bg-layer-3': pair('#FFFFFF', '#323232'),
        '--dsw-alias-bg-overlay': pair('#ECECEC', '#3A3A3A'),
        '--dsw-alias-bg-module-platform': pair('#EDEDED', '#323232'),
        '--dsw-alias-bg-multi-select': pair('#EDEDED', '#323232'),
        '--dsw-alias-bg-skeleton': pair('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.07)'),
        '--dsw-alias-bg-document-selection': tint(30, 40, 'transparent', 'transparent'),
        '--dsw-alias-bg-mask-drop': pair('rgba(255, 255, 255, 0.72)', 'rgba(30, 30, 30, 0.72)'),

        // Separators.
        '--dsw-alias-border-l1': pair('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)'),
        '--dsw-alias-border-l2': pair('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)'),
        '--dsw-alias-border-l2-darkmode-thin': pair('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.08)'),
        '--dsw-alias-border-l3': pair('rgba(0, 0, 0, 0.12)', 'rgba(255, 255, 255, 0.13)'),
        '--dsw-alias-border-l4': pair('rgba(0, 0, 0, 0.16)', 'rgba(255, 255, 255, 0.18)'),
        '--dsw-alias-border-selected': A,

        // Labels (Apple system grays).
        '--dsw-alias-label-primary': pair('#1D1D1F', '#F5F5F7'),
        '--dsw-alias-label-primary-dimmed': pair('#3A3A3C', '#E5E5EA'),
        '--dsw-alias-label-primary-bluish': pair('#1D1D1F', '#F5F5F7'),
        '--dsw-alias-label-secondary': pair('#6E6E73', '#A1A1A6'),
        '--dsw-alias-label-tertiary': pair('#737378', '#98989D'),
        '--dsw-alias-label-caption': pair('#8E8E93', '#7C7C80'),
        '--dsw-alias-label-dimmed': pair('#C7C7CC', '#48484A'),
        '--dsw-alias-label-primary-foreground': pair(a.on, a.on),
        '--dsw-alias-label-on-color': pair('#FFFFFF', '#FFFFFF'),
        '--dsw-alias-menu-icon': pair('#3A3A3C', '#E5E5EA'),
        '--dsw-alias-brand-text': pair('#1D1D1F', '#F5F5F7'),
        '--dsw-alias-label-deep-diving': pair('#6E6E73', '#A1A1A6'),
        '--dsw-alias-label-deep-diving-shimmer': pair('#C7C7CC', '#E5E5EA'),

        // Accent: primary actions, links, focus, selection.
        '--dsw-alias-brand-primary': A,
        '--dsw-alias-brand-primary-new-colorprimary-new-color': A,
        '--dsw-alias-button-primary-fill': A,
        '--dsw-alias-button-primary-hover': pair(mix(a.light, 86, '#000'), mix(a.dark, 86, '#FFF')),
        '--dsw-alias-button-primary-dimmed': pair('#E5E5EA', '#3A3A3C'),
        '--dsw-alias-button-contrast-fill': pair('#3A3A3C', '#636366'),
        '--dsw-alias-button-info-fill': A,
        '--dsw-alias-button-info-hover': pair(mix(a.light, 86, '#000'), mix(a.dark, 86, '#FFF')),
        '--dsw-alias-link': pair('#0068DA', '#419CFF'),
        '--dsw-alias-state-business-primary': A,
        '--dsw-alias-state-business-tertiary': tint(14, 24, 'transparent', 'transparent'),
        '--dsw-alias-toast-action': pair(a.dark, a.dark),
        '--dsw-specific-sidebar-right-flash': A,
        '--dsw-specific-sidebar-nav-item-active-accent': tint(16, 26, 'transparent', 'transparent'),
        '--dsw-alias-switch-thumb': pair('#FFFFFF', '#FFFFFF'),
        '--dsw-focus-ring-color': tint(50, 60, 'transparent', 'transparent'),
        '--dsw-focus-ring-width': pair('3px'),

        // Controls and hover feedback.
        '--dsw-alias-interactive-bg-hover': pair('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.07)'),
        '--dsw-alias-interactive-bg-active': pair('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.12)'),
        '--dsw-alias-interactive-bg-hover-solid': pair('#F2F2F2', '#2C2C2C'),
        '--dsw-alias-interactive-bg-hover-accent': pair('rgba(0, 0, 0, 0.08)', 'rgba(255, 255, 255, 0.14)'),
        '--dsw-alias-button-ghost-active-fill': pair('#E8E8E8', '#3A3A3A'),
        '--dsw-alias-button-ghost-active-hover': pair('#E0E0E0', '#444444'),
        '--dsw-alias-button-ghost-active-border': pair('rgba(0, 0, 0, 0.16)', 'rgba(255, 255, 255, 0.2)'),
        '--dsw-alias-button-elevated-fill': pair('#FFFFFF', '#3A3A3A'),
        '--dsw-alias-button-floating-fill': pair('#FFFFFF', '#2C2C2C'),
        '--dsw-alias-button-floating-hover': pair('#F2F2F2', '#363636'),
        '--dsw-alias-card-fill': pair('#F5F5F7', '#262626'),
        '--dsw-alias-card-fill-hover': pair('#EDEDF0', '#2E2E2E'),
        '--dsw-specific-selector': pair('#EDEDED', '#323232'),
        '--dsw-specific-tip': pair('#F2F2F2', '#2C2C2C'),
        '--dsw-specific-input-major': pair('#FFFFFF', '#262626'),
        '--dsw-alias-settings-card-fill': pair('rgba(0, 0, 0, 0.025)', 'rgba(255, 255, 255, 0.04)'),
        '--dsw-alias-settings-card-stroke': pair('rgba(0, 0, 0, 0.06)', 'rgba(255, 255, 255, 0.08)'),

        // Status colors (systemRed/Green/Orange/Purple).
        '--dsw-alias-state-error-primary': pair('#D70015', '#FF453A'),
        '--dsw-alias-state-error-secondary': pair('#FF6961', '#FF6961'),
        '--dsw-alias-state-success-primary': pair('#248A3D', '#32D74B'),
        '--dsw-alias-state-success-secondary': pair('#5FD97A', '#5FD97A'),
        '--dsw-alias-state-warn-primary': pair('#C93400', '#FF9F0A'),
        '--dsw-alias-state-warn-secondary': pair('#FFB340', '#FFB340'),
        '--dsw-alias-state-done-primary': pair('#8944AB', '#BF5AF2'),
        '--dsw-alias-state-idle-primary': pair('#C7C7CC', '#48484A'),

        // Chat surfaces.
        '--dsw-specific-bubble': tint(11, 10, '#FFFFFF', '#2C2C2E'),
        '--dsw-specific-bubble-highlight': tint(24, 22, '#FFFFFF', '#2C2C2E'),

        // Tooltips: light gray in light mode, like AppKit.
        '--dsw-alias-tooltip-bg': pair('#F2F2F2', '#2C2C2C'),
        '--dsw-alias-tooltip-label': pair('#1D1D1F', '#F5F5F7'),
        '--dsw-alias-markdown-code-block': pair('#F5F5F7', '#262626'),
        '--dsw-alias-markdown-code-block-banner': pair('#EDEDF0', '#2E2E2E'),
        '--dsw-alias-markdown-inline-code': pair('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.09)'),
        '--dsw-alias-markdown-citation': pair('#EDEDF0', '#3A3A3A'),
        '--dsw-alias-markdown-tag': pair('#EDEDF0', '#323232'),
        '--dsw-alias-markdown-code-segment-unselected': pair('#EDEDF0', '#262626'),
        '--dsw-alias-markdown-code-segment-selected': pair('#FFFFFF', '#3A3A3A'),
        '--dsw-alias-turn-trigger-bg': pair('#F5F5F7', 'rgba(255, 255, 255, 0.07)'),

        // Sidebar: neutral source-list look, no blue/violet wash.
        '--dsw-specific-sidebar-fill': pair('#F0F0F2', '#262628'),
        '--dsw-specific-sidebar-nav-item-active': pair('rgba(0, 0, 0, 0.09)', 'rgba(255, 255, 255, 0.1)'),
        '--dsw-specific-sidebar-wash-top': pair('rgba(0, 0, 0, 0)'),
        '--dsw-specific-sidebar-wash-top-clear': pair('rgba(0, 0, 0, 0)'),
        '--dsw-specific-sidebar-wash-bottom': pair('rgba(0, 0, 0, 0)'),
        '--dsw-specific-sidebar-wash-bottom-clear': pair('rgba(0, 0, 0, 0)'),

        // Menus: vibrant macOS menu material.
        '--dsw-menu-surface-fill': pair('rgba(246, 246, 246, 0.86)', 'rgba(40, 40, 40, 0.86)'),
        '--dsw-specific-menu': pair('rgba(246, 246, 246, 0.86)', 'rgba(40, 40, 40, 0.86)'),
        '--dsw-alias-menu-group-header-fill': pair('rgba(246, 246, 246, 0.94)', 'rgba(40, 40, 40, 0.94)'),

        // Overlay scrollbars.
        '--dsw-alias-scrollbar-bg-l1': pair('rgba(0, 0, 0, 0.26)', 'rgba(255, 255, 255, 0.26)'),
        '--dsw-alias-scrollbar-bg-l2': pair('rgba(0, 0, 0, 0.26)', 'rgba(255, 255, 255, 0.26)'),
        '--dsw-alias-scrollbar-hover-l1': pair('rgba(0, 0, 0, 0.45)', 'rgba(255, 255, 255, 0.45)'),
        '--dsw-alias-scrollbar-hover-l2': pair('rgba(0, 0, 0, 0.45)', 'rgba(255, 255, 255, 0.45)'),

        // Geometry and type: macOS radii, SF Pro everywhere (no Montserrat).
        '--dsw-corner-shape': pair('round'),
        '--dsw-radius-xs': pair('4px'),
        '--dsw-radius-sm': pair('6px'),
        '--dsw-radius-md': pair('8px'),
        '--dsw-radius-lg': pair('10px'),
        '--dsw-radius-xl': pair('12px'),
        '--dsw-radius-panel': pair('12px'),
        '--dsw-font-family-brand': pair('-apple-system, BlinkMacSystemFont, "SF Pro Display", var(--dsh-font-family-text-default)'),
      }
    }

    /** Role-addressed rules that tokens cannot express. */
    function macCss(accentId, bubbles, capsule) {
      const a = ACCENTS[accentId] || ACCENTS.blue
      const item = r => ['menuitem', 'menuitemradio', 'menuitemcheckbox']
        .map(role => `[role="menu"] [role="${role}"]:not([aria-disabled="true"]):not(:disabled)${r}`).join(',')
      const hot = ':is(:hover,:focus-visible,[data-highlighted])'
      return `
body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;--dshmac-accent:${a.light};--dshmac-selected:${a.light};--dshmac-on-accent:${a.on};--dshmac-caret:${accentId === 'yellow' ? 'var(--dsw-alias-label-primary)' : a.light}}
body[data-ds-dark-theme]{--dshmac-accent:${a.dark};--dshmac-selected:color-mix(in srgb,${a.dark} 85%,#000);--dshmac-caret:${accentId === 'yellow' ? 'var(--dsw-alias-label-primary)' : a.dark}}
::selection{background:color-mix(in srgb,var(--dshmac-accent) 30%,transparent)}
body[data-ds-dark-theme] ::selection{background:color-mix(in srgb,var(--dshmac-accent) 45%,transparent)}
[role="menu"]{-webkit-backdrop-filter:blur(30px) saturate(1.6);backdrop-filter:blur(30px) saturate(1.6)}
${item(hot)}{background:var(--dshmac-selected)!important;color:var(--dshmac-on-accent)!important;outline:none}
${item(hot + ' :not(kbd)')}{color:var(--dshmac-on-accent)!important}
input[type="checkbox"],input[type="radio"],input[type="range"],progress{accent-color:var(--dshmac-accent)}
textarea,input,[contenteditable="true"]{caret-color:var(--dshmac-caret)}
${controlsCss()}
${bubbles ? bubbleCss() : ''}
${capsule ? capsuleCss() : ''}
`
    }

    /**
     * Control-level macOS look. Host classes are CSS-module names such as
     * `kiGsTW_tab`; `cls()` matches the stable local part and every rule is
     * scoped under a host data attribute, so an unknown name simply stops matching.
     */
    // Two host formats: package bundles use `hash_name`, the web shell uses `_name_hash_line`.
    /** Assistant answer bubbles: text blocks of assistant steps, never reasoning or nested Markdown. */
    function bubbleCss() {
      const MD = `[data-chat-flow-kind="assistant-step"]:not([data-chat-group-part="reasoning"]) ${cls('markdown')}:not(:is([data-turn-process-inline],[data-chat-group-part="reasoning"],${cls('markdown')}) *)`
      return `
body{--dshmac-bubble:#E9E9EB;--dshmac-bubble-inset:#FFFFFF}
body[data-ds-dark-theme]{--dshmac-bubble:#2C2C2E;--dshmac-bubble-inset:#1E1E1E}
${MD}{box-sizing:border-box;width:fit-content;max-width:100%;padding:10px 14px;border-radius:calc((1lh + 20px) / 2);background:var(--dshmac-bubble);--dsw-alias-markdown-code-block:var(--dshmac-bubble-inset);--dsw-alias-markdown-code-block-banner:var(--dshmac-bubble-inset);--dsw-alias-markdown-inline-code:rgba(127,127,127,.16)}
${MD} > :first-child{margin-top:0}
${MD} > :last-child{margin-bottom:0}
${MD} .md-table-wide{width:100%;margin-left:0;padding-left:0}
${MD}{position:relative;overflow:visible}
${MD}::before,${MD}::after{content:"";position:absolute;bottom:0;height:20px;pointer-events:none;corner-shape:round}
${MD}::before{left:-7px;width:20px;background:var(--dshmac-bubble);border-bottom-right-radius:16px 14px}
${MD}::after{left:-26px;width:26px;background:var(--dsw-alias-bg-base);border-bottom-right-radius:10px}
`
    }

    /** Ring of 8 dots (leading dot largest), used as an alpha mask and rotated. */
    const SPINNER_MASK = (() => {
      const dots = []
      for (let k = 0; k < 8; k++) {
        const angle = (-90 - k * 45) * Math.PI / 180
        const x = (8 + 5.4 * Math.cos(angle)).toFixed(2)
        const y = (8 + 5.4 * Math.sin(angle)).toFixed(2)
        const r = (1.9 - k * 0.16).toFixed(2)
        const o = (1 - k * 0.1).toFixed(2)
        dots.push(`<circle cx="${x}" cy="${y}" r="${r}" fill-opacity="${o}"/>`)
      }
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#000">${dots.join('')}</svg>`
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
    })()

    /**
     * Messages / Grok composer: one capsule row. The card's own control row
     * dissolves (display: contents) so tools, text, and trailing controls share
     * one wrapping flex line; attachments and accessories take a full line above.
     */
    function capsuleCss() {
      const ROOT = `[data-composer-seat] :has(> [data-composer-card]):not(${cls('hero')})`
      const CARD = `${ROOT} > [data-composer-card]`
      return `
${ROOT}{container:dshmac-composer / inline-size}
@container dshmac-composer (min-width: 560px){
  ${CARD}{flex-flow:row wrap;align-items:flex-end;gap:6px;padding:6px;border-radius:22px}
  ${CARD} > :not(${cls('row')}):not([data-composer-overlay]):not(:has([data-composer-editor],[contenteditable])){flex:1 0 100%;order:-1}
  ${CARD} > [data-slot] > *{flex:1 0 100%;order:-1}
  ${CARD} > :has([contenteditable]){flex:1 1 0;min-width:120px;order:1;margin-right:0}
  ${CARD} > ${cls('row')}{display:contents}
  ${CARD} ${cls('tools')}{order:0;min-height:32px;gap:6px}
  ${CARD} ${cls('modes')}{gap:6px}
  ${CARD} ${cls('trailing')}{order:2;min-height:32px;margin-left:0;gap:6px}
  ${CARD} ${cls('trailingActive')}{flex:1 0 100%}
  ${CARD} ${cls('add')},${CARD} ${cls('primary')}{width:32px;height:32px;transform:none}
  ${CARD} [contenteditable]{min-height:32px;padding:4px 6px 4px 8px}
  ${CARD} ${cls('placeholder')}{inset:4px 8px auto 8px}
}
`
    }

    const cls = name => `:is([class$="_${name}"],[class*="_${name} "],[class^="_${name}_"],[class*=" _${name}_"])`
    function controlsCss() {
      const SB = '[data-slot="sidebar"]'
      const TABS = '[data-conversation-tabs]'
      const HEAD = 'header[data-window-drag]'
      const SET = `${cls('panel')}:has(${cls('navList')})`
      return `
body{--dshmac-sel:rgba(0,0,0,.1);--dshmac-seg-bg:rgba(0,0,0,.06);--dshmac-seg-on:#fff;--dshmac-seg-shadow:0 0 0 .5px rgba(0,0,0,.08),0 1px 2px rgba(0,0,0,.16);--dshmac-push-bg:#fff;--dshmac-push-shadow:0 0 0 .5px rgba(0,0,0,.14),0 .5px 1.5px rgba(0,0,0,.12)}
body[data-ds-dark-theme]{--dshmac-sel:rgba(255,255,255,.12);--dshmac-seg-bg:rgba(255,255,255,.07);--dshmac-seg-on:rgba(255,255,255,.2);--dshmac-seg-shadow:0 .5px 1px rgba(0,0,0,.4);--dshmac-push-bg:rgba(255,255,255,.12);--dshmac-push-shadow:inset 0 .5px 0 rgba(255,255,255,.12),0 0 0 .5px rgba(0,0,0,.4),0 .5px 1.5px rgba(0,0,0,.3)}

/* Sidebar corners: hosts paint rows inside a 3px transparent inline border,
   which turns the inner corners elliptical, and DSH's superellipse corner
   shape makes them blobby. Use a margin instead and plain round corners. */
${SB}{--dsw-corner-shape:round}
${SB} :is(${cls('sessionRow')},${cls('projectRow')},${cls('panelRow')},${cls('panelEntry')},${cls('trigger')}){border-inline-width:0!important;margin-inline:var(--dsh-sidebar-paint-inset,3px);border-radius:7px!important;corner-shape:round}
${SB} ${cls('panelEntry')} ${cls('panelRow')}{margin-inline:0}

/* Sidebar: source list. 13px rows, 28px tall, 6px selection, accent glyphs. */
${SB} ${cls('panelRow')}{font-size:13px;line-height:16px;min-height:28px;padding-block:4px;border-radius:6px}
${SB} ${cls('panelEntry')}{border-radius:6px}
${SB} ${cls('panelList')}{gap:1px}
${SB} ${cls('panelGlyph')}{color:var(--dshmac-accent)}
${SB} ${cls('panelEntryActive')}{background-color:var(--dshmac-sel)}
${SB} ${cls('panelEntryActive')} ${cls('panelRow')}{font-weight:600}
${SB} ${cls('sessionRow')},${SB} ${cls('projectRow')}{height:28px;border-radius:6px}
${SB} ${cls('sessionRow')}${cls('selected')}{background-color:var(--dshmac-sel)!important;color:var(--dsw-alias-label-primary)}
${SB} ${cls('sessionRow')}${cls('selected')} ${cls('title')}{font-weight:600}
${SB} ${cls('sectionLabel')},${SB} ${cls('sectionHeader')}{font-size:11px;font-weight:600;color:var(--dsw-alias-label-tertiary)}
${SB} ${cls('sessionRow')} ${cls('title')},${SB} ${cls('projectRow')} ${cls('title')}{font-size:13px;line-height:16px}
${SB} ${cls('timestamp')},${SB} ${cls('time')}{font-size:11px;color:var(--dsw-alias-label-tertiary)}
${SB} ${cls('folder')}{color:var(--dshmac-accent)}

/* "New session": macOS push button. */
${SB} ${cls('newSession')}{height:30px;border:none;border-radius:999px;corner-shape:round;background:var(--dshmac-push-bg)!important;box-shadow:var(--dshmac-push-shadow);font-size:13px;font-weight:400}
${SB} ${cls('collapsed')} ${cls('newSession')}{box-shadow:none;background:transparent!important}
@media (hover:hover){${SB} ${cls('newSession')}:hover{filter:brightness(.97)}}
${SB} ${cls('newSession')}:active{filter:brightness(.92)}

/* Conversation header: bold 13px window title. */
${HEAD} ${cls('crumb')}{font-size:13px;line-height:18px;padding:3px 6px;border-radius:6px}
${HEAD} ${cls('crumbCurrent')}{font-weight:600}
${HEAD} ${cls('crumbSep')}{font-size:13px}
${HEAD}:has(${TABS}){min-height:0;padding-bottom:8px}
${HEAD}{border-bottom-color:transparent}

/* View tabs: segmented control instead of underlined tabs. */
${HEAD} ${cls('tabs')}{margin-top:6px;padding-left:0;align-items:center}
${TABS}{display:inline-flex;flex-wrap:nowrap;gap:0;min-height:0;padding:2px;border-radius:999px;corner-shape:round;background:var(--dshmac-seg-bg)}
${TABS} [role="tab"]{margin:0;min-height:0;height:24px;padding:0 14px;border-radius:999px;corner-shape:round;font-size:12px;line-height:22px;color:var(--dsw-alias-label-primary);transition:background-color .12s ease}
${TABS} [role="tab"]::after{display:none}
${TABS} [role="tab"][aria-selected="true"]{background:var(--dshmac-seg-on);box-shadow:var(--dshmac-seg-shadow);color:var(--dsw-alias-label-primary);font-weight:500}
@media (hover:hover){${TABS} [role="tab"]:not([aria-selected="true"]):hover{background:rgba(127,127,127,.12)}}

/* Menus: macOS menu metrics. 5px inset, 24px rows, 5px highlight. */
[role="menu"]{padding:5px!important}
[role="menu"] [role^="menuitem"]{min-height:24px!important;padding:3px 10px!important;gap:7px;border-radius:5px!important;font-size:13px;line-height:18px}
[role="menu"] ${cls('label')}{padding:4px 10px 2px;font-size:11px;font-weight:600}
[role="menu"] ${cls('separator')}{margin:4px 10px}

/* Buttons: macOS 26 capsule push buttons. */
${cls('button')}:is(${cls('primary')},${cls('outline')}){border-radius:999px;font-weight:500}
${cls('button')}${cls('outline')}{background:var(--dshmac-push-bg);box-shadow:var(--dshmac-push-shadow)}

/* Settings window: System Settings sidebar and form metrics. */
${SET} {border-radius:14px}
${SET} ${cls('navTitle')}{font-size:13px;font-weight:600;line-height:18px;padding:22px 12px 8px 22px}
${SET} ${cls('navList')}{gap:1px}
${SET} ${cls('navCell')}{height:30px;padding:0 10px;gap:8px;border-radius:7px;font-size:13px;line-height:18px}
${SET} ${cls('navCell')}${cls('active')}{background:var(--dshmac-sel);color:var(--dsw-alias-label-primary);font-weight:600}
${SET} ${cls('navIcon')}{color:var(--dshmac-accent)}
${SET} ${cls('navIcon')} svg{width:16px;height:16px}
${SET} ${cls('button')}{height:28px;padding:0 14px;font-size:13px;line-height:18px}
${SET} ${cls('button')}${cls('sm')}{height:24px;padding:0 10px;font-size:12px}
${SET} ${cls('options')} :is(${cls('title')}){font-size:13px}
${SET} ${cls('options')} :is(${cls('description')},${cls('desc')}){font-size:12px}

/* User messages: Messages-style accent bubble. */
[data-conversation-region="chat"] ${cls('bubble')}{background:var(--dshmac-accent);color:var(--dshmac-on-accent);padding:10px 14px;border-radius:calc((1lh + 20px) / 2)}
[data-conversation-region="chat"] ${cls('bubble')} *{color:inherit}
[data-conversation-region="chat"] ${cls('bubble')}{position:relative;overflow:visible}
[data-conversation-region="chat"] ${cls('bubble')}::before,[data-conversation-region="chat"] ${cls('bubble')}::after{content:"";position:absolute;bottom:0;height:20px;pointer-events:none;corner-shape:round}
[data-conversation-region="chat"] ${cls('bubble')}::before{right:-7px;width:20px;background:var(--dshmac-accent);border-bottom-left-radius:16px 14px}
[data-conversation-region="chat"] ${cls('bubble')}::after{right:-26px;width:26px;background:var(--dsw-alias-bg-base);border-bottom-left-radius:10px}

/* Running status: macOS dot spinner instead of the DeepSeek whale. */
[data-chat-running] ${cls('runningIcon')} > *{display:none!important}
[data-chat-running] ${cls('runningIcon')}::before{content:"";position:absolute;inset:0;background:currentColor;-webkit-mask:${SPINNER_MASK} center / 100% 100% no-repeat;mask:${SPINNER_MASK} center / 100% 100% no-repeat;animation:dshmac-spin .9s linear infinite}
@keyframes dshmac-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){[data-chat-running] ${cls('runningIcon')}::before{animation:none}}

/* Composer: lighter macOS text-field card. */
[data-composer-seat] ${cls('card')}{border-radius:20px;box-shadow:0 0 0 .5px var(--dsw-alias-border-l3),0 1px 4px rgba(0,0,0,.05)}
body[data-ds-dark-theme] [data-composer-seat] ${cls('card')}{box-shadow:0 0 0 .5px rgba(255,255,255,.12),0 2px 10px rgba(0,0,0,.35)}
`
    }

    // Settings row styles (theme tokens only).
    const ROW_CSS = `
.dshmac-row{display:flex;align-items:center;gap:8px;padding:16px 0;border-bottom:0.5px solid var(--dsw-alias-border-l2)}
.dshmac-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;padding-right:48px}
.dshmac-title{font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary)}
.dshmac-desc{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.dshmac-switch{position:relative;flex:none;width:38px;height:22px;padding:0;border:none;border-radius:11px;background:var(--dsw-alias-bg-module-platform);box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l4);cursor:pointer;transition:background .15s ease;corner-shape:round}
.dshmac-switch[aria-checked=true]{background:var(--dsw-alias-brand-primary);box-shadow:none}
.dshmac-switch::after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25),0 0 0 0.5px rgba(0,0,0,.06);transition:transform .15s ease;corner-shape:round}
.dshmac-switch[aria-checked=true]::after{transform:translateX(16px)}
.dshmac-switch:focus-visible,.dshmac-swatch:focus-visible{outline:3px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 50%,transparent);outline-offset:1px}
.dshmac-swatches{display:flex;flex:none;align-items:center;gap:8px}
.dshmac-swatch{position:relative;width:22px;height:22px;margin:1px;padding:0;border:none;border-radius:50%;cursor:pointer;box-shadow:inset 0 0 0 0.5px rgba(0,0,0,.18);corner-shape:round}
@media (hover:hover){.dshmac-swatch:hover{box-shadow:inset 0 0 0 0.5px rgba(0,0,0,.18),0 0 0 2px var(--dsw-alias-border-l4)}}
.dshmac-swatch[aria-checked=true]::after{content:"";position:absolute;inset:6px;border-radius:50%;background:#fff;corner-shape:round}
.dshmac-current{min-width:72px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);text-align:right}
@media (max-width:767px){.dshmac-row{flex-wrap:wrap}.dshmac-text{padding-right:0;flex-basis:100%}}
`

    return {
      inject: ['slots', 'locale', 'theme'],
      apply(ctx) {
        for (const [locale, dict] of Object.entries(DICTS)) {
          ctx.effect(() => ctx.locale.register(NS, locale, dict), `macos-theme: ${locale} dictionary`)
        }

        const prefs = createStore(load())
        const save = (next) => {
          prefs.set(next)
          try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch (_error) { /* ignore */ }
        }
        const usePrefs = () => useSyncExternalStore(prefs.subscribe, prefs.getSnapshot, prefs.getSnapshot)

        // Token layer follows the preference; light/dark switching stays with the host.
        ctx.effect(() => {
          let dispose = null
          const sync = () => {
            const { enabled, accent } = prefs.getSnapshot()
            if (dispose !== null) { dispose(); dispose = null }
            if (enabled) dispose = ctx.theme.overrideTokens(SOURCE, macTokens(accent))
          }
          const unsubscribe = prefs.subscribe(sync)
          sync()
          return () => { unsubscribe(); if (dispose !== null) dispose() }
        }, 'macos-theme: token layer')

        ctx.effect(() => {
          const onStorage = (event) => { if (event.key === STORAGE_KEY) prefs.set(load()) }
          window.addEventListener('storage', onStorage)
          return () => { window.removeEventListener('storage', onStorage) }
        }, 'macos-theme: cross-window sync')

        function MacStyle() {
          const { enabled, accent, bubbles, capsule } = usePrefs()
          return enabled ? h('style', { 'data-dsh-macos-theme': accent }, macCss(accent, bubbles, capsule)) : null
        }

        function MacSettings({ t }) {
          const prefsNow = usePrefs()
          const { enabled, accent, bubbles, capsule } = prefsNow
          const set = patch => save({ ...prefsNow, ...patch })
          return h(React.Fragment, null,
            h('style', null, ROW_CSS),
            h('div', { className: 'dshmac-row' },
              h('div', { className: 'dshmac-text' },
                h('div', { className: 'dshmac-title' }, t('title')),
                h('div', { className: 'dshmac-desc' }, t('description'))),
              h('button', {
                type: 'button', role: 'switch', className: 'dshmac-switch',
                'aria-checked': enabled, 'aria-label': t('title'),
                onClick: () => { set({ enabled: !enabled }) },
              })),
            enabled && h('div', { className: 'dshmac-row' },
              h('div', { className: 'dshmac-text' },
                h('div', { className: 'dshmac-title' }, t('bubbles.title')),
                h('div', { className: 'dshmac-desc' }, t('bubbles.description'))),
              h('button', {
                type: 'button', role: 'switch', className: 'dshmac-switch',
                'aria-checked': bubbles, 'aria-label': t('bubbles.title'),
                onClick: () => { set({ bubbles: !bubbles }) },
              })),
            enabled && h('div', { className: 'dshmac-row' },
              h('div', { className: 'dshmac-text' },
                h('div', { className: 'dshmac-title' }, t('capsule.title')),
                h('div', { className: 'dshmac-desc' }, t('capsule.description'))),
              h('button', {
                type: 'button', role: 'switch', className: 'dshmac-switch',
                'aria-checked': capsule, 'aria-label': t('capsule.title'),
                onClick: () => { set({ capsule: !capsule }) },
              })),
            enabled && h('div', { className: 'dshmac-row' },
              h('div', { className: 'dshmac-text' },
                h('div', { className: 'dshmac-title' }, t('accent.title')),
                h('div', { className: 'dshmac-desc' }, t('accent.description'))),
              h('span', { className: 'dshmac-current', 'aria-hidden': true }, t(`accent.${accent}`)),
              h('div', { className: 'dshmac-swatches', role: 'radiogroup', 'aria-label': t('accent.title') },
                ACCENT_IDS.map(id => h('button', {
                  key: id, type: 'button', role: 'radio', className: 'dshmac-swatch',
                  'aria-checked': id === accent, 'aria-label': t(`accent.${id}`), title: t(`accent.${id}`),
                  tabIndex: id === accent ? 0 : -1,
                  style: { background: ACCENTS[id].light },
                  onClick: () => { set({ accent: id }) },
                  onKeyDown: (event) => {
                    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
                    if (step === undefined) return
                    event.preventDefault()
                    const next = ACCENT_IDS[(ACCENT_IDS.indexOf(id) + step + ACCENT_IDS.length) % ACCENT_IDS.length]
                    set({ accent: next })
                    const group = event.currentTarget.parentElement
                    requestAnimationFrame(() => { group?.querySelector('[aria-checked="true"]')?.focus() })
                  },
                })))))
        }

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay', id: 'macos-theme-style', order: -100,
        }, MacStyle))

        ctx.slots.inject('settings.general.item', () => ctx.slots.register({
          name: 'settings.general.item', id: 'macos-style', order: 10.5, locale: NS,
        }, MacSettings))
      },
    }
  },
})

# dsh-macos-theme

macOS style for DeepSeek Harness (DSH). Makes DSH look and feel like a native macOS app (AppKit, macOS 26). UI only, no behavior changes.

## Features

- **System colors:** Apple label grays, separators, white content area (`#1E1E1E` in dark mode), neutral sidebar without the blue tint. Light and dark mode.
- **Accent color:** 8 macOS accents (blue, purple, pink, red, orange, yellow, green, graphite) on primary buttons, send button, focus rings, selection, and menu highlights. Links stay blue, like AppKit.
- **Sidebar:** Finder / Music source list. 13px rows, 28px tall, gray selection with dark semibold text, accent icons, round corners.
- **Menus:** macOS metrics (5px inset, 24px rows, 13px text), blurred material, accent highlight with white text.
- **Settings window:** System Settings sidebar and form sizes, gray grouped boxes, capsule push buttons.
- **Header:** 13px semibold title, segmented capsule control for Chat / Trajectory / Context / Fleet.
- **Chat:**
  - Your messages: accent bubbles with an iMessage tail.
  - Message bubbles (optional): assistant answers in gray bubbles with a tail. Tool calls and reasoning stay outside.
  - Bubble geometry from Messages: 14 x 10 insets, radius = half of the one-line height.
  - Running indicator: macOS dot spinner instead of the DeepSeek whale.
- **Single-line composer (optional):** one capsule like Messages / Grok: add button, text, model, and send on one line. Falls back to two rows in narrow panes.
- **Details:** SF Pro everywhere (no Montserrat), macOS corner radii, overlay scrollbars, Apple status colors with high-contrast values for text in light mode.

All settings are in **Settings** > **General** > **macOS style**: on/off switch, Message bubbles, Single-line composer, Accent color.

## Install

In DSH, open **Plugins** > **Add plugin** and enter:

```
github:vec715/dsh-macos-theme
```

Or from the command line:

```sh
dsh plugin add github:vec715/dsh-macos-theme
```

To pin a version: `github:vec715/dsh-macos-theme#v1.0.0`.

From a local clone (for development): `git clone https://github.com/vec715/dsh-macos-theme.git`, then enter the absolute path of the folder in **Plugins** > **Add plugin**.

After installing, quit DSH (cmd+q) and open it again.

## How it works

This is a DSH client bundle. It does not patch the app.

- **Tokens:** about 100 `--dsw-*` design tokens are replaced through the theme service (`ctx.theme.overrideTokens`) with light and dark values.
- **Controls:** a style layer in the `shell.overlay` slot restyles controls. Host classes are CSS-module names such as `kiGsTW_tab`; the plugin matches only the stable part (`_tab`) and scopes every rule under host data attributes (`[data-slot="sidebar"]`, `[data-conversation-tabs]`, `[data-composer-card]`, `[data-chat-flow-kind]`, ARIA roles).
- **Settings row:** registered in `settings.general.item`. Preferences are saved in local storage and synced across windows.

## Limitations

- Control-level styles depend on DSH class names and data attributes. A DSH update can rename them; the affected control then falls back to the stock look.
- Bubble tails use the page background color for the cut-out, so they can show an edge on a different background.
- In single-line composer mode the model button shows only its icon.
- The running label still says "Deep diving"; only its icon and color change.
- The accent color does not follow the macOS system accent automatically.

Tested with DSH 0.2.2-rc.5.

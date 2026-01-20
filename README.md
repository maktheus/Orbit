# Orbit

![Orbit Icon](https://raw.githubusercontent.com/user/repo/main/icon.png)

**Orbit** is a futuristic, high-performance desktop application for managing Android devices. Built with **Tauri**, **React**, and **Rust**, it combines a premium UI with powerful ADB capabilities.

## ✨ Features

- **🌐 Network Scanner**: Automatically detect Android devices on your local network/subnet.
- **⚡ Rapid Connection**: Connect wirelessly via TCP/IP with a single click.
- **📱 Device Management**: View detailed device info (Model, Serial, State).
- **🖥️ Screen Mirroring**: Integrated `scrcpy` support for high-quality mirroring.
- **🌍 International**: Multi-language support (English, Português, Русский, 简体中文).
- **🎨 Modern UI**: Sleek dark mode interface inspired by sci-fi aesthetics with Light Mode support.

## 📸 Screenshots

| Dashboard | Network Scanner | Settings |
|:---:|:---:|:---:|
| ![Dashboard](/Users/matheus.uchoa/.gemini/antigravity/brain/b49c8db0-a39f-42eb-bc73-37e94851016a/orbit_real_dashboard_1768879274776.png) | ![Network Scan](/Users/matheus.uchoa/.gemini/antigravity/brain/b49c8db0-a39f-42eb-bc73-37e94851016a/orbit_real_network_1768878807159.png) | ![Settings](/Users/matheus.uchoa/.gemini/antigravity/brain/b49c8db0-a39f-42eb-bc73-37e94851016a/orbit_real_settings_1768878286871.png) |

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS v4.
- **Backend**: Rust (Tauri), utilizing system `adb` and `nmap`.
- **Styling**: Custom "Orbit" Design System (Zinc + Cyan + Electric Blue).

## 🚀 Getting Started

### Prerequisites
- **Node.js** & **npm**
- **Rust** & **Cargo**
- **ADB** (Android Platform Tools)
- **Scrcpy** (`brew install scrcpy`)
- **Nmap** (Optional: `brew install nmap`)

### 📦 Distribution Guide (Homebrew)

To make **Orbit** installable via `brew install --cask orbit` on any Mac:

1.  **Create a Public GitHub Repository**:
    Host your code on GitHub/GitLab.

2.  **Create a Release**:
    - Run `npm run tauri build`.
    - Upload the `.dmg` file from `src-tauri/target/release/bundle/dmg/` to a GitHub Release.

3.  **Setup a Homebrew Tap**:
    - Create a new repository named `homebrew-tap`.
    - Inside it, place the `Orbit.rb` file (you can find it in this project root).

4.  **Update the Cask Formula (`Orbit.rb`)**:
    - Update `url` to point to your GitHub Release `.dmg` link.
    - Update `sha256` with the hash of the `.dmg`.

5.  **Install**:
    Users can now run:
    ```bash
    brew tap your-username/tap
    brew install --cask orbit
    ```

## 🌍 Languages

Change the language in **Settings** (Gear Icon):
- 🇺🇸 English
- 🇧🇷 Português (Brasil)
- 🇷🇺 Русский
- 🇨🇳 简体中文

---
*Built with code & stardust.*

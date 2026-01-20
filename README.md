# Orbit

![Orbit Icon](https://raw.githubusercontent.com/user/repo/main/icon.png)

**Orbit** is a futuristic, high-performance desktop application for managing Android devices. Built with **Tauri**, **React**, and **Rust**, it combines a premium UI with powerful ADB capabilities.

## ✨ Features

- **🌐 Network Scanner**: Automatically detect Android devices on your local network/subnet.
- **⚡ Rapid Connection**: Connect wirelessly via TCP/IP with a single click.
- **📱 Device Management**: View detailed device info (Model, Serial, State).
- **🖥️ Screen Mirroring**: Integrated `scrcpy` support for high-quality mirroring.
- **🌍 International**: Multi-language support (English, Português, Русский, 简体中文).
- **🎨 Modern UI**: Sleek dark mode interface inspired by sci-fi aesthetics.

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

### Installation

1.  **Clone & Install**
    ```bash
    git clone https://github.com/your-username/orbit.git
    cd orbit
    npm install
    ```

2.  **Run Development**
    ```bash
    # Ensure Cargo is in PATH
    source $HOME/.cargo/env
    npm run tauri dev
    ```

3.  **Build Request**
    ```bash
    npm run tauri build
    ```

## 🌍 Languages

Change the language in **Settings** (Gear Icon):
- 🇺🇸 English
- 🇧🇷 Português (Brasil)
- 🇷🇺 Русский
- 🇨🇳 简体中文

---
*Built with code & stardust.*

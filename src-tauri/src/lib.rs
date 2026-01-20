use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Command;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

struct ScrcpyState {
    processes: Mutex<HashMap<String, u32>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Device {
    serial: String,
    state: String,
    model: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkDevice {
    ip: String,
    mac: String,
    vendor: String,
}

#[tauri::command]
fn list_adb_devices() -> Result<Vec<Device>, String> {
    let output = Command::new("adb")
        .args(["devices", "-l"])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut devices = Vec::new();

    for line in stdout.lines().skip(1) {
        // Skip "List of devices attached"
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        // Example line: "serial product:model model:device device:transport_id"
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 2 {
            continue;
        }

        let serial = parts[0].to_string();
        let state = parts[1].to_string();

        let mut model = None;
        for part in &parts[2..] {
            if part.starts_with("model:") {
                model = Some(part.strip_prefix("model:").unwrap().to_string());
            }
        }

        devices.push(Device {
            serial,
            state,
            model,
        });
    }

    Ok(devices)
}

#[tauri::command]
fn scan_network() -> Result<Vec<NetworkDevice>, String> {
    // Try nmap first
    match Command::new("nmap")
        .args(["-sn", "192.168.1.0/24"])
        .output()
    {
        // TODO: Detect subnet
        Ok(output) if output.status.success() => {
            // Parse nmap output
            // This is complex parsing, sticking to basic arp fallback for MVP or generic nmap parser
            // Simplified Nmap parser logic would go here.
            // For now, let's use a dummy implementation or a very simple ARP scan if on mac
            return parse_nmap_output(&String::from_utf8_lossy(&output.stdout));
        }
        _ => {}
    }

    // Fallback: arp -a
    let output = Command::new("arp")
        .arg("-a")
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut devices = Vec::new();

    for line in stdout.lines() {
        // Example: ? (192.168.1.1) at 00:00:00:00:00:00 on en0 ifscope [ethernet]
        if line.contains("(") && line.contains(")") && line.contains("at") {
            let parts: Vec<&str> = line.split_whitespace().collect();
            // Find IP inside ()
            let ip_part = parts
                .iter()
                .find(|p| p.starts_with("(") && p.ends_with(")"));
            let mac_part = parts
                .iter()
                .position(|p| p == &"at")
                .map(|i| parts.get(i + 1))
                .flatten();

            if let (Some(ip), Some(mac)) = (ip_part, mac_part) {
                devices.push(NetworkDevice {
                    ip: ip.trim_matches(|c| c == '(' || c == ')').to_string(),
                    mac: mac.to_string(),
                    vendor: "Unknown".to_string(),
                });
            }
        }
    }

    Ok(devices)
}

fn parse_nmap_output(output: &str) -> Result<Vec<NetworkDevice>, String> {
    // Very basic parser
    // Nmap scan report for 192.168.1.1
    // MAC Address: AA:BB:CC:DD:EE:FF (Vendor)
    let mut devices = Vec::new();
    let mut current_ip = None;

    for line in output.lines() {
        if line.starts_with("Nmap scan report for") {
            // Extract IP
            if let Some(ip) = line.split_whitespace().last() {
                current_ip = Some(ip.trim_matches(|c| c == '(' || c == ')').to_string());
            }
        } else if line.contains("MAC Address:") {
            if let Some(ip) = current_ip.take() {
                let parts: Vec<&str> = line.split("MAC Address:").collect();
                if parts.len() > 1 {
                    let mac_info = parts[1].trim();
                    let mac_parts: Vec<&str> = mac_info.split_whitespace().collect();
                    let mac = mac_parts[0].to_string();
                    let vendor = mac_info
                        .replace(mac.as_str(), "")
                        .trim()
                        .trim_matches(|c| c == '(' || c == ')')
                        .to_string();
                    devices.push(NetworkDevice { ip, mac, vendor });
                }
            }
        }
    }
    Ok(devices)
}

#[tauri::command]
async fn adb_connect(ip: String) -> Result<String, String> {
    let output = Command::new("adb")
        .args(["connect", &ip])
        .output()
        .map_err(|e| e.to_string())?;

    let result = String::from_utf8_lossy(&output.stdout).to_string();
    if output.status.success() {
        Ok(result)
    } else {
        Err(result) // ADB sometimes prints errors to stdout too, but usually stderr
    }
}

#[tauri::command]
async fn adb_pair(ip: String, code: String) -> Result<String, String> {
    let output = Command::new("adb")
        .args(["pair", &ip, &code])
        .output()
        .map_err(|e| e.to_string())?;

    let result = String::from_utf8_lossy(&output.stdout).to_string();
    if output.status.success() {
        Ok(result)
    } else {
        Err(result)
    }
}

#[tauri::command]
fn launch_scrcpy(state: State<'_, ScrcpyState>, serial: String, force: bool) -> Result<(), String> {
    let mut processes = state.processes.lock().map_err(|e| e.to_string())?;
    let window_title = format!("Orbit - {}", serial);

    if let Some(&pid) = processes.get(&serial) {
        if !force {
            // Try to focus existing window
            #[cfg(target_os = "macos")]
            {
                let _ = Command::new("osascript")
                .arg("-e")
                .arg(format!(r#"tell application "System Events" to set frontmost of (every process whose name is "scrcpy" and unix id is {}) to true"#, pid))
                .output();
                // Also standard generic check, or assume it's running.
                // Return early so we don't spawn another one
                return Ok(());
            }
            // If not mac or logic fails, we just continue to spawn? No, better warn or do nothing.
            #[cfg(not(target_os = "macos"))]
            return Err(
                "Scrcpy is already running for this device. Use Force New Session.".to_string(),
            );
        } else {
            // Kill existing
            // On unix
            #[cfg(unix)]
            if let Ok(_) = Command::new("kill").arg(pid.to_string()).output() {
                processes.remove(&serial);
            }
        }
    }

    // Launch new
    let child = Command::new("scrcpy")
        .arg("-s")
        .arg(&serial)
        .arg("--window-title")
        .arg(&window_title)
        .spawn()
        .map_err(|e| e.to_string())?;

    processes.insert(serial, child.id());

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ScrcpyState {
            processes: Mutex::new(HashMap::new()),
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            list_adb_devices,
            scan_network,
            adb_connect,
            adb_pair,
            launch_scrcpy
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

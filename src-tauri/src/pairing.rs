use mdns_sd::{ServiceDaemon, ServiceInfo};
use qrcodegen::{QrCode, QrCodeEcc};
use rand::{distributions::Alphanumeric, Rng};
use serde::Serialize;
use std::collections::HashMap;
use std::net::TcpListener;
use std::sync::Mutex;
use tauri::State;

pub struct PairingState {
    pub service_daemon: Mutex<Option<ServiceDaemon>>,
    pub active_port: Mutex<Option<u16>>,
}

impl PairingState {
    pub fn new() -> Self {
        Self {
            service_daemon: Mutex::new(None),
            active_port: Mutex::new(None),
        }
    }
}

#[derive(Serialize)]
pub struct PairingResponse {
    pub qr_data: String,
    pub password: String,
    pub port: u16,
    pub service_name: String,
    pub qr_svg: String,
}

// Generate a random 6-character password
fn generate_password() -> String {
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(6)
        .map(char::from)
        .collect()
}

#[tauri::command]
pub async fn start_qr_pairing(
    state: State<'_, PairingState>,
    _app_handle: tauri::AppHandle,
) -> Result<PairingResponse, String> {
    // 1. Start TCP Listener on random port
    let listener = TcpListener::bind("0.0.0.0:0").map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();

    {
        let mut active_port = state.active_port.lock().unwrap();
        *active_port = Some(port);
    }

    // 2. Generate Password
    let password = generate_password();

    // 3. Register mDNS Service
    // Service Type: _adb-tls-pairing._tcp.local.
    // Name: ADB Pairing <Random>
    let mdns = ServiceDaemon::new().map_err(|e| e.to_string())?;
    let instance_name = format!("OrbitPairing-{}", rand::thread_rng().gen::<u16>());
    let service_type = "_adb-tls-pairing._tcp.local.";
    let host_name = format!("{}.local.", instance_name);

    let mut properties = HashMap::new();
    properties.insert("v".to_string(), "1".to_string());

    let service_info = ServiceInfo::new(
        service_type,
        &instance_name,
        &host_name,
        "0.0.0.0", // Fixed: Use valid IP syntax
        port,
        Some(properties),
    )
    .map_err(|e| e.to_string())?;

    mdns.register(service_info).map_err(|e| e.to_string())?;

    {
        let mut daemon_store = state.service_daemon.lock().unwrap();
        *daemon_store = Some(mdns);
    }

    // 4. Generate QR Code String
    // Format: WIFI:T:ADB;S:<name>;P:<password>;;
    let qr_data = format!("WIFI:T:ADB;S:{};P:{};;", instance_name, password);

    // Generate SVG
    let qr = QrCode::encode_text(&qr_data, QrCodeEcc::Medium).map_err(|e| e.to_string())?;
    let qr_svg = to_svg_string(&qr, 4);

    // 5. Spawn Async Task to handle Connection (Skeleton)
    std::thread::spawn(move || {
        for stream in listener.incoming() {
            match stream {
                Ok(_stream) => {
                    println!("Incoming connection on Pairing Port!");
                }
                Err(e) => println!("Connection failed: {}", e),
            }
        }
    });

    Ok(PairingResponse {
        qr_data,
        password,
        port,
        service_name: instance_name,
        qr_svg,
    })
}

pub fn to_svg_string(qr: &QrCode, border: i32) -> String {
    let size = qr.size() + border * 2;
    let mut svg = String::new();
    svg.push_str("<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 ");
    svg.push_str(&size.to_string());
    svg.push_str(" ");
    svg.push_str(&size.to_string());
    svg.push_str(
        "\" stroke=\"none\"><rect width=\"100%\" height=\"100%\" fill=\"#FFFFFF\"/><path d=\"",
    );

    for y in 0..qr.size() {
        for x in 0..qr.size() {
            if qr.get_module(x, y) {
                if x != 0 || y != 0 {
                    svg.push(' ');
                }
                svg.push_str(&format!("M{},{}h1v1h-1z", x + border, y + border));
            }
        }
    }

    svg.push_str("\" fill=\"#000000\"/></svg>");
    svg
}

#[tauri::command]
pub fn stop_qr_pairing(state: State<'_, PairingState>) -> Result<(), String> {
    let mut daemon = state.service_daemon.lock().unwrap();
    if let Some(d) = daemon.take() {
        let _ = d.shutdown();
    }
    let mut port = state.active_port.lock().unwrap();
    *port = None;
    Ok(())
}

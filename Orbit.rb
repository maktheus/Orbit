cask "orbit" do
  version "0.1.1"
  sha256 :no_check
  
  depends_on formula: "scrcpy"

  url "https://github.com/maktheus/Orbit/releases/download/v#{version}/Orbit_#{version}_aarch64.dmg"
  name "Orbit"
  desc "Futuristic Android Device Manager"
  homepage "https://github.com/maktheus/Orbit"

  app "Orbit.app"

  zap trash: [
    "~/Library/Application Support/com.orbit.connector",
    "~/Library/Caches/com.orbit.connector",
    "~/Library/Preferences/com.orbit.connector.plist",
  ]
end

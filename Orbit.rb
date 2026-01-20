cask "orbit" do
  version "0.1.0"
  sha256 :no_check

  url "https://github.com/your-username/orbit/releases/download/v#{version}/Orbit_#{version}_aarch64.dmg"
  name "Orbit"
  desc "Futuristic Android Device Manager"
  homepage "https://github.com/your-username/orbit"

  app "Orbit.app"

  zap trash: [
    "~/Library/Application Support/com.orbit.connector",
    "~/Library/Caches/com.orbit.connector",
    "~/Library/Preferences/com.orbit.connector.plist",
  ]
end

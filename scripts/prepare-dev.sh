set -e

sed -i '' 's/com.souvikpati.souviktube/com.souvikpati.souviktube.dev/' app.config.ts
sed -i '' 's/SouvikTube/SouvikTube-dev/' app.config.ts
yes | bun expo prebuild -p android --clean --no-install
sed -i '' 's/release {/release {\
            signingConfig signingConfigs.debug/' android/app/build.gradle

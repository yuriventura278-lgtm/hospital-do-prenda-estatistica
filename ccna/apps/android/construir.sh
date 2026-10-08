#!/usr/bin/env bash
# Constrói o APK Android (todas as versões a partir do Android 5.1 / API 22) com Capacitor.
# Uso: bash ccna/apps/android/construir.sh   (precisa de Node 20, Java 17 e do Android SDK)
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"; CCNA="$(cd "$AQUI/../.." && pwd)"
TMP="${RUNNER_TEMP:-/tmp}/curso-redes-android"; rm -rf "$TMP"; mkdir -p "$TMP"; cd "$TMP"
npm init -y >/dev/null
npm install --no-audit --no-fund @capacitor/core@6.2.0 @capacitor/cli@6.2.0 @capacitor/android@6.2.0 \
  @capacitor/local-notifications@6.1.1 @capacitor/filesystem@6.0.3 @capacitor/share@6.0.3 @capacitor/browser@6.0.4 @capacitor/app@6.0.2
cp "$AQUI/capacitor.config.json" .
cp -r "$CCNA/www" www
npx cap add android
npx cap sync android
# ícone da app em todas as densidades (precisa do ImageMagick; sem ele fica o ícone padrão)
if command -v convert >/dev/null; then
for d in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do
  n=${d%%:*}; t=${d##*:}; dir="android/app/src/main/res/mipmap-$n"
  convert "$CCNA/www/icons/icon-512.png" -resize ${t}x${t} "$dir/ic_launcher.png"
  convert "$CCNA/www/icons/icon-512.png" -resize ${t}x${t} "$dir/ic_launcher_round.png"
  [ -f "$dir/ic_launcher_foreground.png" ] && convert "$CCNA/www/icons/icon-512.png" -resize ${t}x${t} -gravity center -background none -extent $((t*108/72))x$((t*108/72)) "$dir/ic_launcher_foreground.png" || true
done
for d in mdpi:24 hdpi:36 xhdpi:48 xxhdpi:72 xxxhdpi:96; do n=${d%%:*}; t=${d##*:}; mkdir -p "android/app/src/main/res/drawable-$n"; convert "$CCNA/www/icons/icon-192.png" -resize ${t}x${t} -alpha extract -background white -alpha shape "android/app/src/main/res/drawable-$n/ic_stat_icon.png" || true; done
fi
# permissões das notificações agendadas
sed -i 's#<uses-permission android:name="android.permission.INTERNET" />#<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />\n    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />#' android/app/src/main/AndroidManifest.xml
cd android
chmod +x gradlew
./gradlew --no-daemon assembleDebug
mkdir -p "$CCNA/apps/saida"
cp app/build/outputs/apk/debug/app-debug.apk "$CCNA/apps/saida/Curso-de-Redes-Android.apk"
echo "APK: $CCNA/apps/saida/Curso-de-Redes-Android.apk"

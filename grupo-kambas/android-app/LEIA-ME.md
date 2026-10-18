# APK Android — Grupo Kambas

A APK é compilada automaticamente pelo GitHub Actions
(`.github/workflows/grupo-kambas-apk.yml`) sempre que há alterações em
`grupo-kambas/`, e fica no release **grupo-kambas-apk** do repositório.

Para compilar à mão (precisa de Node 20, Java 17 e Android SDK):

```bash
cd grupo-kambas/android-app
python3 ../construir.py --apk www
npm install
npx cap add android
mkdir -p assets && cp ../static/icone-1024.png assets/icon.png && cp ../static/arranque-2732.png assets/splash.png
npx capacitor-assets generate --android --iconBackgroundColor "#0A3D4C" --splashBackgroundColor "#0A3D4C"
npx cap sync android
cp kambas-debug.keystore ~/.android/debug.keystore
cd android && ./gradlew assembleDebug
```

`kambas-debug.keystore` é uma chave de testes (palavra-passe `android`), igual
em todas as compilações para que cada versão nova se instale por cima da
anterior. Para publicar na Play Store, crie uma chave própria e guarde-a fora
do repositório.

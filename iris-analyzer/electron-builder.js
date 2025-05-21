const { build } = require('electron-builder');

build({
  config: {
    appId: "com.eyecos.irisanalyzer",
    productName: "Iris Analyzer",
    files: [
      "dist/**/*"
    ],
    asar: false,
    extraResources: [
      {
        from: "resources/prueba_electron-1.0-SNAPSHOT.jar",
        to: "prueba_electron.jar"
      }
    ],
    directories: {
      buildResources: "resources",
      output: "release"
    },
    win: {
      target: ["portable"],
    },
    forceCodeSigning: false
  }
})
#cordova-plugin-ms-intune-mam

The Intune App SDK Cordova plugin enables mobile app management features with Microsoft Intune mobile iOS and Android apps built with Cordova. The plugin allows a developer to easily build in data protection features into their app. You will find that you can enable SDK features without changing your app’s behavior. Once you've built the plugin into your iOS or Android mobile app, the IT admin will be able to deploy policy via Microsoft Intune supporting a variety of features that enable data protection. We've built the plugin so that most the steps are automatically performed in the Cordova build process. As a result, you should be able to get your app enabled for management quickly. To get started, follow the steps below based on your target platform.


##How to build the plugin into your iOS mobile app

There are a number of steps that need to be performed for your app to be Intune MAM enabled. For convenience, these steps are performed automatically in the Cordova build process as a pre-build hook. As a result, the automated steps will modify your `*.pbxproj` and `*-Info.plist`, as well as your `*.entitlements` files that are associated with a project configuration. If your project doesn't contain an entitlements file, the plugin will create one automatically.

This setup only supports a single target and will perform the configuration on the first target found if there are multiple targets. If the process fails, make sure that your project's xcodeproj is `[name].xcodeproject` where `[name]` is the value defined in `config.xml` and that your project uses the standard Cordova app folder structure.

##How to build the plugin into your Android mobile app

Import this plugin with the latest Cordova tools. The plugin will be automatically invoked as an `after_compile` step.

The plugin will create a MAM enabled version of a built apk (API greater than or equal to 14) at the end of the build process. The build output will contain a `[Project]-intunewrapped-[Build_Configuration].apk` (e.g. `android-intunewrapped-debug.apk`).

The plugin only supports gradle builds.

Due to a Cordova bug (https://issues.apache.org/jira/browse/CB-9434) that causes certain Cordova hooks to be ignored on `cordova run`, to run the wrapped app from the command line, you must do the following:
```
$ cordova build
$ cordova run --nobuild
```


###Signing your Android app

To add signing information to the wrapped apk, modify `build.json` as you normally would for adding signing information. e.g.
```
{
  "android": {
    "release": {
      "keystore": "your.keystore",
      "storePassword": "yourpassword",
      "alias": "youralias",
      "password" : "yourpassword",
      "keystoreType": ""
    }
  }
}
```

###Build for use with the Intune MAM test app for Android
Add `android:testOnly="true"` to the application node of the `AndroidManifest.xml` file.

Cordova 6.x.x:
In `[PROJECT_ROOT]/platforms/android/cordova/lib/Adb.js`, change line 60 from
```
var args = ['-s', target, 'install'];
```
to
```
var args = ['-s', target, 'install', '-t'];
```

The effect of this is to run `adb install` with the "-t" flag since `testOnly` apps are not installable without it.

##Known Limitations
* The latest Microsoft Intune Company Portal app must be used.
* On Android, Multi-Dex support is incomplete.

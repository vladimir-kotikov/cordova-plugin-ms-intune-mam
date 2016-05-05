//-----------------------------------------------------------------------------------
// <copyright company="Microsoft" file="configuration.js">
//      Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
//-----------------------------------------------------------------------------------

var fs,
  mam,
  npm,
  xcode,
  Q;

// Installs the supplied dependencies through npm install. Expects an array of strings.
// packages: an array of the packages to install (formatted as NPM would expect)
// returns: a Q promise which resolves when all dependencies are installed
var installDependencies = function (packages) {
  console.log('Installing NPM dependencies');
  return Q.nfcall(npm.load)
    .then(function () { return Q.nfcall(npm.commands.install, packages); })
    .then(function () { console.log('Finished installing dependencies'); });
};

var requireLibraries = function () {
  // We can now load our code since our dependencies are loaded. Loading any earlier would crash the process.
  fs = require('fs');
  xcode = require('./xcodehelper.js');
  mam = require('./mamconfig.js');
};

// Loads and parses the pbx project (using config.xml to derive the location of the pbxproject file).
// returns: a Q promise which resolves when execution is complete.
var loadProject = function () {
  console.log('Loading Cordova project configuration file.');

  return Q.nfcall(fs.readFile, './config.xml', 'utf8')
    .then(function (data) {
      console.log('Found configuration file.');
      var name = data.match('<name>(.*)</name>')[1];

      var projectPath = './platforms/ios/' + name + '.xcodeproj' + '/project.pbxproj';
      console.log('Parsing project file: ' + projectPath);
      return xcode.project(projectPath);
    })
    .then(function (project) {
      return Q.ninvoke(project, 'parse').then(function () { return project; });
    });
};

// Writes out changes to the xcode project.
// project: the xcode project object
// returns: a Q promise which will be resolved after file IO is complete
var saveProject = function (project) {
  console.log('Saving the modified project.');
  return Q.nfcall(fs.writeFile, project.filepath, project.writeSync())
    .then(function () {
      console.log('Successfully saved changes.');
      console.log('Finished running configuration steps.');
    });
};

// Configures the necessary settings which must be updated in the PBXProject file.
// project: a reference to the parsed xcode project
var configureProject = function (project) {
  console.log('Starting Step: Configuring Build Settings');

  var intuneAppPluginPath = '../../Plugins/cordova-plugin-ms-intune-mam';
  var adalPluginPath = project.getProjectName() + '/Plugins/cordova-plugin-ms-adal';

  var configUUIDList = project.getNativeTargetConfigList();

  project.addNewToOtherLinkerFlags('\"$(inherited)\"');
  project.addNewToOtherLinkerFlags('\"-ObjC\"');
  project.addNewToOtherLinkerFlags('\"-lsqlite3\"');
  project.addNewToOtherLinkerFlags('\"-lc++\"');

  for (var config of configUUIDList) {
    console.log('Configuring build settings for configuration: ' + config['value'] + ' (' + config['comment'] + ')');
    config = config['value'];
    project.disableBitcode(config);
    project.addLibrarySearchPath(config, '\"$(inherited)\"');
    project.addLibrarySearchPath(config, '\"' + intuneAppPluginPath + '/lib/ios\"');
    project.addHeaderSearchPath(config, '\"$(inherited)\"');
    project.addHeaderSearchPath(config, '\"' + intuneAppPluginPath + '/lib/ios/Headers\"');
    project.addForceLoadLibrary(config, '\"' + intuneAppPluginPath + '/lib/ios/libIntuneMAM.a\"');
    project.addForceLoadLibrary(config, '\"' + adalPluginPath + '/ADALiOS.framework/ADALiOS\"');
  }

  project.enableKeychainSharing();
};

// Entry-point for the Cordova hook. Calls out to install dependencies and starts the configuration process.
// context: the cordova context that the hook gives us.
// returns: a Q promise that resolves after we have completed all steps.
module.exports = function (context) {
  // Globally defined so we don't need to pass around the context.
  Q = context.requireCordovaModule('q');
  npm = context.requireCordovaModule('npm');

  console.log('Running pre-build iOS Intune App SDK configuration steps');

  return installDependencies(['plist@1.2.0', 'xcode@0.8.3'])
    .then(function () {
      requireLibraries();
      return loadProject();
    })
    .then(function (project) {
      configureProject(project);
      return mam.configureIntuneMAM(Q, project).then(function () { return saveProject(project); });
    });
};

// SIG // Begin signature block
// SIG // MIIdpgYJKoZIhvcNAQcCoIIdlzCCHZMCAQExCzAJBgUr
// SIG // DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
// SIG // gjcCAR4wJAIBAQQQEODJBs441BGiowAQS9NQkAIBAAIB
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFPtrrzpPeLnx
// SIG // 9zDINEhb26zhpbNVoIIYZDCCBMMwggOroAMCAQICEzMA
// SIG // AACYBFjLfyMJsJ4AAAAAAJgwDQYJKoZIhvcNAQEFBQAw
// SIG // dzELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEhMB8GA1UEAxMYTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgUENBMB4XDTE2MDMzMDE5
// SIG // MjEyN1oXDTE3MDYzMDE5MjEyN1owgbMxCzAJBgNVBAYT
// SIG // AlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQH
// SIG // EwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
// SIG // cG9yYXRpb24xDTALBgNVBAsTBE1PUFIxJzAlBgNVBAsT
// SIG // Hm5DaXBoZXIgRFNFIEVTTjo3QUZBLUU0MUMtRTE0MjEl
// SIG // MCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAgU2Vy
// SIG // dmljZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
// SIG // ggEBANY3JagEAe41WQrzrh+YxYsa0UxhbcDB8LNbBGWg
// SIG // N3IqG1SHViHo3OXwbt13cES38Y7JsqLtyXk2mvJagPdv
// SIG // atgMmfQN2QX8X/Fak8W7tOsAY+KOIOWArM9Av/NTdhEr
// SIG // EGW4w8W1ubCsw4YU9J086/NmnqXtXa40+Xb8lPwLxJAs
// SIG // 2hA1NHWU6tgZujSIn9dRswPjpA9G3WRvruBCUcpUOIo0
// SIG // rRoF1KQGqW9MtkbZQGL2UqS2M3hRXAP8kV2nAp6A/vof
// SIG // a+uoXv0nLxn3fyf+YT0QrYLGza97xScwVoFfc1apljr2
// SIG // QTxqS4Qi4JU4dLLT2v2cWY00v5yiS2uzGSHdd9UCAwEA
// SIG // AaOCAQkwggEFMB0GA1UdDgQWBBTzwiOf0r0ljb2o9Zwb
// SIG // 6Ehzu+mTwTAfBgNVHSMEGDAWgBQjNPjZUkZwCu1A+3b7
// SIG // syuwwzWzDzBUBgNVHR8ETTBLMEmgR6BFhkNodHRwOi8v
// SIG // Y3JsLm1pY3Jvc29mdC5jb20vcGtpL2NybC9wcm9kdWN0
// SIG // cy9NaWNyb3NvZnRUaW1lU3RhbXBQQ0EuY3JsMFgGCCsG
// SIG // AQUFBwEBBEwwSjBIBggrBgEFBQcwAoY8aHR0cDovL3d3
// SIG // dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNyb3Nv
// SIG // ZnRUaW1lU3RhbXBQQ0EuY3J0MBMGA1UdJQQMMAoGCCsG
// SIG // AQUFBwMIMA0GCSqGSIb3DQEBBQUAA4IBAQA/sT1SIRZd
// SIG // 9FxHt/a5YFKggq9n10faNGi9DoqGqeiwFDFyyuAfvy9n
// SIG // PgYFd9o6FOrzAoU2gPu1xMO6VwkTfrg/LpeInx63QDhB
// SIG // KjkwQ+zedtN7tizeuu/1mO9abqz9nszQdcvmAII2sBLe
// SIG // lY40HEhmfW0z0bUtiT0uQUvOvKWspt+ebtehzMcJoZb9
// SIG // ZJV+p31TrNQ2CuXGVKzwG5QmRFsxmm/I/XdmSBi0JkxJ
// SIG // krXbJTqu/b7oxCNJ6g5yQbrFBotvCodx89UCBzOVGYPx
// SIG // ebFoLdBKGxRh5pOCh9r63hmQK7QiAWpg3OXCCePJ2vRn
// SIG // wNo6iS1rG7zXMAuPOoOXGrsJMIIGBzCCA++gAwIBAgIK
// SIG // YRZoNAAAAAAAHDANBgkqhkiG9w0BAQUFADBfMRMwEQYK
// SIG // CZImiZPyLGQBGRYDY29tMRkwFwYKCZImiZPyLGQBGRYJ
// SIG // bWljcm9zb2Z0MS0wKwYDVQQDEyRNaWNyb3NvZnQgUm9v
// SIG // dCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkwHhcNMDcwNDAz
// SIG // MTI1MzA5WhcNMjEwNDAzMTMwMzA5WjB3MQswCQYDVQQG
// SIG // EwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
// SIG // BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENv
// SIG // cnBvcmF0aW9uMSEwHwYDVQQDExhNaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBQQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IB
// SIG // DwAwggEKAoIBAQCfoWyx39tIkip8ay4Z4b3i48WZUSNQ
// SIG // rc7dGE4kD+7Rp9FMrXQwIBHrB9VUlRVJlBtCkq6YXDAm
// SIG // 2gBr6Hu97IkHD/cOBJjwicwfyzMkh53y9GccLPx754gd
// SIG // 6udOo6HBI1PKjfpFzwnQXq/QsEIEovmmbJNn1yjcRlOw
// SIG // htDlKEYuJ6yGT1VSDOQDLPtqkJAwbofzWTCd+n7Wl7Po
// SIG // IZd++NIT8wi3U21StEWQn0gASkdmEScpZqiX5NMGgUqi
// SIG // +YSnEUcUCYKfhO1VeP4Bmh1QCIUAEDBG7bfeI0a7xC1U
// SIG // n68eeEExd8yb3zuDk6FhArUdDbH895uyAc4iS1T/+QXD
// SIG // wiALAgMBAAGjggGrMIIBpzAPBgNVHRMBAf8EBTADAQH/
// SIG // MB0GA1UdDgQWBBQjNPjZUkZwCu1A+3b7syuwwzWzDzAL
// SIG // BgNVHQ8EBAMCAYYwEAYJKwYBBAGCNxUBBAMCAQAwgZgG
// SIG // A1UdIwSBkDCBjYAUDqyCYEBWJ5flJRP8KuEKU5VZ5KSh
// SIG // Y6RhMF8xEzARBgoJkiaJk/IsZAEZFgNjb20xGTAXBgoJ
// SIG // kiaJk/IsZAEZFgltaWNyb3NvZnQxLTArBgNVBAMTJE1p
// SIG // Y3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhvcml0
// SIG // eYIQea0WoUqgpa1Mc1j0BxMuZTBQBgNVHR8ESTBHMEWg
// SIG // Q6BBhj9odHRwOi8vY3JsLm1pY3Jvc29mdC5jb20vcGtp
// SIG // L2NybC9wcm9kdWN0cy9taWNyb3NvZnRyb290Y2VydC5j
// SIG // cmwwVAYIKwYBBQUHAQEESDBGMEQGCCsGAQUFBzAChjho
// SIG // dHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpL2NlcnRz
// SIG // L01pY3Jvc29mdFJvb3RDZXJ0LmNydDATBgNVHSUEDDAK
// SIG // BggrBgEFBQcDCDANBgkqhkiG9w0BAQUFAAOCAgEAEJeK
// SIG // w1wDRDbd6bStd9vOeVFNAbEudHFbbQwTq86+e4+4LtQS
// SIG // ooxtYrhXAstOIBNQmd16QOJXu69YmhzhHQGGrLt48ovQ
// SIG // 7DsB7uK+jwoFyI1I4vBTFd1Pq5Lk541q1YDB5pTyBi+F
// SIG // A+mRKiQicPv2/OR4mS4N9wficLwYTp2OawpylbihOZxn
// SIG // LcVRDupiXD8WmIsgP+IHGjL5zDFKdjE9K3ILyOpwPf+F
// SIG // ChPfwgphjvDXuBfrTot/xTUrXqO/67x9C0J71FNyIe4w
// SIG // yrt4ZVxbARcKFA7S2hSY9Ty5ZlizLS/n+YWGzFFW6J1w
// SIG // lGysOUzU9nm/qhh6YinvopspNAZ3GmLJPR5tH4LwC8cs
// SIG // u89Ds+X57H2146SodDW4TsVxIxImdgs8UoxxWkZDFLyz
// SIG // s7BNZ8ifQv+AeSGAnhUwZuhCEl4ayJ4iIdBD6Svpu/RI
// SIG // zCzU2DKATCYqSCRfWupW76bemZ3KOm+9gSd0BhHudiG/
// SIG // m4LBJ1S2sWo9iaF2YbRuoROmv6pH8BJv/YoybLL+31HI
// SIG // jCPJZr2dHYcSZAI9La9Zj7jkIeW1sMpjtHhUBdRBLlCs
// SIG // lLCleKuzoJZ1GtmShxN1Ii8yqAhuoFuMJb+g74TKIdbr
// SIG // Hk/Jmu5J4PcBZW+JC33Iacjmbuqnl84xKf8OxVtc2E0b
// SIG // odj6L54/LlUWa8kTo/0wggYQMIID+KADAgECAhMzAAAA
// SIG // ZEeElIbbQRk4AAAAAABkMA0GCSqGSIb3DQEBCwUAMH4x
// SIG // CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9u
// SIG // MRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
// SIG // b3NvZnQgQ29ycG9yYXRpb24xKDAmBgNVBAMTH01pY3Jv
// SIG // c29mdCBDb2RlIFNpZ25pbmcgUENBIDIwMTEwHhcNMTUx
// SIG // MDI4MjAzMTQ2WhcNMTcwMTI4MjAzMTQ2WjCBgzELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjENMAsGA1UECxMETU9QUjEeMBwG
// SIG // A1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMIIBIjAN
// SIG // BgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAky7a2OY+
// SIG // mNkbD2RfTahYTRQ793qE/DwRMTrvicJKLUGlSF3dEp7v
// SIG // q2YoNNV9KlV7TE2K8sDxstNSFYu2swi4i1AL3X/7agmg
// SIG // 3GcExPHfvHUYIEC+eCyZVt3u9S7dPkL5Wh8wrgEUirCC
// SIG // tVGg4m1l/vcYCo0wbU06p8XzNi3uXyygkgCxHEziy/f/
// SIG // JCV/14/A3ZduzrIXtsccRKckyn6B5uYxuRbZXT7RaO6+
// SIG // zUjQhiyu3A4hwcCKw+4bk1kT9sY7gHIYiFP7q78wPqB3
// SIG // vVKIv3rY6LCTraEbjNR+phBQEL7hyBxk+ocu+8RHZhbA
// SIG // hHs2r1+6hURsAg8t4LAOG6I+JQIDAQABo4IBfzCCAXsw
// SIG // HwYDVR0lBBgwFgYIKwYBBQUHAwMGCisGAQQBgjdMCAEw
// SIG // HQYDVR0OBBYEFFhWcQTwvbsz9YNozOeARvdXr9IiMFEG
// SIG // A1UdEQRKMEikRjBEMQ0wCwYDVQQLEwRNT1BSMTMwMQYD
// SIG // VQQFEyozMTY0Mis0OWU4YzNmMy0yMzU5LTQ3ZjYtYTNi
// SIG // ZS02YzhjNDc1MWM0YjYwHwYDVR0jBBgwFoAUSG5k5VAF
// SIG // 04KqFzc3IrVtqMp1ApUwVAYDVR0fBE0wSzBJoEegRYZD
// SIG // aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9j
// SIG // cmwvTWljQ29kU2lnUENBMjAxMV8yMDExLTA3LTA4LmNy
// SIG // bDBhBggrBgEFBQcBAQRVMFMwUQYIKwYBBQUHMAKGRWh0
// SIG // dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY2Vy
// SIG // dHMvTWljQ29kU2lnUENBMjAxMV8yMDExLTA3LTA4LmNy
// SIG // dDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IC
// SIG // AQCI4gxkQx3dXK6MO4UktZ1A1r1mrFtXNdn06DrARZkQ
// SIG // Tdu0kOTLdlGBCfCzk0309RLkvUgnFKpvLddrg9TGp3n8
// SIG // 0yUbRsp2AogyrlBU+gP5ggHFi7NjGEpj5bH+FDsMw9Py
// SIG // gLg8JelgsvBVudw1SgUt625nY7w1vrwk+cDd58TvAyJQ
// SIG // FAW1zJ+0ySgB9lu2vwg0NKetOyL7dxe3KoRLaztUcqXo
// SIG // YW5CkI+Mv3m8HOeqlhyfFTYxPB5YXyQJPKQJYh8zC9b9
// SIG // 0JXLT7raM7mQ94ygDuFmlaiZ+QSUR3XVupdEngrmZgUB
// SIG // 5jX13M+Pl2Vv7PPFU3xlo3Uhj1wtupNC81epoxGhJ0tR
// SIG // uLdEajD/dCZ0xIniesRXCKSC4HCL3BMnSwVXtIoj/QFy
// SIG // mFYwD5+sAZuvRSgkKyD1rDA7MPcEI2i/Bh5OMAo9App4
// SIG // sR0Gp049oSkXNhvRi/au7QG6NJBTSBbNBGJG8Qp+5QTh
// SIG // KoQUk8mj0ugr4yWRsA9JTbmqVw7u9suB5OKYBMUN4hL/
// SIG // yI+aFVsE/KJInvnxSzXJ1YHka45ADYMKAMl+fLdIqm3n
// SIG // x6rIN0RkoDAbvTAAXGehUCsIod049A1T3IJyUJXt3OsT
// SIG // d3WabhIBXICYfxMg10naaWcyUePgW3+VwP0XLKu4O1+8
// SIG // ZeGyaDSi33GnzmmyYacX3BTqMDCCB3owggVioAMCAQIC
// SIG // CmEOkNIAAAAAAAMwDQYJKoZIhvcNAQELBQAwgYgxCzAJ
// SIG // BgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAw
// SIG // DgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
// SIG // ZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMTKU1pY3Jvc29m
// SIG // dCBSb290IENlcnRpZmljYXRlIEF1dGhvcml0eSAyMDEx
// SIG // MB4XDTExMDcwODIwNTkwOVoXDTI2MDcwODIxMDkwOVow
// SIG // fjELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEoMCYGA1UEAxMfTWlj
// SIG // cm9zb2Z0IENvZGUgU2lnbmluZyBQQ0EgMjAxMTCCAiIw
// SIG // DQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAKvw+nIQ
// SIG // HC6t2G6qghBNNLrytlghn0IbKmvpWlCquAY4GgRJun/D
// SIG // DB7dN2vGEtgL8DjCmQawyDnVARQxQtOJDXlkh36UYCRs
// SIG // r55JnOloXtLfm1OyCizDr9mpK656Ca/XllnKYBoF6WZ2
// SIG // 6DJSJhIv56sIUM+zRLdd2MQuA3WraPPLbfM6XKEW9Ea6
// SIG // 4DhkrG5kNXimoGMPLdNAk/jj3gcN1Vx5pUkp5w2+oBN3
// SIG // vpQ97/vjK1oQH01WKKJ6cuASOrdJXtjt7UORg9l7snuG
// SIG // G9k+sYxd6IlPhBryoS9Z5JA7La4zWMW3Pv4y07MDPbGy
// SIG // r5I4ftKdgCz1TlaRITUlwzluZH9TupwPrRkjhMv0ugOG
// SIG // jfdf8NBSv4yUh7zAIXQlXxgotswnKDglmDlKNs98sZKu
// SIG // HCOnqWbsYR9q4ShJnV+I4iVd0yFLPlLEtVc/JAPw0Xpb
// SIG // L9Uj43BdD1FGd7P4AOG8rAKCX9vAFbO9G9RVS+c5oQ/p
// SIG // I0m8GLhEfEXkwcNyeuBy5yTfv0aZxe/CHFfbg43sTUkw
// SIG // p6uO3+xbn6/83bBm4sGXgXvt1u1L50kppxMopqd9Z4Dm
// SIG // imJ4X7IvhNdXnFy/dygo8e1twyiPLI9AN0/B4YVEicQJ
// SIG // TMXUpUMvdJX3bvh4IFgsE11glZo+TzOE2rCIF96eTvSW
// SIG // sLxGoGyY0uDWiIwLAgMBAAGjggHtMIIB6TAQBgkrBgEE
// SIG // AYI3FQEEAwIBADAdBgNVHQ4EFgQUSG5k5VAF04KqFzc3
// SIG // IrVtqMp1ApUwGQYJKwYBBAGCNxQCBAweCgBTAHUAYgBD
// SIG // AEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB/wQFMAMBAf8w
// SIG // HwYDVR0jBBgwFoAUci06AjGQQ7kUBU7h6qfHMdEjiTQw
// SIG // WgYDVR0fBFMwUTBPoE2gS4ZJaHR0cDovL2NybC5taWNy
// SIG // b3NvZnQuY29tL3BraS9jcmwvcHJvZHVjdHMvTWljUm9v
// SIG // Q2VyQXV0MjAxMV8yMDExXzAzXzIyLmNybDBeBggrBgEF
// SIG // BQcBAQRSMFAwTgYIKwYBBQUHMAKGQmh0dHA6Ly93d3cu
// SIG // bWljcm9zb2Z0LmNvbS9wa2kvY2VydHMvTWljUm9vQ2Vy
// SIG // QXV0MjAxMV8yMDExXzAzXzIyLmNydDCBnwYDVR0gBIGX
// SIG // MIGUMIGRBgkrBgEEAYI3LgMwgYMwPwYIKwYBBQUHAgEW
// SIG // M2h0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMv
// SIG // ZG9jcy9wcmltYXJ5Y3BzLmh0bTBABggrBgEFBQcCAjA0
// SIG // HjIgHQBMAGUAZwBhAGwAXwBwAG8AbABpAGMAeQBfAHMA
// SIG // dABhAHQAZQBtAGUAbgB0AC4gHTANBgkqhkiG9w0BAQsF
// SIG // AAOCAgEAZ/KGpZjgVHkaLtPYdGcimwuWEeFjkplCln3S
// SIG // eQyQwWVfLiw++MNy0W2D/r4/6ArKO79HqaPzadtjvyI1
// SIG // pZddZYSQfYtGUFXYDJJ80hpLHPM8QotS0LD9a+M+By4p
// SIG // m+Y9G6XUtR13lDni6WTJRD14eiPzE32mkHSDjfTLJgJG
// SIG // KsKKELukqQUMm+1o+mgulaAqPyprWEljHwlpblqYluSD
// SIG // 9MCP80Yr3vw70L01724lruWvJ+3Q3fMOr5kol5hNDj0L
// SIG // 8giJ1h/DMhji8MUtzluetEk5CsYKwsatruWy2dsViFFF
// SIG // WDgycScaf7H0J/jeLDogaZiyWYlobm+nt3TDQAUGpgEq
// SIG // KD6CPxNNZgvAs0314Y9/HG8VfUWnduVAKmWjw11SYobD
// SIG // HWM2l4bf2vP48hahmifhzaWX0O5dY0HjWwechz4GdwbR
// SIG // BrF1HxS+YWG18NzGGwS+30HHDiju3mUv7Jf2oVyW2ADW
// SIG // oUa9WfOXpQlLSBCZgB/QACnFsZulP0V3HjXG0qKin3p6
// SIG // IvpIlR+r+0cjgPWe+L9rt0uX4ut1eBrs6jeZeRhL/9az
// SIG // I2h15q/6/IvrC4DqaTuv/DDtBEyO3991bWORPdGdVk5P
// SIG // v4BXIqF4ETIheu9BCrE/+6jMpF3BoYibV3FWTkhFwELJ
// SIG // m3ZbCoBIa/15n8G9bW1qyVJzEw16UM0xggSuMIIEqgIB
// SIG // ATCBlTB+MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
// SIG // aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UE
// SIG // ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSgwJgYDVQQD
// SIG // Ex9NaWNyb3NvZnQgQ29kZSBTaWduaW5nIFBDQSAyMDEx
// SIG // AhMzAAAAZEeElIbbQRk4AAAAAABkMAkGBSsOAwIaBQCg
// SIG // gcIwGQYJKoZIhvcNAQkDMQwGCisGAQQBgjcCAQQwHAYK
// SIG // KwYBBAGCNwIBCzEOMAwGCisGAQQBgjcCARUwIwYJKoZI
// SIG // hvcNAQkEMRYEFChTOZ5GFm5Pd6aebKCd/SzhsBlUMGIG
// SIG // CisGAQQBgjcCAQwxVDBSoDSAMgBNAGkAYwByAG8AcwBv
// SIG // AGYAdAAgAEMAbwByAHAAbwByAGEAdABpAG8AbgAgACgA
// SIG // UgApoRqAGGh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbTAN
// SIG // BgkqhkiG9w0BAQEFAASCAQAE4zHY6KQTXavtDPSYXFaT
// SIG // 7nQvN7O1sLb6G2BUL2in61hapt76qk9ssSnEYFclHCTX
// SIG // H2Ufq6D3IfgxQUy+mfDDHKMRDXLDGnMSDPU6RP/M7G+F
// SIG // 8PhOVCz0/ucsTfqZJ+FJ2ScRCyjdv5ehwG21XIiqwCC7
// SIG // QhmbkJqu6giTPOX1C5ZwfUnc7+GOKe+dSZnV7kEQ62c+
// SIG // 4opw3uSC0hU7TRxdzqrzW+vyMfsOLeprM6w0wu5mYdh/
// SIG // ozC9UlXxgh8RKkBLGyu00fS6Bsn+ZLb8Q86dDWfwTWHP
// SIG // iQgqyYeSgr4L7hJR5vU6X/P/EsT2QkPy467YDjRmEjtf
// SIG // nqwkX1WXJcuCoYICKDCCAiQGCSqGSIb3DQEJBjGCAhUw
// SIG // ggIRAgEBMIGOMHcxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xITAf
// SIG // BgNVBAMTGE1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQQIT
// SIG // MwAAAJgEWMt/IwmwngAAAAAAmDAJBgUrDgMCGgUAoF0w
// SIG // GAYJKoZIhvcNAQkDMQsGCSqGSIb3DQEHATAcBgkqhkiG
// SIG // 9w0BCQUxDxcNMTYwNTA1MjAxOTE2WjAjBgkqhkiG9w0B
// SIG // CQQxFgQUwoqkPa6PAOv7H49mvysqVXVMyVgwDQYJKoZI
// SIG // hvcNAQEFBQAEggEASsyevpSM401SabgO2eor9s82meAn
// SIG // GDv/9Dr34+vtfih3MJBudeO9ASJl31oP++Wk+poYD9RC
// SIG // pWDurFsaPruY5bSq22LO4VHz7qcoTr+7nHfRF95Bhr43
// SIG // fFIdCgQlZhYwnKY1cRpDNMg530PDA3yudsnD7b/imB71
// SIG // 7IfJkXJBoVYt3yjSf5Xlo9AqYIcinZ0QsOjeHJLDzGct
// SIG // 1IgvkMqNm2V4858g9EDprJSwCAHQB8STXT9+VxJ3SJmq
// SIG // QZR7eLua9vrsGiXqTUY4t7Dxbsl/Y9s3Vr6haZUD6Gy/
// SIG // ggZqI8smYrgW/wblPkjWz5N/y7728/H3wSSeBnrplY9/
// SIG // BNj/jQ==
// SIG // End signature block

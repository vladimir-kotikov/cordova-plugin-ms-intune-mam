//-----------------------------------------------------------------------------------
// <copyright company="Microsoft" file="plisthelper.js">
//      Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
//-----------------------------------------------------------------------------------

var plistLibrary = require('plist');
var modify = require('./modification.js');
var fs = require('fs');

// Constructs a plist object from a filename and a handle to the Q library.
//  Note: plist object must be loaded via plist.load before use.
// filename: the name of the file to load
// Q: a reference to the Q library
var Plist = function (filename, Q) {
  if (!(this instanceof Plist)) {
    return new Plist(filename, Q);
  }
  this.q = Q;
  this.filepath = filename;
};
// Adds the specified group to keychain-access-groups. Note, this method will prepend '$(AppIdentifierPrefix' to group before adding it.
// group: the group to add
Plist.prototype.addKeyChainAccessGroup = function (group) {
  modify.addToUniqueKeyedArray(this.data, 'keychain-access-groups', '$(AppIdentifierPrefix)' + group);
};

// Returns the bundle identifier from the plist.
// returns: the CFBundleIdentifier
Plist.prototype.getBundleIdentifier = function () {
  return this.data['CFBundleIdentifier'];
};

// Returns the Bundle URL types from the plist.
// returns: the CFBundleURLTypes
Plist.prototype.getURLTypes = function () {
  return this.data['CFBundleURLTypes'];
};

// Returns the URL schemes belonging to a specified URL type.
// urlType: the URL type object to get the URL schemes from
// returns: an array of the CFBundleURLSchemes
Plist.prototype.getURLSchemesFromURLType = function (urlType) {
  if (!urlType || !urlType['CFBundleURLSchemes']) {
    throw new ReferenceError('Invalid argument urlType for getURLSchemeToURLType');
  }

  return urlType['CFBundleURLSchemes'];
};

// Adds a URL scheme to the specified URL type.
// urlType: the URL type object to add the scheme to
// scheme: the scheme to add
Plist.prototype.addURLSchemeToURLType = function (urlType, scheme) {
  if (!urlType || !urlType['CFBundleURLSchemes']) {
    throw new ReferenceError('Invalid argument urlType for addURLSchemeToURLType');
  }
  if (!scheme) {
    throw new ReferenceError('Undefined argument scheme for addURLSchemeToURLType');
  }

  modify.addToUniqueKeyedArray(urlType, 'CFBundleURLSchemes', scheme);
};

// Returns the list of application queries schemes.
// returns: the value of LSApplicationQueriesSchemes
Plist.prototype.getApplicationQueriesSchemes = function () {
  return this.data['LSApplicationQueriesSchemes'];
};

// Adds a scheme to the list of application queries schemes.
// scheme: the scheme to add
Plist.prototype.addApplicationQueriesScheme = function (scheme) {
  if (!scheme) {
    throw new ReferenceError('Undefined argument for addApplicationQueriesScheme');
  }
  modify.addToUniqueKeyedArray(this.data, 'LSApplicationQueriesSchemes', scheme);
};

// Returns the value of the main storyboard file.
// return: the UIMainStoryboardFile
Plist.prototype.getMainStoryboard = function () {
  return this.data['UIMainStoryboardFile'];
};

// Returns the value of the main storyboard file for ipad.
// return: the UIMainStoryboardFile~ipad
Plist.prototype.getMainStoryboardIpad = function () {
  return this.data['UIMainStoryboardFile~ipad'];
};

// Returns the value of the main nib file.
// return: the MSMainnibFile
Plist.prototype.getMainNib = function () {
  return this.data['NSMainnibFile'];
};

// Returns the value of the main nib file for ipad.
// return: the NSMainnibFile~ipad
Plist.prototype.getMainNibIpad = function () {
  return this.data['NSMainnibFile~ipad'];
};

// Removes the key/value pair for the main storyboard file.
Plist.prototype.deleteMainStoryboard = function () {
  delete this.data['UIMainStoryboardFile'];
};

// Removes the key/value pair for the main storyboard file for ipad.
Plist.prototype.deleteMainStoryboardIpad = function () {
  delete this.data['UIMainStoryboardFile~ipad'];
};

// Removes the key/value pair for the main nib file.
Plist.prototype.deleteMainNib = function () {
  delete this.data['NSMainnibFile'];
};

// Removes the key/value pair for the main nib file for ipad.
Plist.prototype.deleteMainNibIpad = function () {
  delete this.data['NSMainnibFile~ipad'];
};

// Returns the value of application-groups
// returns: the value of com.apple.security.application-groups
Plist.prototype.getApplicationGroupsSet = function () {
  return this.data['com.apple.security.application-groups'];
};

// Generic method for maintaining and modifying non-standard Plist entries. Sets data[mapKey][valueKey] = value.
//  This method is not meant to be used to add values to the root of a plist.
// mapKey: the key inside the plist to insert the pair into
// valueKey: the key of the pair to insert
// value: the corresponding value
var addUniqueKeyPairToMap = function (plist, mapKey, valueKey, value) {
  modify.addUniqueKeyedValue(plist.data[mapKey], valueKey, value);
};

// Adds the specified key-value pair to IntuneMAMSettings (creating IntuneMAMSettings if it does not already exist).
// key: the key to set
// value: the corresponding value to set
var addToIntuneMAMSettings = function (plist, key, value) {
  modify.addUniqueKeyedMap(plist.data, 'IntuneMAMSettings');
  addUniqueKeyPairToMap(plist, 'IntuneMAMSettings', key, value);
};

// Adds the key/value value pair to IntuneMAMSettings.
// currentValue: the value to add to IntuneMAMSettings
// intuneKey: the key to store it under
Plist.prototype.addStoryboardOrNibToIntune = function (currentValue, intuneKey) {
  if (!intuneKey) {
    throw new ReferenceError('Undefined argument intuneKey for addStoryboardOrNibToIntuneIfExists');
  }
  if (!currentValue) {
    throw new ReferenceError('Undefined argument currentValue for addStoryboardOrNibToIntuneIfExists');
  }
  addToIntuneMAMSettings(this, intuneKey, currentValue);
};

// Adds an AppGroupIdentifiers key to the IntuneMAMSettings dictionary.
// value: the value to set AppGroupIdentifiers.
Plist.prototype.addAppGroupSettings = function (value) {
  if (!value) {
    throw new ReferenceError('Undefined argument for addAppGroupSettings');
  }
  addToIntuneMAMSettings(this, 'AppGroupIdentifiers', value);
};

// Loads the file this object was constructed with and parses/stores the data.
// returns: a Q promise which resolves when the loading is complete (and returns this back to the next in the chain)
Plist.prototype.load = function () {
  var plist = this;
  console.log('Reading file from path: ./platforms/ios/' + this.filepath);
  return this.q.ninvoke(fs, 'readFile', './platforms/ios/' + this.filepath, 'utf8')
    .then(function (file) {
      plist.data = plistLibrary.parse(file);
      return plist;
    });
};

// Writes out the updated file to the same location it was read from.
// returns: a Q promise which resolves when the saving is complete
Plist.prototype.save = function () {
  return this.q.nfcall(fs.writeFile, './platforms/ios/' + this.filepath, plistLibrary.build(this.data));
};

module.exports = Plist;

// SIG // Begin signature block
// SIG // MIIdpgYJKoZIhvcNAQcCoIIdlzCCHZMCAQExCzAJBgUr
// SIG // DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
// SIG // gjcCAR4wJAIBAQQQEODJBs441BGiowAQS9NQkAIBAAIB
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFAqGX1SOy+wf
// SIG // LMOLhH0ubVK43/u7oIIYZDCCBMMwggOroAMCAQICEzMA
// SIG // AACdQmjuMRzXVr0AAAAAAJ0wDQYJKoZIhvcNAQEFBQAw
// SIG // dzELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEhMB8GA1UEAxMYTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgUENBMB4XDTE2MDMzMDE5
// SIG // MjEzMFoXDTE3MDYzMDE5MjEzMFowgbMxCzAJBgNVBAYT
// SIG // AlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQH
// SIG // EwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
// SIG // cG9yYXRpb24xDTALBgNVBAsTBE1PUFIxJzAlBgNVBAsT
// SIG // Hm5DaXBoZXIgRFNFIEVTTjoxNDhDLUM0QjktMjA2NjEl
// SIG // MCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAgU2Vy
// SIG // dmljZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
// SIG // ggEBAMvD7zaof/MpdTK2RrztdfdLzaj+0Eta6aPh4Pfn
// SIG // 9lTn/y1k7EKBtBQzsLECgwQsqzbuU1XOPgOGbr6jfu7q
// SIG // dmSK9xbVULAH9SukyUgadiVrp47MFQbuO1AHz+PTwyAS
// SIG // 6A7dWOGl8yPvTSW4mk8F46LOs2AykPr+tzTumBMnx3zq
// SIG // Xm6+/YKmzYIT79YYvbYQbbxzG18JFGUZpK2r6rw/Ayoh
// SIG // RpgTDoPyLjfBvzDxIXSJp5ZGBQXZ1uD9CvURc76wAVph
// SIG // 98NhhLp2sXDgJqG/cW2WUfFX7a32AjZHx0xWBp2jTYEa
// SIG // ldaxBbfOuq3vLnscjYzlX5kffiQSlBWwNBCzD5UCAwEA
// SIG // AaOCAQkwggEFMB0GA1UdDgQWBBRk6k/zPCryhAlgdAYV
// SIG // RgyudvnzOjAfBgNVHSMEGDAWgBQjNPjZUkZwCu1A+3b7
// SIG // syuwwzWzDzBUBgNVHR8ETTBLMEmgR6BFhkNodHRwOi8v
// SIG // Y3JsLm1pY3Jvc29mdC5jb20vcGtpL2NybC9wcm9kdWN0
// SIG // cy9NaWNyb3NvZnRUaW1lU3RhbXBQQ0EuY3JsMFgGCCsG
// SIG // AQUFBwEBBEwwSjBIBggrBgEFBQcwAoY8aHR0cDovL3d3
// SIG // dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNyb3Nv
// SIG // ZnRUaW1lU3RhbXBQQ0EuY3J0MBMGA1UdJQQMMAoGCCsG
// SIG // AQUFBwMIMA0GCSqGSIb3DQEBBQUAA4IBAQA/XRxIfkcv
// SIG // 2gydWAEcwbExnqbZ0QTu9xfz+8BfHQu50zzRVKrWYTsm
// SIG // pEvDQP2cMO+J+IL5tQFnxxozdQKPDYi9yesBZpjjfzxF
// SIG // HVwNs1hWIYHkXgj5gE28DTdON3nB4ho1jvknjGKb5dRu
// SIG // JmtDSFCWrvQ5k5H2jLzTCvv6zZY69zEfG8bEjmccdolI
// SIG // mrTdHHjJiD+YEvb1KQ8U2ZMVbDHwOZ+t49fEzneDCc/h
// SIG // tCOtsqiL7WMuxk8d/EheeuOeMKjJ4ImHKjNgY7+sbtRs
// SIG // h01B+7/5dtSQXHiLdN4JrCIZSzaPMyItul+g9bBggRGV
// SIG // dWFMkAvSFdh+tua1VMhWZPH+MIIGBzCCA++gAwIBAgIK
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
// SIG // hvcNAQkEMRYEFIKaKwJ74Cg2g+KvspHzGFSzgXZnMGIG
// SIG // CisGAQQBgjcCAQwxVDBSoDSAMgBNAGkAYwByAG8AcwBv
// SIG // AGYAdAAgAEMAbwByAHAAbwByAGEAdABpAG8AbgAgACgA
// SIG // UgApoRqAGGh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbTAN
// SIG // BgkqhkiG9w0BAQEFAASCAQASr8OI2+Gih36kV2kQOjQr
// SIG // hany07lWHSnH/1dsKGnhMkqsjJjhKVetnF6bgOAnSGhh
// SIG // gXINGl6NJ2NyoJUkfGZ+EKfNT5elBhTAmVMz8rgOpKZ1
// SIG // HreyKJTBOi2bl7puu5z7jBiHG+/c3KR+PLRGxrIAZBM6
// SIG // ECCome4KrVfKca2l4tUo6wXKE4vNyLXaUnbR4g1NKjqH
// SIG // wx5EyOieUAeuuT8l8znJ1Q1XRKPqjJx43+Tl8TgZgQvk
// SIG // Et4i/jOZeFkgK4RLFB8+Fnn1rN4AfH45dV/Ycka2jotg
// SIG // rn5E6QxZwHpFLLrkyTPdJ/0CeCFyWo+MYxcyb7dwFYbm
// SIG // tjJFvqSFH9hfoYICKDCCAiQGCSqGSIb3DQEJBjGCAhUw
// SIG // ggIRAgEBMIGOMHcxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xITAf
// SIG // BgNVBAMTGE1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQQIT
// SIG // MwAAAJ1CaO4xHNdWvQAAAAAAnTAJBgUrDgMCGgUAoF0w
// SIG // GAYJKoZIhvcNAQkDMQsGCSqGSIb3DQEHATAcBgkqhkiG
// SIG // 9w0BCQUxDxcNMTYwNTA1MjAxOTEzWjAjBgkqhkiG9w0B
// SIG // CQQxFgQU7aIOwPaYCSguOQvtiliQA+6U/dEwDQYJKoZI
// SIG // hvcNAQEFBQAEggEAsCXx918ZeXDamvi9lKpSsXmoQ4uM
// SIG // HaWQutcGpe1cTVrUWbaJMHox6F9uVTbFsDP6VqLYrfVd
// SIG // mbjEplp2W6Hmg/gvUJ4j2MRMC0qYgAX2JCzdoEZEUJHP
// SIG // Ij/m8a+RqdD7sKYbv8IwaFmy0ZT+fMu9uzLn8j5JKxwa
// SIG // BaRtLBbRz8IQNYLxjtS5QhQc0GJQXIDFCI1tTv56G0cY
// SIG // wizBMoNbiLvwOTGliLiQpYvO+mGTCAE3ZdP6xV4G4D6m
// SIG // KWF+4SJGopmZRkVMaMZqrZQQx3cz9Pwcfjx7nHCblGhH
// SIG // 3f5kkdEm96jvaMxP+XuJnGHNAB96egVVnSle48ECABah
// SIG // SlcKxw==
// SIG // End signature block

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
// urlType: the URL type to get the URL schemes for
// returns: an array of the CFBundleURLSchemes
Plist.prototype.getURLSchemesFromURLType = function (urlType) {
  return this.data['CFBundleURLTypes'][urlType]['CFBundleURLSchemes'];
};

// Adds a URL scheme to the specified URL type.
// urlType: the URL type to add the scheme to
// scheme: the scheme to add
Plist.prototype.addURLSchemeToURLType = function (urlType, scheme) {
  modify.addToUniqueKeyedArray(this.data['CFBundleURLTypes'][urlType], 'CFBundleURLSchemes', scheme);
};

// Returns the list of application queries schemes.
// returns: the value of LSApplicationQueriesSchemes
Plist.prototype.getApplicationQueriesSchemes = function () {
  return this.data['LSApplicationQueriesSchemes'];
};

// Adds a scheme to the list of application queries schemes.
// scheme: the scheme to add
Plist.prototype.addApplicationQueriesScheme = function (scheme) {
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
Plist.prototype.addStoryboardOrNibToIntuneIfExists = function (currentValue, intuneKey) {
  if (currentValue) {
    addToIntuneMAMSettings(this, intuneKey, currentValue);
  }
};

// Adds an AppGroupIdentifiers key to the IntuneMAMSettings dictionary.
// value: the value to set AppGroupIdentifiers.
Plist.prototype.addAppGroupSettings = function (value) {
  addToIntuneMAMSettings(this, 'AppGroupIdentifiers', value);
};

// Loads the file this object was constructed with and parses/stores the data.
// returns: a Q promise which resolves when the loading is complete (and returns this back to the next in the chain)
Plist.prototype.load = function () {
  var plist = this;
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
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFCt56mRdBYQt
// SIG // neMR3BzEIDd5q/ayoIIYZDCCBMMwggOroAMCAQICEzMA
// SIG // AACc7v4UValdNVAAAAAAAJwwDQYJKoZIhvcNAQEFBQAw
// SIG // dzELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEhMB8GA1UEAxMYTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgUENBMB4XDTE2MDMzMDE5
// SIG // MjEzMFoXDTE3MDYzMDE5MjEzMFowgbMxCzAJBgNVBAYT
// SIG // AlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQH
// SIG // EwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
// SIG // cG9yYXRpb24xDTALBgNVBAsTBE1PUFIxJzAlBgNVBAsT
// SIG // Hm5DaXBoZXIgRFNFIEVTTjo1ODQ3LUY3NjEtNEY3MDEl
// SIG // MCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAgU2Vy
// SIG // dmljZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
// SIG // ggEBAMwlhsl+iHoEj/vklU9epTLAab6xrU1GWdPtri0X
// SIG // lXXCMHd2091EB93Uff8GMa0sSf786tMU1N48+M230myS
// SIG // iD2LhwqTOH+Wtrc7v555A64ftHgB3Tc7LuyveruJiWU7
// SIG // iGI15VE7d64pXCwmFZs4K9MbvbPBtBKuu76g8rl7jG2p
// SIG // 8o7lEj/f2zhzZtxVW0XTnLCg2y34ziccn4ieu78n2xHP
// SIG // emwVbpUZv+hTb1+ewejzeMMwiURNM4oQLKdHRDqDccaW
// SIG // dOU+iQbhgUshhWzdmlwnrRfbPvS0ezij1zAE4GnvjMtG
// SIG // xRLA8t7CfM/J1FW7ktvNOThFdvqZVRFYbMQsiYkCAwEA
// SIG // AaOCAQkwggEFMB0GA1UdDgQWBBQ9XziJKANTiL5XmMZp
// SIG // /vYFXJZLLjAfBgNVHSMEGDAWgBQjNPjZUkZwCu1A+3b7
// SIG // syuwwzWzDzBUBgNVHR8ETTBLMEmgR6BFhkNodHRwOi8v
// SIG // Y3JsLm1pY3Jvc29mdC5jb20vcGtpL2NybC9wcm9kdWN0
// SIG // cy9NaWNyb3NvZnRUaW1lU3RhbXBQQ0EuY3JsMFgGCCsG
// SIG // AQUFBwEBBEwwSjBIBggrBgEFBQcwAoY8aHR0cDovL3d3
// SIG // dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNyb3Nv
// SIG // ZnRUaW1lU3RhbXBQQ0EuY3J0MBMGA1UdJQQMMAoGCCsG
// SIG // AQUFBwMIMA0GCSqGSIb3DQEBBQUAA4IBAQBW9mryWArT
// SIG // QwTRt58bLNWamRLKYRBK7V4/jFUv0R3jt027EwgUYa/L
// SIG // EWspXTacTuw6feQf/Ov68BRuktDg4eLL7sMBFl+oSuK7
// SIG // 4rT4+rVGDt3ZL4likaHyLofibFnlxCHa9893BvwIQrq8
// SIG // OOyT+j2l5f7tesai2vrhS7krO3Le7H+DoJM+bvZc9/9K
// SIG // +WyVFpHqY9wXqNLTBX0rql19kWdzw3WNHzkui86g8mw1
// SIG // T4ez07TsJEHqKzpEAv/8j5vIJsr+h+Hp19UdUcDPtExi
// SIG // XXJKoIcLFLYxTLZ2axLwxuFSwOqwzpSNPG8sWnYUGupP
// SIG // TBbE37m8UOHC2xm7iFh+XejuMIIGBzCCA++gAwIBAgIK
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
// SIG // hvcNAQkEMRYEFEwGrDDcxOL9+zSYK8ZiwC0VAadPMGIG
// SIG // CisGAQQBgjcCAQwxVDBSoDSAMgBNAGkAYwByAG8AcwBv
// SIG // AGYAdAAgAEMAbwByAHAAbwByAGEAdABpAG8AbgAgACgA
// SIG // UgApoRqAGGh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbTAN
// SIG // BgkqhkiG9w0BAQEFAASCAQAPp0kGPNEOfZh6eITepOyq
// SIG // MO5fDLp5YfM0C+tZGepRGHNB4wObQUfp/poiqnpkdOHn
// SIG // kN07FongyekgQ/Jv15CmmRrdi3aR7xFP7l/Uqaw070u3
// SIG // AZCVapIcicM56XODmhTCmTYs3DdG8Qh79Wnegjc+ZIjo
// SIG // o0/E3iAsLsBVRKrevSNjmN1D8dqXUEloAJn/OVyUlLUz
// SIG // YMopMg3txBzKtRudYwdelusTFjbLUTSmVZTApC54n0Mi
// SIG // dK3f2y5j05JRL8H7rRGsdwTDiWtvG30XGm7AXGEDd7W7
// SIG // NL/5YiNgS/nwbhW1LfkrrGN8OCD5DEoCKBVBMciv22t4
// SIG // U5hclYrS9Zh1oYICKDCCAiQGCSqGSIb3DQEJBjGCAhUw
// SIG // ggIRAgEBMIGOMHcxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xITAf
// SIG // BgNVBAMTGE1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQQIT
// SIG // MwAAAJzu/hRVqV01UAAAAAAAnDAJBgUrDgMCGgUAoF0w
// SIG // GAYJKoZIhvcNAQkDMQsGCSqGSIb3DQEHATAcBgkqhkiG
// SIG // 9w0BCQUxDxcNMTYwNDE0MTYwNDU2WjAjBgkqhkiG9w0B
// SIG // CQQxFgQUtPzbnfuUI0ZOhNgfN6uM9TaTiNkwDQYJKoZI
// SIG // hvcNAQEFBQAEggEAA/R2eJu9VNLbbMKALj3s8RdLnYxZ
// SIG // OiVBu1uyJHbpsACyVK0J5+kDJ8TVNAItfM1hmaqEl0Aw
// SIG // DO2wgMutTczDN/wmP84Y2op2ncx7EiHggVDv1BaGRc1v
// SIG // g05jOak+QbeuybLIkbc1RZoARecb0cBzbl5l4/2FR+1f
// SIG // y3thP039Ure7z2ffgQSeU6L5TxXpyzTmkCtF/+lsfIcu
// SIG // zFXSSL064tyGmaidaZghXNEk9NB6a61u8MmG5SWRqaYD
// SIG // nc1VbhWjoClnT/4l8aiDdCbtBOIe9vmI/iy2wwRJmBK7
// SIG // NRNNmkBlkMZjCsWSif/aj3W1H0psY8Ov2gFpl3T0Otfd
// SIG // uc702g==
// SIG // End signature block

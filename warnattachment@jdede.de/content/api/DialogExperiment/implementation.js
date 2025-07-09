// A basic UI for blocking dialogs
//
var { ExtensionCommon } = ChromeUtils.importESModule("resource://gre/modules/ExtensionCommon.sys.mjs");
var Services = globalThis.Services || ChromeUtils.importESModule(
  "resource://gre/modules/Services.sys.mjs"
).Services;


var DialogExperiment = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      DialogExperiment: {
        async getWarningDialog(title, text, checkboxhint){
            var check = {value: false};
            Services.prompt.alertCheck(null, title, text, checkboxhint, check);
            return check.value;
        },
        async getBlockingDialog(title, text){
            Services.prompt.alert(null, title, text)
        }
      }
    };
  }
};

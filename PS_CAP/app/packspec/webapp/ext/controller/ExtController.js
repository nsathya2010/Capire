sap.ui.define([
    "sap/m/MessageToast"
], function(MessageToast) {
    'use strict';

    return {
        UploadExcel: function(oEvent) {
            MessageToast.show("Custom handler invoked.");
        }
    };
});

/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"orion/maintreq/manage/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("orion.maintreq.manage.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// config.setApplicationFullWidth(true);
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			this.getModel().setDeferredGroups(["Changes"]);
			this.getModel().setChangeGroups({
				"*": {
					groupId: "Changes",
					changeSetId: "Changes",
					single: false
				}
			});
		}
	});
});
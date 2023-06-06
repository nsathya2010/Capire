/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"orion/maintreq/manage/controller/BaseController",
	"orion/maintreq/manage/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"orion/maintreq/manage/util/Constants"
], function (BaseController, formatter, Filter, FilterOperator, Constants) {
	"use strict";

	return BaseController.extend("i2d.eam.malfunction.manages1.controller.fragments.CurrentWorkRequests", {
		formatter: formatter,

		onInit: function () {
			this.getRouter().getRoute("showCurrentWorkRequests").attachMatched(this._onRouteMatched, this);
		},

		/**
		 * called when the show current wr link is pressed
		 */
		_onRouteMatched: function () {
			var that = this;
			this.getView().getModel().metadataLoaded().then(function () {
				return that.parentBindingContextAvailable(Constants.ENTITY.WORK_REQUEST_TP);
			}).then(function () {

				that._oCreateWorkRequestView = that.getView().getParent().getParent();
				that._oWorkRequest = that.getView().getBindingContext().getObject();
				var oList = that.getView().byId("CreateWrListCurrentNotifications");
				var oPopover = that.getView().byId("CreateWrRespPopoverCurrentNotifs");
				if (that._sTechnicalObject !== that._oWorkRequest.TechnicalObject || that._sTechObjIsEquipOrFuncnlLoc !== that._oWorkRequest
					.TechObjIsEquipOrFuncnlLoc) {
					that._sTechnicalObject = that._oWorkRequest.TechnicalObject;
					that._sTechObjIsEquipOrFuncnlLoc = that._oWorkRequest.TechObjIsEquipOrFuncnlLoc;

					oList.removeAllItems();
					oPopover.setBusy(true);

					oList.getBinding("items").attachEventOnce("change", function () {
						oPopover.setBusy(false);
					}, this);
					var aFilters = [
						new Filter({
							path: "IsActiveEntity",
							operator: FilterOperator.EQ,
							value1: true
						}),
						new Filter({
							path: "TechnicalObject",
							operator: FilterOperator.EQ,
							value1: that._sTechnicalObject
						}), new Filter({
							path: "TechObjIsEquipOrFuncnlLoc",
							operator: FilterOperator.EQ,
							value1: that._sTechObjIsEquipOrFuncnlLoc
						}),
						new Filter({
							path: "NotifProcessingPhase",
							operator: FilterOperator.LE,
							value1: Constants.WORK_REQUEST_STATUS.CURRENT
						})
					];
					oList.getBinding("items").filter(aFilters);
				}

				oPopover.openBy(that._oCreateWorkRequestView.byId(
					"CreateWrCurrentNotificationsLink"));
			});
		},

		onAfterClose: function () {
			this.getRouter().navTo("draft", {
				DraftUUID: encodeURIComponent(this._oWorkRequest.DraftUUID)
			}, true);
			// this.getRouter().navTo("RouteCreateWorkRequest", {}, true /*no history*/ );
		}
	});

});
/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */

sap.ui.define(["sap/ui/core/util/MockServer"], function (MockServer) {
	"use strict";
	var oMockServer,
		_sAppModulePath = "orion/maintreq/manage/",
		_sJsonFilesModulePath = _sAppModulePath + "localService/mockdata",
		_sMainEventPriozPrflJson = "MaintEvtPrioznPrfl.json",
		_EventPrioritizationMetadataPath = "localService/EventPrioritizationMetadata",
		_EventPrioritizationServiceUrl = "/sap/opu/odata4/sap/ui_prioritization_profile/srvd_a2x/sap/ui_prioritization_profile/0001/";
	return {
		/**
		 * Initializes the mock server.
		 * You can configure the delay with the URL parameter "serverDelay".
		 * The local mock data in this folder is returned instead of the real data for testing.
		 * @public
		 */
		_getResponseJson: function (sEntityName) {
			return jQuery.sap.sjax({
				url: jQuery.sap.getModulePath(_sJsonFilesModulePath) +
					"/" + sEntityName,
				dataType: "json"
			});
		},
		init: function () {
			// configure mock server for event prioritization service

			var sMetadataUrl = jQuery.sap.getModulePath(
					_sAppModulePath + _EventPrioritizationMetadataPath,
					".xml"
				),
				sJsonFilesUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath),
				sMockServerUrl = _EventPrioritizationServiceUrl;
			oMockServer = new MockServer({
				rootUri: sMockServerUrl
			});

			// load local mock data

			oMockServer.simulate(sMetadataUrl, {
				sMockdataBaseUrl: sJsonFilesUrl,
				bGenerateMissingMockData: true
			});

			var aRequests = oMockServer.getRequests();
			var sResponse = this._getResponseJson(_sMainEventPriozPrflJson).data;
			var iResponse = sResponse.value.length;
			
			aRequests.push({
				method: "GET",
				path: new RegExp("MaintEvtPrioznPrfl.*"),
				response: function (oXhr) {
					var oResponse = {
						headers: {
							"Content-Type": "application/json"
						},
						status: "200",
						statusText: "OK"
					};
					if(oXhr.url.includes("$count")){
						oResponse.data = iResponse;
					} else{
						oResponse.data = sResponse;
					}
					oXhr.respond(
						oResponse.status,
						oResponse.headers,
						JSON.stringify(oResponse.data)
					);
					return true;	
				}
			});
			aRequests.push({
				method: "POST",
				path: new RegExp("MaintEvtPrioznPrfl/SAP__self.CalculateMaintEventPriority.*"),
				response: function (oXhr) {
					jQuery.sap.log.debug(
						"Mock Server: Incoming request for external resource"
					);
					var oResponse = {
						data: {
							value:[
								{
									MAINTPRIORITY:"1",
									MAINTPRIORITYDESC:"high",
									LACD_DATE:"12-10-2020",
									LEADING_VALUES:[
										{
											MAINTEVENTCNSQNCCATEGORYCODE:"1",
											MAINTEVENTCONSEQUENCECODE:"2",
											MAINTEVENTLIKELIHOODCODE:"3"
										}]
								}
								]
						},
						headers: {
							"Content-Type": "application/json"
						},
						status: "200",
						statusText: "OK"
					};
					oXhr.respond(
						oResponse.status,
						oResponse.headers,
						JSON.stringify(
							oResponse.data
						)
					);
					return true;
				}

			});
			oMockServer.setRequests(aRequests);
			oMockServer.start();
		}
	};
});
/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/util/MockServer"], function (MockServer) {
	"use strict";
	var oMockServer,
		_sAppModulePath = "orion/maintreq/manage/",
		_sJsonFilesModulePath = _sAppModulePath + "localService/mockdata",
		_sRootView = "C_MaintWorkRequestOverviewTP.json";
	var ENTITY_SETS_TO_MOCK = ["C_MaintWorkRequestOverviewTP", "C_MaintWorkRequestDamageCodeVH",
		"C_TechObjFlatVH", "C_WorkReqTextTemplateVH", "I_DraftAdministrativeData",
		"I_MalfunctionEffectStdVH", "I_PMNotificationPriority"
	];
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
			var oUriParameters = jQuery.sap.getUriParameters(),
				sJsonFilesUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath),
				sManifestUrl = jQuery.sap.getModulePath(
					_sAppModulePath + "manifest",
					".json"
				),
				sEntity = "C_MaintWorkRequestOverviewTP",
				sErrorParam = oUriParameters.get("errorType"),
				iErrorCode = sErrorParam === "badRequest" ? 400 : 500,
				oManifest = jQuery.sap.syncGetJSON(sManifestUrl).data,
				oDataSource = oManifest["sap.app"].dataSources,
				oMainDataSource = oDataSource.mainService,
				sMetadataUrl = jQuery.sap.getModulePath(
					_sAppModulePath +
					oMainDataSource.settings.localUri.replace(".xml", ""),
					".xml"
				),
				// ensure there is a trailing slash
				sMockServerUrl = /.*\/$/.test(oMainDataSource.uri) ? oMainDataSource.uri : oMainDataSource.uri + "/",
				aAnnotations = oMainDataSource.settings.annotations;

			oMockServer = new MockServer({
				rootUri: sMockServerUrl
			});

			// configure mock server with a delay of 1s
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: oUriParameters.get("serverDelay") || 1000
			});

			// load local mock data
			oMockServer.simulate(sMetadataUrl, {
				sMockdataBaseUrl: sJsonFilesUrl,
				bGenerateMissingMockData: true,
				aEntitySetsNames: ENTITY_SETS_TO_MOCK
			});

			var aRequests = oMockServer.getRequests(),

				fnResponse = function (iErrCode, sMessage, aRequest) {
					aRequest.response = function (oXhr) {
						oXhr.respond(
							iErrCode, {
								"Content-Type": "text/plain;charset=utf-8"
							},
							sMessage
						);
					};
				};
			aRequests.push({
				method: "POST",
				path: new RegExp("C_MaintWorkRequestOverviewTPPrepare.*"),
				response: function (oXhr) {
					var oResponse = {
						data: {
							C_MaintWorkRequestOverviewTPPrepare: {
								__metadata: {
									type: "cds_ui_maintworkrequestoverview.DummyFunctionImportResult"
								},
								IsInvalid: false
							}
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
						JSON.stringify({
							d: oResponse.data
						})
					);
				}
			});
			var sResponse = this._getResponseJson(_sRootView);
			aRequests.push({
				method: "POST",
				path: new RegExp("C_MaintWorkRequestOverviewTPActivate.*"),
				response: function (oXhr) {
					jQuery.sap.log.debug(
						"Mock Server: Incoming request for external resource"
					);
					var oResponse = {
						data: sResponse.data[5],
						headers: {
							"Content-Type": "application/json",
							"sap-message": JSON.stringify({
								code: "EAMS_BO/502",
								message: "Work request 10094460 saved.",
								severity: "success",
								target: "",
								transition: true,
								details: []
							}),
							location: "/C_MaintWorkRequestOverviewTP(MaintenanceNotification='%2500000000001',DraftUUID=guid'00000000-0000-0000-0000-000000000000',IsActiveEntity=true)"
						},
						status: "200",
						statusText: "OK"
					};
					oXhr.respond(
						oResponse.status,
						oResponse.headers,
						JSON.stringify({
							d: oResponse.data
						})
					);
					return true;
				}
			});
			aRequests.push({
				method: "POST",
				path: new RegExp("C_MaintWorkRequestOverviewTP"),
				response: function (oXhr) {
					jQuery.sap.log.debug(
						"Mock Server: Incoming request for external resource"
					);
					var oResponse = {
						data: sResponse.data[0],
						headers: {
							"Content-Type": "application/json",
							location: sResponse.data[0].__metadata.uri
						},
						status: "201",
						statusText: "Created"
					};
					oXhr.respond(
						oResponse.status,
						oResponse.headers,
						JSON.stringify({
							d: oResponse.data
						})
					);
					return true;
				}
			});
			aRequests.push({
				method: "MERGE",
				path: new RegExp("C_MaintWorkRequestOverviewTP.*"),
				response: function (oXhr) {
					jQuery.sap.log.debug(
						"Mock Server: Incoming request for external resource"
					);
					var oResponse = {
						headers: {},
						status: "204",
						statusText: "No Content"
					};
					oXhr.respond(
						oResponse.status,
						oResponse.headers
					);
					return true;
				}
			});
			oMockServer.setRequests(aRequests);
			// handling the metadata error test
			if (oUriParameters.get("metadataError")) {
				aRequests.forEach(function (aEntry) {
					if (aEntry.path.toString().indexOf("$metadata") > -1) {
						fnResponse(500, "metadata Error", aEntry);
					}
				});
			}

			// Handling request errors
			if (sErrorParam) {
				aRequests.forEach(function (aEntry) {
					if (aEntry.path.toString().indexOf(sEntity) > -1) {
						fnResponse(iErrorCode, sErrorParam, aEntry);
					}
				});
			}
			oMockServer.start();

			jQuery.sap.log.info("Running the app with mock data");

			if (aAnnotations && aAnnotations.length > 0) {
				aAnnotations.forEach(function (sAnnotationName) {
					var oAnnotation = oDataSource[sAnnotationName],
						sUri = oAnnotation.uri,
						sLocalUri = jQuery.sap.getModulePath(
							_sAppModulePath +
							oAnnotation.settings.localUri.replace(".xml", ""),
							".xml"
						);

					// backend annotations
					new MockServer({
						rootUri: sUri,
						requests: [{
							method: "GET",
							path: new RegExp("([?#].*)?"),
							response: function (oXhr) {
								jQuery.sap.require("jquery.sap.xml");

								var oAnnotations = jQuery.sap.sjax({
									url: sLocalUri,
									dataType: "xml"
								}).data;

								oXhr.respondXML(
									200, {},
									jQuery.sap.serializeXML(oAnnotations)
								);
								return true;
							}
						}]
					}).start();
				});
			}
			this._createMockServerForOtherServices();
		},

		_createMockServerForOtherServices: function () {
			new MockServer({
				rootUri: "/sap/opu/odata/SAP/CA_FM_FEATURE_TOGGLE_STATUS_SRV/",
				requests: [{
					method: "GET",
					path: new RegExp(".*"),
					response: function (oXhr) {
						oXhr.respondJSON(
							200, {}, {
								d: {
									results: []
								}
							}
						);
						return true;
					}
				}]
			}).start();

		},
		/**
		 * @public returns the mockserver of the app, should be used in integration tests
		 * @returns {sap.ui.core.util.MockServer}
		 */
		getMockServer: function () {
			return oMockServer;
		}
	};
});
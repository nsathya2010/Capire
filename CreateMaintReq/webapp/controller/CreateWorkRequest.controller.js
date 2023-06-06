/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"./BaseController",
	"orion/maintreq/manage/controls/TechnicalObjectValueHelp",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"orion/maintreq/manage/model/formatter",
	"sap/ui/core/message/Message",
	"sap/ui/core/library",
	"orion/maintreq/manage/util/Constants",
	"sap/ui/model/Sorter",
	"sap/ui/generic/app/ApplicationController",
	"orion/maintreq/manage/util/DraftHandler",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/odata/type/String",
	"sap/ui/model/ValidateException",
	"orion/maintreq/manage/controls/EventPrioritizationDialog",
	"sap/ui/model/odata/ODataPropertyBinding",
	"orion/maintreq/manage/util/NotificationConsequencePersistenceHelper",
	"sap/fe/navigation/NavigationHandler",
	"sap/base/Log"
], function (BaseController, TechnicalObjectValueHelp, MessageToast, JSONModel, Filter, FilterOperator, formatter, Message, Library,
	Constants, Sorter, ApplicationController, DraftHandler, DateFormat, String, ValidateException, EventPrioritizationDialog,
	ODataPropertyBinding, NotificationConsequencePersistenceHelper, NavigationHandler, Log) {
	"use strict";

	return BaseController.extend("orion.maintreq.manage.controller.CreateWorkRequest", {
		// formatter
		formatter: formatter,
		// shortcut for sap.ui.core.MessageType
		messageType: Library.MessageType,
		// technical object value help
		_oTechnicalObjectValueHelp: null,
		// fiori lpd user id
		_sCurUserId: "",
		// fiori lpd user name
		_sCurUserName: "",
		// current failure mode group
		_failureModeGroup: "",
		// local json model
		_oLocalViewModel: null,
		// faikure mode smartfield
		_oFailureModeField: null,
		// failure mode group smartfield
		_oFailureModeCodeGroupField: null,
		// failure mode internal combobox
		_oFailureModeComboBox: null,
		// error counts for internally generated messages
		_fieldsWithErrors: 0,
		// application controller instance
		_oApplicationController: null,
		// draft handler utillity
		_oDraftHandler: null,
		// CatalogProfile Field Binding
		_oCatalogProfileBinding: null,
		// Event Prioritization Dialog
		_oEPMDialog: null,
		_myReqestsRadioBtnChanged: null,
		// flag to check if event prioritization was used
		_isEPMSelected: false,
		_selectedTechObj: null,
		_linkForHelpDocument: null,
		_FirstRun: true, // Global variable for First Run
		_NotificationConsequencePersistenceHelper: null,
		bPendingReadTeamplates: false,
		bNewDraft: false,
		bNotificationTypeChanged: false,
		oUserDefaults: null,
		maintanceReqestCreated: false,
		onInit: function () {
			var oRouter = this.getRouter();
			// Fetching i18n bundle to generate a function for fetching translated value
			var oI18n = this.getOwnerComponent().getModel("i18n");
			var oResourceBundle = oI18n.getResourceBundle();
			this._i18n = oResourceBundle.getText.bind(oResourceBundle);
			this.oModel = this.getOwnerComponent().getModel();

			if (this.getMyComponent().getComponentData() && this.getMyComponent().getComponentData().startupParameters && this.getMyComponent()
				.getComponentData().startupParameters) {
				//if the component data exists, we are assuming we are in the UYT env or CCF
				// and the startup parameters are ready to use.
				this._oStartupParameters = this.getMyComponent().getComponentData().startupParameters;
			} else {
				this._oStartupParameters = {};
				//this data does not exist in the local WEB-IDE environment, hence will be hardcoded here
				this._oStartupParameters.source = ["lpd"];
				this._oStartupParameters.NotificationType = ["M1"];
			}

			this._setFailureModeFieldsInstances();
			this._setupTechnicalObjectValueHelp();
			this._setupLongTextField();
			// initalise event to adding counter to long text field
			this._setupLongTextFieldCount();
			// this._sortDetectionCodes();
			oRouter.getRoute("RouteCreateWorkRequest").attachMatched(this.onCreateWorkRequestMatched, this);
			oRouter.getRoute("draft").attachMatched(this.onDraftRouteMatched, this);
			// set message model
			var oMessageManager = sap.ui.getCore().getMessageManager();
			this.getView().setModel(oMessageManager.getMessageModel(), "message");
			//Register the view by the message manager
			oMessageManager.registerObject(this.getView(), true);
			this._setupUserDefaults();
			var oHashObject = new sap.ui.core.routing.HashChanger();
			var sAction = new sap.ushell.services.URLParsing().parseShellHash(oHashObject.getHash()).action;
			if (sAction === "display") {
				this.getView().byId("idIconTabBar").setSelectedKey("tab2");
				this.goToTab2();
			}

			//this._PlantValueDropDownSet();

		},


		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 */
		onExit: function () {
			if (this._oTechnicalObjectValueHelp) {
				this._oTechnicalObjectValueHelp.destroy();
			}
			if (this._oEPMDialog) {
				this._oEPMDialog.destroy();
			}
			if (this._oCatalogProfileBinding) {
				this._oCatalogProfileBinding.destroy();
			}
			if (this._oMaintNotificationCatalogBinding) {
				this._oMaintNotificationCatalogBinding.destroy();
			}
			if (this._oDetectionCodeBinding) {
				this._oDetectionCodeBinding.destroy();
			}
			if (this._oDraftHandler) {
				this._oDraftHandler.destroy();
			}

		},
		onPressHelpButton: function () {
			this.getView().refresh();

			if (this._linkForHelpDocument) {
				sap.m.URLHelper.redirect(this._linkForHelpDocument, true);
			}
			// var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZPM_NOTIF_SEND_MAIL_SRV");
			// oDataModel.callFunction("/Notif_Trigger_email", {
			// 	method: "GET",
			// 	urlParameters: {
			// 		NotifNum: '10000555'
			// 	},
			// 	success: function (oData) {
			// 		console.log(oData);

			// 	},
			// 	error: function (oError) {
			// 		console.log(oError);
			// 	}
			// });


		},
		setCustomDefaults: function () {
			if (this.oModel.getProperty(this.getView().getBindingContext().getPath() + "/NotificationType") != "M1") {
				this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/NotificationType", "M1");		//Defaulting the Notification type	
			}

			// Based on sematic Object, Action Load tab2
			this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/MaintPriority", "4"); // 4-Low
			if (this._FirstRun) {
				this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/MaintenancePlanningPlant", "");
				this._FirstRun = false;
			}
		},
		onAfterRendering: function () {
			// The view has now been fully initialized, so the getModel() method will return the model.
			this._PlantValueDropDownSet();
		},

		_PlantValueDropDownSet: function () {
			var sPath = "/C_MaintenancePlanPlantVH";

			var newFilter = new Filter({
				filters: [
					new Filter({ path: 'MaintenancePlanningPlant', operator: FilterOperator.EQ, value1: '1010' }),
					new Filter({ path: 'MaintenancePlanningPlant', operator: FilterOperator.EQ, value1: '1011' }),
					new Filter({ path: 'MaintenancePlanningPlant', operator: FilterOperator.EQ, value1: '1015' }),
					new Filter({ path: 'MaintenancePlanningPlant', operator: FilterOperator.EQ, value1: '1020' }),
					new Filter({ path: 'MaintenancePlanningPlant', operator: FilterOperator.EQ, value1: '1030' }),
					new Filter({ path: 'MaintenancePlanningPlant', operator: FilterOperator.EQ, value1: '1040' }),
					new Filter({ path: 'MaintenancePlanningPlant', operator: FilterOperator.EQ, value1: '1050' }),
					new Filter({ path: 'MaintenancePlanningPlant', operator: FilterOperator.EQ, value1: 'OES1' }),
					new Filter({ path: 'MaintenancePlanningPlant', operator: FilterOperator.EQ, value1: 'FHA1' })


				],
				and: false
			})

			var oParams = { "$top": "2000", "$inlinecount": "allpages" };

			var sCurUserId = sap.ushell.Container.getService("UserInfo").getUser().getId();
			if (sCurUserId == "DEFAULT_USER") {
				newFilter = null;
			}

			var that = this;
			var ODataModel = this.getView().getModel();

			ODataModel.read(sPath, {
				filters: [newFilter], urlParameters: oParams,
				success: function (oData, response) {
					var oDropDown = that.getView().byId("idMaintPlantDrop");
					oDropDown.removeAllItems();
					oDropDown.setValue("");
					var filteredData = response.data.results;
					for (var i = 0; i < filteredData.length; i++) {
						var oItem = new sap.ui.core.Item({
							key: filteredData[i].MaintenancePlanningPlant,
							text: filteredData[i].MaintenancePlanningPlant + " (" + filteredData[i].PlantName1 + ")"
						});
						oDropDown.addItem(oItem);
					}
				},
				error: function (error) {
					console.log(error);
				}
			});


		},
		onPlantSelection: function (oEvent) {
			this.setCustomDefaults();

			var sPath = "/I_TechObjWorkReqQuickVw";

			var sPlant = oEvent.getParameter("value");

			//Set the property of Priority

			var newFilter = new Filter({
				filters: [
					new Filter({ path: 'MaintenancePlant', operator: FilterOperator.EQ, value1: sPlant }),
					new Filter({ path: 'TechObjIsEquipOrFuncnlLoc', operator: FilterOperator.EQ, value1: "EAMS_FL" })],
				and: true
			})

			var oParams = { "$top": "2000", "$inlinecount": "allpages" };

			var that = this;
			var ODataModel = this.getView().getModel();

			ODataModel.read(sPath, {
				filters: [newFilter],
				urlParameters: oParams,
				success: function (oData, response) {
					var regex = /^[FO].R.*/; // regular expression to match strings that start with "F" or "O", followed by any single character, and "R"

					var filteredData = response.data.results.filter(function (item) {
						return regex.test(item.TechnicalObjectLabel);
					});

					var oDropDown = that.getView().byId("idMaintBuilding");
					oDropDown.removeAllItems();
					oDropDown.setValue("");

					for (var i = 0; i < filteredData.length; i++) {
						if (filteredData[i].TechnicalObjectLabel.length == 5) {

							var oItem = new sap.ui.core.Item({
								key: filteredData[i].TechnicalObjectLabel,
								text: filteredData[i].TechnicalObjectLabel + " (" + filteredData[i].TechnicalObjectDescription + ")"
							});
							oDropDown.addItem(oItem);
						}
					}

				},
				error: function (error) {
					// Handle error
					console.log(error);
				}
			});
		},
		OnTecObjSelected: function (oEvent) {

			//var selectedKey = oEvent.oSource.getProperty("selectedKey");

			var selectedItem = oEvent.getParameter("selectedItem");
			var selectedKey = selectedItem.getKey();

			var oTechObjSmartField = this.getView().byId("createWrSmartFieldTechObj");

			if (selectedKey && oTechObjSmartField) {
				oTechObjSmartField.setValue(selectedKey);
				this._selectedTechObj = selectedKey;
				this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/TechnicalObjectLabel", selectedKey);
				this.setCustomDefaults();
				this._clearTechnicalObjectContext("");
				oTechObjSmartField.fireChange();
			}
		},
		onSelectTab: function (oEvent) {
			var selectedTab = oEvent.getParameter("key");
			var previousTab = oEvent.getParameter("previousKey");

			switch (selectedTab) {
				case "tab1":
					if (previousTab == "tab2" && this.maintanceReqestCreated) {
						location.reload();
					}
					this.getView().byId("createWrOverflowToolbar").setProperty("visible", true);
					break;
				case "tab2":
					this.goToTab2();
					break;
			}
		},
		onSelectPhaseFiltersRadioButtonSelect: function (oEvent) {
			this._myReqestsRadioBtnChanged = true;
			this.TriggerFilterRebind();
		},
		goToTab2: function () {
			this.getView().byId("createWrOverflowToolbar").setProperty("visible", false);
			this._myReqestsRadioBtnChanged = true;
			this.TriggerFilterRebind();
		},
		TriggerFilterRebind: function () {
			var oTable = this.getView().byId("idMainReqTable");
			var oSmartTable = oTable.getParent();

			oSmartTable.setEntitySet("C_MaintWorkRequestOverviewTP");

			oSmartTable.rebindTable(true);
		},
		OnSmartTableInitialise: function (oEvent) {

		},
		onBeforeRebindTable: function (oEvent) {
			var sCurUserId = sap.ushell.Container.getService("UserInfo").getUser().getId();
			if (sCurUserId == "DEFAULT_USER") {
				sCurUserId = "RFC_BASUSER";
			}


			var sIndex = this.getView().byId("idRBgroup").getSelectedIndex();
			var binding = oEvent.getParameter("bindingParams");

			switch (sIndex) {
				case 0:// OutStanding/Odattavat
					var newFilter = new Filter({
						filters: [
							new Filter({ path: 'NotifProcessingPhase', operator: FilterOperator.EQ, value1: "1" }),
							new Filter({ path: 'CreatedByUser', operator: FilterOperator.EQ, value1: sCurUserId })],
						and: true
					})

					binding.filters.push(newFilter);
					break;
				case 1:// In Process/Aloitetut
					var newFilter = new Filter({
						filters: [
							new Filter({ path: 'NotifProcessingPhase', operator: FilterOperator.EQ, value1: "3" }),
							new Filter({ path: 'CreatedByUser', operator: FilterOperator.EQ, value1: sCurUserId })],
						and: true
					})
					binding.filters.push(newFilter);
					break;
				case 2:// Completed/Valmiit
					var newFilter = new Filter({
						filters: [
							new Filter({ path: 'NotifProcessingPhase', operator: FilterOperator.EQ, value1: "4" }),
							new Filter({ path: 'CreatedByUser', operator: FilterOperator.EQ, value1: sCurUserId })],
						and: true
					})
					binding.filters.push(newFilter);
					break;
			}
			if (this._myReqestsRadioBtnChanged) {
				this._myReqestsRadioBtnChanged = false;
				binding.sorter = [new sap.ui.model.Sorter({ path: "MaintenanceNotification", descending: true })];
			}

		},
		onPlantSelectionDropDown: function (oEvent) {

			var selectedItem = oEvent.getParameter("selectedItem");
			var sPlant = selectedItem.getKey();

			this.setCustomDefaults();

			this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/MaintenancePlanningPlant", sPlant);

			var sPath = "/I_TechObjWorkReqQuickVw";

			//Set the property of Priority

			var newFilter = new Filter({
				filters: [
					new Filter({ path: 'MaintenancePlant', operator: FilterOperator.EQ, value1: sPlant }),
					new Filter({ path: 'TechObjIsEquipOrFuncnlLoc', operator: FilterOperator.EQ, value1: "EAMS_FL" })],
				and: true
			})

			var oParams = { "$top": "2000", "$inlinecount": "allpages" };

			var that = this;
			var ODataModel = this.getView().getModel();

			ODataModel.read(sPath, {
				filters: [newFilter],
				urlParameters: oParams,
				success: function (oData, response) {
					var regex = /^[FO].R.*/; // regular expression to match strings that start with "F" or "O", followed by any single character, and "R"

					var filteredData = response.data.results.filter(function (item) {
						return regex.test(item.TechnicalObjectLabel);
					});

					var oDropDown = that.getView().byId("idMaintBuilding");
					oDropDown.removeAllItems();
					oDropDown.setValue("");

					for (var i = 0; i < filteredData.length; i++) {
						if (filteredData[i].TechnicalObjectLabel.length == 5) {

							var oItem = new sap.ui.core.Item({
								key: filteredData[i].TechnicalObjectLabel,
								text: filteredData[i].TechnicalObjectLabel + " (" + filteredData[i].TechnicalObjectDescription + ")"
							});
							oDropDown.addItem(oItem);
						}
					}

				},
				error: function (error) {
					// Handle error
					console.log(error);
				}
			});
		},

		/**
		 * event handler for technical object changed event
		 * @param  {Object} oEvent
		 */
		onTechnicalObjectChanged: function (oEvent) {
			var sNewValue = oEvent.getParameter("newValue");
			// if newvalue is empty then technical object is still valid
			if (!sNewValue) {
				// if newvalue is empty then technical object is still valid
				this._clearTechnicalObjectContext(sNewValue);
				this._removeMessage("TechnicalObjectLabel");
			}
			var oMessageManager = sap.ui.getCore().getMessageManager();
			var aMessages = oMessageManager.getMessageModel().getData();
			aMessages = this._getTargettedMessages(aMessages);
			aMessages = this._removeTechnicalMessages(aMessages);
			// this.getView().triggerValidateFieldGroup();
		},

		onNavToMaintNotif: function (oEvent) {

		},
		/** 
		 * event handle for action sheet list item press action
		 * @param oEvent
		 */
		addTemplateToDescription: function (oEvent) {
			var oDocuText = oEvent.getSource().getBindingContext().getProperty("MaintNotificationLongText");
			this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/MaintNotifLongTextForEdit",
				oDocuText);
		},

		_setup: function () {
			if (!this._oApplicationController) {
				this._oApplicationController = new ApplicationController(this.oModel, this.getView());
				this._oApplicationController.attachEvent("beforeSideEffectExecution", this._onSideEffectsExecuted, this);
			}
			if (!this.NotificationConsequencePersistenceHelper) {
				this._NotificationConsequencePersistenceHelper = new NotificationConsequencePersistenceHelper(this.getView());
			}
			if (!this._oDraftHandler) {
				this._oDraftHandler = new DraftHandler(this._oApplicationController, this.getView());
			}
			// get flp username and userid
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("UserInfo")) {
				this._sCurUserName = sap.ushell.Container.getService("UserInfo").getUser().getFullName();
				this._sCurUserId = sap.ushell.Container.getService("UserInfo").getUser().getId();
			}
			if (!this._oLocalViewModel) {
				this._oLocalViewModel = new JSONModel();
				this._oLocalViewModel.setProperty("/currentWorkRequests", 0);
				this._oLocalViewModel.setProperty("/createdByUserName", this._sCurUserName);
				this._oLocalViewModel.setProperty("/NotificationCreationDate", "");
				this._oLocalViewModel.setProperty("/MalfunctionStartDate", "");
				this._oLocalViewModel.setProperty("/emergencyNotification", false);
				this.getView().setModel(this._oLocalViewModel, "viewProperties");
			}
			if (!this._oLongTextTemplateModel) {
				this._oLongTextTemplateModel = new JSONModel();
				this._oLongTextTemplateModel.setProperty("/busy", false);
				this._oLongTextTemplateModel.setProperty("/enabled", true);
				this.getView().setModel(this._oLongTextTemplateModel, "longTextTemplates");
			}

			// count for custom generated messages
			// initialize EPM dialog
			if (!this._oEPMDialog) {
				var that = this;
				this._oEPMDialog = new EventPrioritizationDialog();
				this._oEPMDialog.attachEvent("apply", function (oEvent) {
					// get prioritization profile
					// open EPM 
					that._oDraftHandler.showDraftSaving();
					this._NotificationConsequencePersistenceHelper.saveEventPrioritisationDraftItem(oEvent.getParameter("selectedItems"));
					this._NotificationConsequencePersistenceHelper.attachEvent("saved", function () {
						that._oDraftHandler.showDraftSaved();
					});
					this._removeMessage("MaintPriority", this.messageType.Warning);
					this._isEPMSelected = true;
					var oDateInstance = DateFormat.getDateInstance({
						UTC: true
					});
					var oDateTimeInstance = DateFormat.getDateTimeInstance({});
					this.oModel.setProperty(this.getView().getBindingContext() + "/MaintPriority", oEvent.getParameter("priority"));
					// this.oModel.setProperty(this.getView().getBindingContext() + "/MaintPriorityType", oEvent.getParameter("priorityType"));
					this.oModel.setProperty(this.getView().getBindingContext() + "/LatestAcceptableCompletionDate",
						oDateInstance.parse(oEvent.getParameter("lacdDate")));
					this.oModel.setProperty(this.getView().getBindingContext() + "/MaintNotifRqdStartDateTime",
						oDateTimeInstance.parse(oEvent.getParameter("requiredStartDate") + "T" + oEvent.getParameter("requiredStartTime")));
					this.oModel.setProperty(this.getView().getBindingContext() + "/MaintNotifRqdEndDateTime",
						oDateTimeInstance.parse(oEvent.getParameter("requiredEndDate") + "T" + oEvent.getParameter("requiredEndTime")));
					this.oModel.firePropertyChange({
						path: "MaintPriority",
						context: this.getView().getBindingContext()
					});
				}.bind(this));
				//to get access to the global model
				this.getView().addDependent(this._oEPMDialog);
			}

			// initialize the Technical object valuehelp
			this._fieldsWithErrors = 0;
			// initialize epm selection boolean
			this._isEPMSelected = false;
		},

		/** 
		 * function is called to fire the attachChange event for long text
		 */
		_setupLongTextFieldCount: function () {
			this.getView().byId("createWrNotifLongText").attachChange(this._onLongTextChanged.bind(this));
		},

		/** 
		* function is called to add the exceeded text to the long text field 
		* @param oEvent
		*/
		_onLongTextChanged: function (oEvent) {
			var aTextArea = oEvent.getSource().getInnerControls().filter(function (oControl) {
				return oControl instanceof sap.m.TextArea;
			});
			if (!aTextArea || !aTextArea.length) {
				return;
			}

			var oMetaModel = this.oModel.getMetaModel(),
				sEntityType = oMetaModel && oMetaModel.getODataEntityType(Constants.ENTITY_NAMESPACE + "." + Constants.ENTITY.WORK_REQUEST_TP_TYPE),
				iMaxLength = oMetaModel && oMetaModel.getODataProperty(sEntityType, "MaintNotifLongTextForEdit") && oMetaModel.getODataProperty(
					sEntityType, "MaintNotifLongTextForEdit").maxLength;
			aTextArea[0].setShowExceededText(true);
			aTextArea[0].setMaxLength(parseInt(iMaxLength));
		},

		/**
		 * Function called to setup user defaults for Emergency Notif fields like Planning plant, work center etc.
		 * 
		 * 
		 */
		_setupUserDefaults: function () {
			var that = this;
			this.oNavigationHandler = new NavigationHandler(this.getView().getController(), "sap.fe.navigation.Mode.ODataV2");
			if (this.oNavigationHandler) {
				var oParseNavigationPromise = this.oNavigationHandler.parseNavigation();

				oParseNavigationPromise.done(function (oAppData, oURLParms, sNavType) {
					that.oUserDefaults = {};
					// var oSelectionVariant = new sap.fe.navigation.SelectionVariant(oAppData.selectionVariant);
					if (oAppData && oAppData.oDefaultedSelectionVariant) {
						var aUserDefaultParams = oAppData.oDefaultedSelectionVariant.getSelectOptionsPropertyNames(); //returns an array of all the fields for which there is a user default set.
						aUserDefaultParams.forEach(function (sFieldName) {
							var oFieldCondition = oAppData.oDefaultedSelectionVariant.getSelectOption(sFieldName)[0]; //will fetch user default values and conditions for the passed field name
							//0: {Sign: "I", Option: "EQ", Low: "4510", High: null} -> response of above will be an array of length 1 with this information
							if (oFieldCondition.Sign === "I" && oFieldCondition.Option === "EQ") {
								//include and equal
								that.oUserDefaults[sFieldName] = oFieldCondition.Low;
							}
						});
					}
				});

				oParseNavigationPromise.fail(function (oErr) {
					Log.error(oErr);
				});
			}
		},

		/** 
		 * event handler for event before side effect execution 
		 * @constructor 
		 * @param oEvent 
		 */
		_onSideEffectsExecuted: function (oEvent) {
			var oProperties = this._getPropertiesMap(["TechnicalObject", "TechObjIsEquipOrFuncnlLoc", "NotificationType", "MaintenancePlant"]);
			// check if notification type was changed
			var sNotifType = this.oModel.getProperty(this.getView().getBindingContext().getPath() + "/NotificationType");
			if (this.bNotificationTypeChanged) {
				oProperties["NotificationType"] = "";
				this.bNotificationTypeChanged = false;
				this.getView().byId("createWrPriorityField").setEditable(true);
			} else if (!sNotifType) {
				this.getView().byId("createWrPriorityField").setEditable(false);
			}
			oEvent.getParameter("promise").then(function () {
				if (this._propertiesChanged(["TechnicalObject", "TechObjIsEquipOrFuncnlLoc", "NotificationType", "MaintenancePlant"],
					oProperties)) {
					this._getLongTextTemplates().then(this._setLongtextTemplates.bind(this));
				}
				if (this._propertiesChanged(["TechnicalObject", "TechObjIsEquipOrFuncnlLoc"], oProperties)) {
					this._setCurrentWorkRequestCount();
				}
			}.bind(this));
		},
		/** 
		 * creates a map for array of properties from current binding context
		 * @constructor 
		 * @param aProperties
		 * @returns
		 */
		_getPropertiesMap: function (aProperties) {
			var oMap = {};
			for (var i in aProperties) {
				oMap[aProperties[i]] = this.getView().getBindingContext().getProperty(aProperties[i]);
			}
			return oMap;
		},
		/** 
		 * checks if current context property values are different from oOldMap
		 * @constructor 
		 * @param aProperties
		 * @param oOldMap
		 * @returns
		 */
		_propertiesChanged: function (aProperties, oOldMap) {
			for (var i in aProperties) {
				if (this.getView().getBindingContext().getProperty(aProperties[i]) !== oOldMap[aProperties[i]]) {
					return true;
				}
			}
			return false;
		},
		// _onBatchRequestSent: function (oEvent) {
		// 	var aRequests = oEvent.getParameter("requests");
		// 	for (var i in aRequests) {
		// 		if (aRequests[i].method === "POST" &&
		// 			aRequests[i].url.indexOf("SideEffectsQualifier") !== -1) {
		// 			// this._oFailureModeCodeGroupComboBox.setBusy(true);
		// 		}
		// 	}
		// },

		/** 
		 * on batch request completion of sideeffects show open work requests
		 * @constructor 
		 * @param oEvent
		 */
		// _onBatchRequestCompleted: function (oEvent) {
		// var aRequests = oEvent.getParameter("requests");
		// for (var i in aRequests) {
		// 	if (aRequests[i].method === "POST" &&
		// 		aRequests[i].url.indexOf("SideEffectsQualifier") !== -1) {
		// 		// this._oFailureModeCodeGroupComboBox.setBusy(false);
		// 		this._setCurrentWorkRequestCount();
		// 	}
		// }
		// },
		_onMaintNotificationCatalogChanged: function (oEvent) {
			this._onFailureModeCodeGroupLoaded("", oEvent.getSource().getValue());
		},
		_onCatalogProfileChanged: function (oEvent) {

			// empty the failure mode fields
			this._oFailureModeCodeGroupComboBox.setSelectedKey("");
			this._oFailureModeComboBox.setSelectedKey("");
			// make failure mode disabled and remove busy indicator
			this._oFailureModeComboBox.setEnabled(false);
			this._oFailureModeComboBox.setEditable(false);
			// set failure mode group to empty
			this._failureModeGroup = "";
		},

		/**
		 * event handler for bar code scanner
		 * @param  {Object} oEvent
		 * 
		 */
		onScanSuccess: function (oEvent) {
			var oTechObjSmartField = this.getView().byId("createWrSmartFieldTechObj");

			// Make the Plant and building empty
			var oMaintPlant = this.getView().byId("idMaintPlant");
			oMaintPlant.setValue("");
			oMaintPlant.fireChange();
			oTechObjSmartField.setValue("");

			var oPlantDropDown = this.getView().byId("idMaintPlantDrop");
			oPlantDropDown.setValue("");
			var oBuilding = this.getView().byId("idMaintBuilding");
			oBuilding.setValue("");

			var oTechObj = oEvent.getParameter("text");
			if (oTechObj && oTechObjSmartField) {
				this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/TechnicalObjectLabel",
					oTechObj);
				this._clearTechnicalObjectContext("");

				//oTechObjSmartField.focus();
			}

		},

		/**
		 * Function called to set the user default values to the actual fields.
		 * @param bUnset {boolean}
		 * In case bUnset is set to true, it means the value of user default fields needs to be reset to empty
		 */
		_setUserDefaults: function (bUnset) {
			//setup values for user defaults
			if (this.oUserDefaults) {
				var that = this;
				Object.keys(this.oUserDefaults).forEach(function (sFieldName) {
					if (sFieldName === "NotificationType") {
						return;
					}
					that.oModel.setProperty(that.getView().getBindingContext() + "/" + sFieldName, (bUnset ? "" : that.oUserDefaults[sFieldName]));
				});
			}
		},

		/*
		 * on route matched for create work request view
		 * @param oEvent
		 */
		onCreateWorkRequestMatched: function () {
			var that = this;
			this._setup();

			// promise chain for draft handling
			if (!this.getView().getBindingContext()) {
				this.getView().setBusy(true);
				this.oModel.metadataLoaded().then(function () {
					return that._getDraftUUID().catch(function () {
						return that._createNewDraft();
					}).then(function (sDraftUUID) {
						// navigate to the resumed draft
						that.getRouter().navTo("draft", {
							DraftUUID: encodeURIComponent(sDraftUUID)
						}, true);
					});
				});
			}
		},
		_showResumeDialog: function (bShow) {
			var that = this;
			return that._oDraftHandler.getLatestDraftOfUser()
				.then(function (oResponse) {
					that.getCleanState(that.oModel);
					that.getView().setBusy(false);
					return that._oDraftHandler.resumeDraftDialog(oResponse.LastChangeDateTime)
						.then(function () {
							//resume the existing draft
							return Promise.resolve(oResponse.DraftUUID);
						}).catch(function () {
							// Discard existing draft and create new one (Discard)
							that._oDraftHandler.discardDraft(that.oModel.createKey("/" + Constants.ENTITY.WORK_REQUEST_TP, {
								DraftUUID: oResponse.DraftUUID,
								MaintenanceNotification: "",
								IsActiveEntity: false
							}));

							that._oDraftHandler.showDraftDiscardedMessage(true);
							return Promise.reject();
						});
				});
		},
		_getDraftUUID: function () {
			if (this._oStartupParameters && this._oStartupParameters.DraftUUID) {
				return Promise.resolve(this._oStartupParameters.DraftUUID);
			} else if (this._oStartupParameters && this._oStartupParameters.preferredMode && this._oStartupParameters.preferredMode[0] ===
				"create") {
				return Promise.reject();
			} else {
				return this._showResumeDialog();
			}
		},
		onDraftRouteMatched: function (oEvent) {
			var that = this;
			this._setup();
			var sDraftUUID = decodeURIComponent(oEvent.getParameter("arguments").DraftUUID);
			if (!this.getView().getBindingContext()) {
				this.getView().setBusy(true);
				this.oModel.metadataLoaded().then(function () {
					that._setupTitleField();

					that.loadDraft({
						DraftUUID: sDraftUUID
					});
				}).then(function () {

					// set default values
					that._setDefaultValues.call(that);
				});
			}
		},
		loadDraft: function (oResponse) {
			var that = this;
			that.sEntityPath = that.oModel.createKey("/" + Constants.ENTITY.WORK_REQUEST_TP, {
				DraftUUID: oResponse.DraftUUID,
				MaintenanceNotification: "",
				IsActiveEntity: false
			});
			// attach Model Events
			that.oModel.attachRequestSent(that.onRequestSent, that);

			that._oDraftHandler.registerDraftIndicator(that.getView().byId("createWrDraftIndicator"), that.sEntityPath);

			that.getView().bindElement({
				path: that.sEntityPath,
				events: {
					dataReceived: function (oDataReceivedEvent) {
						if (!oDataReceivedEvent.getParameter("data")) {
							// no data (possibly a 'not found' error)
							this._oStartupParameters.DraftUUID = "";
							this.getRouter().navTo("RouteCreateWorkRequest", {}, true);
							sap.ui.getCore().getMessageManager().removeAllMessages();
						} else {
							// set default values
							this._setDefaultValues();
						}
					}.bind(that)
				}
			});

		},
		_setDefaultValues: function () {
			var that = this;
			// set default values if new draft was created
			if (!this.getView().getBindingContext()) {
				return;
			}

			this._afterViewBoundToDraft();
			this._evaluateNotifProcessingContext();

			var oCtx = this.getView().getBindingContext();
			// create property binding for catalog profile
			this._oCatalogProfileBinding = this.oModel.bindProperty(
				oCtx.getPath() + "/CatalogProfile",
				oCtx
			);
			// attach property change handler
			this._oCatalogProfileBinding.attachChange(this._onCatalogProfileChanged.bind(this));
			// create property binding for catalog profile
			this._oNotificationTypeBinding = this.oModel.bindProperty(
				oCtx.getPath() + "/NotificationType",
				oCtx
			);
			this._oNotificationTypeBinding.attachChange(function (oEvent) {
				this.bNotificationTypeChanged = true;
			}.bind(this));

			// reported By user defaults to created by user
			if (!this.getView().getBindingContext().getProperty("ReportedByUser")) {
				this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/ReportedByUser",
					this.getView().getBindingContext().getProperty("CreatedByUser"));
			}

			// if (this.getView().getBindingContext().getProperty("MaintNotifProcessingContext") === "01") {
			// 	this._oLocalViewModel.setProperty("/emergencyNotification", true);
			// } else {
			// 	this._oLocalViewModel.setProperty("/emergencyNotification", false);
			// }

			if (this.getView().getBindingContext().getProperty("MaintNotificationCodeGroup") === "") {
				this.oFailureModePromise.then(function (data) {
					that._oFailureModeComboBox.setEnabled(false);
					that._oFailureModeComboBox.setEditable(false);
				});
			} else {
				this._failureModeGroup = this.getView().getBindingContext().getProperty("MaintNotificationCodeGroup");
			}
		},
		/**
		 *  event call back for element change event of view 
		 * 	called after view is bound to the draft entity set
		 */
		_afterViewBoundToDraft: function () {
			var that = this;
			// attachment key
			if (!this.getView().getBindingContext().getProperty("MaintWorkRequestAttchKey")) {
				this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/MaintWorkRequestAttchKey",
					this.getView().getBindingContext().getProperty("DraftUUID"));
				this._oApplicationController.propertyChanged("MaintWorkRequestAttchKey", this.getView().getBindingContext());
			}
			// initialize the attachment component
			that.initAttachmentComponent({
				mode: Constants.ATTACHMENT_SERVICE.MODE.CREATE,
				objectType: Constants.ATTACHMENT_SERVICE.OBJECT_TYPES.NOTIFICATION,
				objectKey: that.getView().getBindingContext().getProperty("MaintWorkRequestAttchKey")
			},
				"workRequestCreateAttachSrvCompContCreate"); // attachment component id
			that.getView().setBusy(false);
			this._getLongTextTemplates().then(
				function (aTemplates) {
					return that._setLongtextTemplates(aTemplates);
				}
			).then(function () {

				var aTemplates = that._oLongTextTemplateModel.getProperty("/templates");
				if (aTemplates.length === 1) {
					if (that.bNewDraft) {
						var sSelectedKey = aTemplates[0].WorkRequestTextTemplate.toUpperCase();
						that.oModel.setProperty(that.getView().getBindingContext().getPath() + "/WorkRequestTextTemplate",
							sSelectedKey);
						that.oModel.setProperty(that.getView().getBindingContext().getPath() + "/MaintNotifLongTextForEdit",
							aTemplates[0].MaintNotificationLongText);
						that._oApplicationController.propertyChanged("MaintNotifLongTextForEdit", that.getView().getBindingContext());
					}
					var sSelectedTemplate = that.getView().getBindingContext().getProperty("WorkRequestTextTemplate");
					that._oLongTextTemplateModel.setProperty("/enabled", !sSelectedTemplate);
				} else if (aTemplates.length > 1) {
					that._oLongTextTemplateModel.setProperty("/enabled", true);
				}

			}).catch(function () { });
			// set the number of work request count
			this._setCurrentWorkRequestCount();

		},
		/**
		 *  event call back for requestsent event of odata model
		 * 	filtering and sorting of smartfield dropdowns is done here
		 */
		onRequestSent: function () {
			// this._onFailureModeCodeGroupLoaded();
		},

		/**
		 * Event handler for when detection code field is changed.
		 * This method call resets the group field since that is an uneditable field.
		 * If detection code has a value, the detection group field is reset to blank.
		 * 
		 */
		_onDetectionCodeChanged: function (oEvent) {
			if (!oEvent.getSource().getValue()) {
				this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/MaintNotifDetectionCodeGroup", "");
				this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/MaintNotifDetectionCodeGrpTxt", "");
			}
		},

		/**
		 * Event handler for when the notification processing context field is changed
		 * This method call will help set the flag to enable the fields on the view
		 * In case the value selected is "Emergency Process" or 01, the above fields need to be visible on the UI
		 * 
		 */
		_evaluateNotifProcessingContext: function (oEvent) {
			if (oEvent) {
				var oComboBox = oEvent.getSource().getInnerControls()[0],
					oSelectedKey = oComboBox.getSelectedKey(),
					oValue = oComboBox.getValue();
				// if (!oSelectedKey && oValue) {
				// 	this._createMessage("MaintNotifProcessingContext", this._i18n("xmsg.invalidProcessingContext"), this.messageType.Error);
				// } else {
				// 	this._removeMessage("MaintNotifProcessingContext");
				// }
				if (this.oModel.getProperty(this.getView().getBindingContext().getPath() + "/MaintNotifProcessingContext") === "01") {
					this._oLocalViewModel.setProperty("/emergencyNotification", true);
					// this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/MaintenancePlanningPlant", "");
					// this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/MainWorkCenter", "");
					this._setUserDefaults();
				} else {
					this._oLocalViewModel.setProperty("/emergencyNotification", false);
					this._setUserDefaults(true);
				}
			} else {
				this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/MaintNotifProcessingContext", "");
			}

		},

		/**
		 * call back for when failure mode group field is loaded
		 *  function filters the failure mode group dropdown with the current catalog profile
		 */
		_onFailureModeCodeGroupLoaded: function (sCatalogProfile, sMaintNotificationCatalog) {
			var that = this;
			var oContext = this.getView().getBindingContext(),
				_sCatalogProfile,
				_sMaintNotificationCatalog,
				oBinding;

			if (oContext) {
				_sCatalogProfile = sCatalogProfile ? sCatalogProfile : oContext.getProperty("CatalogProfile");
				_sMaintNotificationCatalog = sMaintNotificationCatalog ? sMaintNotificationCatalog : oContext.getProperty(
					"MaintNotificationCatalog");
			} else {
				return;
			}
			// check if _oFailureModeCodeGroupComboBox has items binding and catalogprofile is not null
			if (this._oFailureModeCodeGroupComboBox && this._oFailureModeCodeGroupComboBox instanceof sap.m.ComboBox &&
				this._oFailureModeCodeGroupComboBox.isBound("items") && _sCatalogProfile) {
				oBinding = that._oFailureModeCodeGroupComboBox.getBinding("items");
				oBinding.filter([
					new Filter("CatalogProfile",
						sap.ui.model.FilterOperator.EQ,
						_sCatalogProfile),
					new Filter("InspectionCatalog",
						sap.ui.model.FilterOperator.EQ,
						_sMaintNotificationCatalog)
				]);

				this.oModel.detachRequestSent(this.onRequestSent, this);
				// on change of failure mode group binding set busy indicator to false
			} else {
				return;
			}
		},

		/**
		 *  @param  {Object} oEvent 
		 *  Event handler for failure mode group combobox change event
		 */
		onShowEPM: function () {
			var that = this;
			var sNotificationType = this.getView().getBindingContext().getProperty("NotificationType");
			var sPriorityType = this.getView().getBindingContext().getProperty("MaintPriorityType");
			this._oEPMDialog.setPriorityMapPromise(this._NotificationConsequencePersistenceHelper.getPriorityColorCodeMap(sPriorityType));
			this._oEPMDialog.setSelectedItemsPromise(this._NotificationConsequencePersistenceHelper.getSelectedConsequences());
			this._oEPMDialog.setNotificationType(sNotificationType);
			this._oEPMDialog.setPlant(this.getView().getBindingContext().getProperty("MaintenancePlant"));
			this.getView().setBusy(true);
			that._oEPMDialog.open().then(function () {
				that.getView().setBusy(false);
				that._removeMessage("MaintPriority");
				Log.debug("dialog opened");
			}).catch(function () {
				that.getView().setBusy(false);
				that._createMessage("MaintPriority", that._i18n("xmsg.invalidCatalogProfile"), that.messageType.Error);
			});
		},
		/** 
		 * event handler to filter failure mode group changed - on change filter failure modes
		 * @param oEvent
		 * @returns
		 */
		onFailureModeGroupChanged: function (oEvent) {
			var oComboBox = oEvent.getSource().getInnerControls()[0],
				oSelectedKey = oComboBox.getSelectedKey(),
				oValue = oComboBox.getValue();

			if (oValue === "") {
				this._oFailureModeComboBox.setEnabled(false);
				this._oFailureModeComboBox.setEditable(false);
				this._oFailureModeComboBox.setSelectedKey("");
				this._removeMessage("MaintNotificationCodeGroup");
				return;
			}
			if (!oSelectedKey && oValue) {
				this._oFailureModeComboBox.setEnabled(false);
				this._oFailureModeComboBox.setEditable(false);
				this._oFailureModeComboBox.setSelectedKey("");
				this._createMessage("MaintNotificationCodeGroup", this._i18n("xmsg.invalidFailureModeGroup"), this.messageType.Error);
			} else {
				this._removeMessage("MaintNotificationCodeGroup");
				this._oFailureModeComboBox.setEnabled(true);
				this._oFailureModeComboBox.setEditable(true);
				this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/MaintNotificationCode",
					"");
			}
		},
		/**
		 *  @param  {Object} oEvent 
		 *  Event handler for malfunction effects combobox change event
		 */
		onEffectChanged: function (oEvent) {
			var oComboBox = oEvent.getSource().getInnerControls()[0],
				oSelectedKey = oComboBox.getSelectedKey(),
				oValue = oComboBox.getValue();
			if (!oSelectedKey && oValue) {
				this._createMessage("MalfunctionEffect", this._i18n("xmsg.invalidEffect"), this.messageType.Error);
			} else {
				this._removeMessage("MalfunctionEffect");
			}
		},
		/**
		 *  @param  {Object} oEvent 
		 *  Event handler for failure mode combobox change event
		 */
		onFailureModeChanged: function (oEvent) {
			var oComboBox = oEvent.getSource().getInnerControls()[0],
				oSelectedKey = oComboBox.getSelectedKey(),
				oValue = oComboBox.getValue();
			if (!oSelectedKey && oValue) {
				this._createMessage("MaintNotificationCode", this._i18n("xmsg.invalidFailureMode"), this.messageType.Error);
			} else {
				this._removeMessage("MaintNotificationCode");
			}
		},

		/**
		 *  @param  {Object} oEvent 
		 *  Event handler for long text change event
		 */
		onLongTextChanged: function () { },

		/**
		 *  @param  {Object} oEvent 
		 *  Event handler for prority combobox change event
		 */
		onPriorityChanged: function (oEvent) {
			var oComboBox = oEvent.getSource().getInnerControls()[0],
				oSelectedKey = oComboBox.getSelectedKey(),
				oValue = oComboBox.getValue();
			/*if (!oSelectedKey && oValue) {
				this._createMessage("MaintPriority", this._i18n("xmsg.invalidPriority"), this.messageType.Error);
			} else if (this._isEPMSelected) {
				// this._createMessage("MaintPriority", this._i18n("xmsg.priority.warning.epmUsage"), this.messageType.Warning);
				this._isEPMSelected = false;
			} else {
				this._removeMessage("MaintPriority");
			}*/
		},

		/** 
		 * 
		 * @constructor 
		 * @returns array of messages with target not null
		 */
		_getTargettedMessages: function (aMessages) {
			var aTargetMessages = [],
				oMessage;

			for (var i = 0; i < aMessages.length; i++) {
				oMessage = aMessages[i];
				if (oMessage.getTarget() && oMessage.getType() === this.messageType.Error) {
					aTargetMessages.push(oMessage);
				}
			}
			return aTargetMessages;
		},
		_removeTechnicalMessages: function (aMessages) {
			var aTechnicalMessages = [];
			var sPath = this.getView().getBindingContext().getPath();
			aMessages = aMessages.reduce(function (acc, oMessage) {
				if (oMessage.getTechnical() || oMessage.getTarget() === sPath) {
					aTechnicalMessages.push(oMessage);
				} else {
					acc.push(oMessage);
				}
				return acc;
			}, []);
			sap.ui.getCore().getMessageManager().removeMessages(aTechnicalMessages);
			return aMessages;
		},
		_checkBeforeSave: function () {
			// Check smart fields for client errors before saving (mandatory fields, wrong input types) 
			this.getView().byId("createWrSmartFormTechnical").check();
			this.getView().byId("createWrSmartFormGeneral").check();
			this.getView().byId("createWrSmartFormResponsibilities").check();

			var oMessageManager = sap.ui.getCore().getMessageManager();
			var aMessages = oMessageManager.getMessageModel().getData();
			aMessages = this._getTargettedMessages(aMessages);
			aMessages = this._removeTechnicalMessages(aMessages);

			if (this.getView().byId("createWrSmartFieldTechObj").getValue() === "") {
				this._createMessage("TechnicalObjectLabel", 'Enter Kohde', this.messageType.Error);
				aMessages.push("Enter Kohde");
			}

			if (aMessages && aMessages.length) {
				return false;
			}
			return true;
		},
		/**
		 * event handler for save button press event
		 */
		onPressSave: function () {

			//Dev Only

			this.setCustomDefaults();
			if (!this._checkBeforeSave()) {
				return;
			}
			// remove messages coming from server side
			sap.ui.getCore().getMessageManager().removeAllMessages();
			// set the view to buisy
			this.getView().setBusy(true);
			// fire the activate action of draft
			var oActivateDraft = this._oDraftHandler.activateDraft(this.getView()
				.getBindingContext(), true /*LenientSave*/);

			oActivateDraft.then(function (oResponse) {
				// call back for success full save
				this._onSuccessSave(oResponse);
				this.getView().setBusy(false);
			}.bind(this)).catch(function () {
				this.getView().setBusy(false);
			}.bind(this));
		},
		/**
		 * event handler for current work requests link in message bar
		 */
		onShowCurrentWorkRequests: function () {
			// navigate to current work requests view 
			this.getRouter().navTo("showCurrentWorkRequests", {}, true /*no history*/);
		},
		/**
		 * event handler for Cancel button press event
		 */
		onPressCancel: function (oEvent) {
			// show discard draft popover
			this._oDraftHandler.confirmDiscardDraft(oEvent.getSource(), true);
		},

		/**
		 * helper function to create a new draft entity
		 * @returns {Promise} oNewDraft
		 */
		_createNewDraft: function () {
			this.bNewDraft = true;
			var oDefaultParams = {
				ReporterFullName: this._sCurUserName
			};
			var aNotificationType = this._oStartupParameters['NotificationType'];
			oDefaultParams['NotificationType'] = Array.isArray(aNotificationType) ? aNotificationType[0] : aNotificationType;
			for (var key in this._oStartupParameters) {
				var sValue = this._oStartupParameters[key];
				switch (key) {
					case "NotificationType":
					case "TechnicalObject":
					case "TechnicalObjectLabel":
					case "TechObjIsEquipOrFuncnlLoc":
					case "MaintenancePlant":
						oDefaultParams[key] = Array.isArray(sValue) ? sValue[0] : sValue;
						break;
				}
			}

			return this._oApplicationController.getTransactionController().getDraftController().createNewDraftEntity(
				Constants.ENTITY.WORK_REQUEST_TP, "/" + Constants.ENTITY.WORK_REQUEST_TP, oDefaultParams, true, {})
				.then(function (oResponse) {
					return Promise.resolve(oResponse.data.DraftUUID);
				});
		},
		/**
		 * helper method to clear the technical object context
		 * clear AssetLocation , LocationName , currentWorkRequests , TechnicalObject, TechObjIsEquipOrFuncnlLoc
		 * toggle the hierarchy view
		 */
		_clearTechnicalObjectContext: function (sNewValue) {
			this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/AssetLocation",
				"");
			this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/LocationName",
				"");
			this._oLocalViewModel.setProperty("/currentWorkRequests", "");
			this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/TechnicalObject", "");
			this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/TechObjIsEquipOrFuncnlLoc", "");

			// this._toggleHierarchy(sNewValue);
		},
		/**
		 * helper method to filter failure mode combobox
		 */
		_filterFailureMode: function () {
			this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/MaintNotificationCode",
				"");
		},
		/**
		 * helper method to sort malfunction effects combobox
		 * @returns {Boolean} bSortDone
		 */
		// _sortMalEffects: function () {
		// 	var oMalEffectsSmartField = this.getView().byId("createWrSmartFieldMalEffect");
		// 	var oMalEffectsComboBox = oMalEffectsSmartField.getInnerControls()[0];
		// 	if (oMalEffectsComboBox instanceof sap.m.ComboBox && oMalEffectsComboBox.isBound("items")) {
		// 		var oBinding = oMalEffectsComboBox.getBinding("items");
		// 		oBinding.sort(new Sorter("MalfunctionEffect", true));
		// 		return true;
		// 	} else {
		// 		return false;
		// 	}

		// },
		/*
		 * 
		 * toggles to heirarchy view of technical object vh 
		 * @param oValue map of technicalObject fields
		 * @private
		 */
		_toggleHierarchy: function (oTechnicalObject) {
			var oMap = oTechnicalObject ? oTechnicalObject : this.getView().getBindingContext().getObject();
			if (this._oTechnicalObjectValueHelp) {
				this._oTechnicalObjectValueHelp.setSearchString(oMap.TechnicalObjectLabel);
				this._oTechnicalObjectValueHelp.setTechnicalObjectLabel(oMap.TechnicalObjectLabel);
				this._oTechnicalObjectValueHelp.setTechnicalObject(oMap.TechnicalObject);
				this._oTechnicalObjectValueHelp.setTechObjIsEquipOrFuncnlLoc(oMap.TechObjIsEquipOrFuncnlLoc);
				this._oTechnicalObjectValueHelp.setIsValidTechnicalObject((oMap.TechnicalObject &&
					oMap.TechObjIsEquipOrFuncnlLoc) ? true : false);
				this._oTechnicalObjectValueHelp.setHierarchyNodeLevel(oMap.HierarchyNodeLevel);
			}
		},
		/*
		 * Function called to create a message leveraged by the Message manager
		 * @params sField {String} field to be validated in odata model
		 * @params sMessage {String} i18n String object reference for the error message
		 * @params messageType {sap.ui.core.Library.MessageType} message type (Success, Error etc.)
		 * 
		 */
		_createMessage: function (sField, sMessage, messageType) {
			var sTarget = this.getView().getBindingContext().getPath() + "/" + sField;
			var aMessages = sap.ui.getCore().getMessageManager()
				.getMessageModel().getData().filter(function (mItem) {
					return mItem.target === sTarget;
				});

			if (!aMessages.length) {
				var oMessage = new Message({
					message: sMessage,
					type: messageType,
					target: sTarget,
					processor: this.getView().getModel(),
					persistent: false,
					technical: false
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
				if (messageType === this.messageType.Error) {
					this._fieldsWithErrors += 1;
				}
			}
		},

		/**
		 * removes ui generated error messages
		 * @param  {String} sField the filed on which message needs to be removed
		 * 
		 */
		_removeMessage: function (sField, sType) {
			var sTarget = this.getView().getBindingContext().getPath() + "/" + sField;
			var sMessageType = sType || this.messageType.Error;
			var aMessages = sap.ui.getCore().getMessageManager()
				.getMessageModel().getData().filter(function (mItem) {
					return mItem.target === sTarget && mItem.type === sMessageType;
				});
			sap.ui.getCore().getMessageManager().removeMessages(aMessages);
			if (this._fieldsWithErrors > 0) {
				this._fieldsWithErrors -= 1;
			}
		},

		// _splitDateTime: function (oDate) {
		// 	var oTime = new Date(0);
		// 	var oNewDate = new Date(oDate);
		// 	var tzOffset = oTime.getTimezoneOffset() * 60 * 1000;
		// 	oTime.setHours(oDate.getHours());
		// 	oTime.setMinutes(oDate.getMinutes());
		// 	oTime.setSeconds(oDate.getSeconds());
		// 	var oTimeFormat = new sap.ui.model.odata.type.Time();
		// 	// substract tzoffset to reverse the utc conversion by framework
		// 	var nTime = oTime.getTime() - tzOffset;

		// 	oTime = oTimeFormat.formatValue({
		// 		ms: nTime,
		// 		__edmType: "Edm.Time"
		// 	}, "any");
		// 	// removes the time from date object
		// 	this._removeTime(oNewDate);
		// 	return [oNewDate, oTime];
		// },
		// /**
		//  * @param  {Date} oDate 
		//  * @returns {Date} oDate with hours , minutes , seconds set to 0
		//  */
		// _removeTime: function (oDate) {
		// 	oDate.setHours(0);
		// 	oDate.setMinutes(0);
		// 	oDate.setSeconds(0);
		// 	// substract tzoffset to reverse the utc conversion by framework
		// 	var nDate = oDate.getTime() - oDate.getTimezoneOffset() * 60 * 1000;
		// 	oDate.setTime(nDate);
		// 	return oDate;
		// },
		/** 
		 * checks if message header has sap-message and returns the message text
		 * @constructor 
		 * @param oResponse response from activate draft
		 * @returns sMessage
		 */
		_getMessageText: function (oResponse) {
			var oMessageHeader = null;
			var sMessage = this._i18n("xmsg.workRequestCreated");
			if (oResponse &&
				oResponse.response &&
				oResponse.response.headers && oResponse.response.headers && oResponse.response.headers["sap-message"]) {
				oMessageHeader = JSON.parse(oResponse.response.headers["sap-message"]);
				sMessage = oMessageHeader.message;
			}

			return sMessage;
		},
		/**
		 * callback after succesful work request save
		 */
		_onSuccessSave: function (oResponse) {
			var sMessage = this._getMessageText(oResponse);

			MessageToast.show(sMessage, {
				closeOnBrowserNavigation: false
			});
			var sNotifId = oResponse && oResponse.data && oResponse.data.MaintenanceNotification;
			sap.ushell.Container.getService("Personalization").getContainer("NotificationParams")
				.fail(function () {
					Log.error("Loading personalization data failed.");
				})
				.done(function (oContainer) {
					var oParamValues = oContainer.getItemValue("params");
					if (oParamValues && oParamValues.ObjId) {
						oParamValues.Notification = sNotifId;
						oContainer.setItemValue("params", oParamValues);
						oContainer.save(); // validity = 0 = transient, no roundtrip  
					}
				}.bind(this));
			if (sap.ushell && sap.ushell.Container) {

				if (this._oStartupParameters && this._oStartupParameters.preferredMode && this._oStartupParameters.preferredMode[0] === "create") {
					window.history.back(-1);
				} else {
					var oParams = {};
					// navigate to My work Requestrs
					if (oResponse && oResponse.data && (oResponse.data.MaintenanceOrder || oResponse.data.MaintNotifProcessingContext === '01' ||
						oResponse.data.MaintNotifProcessingContext === '02')) {
						// emergency notif or minor work was created
						oParams.ProcessingContext = true;
					} else {
						//generic notif created 
						oParams.ProcessingContext = false;
					}
					this.maintanceReqestCreated = true;
					var oIconTabBar = this.getView().byId("idIconTabBar");
					//Custom Behavior for Tab 2 select on Successful Save

					this.sendEmailAfterCreate(sNotifId);

					oIconTabBar.setSelectedKey("tab2");
					this.goToTab2();
					// var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
					// if (oCrossAppNavigator) {
					// 	oCrossAppNavigator.toExternal({
					// 		target: {
					// 			semanticObject: "MaintenanceWorkRequest",
					// 			action: "manage"
					// 		},
					// 		params: oParams
					// 	});
					// }
				}
			}
		},
		sendEmailAfterCreate: function ( sNotifId ) {
			var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZPM_MAINT_NOTIF_SEND_MAIL_SRV");
			oDataModel.callFunction("/Maint_Notif_Send_Email", {
				method: "GET",
				urlParameters: {
					NotificationNum: sNotifId
				},
				success: function (oData) {
					console.log(oData);

				},
				error: function (oError) {
					console.log(oError);
				}
			});
		},

		/**
		 * helper function to get the count of current work requests for the given
		 *  TechnicalObject , TechnicalObjectType 
		 *  only considers active entity and processingphase <= Constants.WORK_REQUEST_STATUS.CURRENT
		 */
		_setCurrentWorkRequestCount: function () {
			var that = this;
			if (!this.getView().getBindingContext()) {
				return;
			}
			var oWorkRequest = this.getView().getBindingContext().getObject();
			if (oWorkRequest.TechnicalObject !== "" && (oWorkRequest.TechObjIsEquipOrFuncnlLoc === Constants.FUNCTIONAL_LOCATION ||
				oWorkRequest.TechObjIsEquipOrFuncnlLoc === Constants.EQUIPMENT)) {
				var aFilters = [new Filter({
					path: "IsActiveEntity",
					operator: FilterOperator.EQ,
					value1: "true"
				}),
				new Filter({
					path: "TechnicalObject",
					operator: FilterOperator.EQ,
					value1: oWorkRequest.TechnicalObject
				}), new Filter({
					path: "TechObjIsEquipOrFuncnlLoc",
					operator: FilterOperator.EQ,
					value1: oWorkRequest.TechObjIsEquipOrFuncnlLoc
				}),
				new Filter({
					path: "NotifProcessingPhase",
					operator: FilterOperator.LE,
					value1: Constants.WORK_REQUEST_STATUS.CURRENT
				})
				];
				new Promise(function (resolve) {
					that.oModel.read("/" + Constants.ENTITY.WORK_REQUEST_TP + "/$count", {
						filters: aFilters,
						success: function (sCount) {
							return resolve(sCount);
						}
					});
				}).then(function (sCount) {
					that._oLocalViewModel.setProperty("/currentWorkRequests", sCount);
				});
			} else {
				that._oLocalViewModel.setProperty("/currentWorkRequests", 0);
			}
		},
		/** 
		 * get templates from backend
		 * @constructor 
		 * @returns oPromise resolved when data is returned
		 */
		_getLongTextTemplates: function () {
			var that = this;
			var oWorkRequest = this.getView().getBindingContext(),
				aFilters = [];
			this.bPendingReadTeamplates = true;
			if (oWorkRequest) {
				aFilters = [new Filter({
					path: "NotificationType",
					operator: FilterOperator.EQ,
					value1: oWorkRequest.getProperty("NotificationType")
				}),
				new Filter({
					path: "TechnicalObject",
					operator: FilterOperator.EQ,
					value1: oWorkRequest.getProperty("TechnicalObject")
				}), new Filter({
					path: "TechObjIsEquipOrFuncnlLoc",
					operator: FilterOperator.EQ,
					value1: oWorkRequest.getProperty("TechObjIsEquipOrFuncnlLoc")
				}),
				new Filter({
					path: "MaintenancePlant",
					operator: FilterOperator.EQ,
					value1: oWorkRequest.getProperty("MaintenancePlant")
				})
				];
			}
			return new Promise(function (resolve, reject) {
				that._oLongTextTemplateModel.setProperty("/busy", true);
				that.oModel.read("/" + Constants.ENTITY.LONG_TEXT_TEMPLATE, {
					filters: aFilters,
					success: function (oResult) {
						that.bPendingReadTeamplates = false;
						that._oLongTextTemplateModel.setProperty("/busy", false);
						return resolve(oResult.results);
					},
					error: function (oError) {
						that._oLongTextTemplateModel.setProperty("/busy", false);
						reject(oError);
					}
				});
			});
		},
		/** 
		 * 
		 * @constructor 
		 * @param aTemplates
		 * @param bSetDefault set the default template if only one long text
		 * @returns
		 */
		_setLongtextTemplates: function (aTemplates, bSetDefault) {
			this.setCustomDefaults();
			if (!aTemplates) {
				return;
			}
			//Custom Code for Template selection, The BADI EAM_LTXT_TML_MAINT_NOTIF with the below has to implemented and Custom Document in TCode SE61 has to be created -345

			// cl_eam_ntf_lngtxt_tmplt=>add_template(
			// 	EXPORTING
			// 	  iv_langu       = 'U'
			// 	  iv_docu_id     = 'DT'
			// 	  iv_docu_typ    = 'E'
			// 	  iv_description = 'M1 - Custom FIORI APP Template'
			// 	  iv_doku_obj    = 'ZPM_M1_LONGTEXT_TEMPLATE'
			// 	CHANGING
			// 	  ct_ltxt_tml    = ct_ltxt_tml ).


			// Create an empty array to store the results
			var defM1Temp = [];

			// Loop through the JSON array and check for location = "India"
			for (let i = 0; i < aTemplates.length; i++) {
				if (aTemplates[i].WorkRequestTextTemplate == "M1 - Custom FIORI APP Template") {
					defM1Temp.push(aTemplates[i]);
				}
			}

			if (defM1Temp) {
				var vFullText = defM1Temp[0].MaintNotificationLongText;
				//new variable and assign it with value of substring of vFullText between <TEMPLATE.START> and <TEMPLATE.END>

				var startTag = "<TEMPLATE.START>";
				var endTag = "<TEMPLATE.END>";

				var startIndex = vFullText.indexOf(startTag) + startTag.length;
				var endIndex = vFullText.indexOf(endTag);
				defM1Temp[0].MaintNotificationLongText = vFullText.substring(startIndex, endIndex);
				//Delete the first and last occurances of new line char /n with Regex ^\n for first occurance and \n+$ last occurance
				defM1Temp[0].MaintNotificationLongText = defM1Temp[0].MaintNotificationLongText.replace(/^\n+|\n+$/g, "");


				//new variable and assign it with value of substring of vFullText between <HEADER.START> and <HEADER.END>
				startTag = "<HEADER.START>";
				endTag = "<HEADER.END>";

				startIndex = vFullText.indexOf(startTag) + startTag.length;
				endIndex = vFullText.indexOf(endTag);

				var headerText = vFullText.substring(startIndex, endIndex);
				headerText = headerText.replace(/^\n+|\n+$/g, "");
				this.getView().byId("idtxt").setText(headerText);
				//Pass the value to a new var after the text /END/ until the text /LINK/
				startTag = "<LINK.START>";
				endTag = "<LINK.END>";

				startIndex = vFullText.indexOf(startTag) + startTag.length;
				endIndex = vFullText.indexOf(endTag);

				this._linkForHelpDocument = vFullText.substring(startIndex, endIndex);
				this._linkForHelpDocument = this._linkForHelpDocument.replace(/^\n+|\n+$/g, "");
			}

			this._oLongTextTemplateModel.setProperty("/templates", defM1Temp);

			//this._oLongTextTemplateModel.setProperty("/templates", aTemplates);
			if (aTemplates.length > 1) {
				this._oLongTextTemplateModel.setProperty("/enabled", true);
			}
		},
		onLongtextTemplateChanged: function (oEvent) {
			var oContext = oEvent.getSource().getSelectedItem().getBindingContext("longTextTemplates");
			this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/MaintNotifLongTextForEdit",
				oContext.getProperty("MaintNotificationLongText"));
		},
		/**
		 * helper function to set a custom data type to title text field
		 * this is done to incorporate custom error messages for the field
		 *  
		 */
		_setupTitleField: function () {
			// bind custom data type to title field
			var oTitleField = this.byId("createWrSmartFieldTitle");
			if (!oTitleField) {
				return;
			}
			var oMetaModel = this.oModel.getMetaModel();
			var sEntityType = oMetaModel && oMetaModel.getODataEntityType(Constants.ENTITY_NAMESPACE + "." + Constants.ENTITY.WORK_REQUEST_TP_TYPE);
			var sMaxLength = oMetaModel && oMetaModel.getODataProperty(sEntityType, "NotificationText") && oMetaModel.getODataProperty(
				sEntityType,
				"NotificationText").maxLength;
			var StringExtended = String.extend("custom.type.StringExtended", {
				constructor: function (oI18n, nMaxLength) {
					this._i18n = oI18n;
					return String.call(this, null, {
						maxLength: Number(nMaxLength)
					});
				},
				/**
				 * Validates whether the given value in model representation is valid and meets the
				 * defined constraints.
				 *
				 * @param {string} sValue
				 *   the value to be validated
				 * @throws {sap.ui.model.ValidateException} if the value is not valid
				 * @public
				 */
				validateValue: function (sValue) {
					String.prototype.validateValue.call(this, sValue);

					if (!sValue || sValue.trim().length === 0) {
						throw new ValidateException(this._i18n("xmsg.invalidTitle"));
					}

				},
				/**
				 * Returns the type's name.
				 *
				 * @returns {string}
				 *   the type's name
				 * @public
				 */
				getName: function () {
					return "custom.type.StringExtended";
				}
			});
			oTitleField.bindProperty("value", {
				path: "NotificationText",
				// extended string type to change validation message for title field
				type: new StringExtended(this._i18n, sMaxLength)
			});
		},
		/**
		 * helper function to set the bind a custom value help with technical object smart field
		 *  
		 */
		_setupTechnicalObjectValueHelp: function () {
			var oTechnicalObjectSmartfield = this.getView().byId("createWrSmartFieldTechObj");
			oTechnicalObjectSmartfield.attachEvent("innerControlsCreated", function () {
				var aControls = oTechnicalObjectSmartfield.getInnerControls();
				if (aControls.length > 0 && aControls[0] instanceof sap.m.Input) {
					var oTechnicalObjectInput = aControls[0];

					// Enable Value Help in inner control
					oTechnicalObjectInput.setShowValueHelp(true);
					// Ensure that the Technical Object Value Help is always
					// enabled and that this behavior cannot be reset
					oTechnicalObjectInput.setShowValueHelp = function () {
						this.setProperty("showValueHelp", true);
					}.bind(oTechnicalObjectInput);
				}
				// attach suggestion item selected event callback
				if (oTechnicalObjectInput) {
					// oTechnicalObjectInput.attachSuggestionItemSelected(function (oEvent) {
					// 	if (oEvent.getParameter("selectedRow")) {
					// 		// remove message if item is selected
					// 		this._removeMessage("TechnicalObjectLabel");
					// 	}

					// }.bind(this));
					// attach valuehelp request event and open the _oTechnicalObjectValueHelp
					oTechnicalObjectInput.attachValueHelpRequest(function () {
						if (!this._oTechnicalObjectValueHelp) {
							this._oTechnicalObjectValueHelp = new TechnicalObjectValueHelp({
								entitySetFlat: Constants.ENTITY.TECHNICAL_OBJECT_FLAT,
								entityTypeFlat: Constants.ENTITY.TECHNICAL_OBJECT_FLAT_TYPE,
								entitySetHierarchy: Constants.ENTITY.TECHNICAL_OBJECT_HIER,
								entityTypeHierarchy: Constants.ENTITY.TECHNICAL_OBJECT_HIER_TYPE,
								triggeringView: this.getView(),
								hierarchyNodeLevel: this.getView().getBindingContext().getProperty("HierarchyNodeLevel")
							});
						}
						// on Technical object selected set the other field in the model
						this._oTechnicalObjectValueHelp.attachTechnicalObjectSelected(function (oEvent) {
							this._removeMessage("TechnicalObjectLabel");
							// set count of current work requests to 0
							// this._oLocalViewModel.setProperty("/currentWorkRequests", 0);
							var oSelectedTechnicalObject = oEvent.getParameters();
							// hierarchy node level for hierarchy view 
							this._oTechnicalObjectValueHelp.setHierarchyNodeLevel(oSelectedTechnicalObject.HierarchyNodeLevel);
							// Technical Object Label Field 
							this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/TechnicalObjectLabel",
								oSelectedTechnicalObject.TechnicalObjectLabel);
							// Technical Object Type (EAMS_EQUI / EAMS_FL) Field 
							this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/TechObjIsEquipOrFuncnlLoc",
								oSelectedTechnicalObject.TechObjIsEquipOrFuncnlLoc);
							// assetLocation field (location Id)	
							this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/AssetLocation",
								oSelectedTechnicalObject.AssetLocation);
							// assetLocation Name (location name)
							this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/LocationName",
								oSelectedTechnicalObject.LocationName);
							this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/TechnicalObjectDescription",
								oSelectedTechnicalObject.TechnicalObjectDescription);

							// set current work requests
							this.oModel.firePropertyChange({
								path: "TechnicalObjectLabel",
								context: this.getView().getBindingContext()
							});

						}, this);
						var sValue = oTechnicalObjectInput.getValue();
						var oWorkRequest = this.getView().getBindingContext().getObject();
						if (sValue !== "" && oWorkRequest.TechnicalObject !== "" && (oWorkRequest.TechObjIsEquipOrFuncnlLoc === Constants.FUNCTIONAL_LOCATION ||
							oWorkRequest.TechObjIsEquipOrFuncnlLoc === Constants.EQUIPMENT)) {
							// if technical object is already selected in vh control then show hierarchy vew
							this._toggleHierarchy();
						} else {
							// otherwise set search String to the entered text
							this._toggleHierarchy({
								TechnicalObjectLabel: sValue,
								TechnicalObject: "",
								TechObjIsEquipOrFuncnlLoc: ""
							});
						}
						// open the dialog
						this._oTechnicalObjectValueHelp.open();
					}.bind(this));
				}

			}.bind(this));
		},

		/**
		 * helper function to set the failure mode and failure mode group field instance
		 */
		_setFailureModeFieldsInstances: function () {
			var that = this;
			this._oFailureModeCodeGroupField = this.byId("createWrSmartFieldFailureModeGroup");
			this._oFailureModeField = this.byId("createWrSmartFieldFailureMode");
			if (this._oFailureModeField) {
				this.oFailureModePromise = new Promise(function (resolve, reject) {
					that._oFailureModeField.attachEvent("innerControlsCreated", function () {
						that._oFailureModeComboBox = this._oFailureModeField.getInnerControls()[0];
						resolve(that._oFailureModeComboBox);
					}.bind(that));
				});
			}
			if (this._oFailureModeCodeGroupField) {
				that._oFailureModeCodeGroupField.attachEvent("innerControlsCreated", function () {
					that._oFailureModeCodeGroupComboBox = that._oFailureModeCodeGroupField.getInnerControls()[0];
				}.bind(that));
			}
		},
		/**
		 * helper function to set the growing property for longtext field
		 */
		_setupLongTextField: function () {
			// Long text set growing property
			this.getView().byId("createWrNotifLongText").attachInnerControlsCreated(function (oEvent) {
				var aTextArea = oEvent.getSource().getInnerControls().filter(function (oControl) {
					return oControl instanceof sap.m.TextArea;
				});
				if (!aTextArea || !aTextArea.length) {
					return;
				}

				aTextArea[0].setGrowingMaxLines(7);
				aTextArea[0].setGrowing(true);
			});
		},
		_sortPriority: function (oEvent) {
			var aControls = oEvent.getSource().getInnerControls().filter(function (oControl) {
				return oControl instanceof sap.m.ComboBox;
			});
			// var that = this;
			if (aControls && aControls[0]) {
				var oPriorityComboBox = aControls[0],
					bIsPrioritySorted = false,
					sSortProperty = "MaintPriority";
				aControls[0].onAfterRenderingList = function () {
					var oPriorityComboBoxItems = oPriorityComboBox.getBinding("items");
					var oSorter = oPriorityComboBoxItems && oPriorityComboBoxItems.aSorters && oPriorityComboBoxItems.aSorters[0];
					bIsPrioritySorted = oSorter && oSorter.sPath === sSortProperty;
					if (oPriorityComboBoxItems && !bIsPrioritySorted) {
						oPriorityComboBoxItems.sort(new sap.ui.model.Sorter(sSortProperty, false, false));
						bIsPrioritySorted = true;
					}
				};
			}

		},
		_sortDetectionCodes: function (oEvent) {
			var aControls = oEvent.getSource().getInnerControls().filter(function (oControl) {
				return oControl instanceof sap.m.ComboBox;
			});
			var that = this;
			if (aControls && aControls[0]) {
				this.oDetectionCodeComboBox = aControls[0];
				aControls[0].onAfterRenderingList = function (oEvent2) {
					var oDetectionCodeItems = that.oDetectionCodeComboBox.getBinding("items");
					if (oDetectionCodeItems && !oDetectionCodeItems.isGrouped()) {
						oDetectionCodeItems.sort(new sap.ui.model.Sorter("MaintNotifDetectionCodeGrpTxt", false, true));
					}
				};
			}

		},

		/**
		 * Event handler for change in detection code value
		 * 
		 */
		onLoadDetectionCode: function (oEvent) {

			// this.oModel.setProperty(this.getView().getBindingContext().getPath() + "/MaintNotifDetectionCodeGroup", "");
		},
		/**
		 * returns the views component
		 * @returns  {sap.ui.component} oComponent
		 *  
		 */
		getMyComponent: function () {
			var sComponentId = sap.ui.core.Component.getOwnerIdFor(this.getView());
			return sap.ui.component(sComponentId);
		}
	});
});
/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/m/Dialog","sap/m/DialogRenderer","sap/ui/comp/smarttable/SmartTable","sap/ui/comp/smarttable/TableType","sap/ui/comp/smartfilterbar/SmartFilterBar","sap/ui/comp/smartfilterbar/ControlConfiguration","sap/m/Button","sap/m/Toolbar","sap/m/SegmentedButton","sap/m/SegmentedButtonItem","sap/m/ToolbarSpacer","sap/ui/core/CustomData","sap/m/Column","sap/m/ColumnListItem","sap/ui/core/Icon","sap/m/Table","sap/m/ObjectIdentifier","sap/m/Text","sap/m/HBox","sap/m/FlexAlignItems","sap/ui/table/TreeTable","sap/ui/table/Column","sap/ui/table/SelectionBehavior","sap/ui/table/SelectionMode","sap/ui/layout/HorizontalLayout","sap/m/Link","sap/ui/model/Filter","sap/ui/comp/smartvariants/SmartVariantManagement","sap/m/Bar","sap/ui/model/json/JSONModel"],function(D,a,S,T,b,C,B,c,d,e,f,g,h,i,I,j,O,k,H,F,l,m,n,o,p,L,q,r,M,J){"use strict";var s=D.extend("orion.maintreq.manage.controls.TechnicalObjectValueHelp",{metadata:{properties:{"entitySetFlat":"string","entityTypeFlat":"string","entitySetHierarchy":"string","entityTypeHierarchy":"string","isValidTechnicalObject":{type:"boolean",defaultValue:false},"searchString":"string","TechnicalObject":"string","TechObjIsEquipOrFuncnlLoc":"string","TechnicalObjectLabel":"string","hierarchyNodeLevel":"string"},aggregations:{"triggeringView":{type:"sap.ui.core.mvc.View",multiple:false}},events:{"technicalObjectSelected":{parameters:{"selectedObject":"object"}}}},constants:{EQUIPMENT:"EAMS_EQUI",FUNCTIONAL_LOCATION:"EAMS_FL",EQUIPMENT_ICON:"sap-icon://technical-object",FUNCTIONAL_LOCATION_ICON:"sap-icon://functional-location",TEXT_FIELDS_TO_IGNORE:"TechnicalObjectCategoryDesc,TechnicalObjectTypeDesc,ABCIndicatorDesc,"+"BusinessAreaName,CompanyCodeName,ControllingAreaName,CostCenterDescription,WorkCenterText,MainWorkCenterText,MaintenancePlantName,"+"MaintenancePlannerGroupName,PlantSectionPersonRespName,DivisionName,LocationName",IGNORE_FROM_PERSONALIZATION:"TechnicalObject,TechnicalObjectLabel,TechObjIsEquipOrFuncnlLoc",REQUEST_AT_LEAST_FIELDS:"TechnicalObject,TechObjIsEquipOrFuncnlLoc,TechnicalObjectDescription",INITIALLY_VISIBLE_FIELDS_FLAT_TABLE:"",TECHNICAL_FIELDS_HIERARCHY:"DrillDownState,HierarchyNodeLevel",TECHNICAL_OBJECT_IDENTIFIER_HIERARCHY_TABLE:"TechnicalObjectIdentifierHierarchyTable",TECHNICAL_OBJECT_IDENTIFIER_FLAT_TABLE:"TechnicalObjectIdentifierFlatTable"},_oResourceBundle:null,_oDeviceModel:null,_oSmartTableFlat:null,_oSmartFilterBarFlat:null,_oSmartTableHierarchy:null,_oSmartFilterBarHierarchy:null,_oSmartTableToolbarHierarchy:null,_oSelectedInstallationLocation:null,_oBacktoSearchLink:null,_oSmartVariantManagement:null,_SearchFieldValue:null,renderer:function(R,t){t._insertDialogContent();a.render(R,t);}});s.prototype.setTriggeringView=function(t){this._oResourceBundle=t.getModel("i18n").getResourceBundle();this._oDeviceModel=t.getModel("device");t.addDependent(this);this._setTexts();this._setStretchDialog(this._oDeviceModel);};s.prototype.setEntityTypeFlat=function(E){this.setProperty("entityTypeFlat",E,true);this._oSmartFilterBarFlat.setEntityType(this.getEntityTypeFlat());};s.prototype.setEntitySetFlat=function(E){this.setProperty("entitySetFlat",E,true);this._oSmartTableFlat.setEntitySet(this.getEntitySetFlat());};s.prototype.setEntityTypeHierarchy=function(E){this.setProperty("entityTypeHierarchy",E,true);};s.prototype.setEntitySetHierarchy=function(E){this.setProperty("entitySetHierarchy",E,true);this._oSmartTableHierarchy.setEntitySet(this.getEntitySetHierarchy());};s.prototype.init=function(){var t=new sap.ui.model.json.JSONModel();this.setModel(t,"HierModel");this.getModel("HierModel").setProperty("/HierFlag","");if(D.prototype.init){D.prototype.init.apply(this,arguments);}this._initDialog();this._initSmartTableToolbarHierarchy();this._createSmartVariantManagement();this._createSmartTableHierarchy();this._createSmartFilterBarFlat();this._createSmartTableFlat();};s.prototype.exit=function(){if(D.prototype.exit){D.prototype.exit.bind(this);}if(this._oSmartTableFlat){this._oSmartTableFlat.destroy();this._oSmartTableFlat=null;}if(this._oSmartFilterBarFlat){this._oSmartFilterBarFlat.destroy();this._oSmartFilterBarFlat=null;}if(this._oSmartTableHierarchy){this._oSmartTableHierarchy.destroy();this._oSmartTableHierarchy=null;}};s.prototype._setTexts=function(){var t=this;this.setTitle(this._oResourceBundle.getText("xtit.selectTechnicalObject"));this._oSmartTableFlat.setHeader(this._oResourceBundle.getText("xtit.technicalObjects"));this.addButton(new B({text:t._oResourceBundle.getText("xbut.cancel"),press:function(){t.close();}}));this._oSmartTableHierarchy.getTable().getColumns().some(function(u){if(u.getId()===t.constants.TECHNICAL_OBJECT_IDENTIFIER_HIERARCHY_TABLE){u.getLabel().setText(t._oResourceBundle.getText("xcol.technicalObjectIdentifier"));}});this._oSmartTableFlat.getTable().getColumns().some(function(u){if(u.getId()===t.constants.TECHNICAL_OBJECT_IDENTIFIER_FLAT_TABLE){u.getHeader().setText(t._oResourceBundle.getText("xcol.technicalObjectIdentifier"));}});this._setTextSearchButton();};s.prototype._setTextSearchButton=function(){var t=this._oSmartTableToolbarHierarchy.getContent().filter(function(u){return u.getId()==="technicalObjectHierarchyLinkBackToSearch";})[0];if(t){if(!this.getIsValidTechnicalObject()){t.setText(this._oResourceBundle.getText("xlnk.backToSearchResults"));}else if(this.getIsValidTechnicalObject()&&this.getTechnicalObject()&&(this.getTechObjIsEquipOrFuncnlLoc()==="EAMS_FL"||this.getTechObjIsEquipOrFuncnlLoc()==="EAMS_EQUI")){t.setText(this._oResourceBundle.getText("xlnk.Search"));}}};s.prototype._setStretchDialog=function(t){if(t&&t.getProperty("/system/phone")){this.setStretch(true);}};s.prototype._insertDialogContent=function(){if(this.getContent()&&this.getContent().length===0){this.insertContent(new M({contentLeft:[this._oSmartVariantManagement]}),0);this._oSmartVariantManagement.setPersistencyKey("malfuncManageSelectTechnicalObject");this.insertContent(this._oSmartTableHierarchy,1);this.insertContent(this._oSmartFilterBarFlat,2);this.insertContent(this._oSmartTableFlat,3);}this._setInitialDialogLayout();};s.prototype._displayFlatList=function(){this._oSmartTableFlat.setVisible(true);this._oSmartFilterBarFlat.setVisible(true);this._oSmartTableHierarchy.setVisible(false);};s.prototype._displayHierarchy=function(){this._oSmartTableFlat.setVisible(false);this._oSmartFilterBarFlat.setVisible(false);this._oSmartTableHierarchy.setVisible(true);};s.prototype._triggerSearch=function(){if(this._oSmartFilterBarFlat.getBasicSearchControl()){this._oSmartFilterBarFlat.getBasicSearchControl().setValue(this.getSearchString());if(this.getSearchString()&&this.getSearchString().trim().length>0){this._SearchFieldValue=this.getSearchString();this._oSmartFilterBarFlat.fireSearch();}}};s.prototype._triggerSearchOnInit=function(){this._triggerSearch();this._oSmartFilterBarFlat.detachInitialise(this._triggerSearchOnInit,this);};s.prototype._setInitialDialogLayout=function(){var t=(sap.ui.Device.system.combi||sap.ui.Device.system.desktop||sap.ui.Device.system.tablet);if(!this.getIsValidTechnicalObject()){this._displayFlatList();this._oSmartFilterBarFlat.attachInitialise(this._triggerSearchOnInit,this);this._triggerSearch();}else if(this.getIsValidTechnicalObject()&&this.getTechnicalObject()&&(this.getTechObjIsEquipOrFuncnlLoc()==="EAMS_FL"||this.getTechObjIsEquipOrFuncnlLoc()==="EAMS_EQUI")&&t){this._displayHierarchy();this._oSelectedInstallationLocation={TechnicalObject:this.getTechnicalObject(),TechObjIsEquipOrFuncnlLoc:this.getTechObjIsEquipOrFuncnlLoc(),TechnicalObjectLabel:this.getTechnicalObjectLabel(),HierarchyNodeLevel:this.getHierarchyNodeLevel()};this._oSmartTableHierarchy.rebindTable();}else{this._displayFlatList();}};s.prototype._initDialog=function(){this.setHorizontalScrolling(false);this.setContentHeight("1080px");this.setContentWidth("930px");};s.prototype._initSmartTableToolbarHierarchy=function(){var t=this;if(!this._oSmartTableToolbarHierarchy){if(!this._oBackToSearchLink){this._oBackToSearchLink=new B("technicalObjectHierarchyLinkBackToSearch",{type:sap.m.ButtonType.Transparent,press:function(E){t._displayFlatList();E.preventDefault=true;}});}this._oSmartTableToolbarHierarchy=new c({content:[new f(),this._oBackToSearchLink]});}};s.prototype._createSmartVariantManagement=function(){this._oSmartVariantManagement=new sap.ui.comp.smartvariants.SmartVariantManagement("malfuncManageSelectTechnicalObjectVariant",{showExecuteOnSelection:true});this._oSmartVariantManagement.addStyleClass("sapUiResponsiveMargin");};s.prototype._createSmartFilterBarFlat=function(){var t=(sap.ui.Device.system.combi||sap.ui.Device.system.desktop||sap.ui.Device.system.tablet);var u=this;this._oSmartFilterBarFlat=new b({persistencyKey:"malfuncManageSelectTechnicalObjectFilterFlat",id:"SmartFilterBarFlatId",useVariantManagement:true,smartVariant:this._oSmartVariantManagement.getId(),enableBasicSearch:true,afterVariantLoad:function(){if(u._SearchFieldValue!==null){this.getBasicSearchControl().setValue(u._SearchFieldValue);}this.fireSearch();}});this._oSmartFilterBarFlat.setUseToolbar(false);this._oSmartFilterBarFlat.addControlConfiguration(new C("SmartFilterIdFlatTechnicalObjectSortField",{id:"SmartFilterIdFlatTechnicalObjectSortField",key:"MaintObjectFreeDefinedAttrib",index:0,visibleInAdvancedArea:t}));this._oSmartFilterBarFlat.addControlConfiguration(new C("SmartFilterIdFlatTechObjIsEquipOrFuncnlLoc",{id:"SmartFilterIdTechObjIsEquipOrFuncnlLoc",key:"TechObjIsEquipOrFuncnlLoc",index:1,visibleInAdvancedArea:t}));this._oSmartFilterBarFlat.addControlConfiguration(new C("SmartFilterIdFlatTechnicalObjectType",{id:"SmartFilterIdTechnicalObjectType",key:"TechnicalObjectType",index:2,visibleInAdvancedArea:t}));this._oSmartFilterBarFlat.addControlConfiguration(new C("SmartFilterIdFlatAssetLocation",{id:"SmartFilterIdFlatAssetLocation",key:"AssetLocation",index:3,visibleInAdvancedArea:t}));this._oSmartFilterBarFlat.addControlConfiguration(new C("SmartFilterIdFlatWorkCenter",{id:"SmartFilterIdFlatWorkCenter",key:"WorkCenter",index:4,visibleInAdvancedArea:t}));};s.prototype._createSmartTableHierarchy=function(){var t=this;this._oSmartTableHierarchy=new S({persistencyKey:"malfuncManageSelectTechnicalObjectHierarchy",tableType:T.TreeTable,demandPopin:false,enableAutoBinding:true,editable:false,smartFilterId:"SmartFilterBarHierarchyId",smartVariant:this._oSmartVariantManagement.getId(),useExportToExcel:false,showRowCount:false,customData:{key:"p13nDialogSettings",value:{filter:{visible:false}}},ignoreFromPersonalisation:this.constants.TECHNICAL_FIELDS_HIERARCHY+","+this.constants.IGNORE_FROM_PERSONALIZATION+","+this.constants.TEXT_FIELDS_TO_IGNORE,requestAtLeastFields:this.constants.REQUEST_AT_LEAST_FIELDS,customToolbar:t._oSmartTableToolbarHierarchy,items:[this._getCustomFieldsTableHierarchy()],beforeRebindTable:function(E){t._oSmartTableHierarchy.setHeader((t._oSelectedInstallationLocation.TechnicalObjectLabel)?t._oResourceBundle.getText("xtit.technicalObjectStructure",[t._oSelectedInstallationLocation.TechnicalObjectLabel]):t._oResourceBundle.getText("xtit.technicalObjects"));var u=E.getParameter("bindingParams");u.parameters.useServersideApplicationFilters=true;u.parameters.threshold=Number.MAX_VALUE;u.parameters.operationMode="Client";u.parameters.numberOfExpandedLevels=parseInt(t._oSelectedInstallationLocation.HierarchyNodeLevel,10);var v={"hierarchyLevelFor":"HierarchyNodeLevel","hierarchyNodeFor":"HierarchyNodeUniqueID","hierarchyParentNodeFor":"ParentNodeUniqueID","hierarchyDrillStateFor":"DrillDownState"};var w=new Date();var N=new Date(0);var x=new sap.ui.model.odata.type.Time();var y=x.formatValue({ms:w.getTime(),__edmType:"Edm.Time"},"any");u.parameters.treeAnnotationProperties=v;var z=[new q("TechnicalObject","EQ",t._oSelectedInstallationLocation.TechnicalObject),new q("TechObjIsEquipOrFuncnlLoc","EQ",t._oSelectedInstallationLocation.TechObjIsEquipOrFuncnlLoc)];if(!u.filters&&Array.isArray(u.filters)){u.filters.push(z);}else{u.filters=z;}u.events={"dataReceived":function(A){var R=A.getParameter("data");if(R.results.length>=100&&this.getModel("HierModel").getProperty("/HierFlag")===""){sap.m.MessageBox.information(t._oResourceBundle.getText("xtit.technicalObjectIdentifier"));}this.getModel("HierModel").setProperty("/HierFlag","");}};}});this._oSmartTableHierarchy.addStyleClass("sapUiResponsiveMargin");};s.prototype._createSmartTableFlat=function(){this._oSmartTableFlat=new S({tableType:T.ResponsiveTable,persistencyKey:"malfuncManageSelectTechnicalObjectTableFlat",demandPopin:true,enableAutoBinding:true,smartFilterId:"SmartFilterBarFlatId",enableAutoColumnWidth:true,smartVariant:this._oSmartVariantManagement.getId(),useExportToExcel:false,customData:{key:"p13nDialogSettings",value:{filter:{visible:false}}},ignoreFromPersonalisation:"TechnicalObjectDescription,"+this.constants.IGNORE_FROM_PERSONALIZATION+","+this.constants.TEXT_FIELDS_TO_IGNORE,requestAtLeastFields:this.constants.REQUEST_AT_LEAST_FIELDS+",HierarchyNodeLevel"+",AssetLocation"+",LocationName",items:[this._getCustomFieldsTableFlat()]});this._oSmartTableFlat.addStyleClass("sapUiResponsiveMargin");};s.prototype._getCustomFieldsTableFlat=function(){var t=this;var u=(sap.ui.Device.system.combi||sap.ui.Device.system.desktop||sap.ui.Device.system.tablet);return new j({itemPress:function(E){var v=E.getParameter("listItem").getBindingContext().getObject();t.fireTechnicalObjectSelected(v);t.close();},growing:true,growingScrollToLoad:true,columns:[new h({id:t.constants.TECHNICAL_OBJECT_IDENTIFIER_FLAT_TABLE,header:new k({}),customData:new g({key:"p13nData",value:{"columnKey":"TechnicalObjectIdentifier","leadingProperty":"TechnicalObjectLabel","sortProperty":"TechnicalObjectLabel","filterProperty":"TechnicalObjectLabel","columnIndex":"0"}})}),new h({id:"TechObjInstallationLocation",demandPopin:true,header:new k({text:"{/C_TechObjFlatVH/TechObjInstallationLocation/#@sap:label}"}),customData:new g({key:"p13nData",value:{"columnKey":"TechObjInstallationLocationLink","leadingProperty":"TechObjInstallationLocation","filterProperty":"TechObjInstallationLocation","columnIndex":"1"}})})],items:[new i({type:sap.m.ListType.Active,cells:[new H({alignItems:F.Center,items:[new I({src:{path:"TechObjIsEquipOrFuncnlLoc",formatter:t._getTechnicalObjectIcon.bind(t)}}).addStyleClass("sapUiSmallMarginEnd"),new O({title:"{TechnicalObjectLabel}",text:"{TechnicalObjectDescription}"})]}),new L({text:"{TechObjInstallationLocation}",enabled:u,wrapping:true,visible:"{= ${TechObjInstallationLocation}?true:false}",press:function(E){t._oSelectedInstallationLocation=E.getSource().getParent().getBindingContext().getObject();t._displayHierarchy();t._oSmartTableHierarchy.rebindTable();E.preventDefault=true;}})]})]});};s.prototype._getCustomFieldsTableHierarchy=function(){var t=this;var u=new l({rootLevel:1,enableSelectAll:false,selectionMode:o.Single,selectionBehavior:n.RowOnly,rowSelectionChange:function(E){var v=E.getParameter("rowContext").sPath;var w=this.getModel().getProperty(v);t.getModel("HierModel").setProperty("/HierFlag","X");t.fireTechnicalObjectSelected(w);t.close();},columns:[new m({id:t.constants.TECHNICAL_OBJECT_IDENTIFIER_HIERARCHY_TABLE,label:new k({}),template:new p({content:[new I({src:{path:"TechObjIsEquipOrFuncnlLoc",formatter:t._getTechnicalObjectIcon.bind(t)}}).addStyleClass("sapUiSmallMarginEnd"),new k({text:{parts:[{path:"TechnicalObjectDescription"},{path:"TechnicalObjectLabel"}],formatter:t._concatIdAndDescription.bind(t)}})]}),customData:new g({key:"p13nData",value:{"columnKey":"TechnicalObjectIdentifier","leadingProperty":"TechnicalObjectLabel","sortProperty":"TechnicalObjectLabel","filterProperty":"TechnicalObjectLabel","columnIndex":"0"}})})]});u.addStyleClass("sapUiSizeCompact");return u;};s.prototype._concatIdAndDescription=function(t,u){if(t&&t.trim()){return t+((u)?" ("+u+")":"");}else{return(u)?u:"";}};s.prototype._getTechnicalObjectIcon=function(t){var u="";switch(t){case this.constants.EQUIPMENT:u=this.constants.EQUIPMENT_ICON;break;case this.constants.FUNCTIONAL_LOCATION:u=this.constants.FUNCTIONAL_LOCATION_ICON;break;case"":u="";break;case null:u="";break;default:throw new Error("Unknown Technical Object Type");}return u;};return s;});
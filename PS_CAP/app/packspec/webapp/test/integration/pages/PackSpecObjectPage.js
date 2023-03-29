sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'packspec',
            componentId: 'PackSpecObjectPage',
            entitySet: 'PackSpec'
        },
        CustomPageDefinitions
    );
});
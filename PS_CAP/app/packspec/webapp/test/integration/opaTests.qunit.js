sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'packspec/test/integration/FirstJourney',
		'packspec/test/integration/pages/PackSpecList',
		'packspec/test/integration/pages/PackSpecObjectPage'
    ],
    function(JourneyRunner, opaJourney, PackSpecList, PackSpecObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('packspec') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onThePackSpecList: PackSpecList,
					onThePackSpecObjectPage: PackSpecObjectPage
                }
            },
            opaJourney.run
        );
    }
);
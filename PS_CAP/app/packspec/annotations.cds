using PackSpec as service from '../../srv/service';

annotate service.PackSpec with @(

UI: {
    SelectionFields: [ps_id],
    LineItem       : [
        {
            $Type: 'UI.DataField',
            Label: 'PackSpec ID',
            Value: ps_id,
        },
        {
            $Type: 'UI.DataField',
            Label: 'Description',
            Value: ps_desc,
        },]
});

annotate service.PackSpec with @(
    UI.FieldGroup #GeneratedGroup1: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Label: 'Description',
                Value: ps_desc,
            },
            {
                $Type: 'UI.DataField',
                Label: 'PackSpec ID',
                Value: ps_id,
            },
        ],
    },
    UI.Facets                     : [
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'GeneratedFacet1',
            Label : 'Information',
            Target: '@UI.FieldGroup#GeneratedGroup1',
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'PS Header',
            ID    : 'PSHeader',
            Target: '@UI.FieldGroup#PSHeader',
        },
    ]
);

annotate service.PackSpec with @(UI.FieldGroup #Header: {
    $Type: 'UI.FieldGroupType',
    Data : [],
});

annotate service.PackSpec with @(UI.FieldGroup #PSHeader: {
    $Type: 'UI.FieldGroupType',
    Data : [
        {
            $Type: 'UI.DataField',
            Value: header.material,
            Label: 'Material',
        },
        {
            $Type: 'UI.DataField',
            Value: header.ps_group,
            Label: 'PackSpec Group',
        },
        {
            $Type: 'UI.DataField',
            Value: header.modifiedAt,
            Label: 'Modified At',
        },
        {
            $Type: 'UI.DataField',
            Value: header.createdAt,
            Label: 'Created At',
        },
    ],
});

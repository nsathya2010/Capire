using Students as service from '../../srv/upload-service';

annotate service.Students with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'StudentId',
            Value : StudentId,
        },
        {
            $Type : 'UI.DataField',
            Label : 'FirstName',
            Value : FirstName,
        },
        {
            $Type : 'UI.DataField',
            Label : 'LastName',
            Value : LastName,
        },
        {
            $Type : 'UI.DataField',
            Label : 'DOB',
            Value : DOB,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Address',
            Value : Address,
        },
    ]
);
annotate service.Students with @(
    UI.FieldGroup #GeneratedGroup1 : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'StudentId',
                Value : StudentId,
            },
            {
                $Type : 'UI.DataField',
                Label : 'FirstName',
                Value : FirstName,
            },
            {
                $Type : 'UI.DataField',
                Label : 'LastName',
                Value : LastName,
            },
            {
                $Type : 'UI.DataField',
                Label : 'DOB',
                Value : DOB,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Address',
                Value : Address,
            },
            {
                $Type : 'UI.DataField',
                Value : ID,
                Label : 'ID',
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup1',
        },
    ]
);

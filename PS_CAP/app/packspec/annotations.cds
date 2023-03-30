using PackSpec as service from '../../srv/service';

annotate service.PackSpec with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'PS ID',
            Value : ps_id,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Description',
            Value : ps_desc,
        },
    ]
);
annotate service.PackSpec with @(
    UI.FieldGroup #GeneratedGroup1 : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'PS ID',
                Value : ps_id,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Description',
                Value : ps_desc,
            },
            {
                $Type : 'UI.DataField',
                Value : ID,
                Label : 'ID',
            },
            {
                $Type : 'UI.DataField',
                Value : createdBy,
            },
            {
                $Type : 'UI.DataField',
                Value : createdAt,
            },
            {
                $Type : 'UI.DataField',
                Value : modifiedAt,
            },
            {
                $Type : 'UI.DataField',
                Value : modifiedBy,
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
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Header Details',
            ID : 'HeaderDetails',
            Target : '@UI.FieldGroup#HeaderDetails',
        },
    ]
);
annotate service.PackSpec with @(
    UI.FieldGroup #HeaderDetails : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : header.material,
                Label : 'Material',
            },{
                $Type : 'UI.DataField',
                Value : header.ps_group,
                Label : 'PS Group',
            },
            {
                $Type : 'UI.DataField',
                Value : header.createdAt,
            },
            {
                $Type : 'UI.DataField',
                Value : header.createdBy,
            },
            {
                $Type : 'UI.DataField',
                Value : header.ID,
                Label : 'ID',
            },
            {
                $Type : 'UI.DataField',
                Value : header.master_key_ID,
                Label : 'master_key_ID',
            },
            {
                $Type : 'UI.DataField',
                Value : header.modifiedAt,
            },
            {
                $Type : 'UI.DataField',
                Value : header.modifiedBy,
            },],
    }
);
annotate service.PackSpec with @(
    UI.SelectionFields : [
        ps_id,
        header.material,
    ]
);

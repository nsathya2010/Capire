namespace ps.db;

using
{
    cuid,
    temporal,
    managed
}
from '@sap/cds/common';

using { ps.commons } from './commons';

context masterdata
{
    entity ps_master : cuid, managed
    {
        ps_id : Integer;
        ps_desc : String;
        header : Composition  of one ps_header on header.master_key = $self;
        // levels : Composition of many ps_level on header.master_key = $self;
    }

    entity ps_header : cuid, managed
    {
        ps_group : commons.ps_group;
        material : String(10);
        master_key : Association to ps_master;
    }

//     entity ps_level : cuid, managed
//     {
//         ps_level : commons.ps_level;
//         ps_master_id : String;
//         ps_level_mat : Association to one ps_level_mat;
//         ps_master : Composition of one ps_master on ps_master.ID = $self.ps_master_id;
//     }

//     entity ps_level_mat : cuid, managed
//     {
//         // material : commons.material;
//         material : String(10);
//         ps_level_id : String;
//         ps_level : Composition of one ps_level on ps_level.ID = $self.ps_level_id;
//     }
}

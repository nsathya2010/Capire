using ps.db as db from '../db/tables';

service PackSpec {
  entity PS_Header as projection on db.masterdata.ps_header;
  entity PackSpec as projection on db.masterdata.ps_master
  {
    *,
    header : redirected to PS_Header
  };

function generateQuoteId() returns String;  
//   entity PS_Level as projection on db.masterdata.ps_level;
//   entity PS_Level_Items as projection on db.masterdata.ps_level_mat;
}

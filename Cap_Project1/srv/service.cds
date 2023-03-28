using {com.sat.db  } from '../db/table';


service NewService { 
entity OrderSet as projection on db.trans.order;
function helloCap(name: String) returns String;

}
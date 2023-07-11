using {SampleCAP.up as up} from '../db/data-upload';

service Students @(path: '/Students')
{ 
@cds.persistence.skip
@odata.singleton
 entity ExcelUpload {
        @Core.MediaType : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        excel : LargeBinary;
    };

entity Students as projection on up.Students
}
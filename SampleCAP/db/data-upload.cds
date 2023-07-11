namespace SampleCAP.up;
using
{
    cuid,
    temporal,
    managed
} from '@sap/cds/common';


entity Students : cuid {
 StudentId: String(6);
 FirstName: String;
 LastName: String;
 DOB: Date;
 Address: String;
}
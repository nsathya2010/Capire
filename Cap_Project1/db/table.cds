namespace com.sat.db;
using { Currency, managed, cuid, temporal } from '@sap/cds/common';

context trans {
    entity order : cuid, managed {
        key id_cust: Int16;
        customer: String;
        total : Decimal(10,2);
        currency: Currency;
    }
}


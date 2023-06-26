namespace ticketing;

entity Customer {
    key ID               : UUID;
        firstName        : String;
        lastName         : String;
        email            : String;
        phone            : String;
        submittedTickets : Association to many Ticket
                               on submittedTickets.requestedBy = $self;
}

entity Agent {
    key ID              : UUID;
        firstName       : String;
        lastName        : String;
        email           : String;
        phone           : String;
        expertise       : String;
        workload        : Integer;
        assignedTickets : Association to many Ticket
                              on assignedTickets.assignedTo = $self;
}

entity Ticket {
    key ID             : UUID;
        title          : String;
        description    : String;
        priority       : Integer;
        status         : String;
        submittedAt    : DateTime;
        updatedAt      : DateTime;
        requestedBy    : Association to Customer;
        assignedTo     : Association to Agent;
        channel        : String;
        communications : Composition of many Communication
                             on communications.ticket = $self;
}

entity Communication {
    key ID        : UUID;
        ticket    : Association to Ticket;
        message   : String;
        timestamp : Timestamp @cds.on.insert : $now
}

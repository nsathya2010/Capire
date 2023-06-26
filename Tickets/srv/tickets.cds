using {ticketing} from '../db/tickets.cds';


service TicketingService {
    entity Customers as projection on ticketing.Customer;
    entity Agents    as projection on ticketing.Agent;
    entity Tickets   as projection on ticketing.Ticket;
    entity Communication   as projection on ticketing.Communication;
}

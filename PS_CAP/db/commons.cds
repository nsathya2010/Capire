namespace ps.commons;

type ps_group : String(4) enum{
    ps1 = 'PS1'; 
    ps2 = 'PS2'; 
    ps3 = 'PS3'; 
    ps4 = 'PS4'; 
};

type ps_level : String(2) enum{
    l1 = 'L1'; 
    l2 = 'L2'; 
    l3 = 'L3'; 
    l4 = 'L4'; 
};

// type material : Association to materials_list;


entity materials_list {
    material: String(10);
    desc: String;
    is_packaging: String(1);

};


module.exports = cds.service.impl(async function () {

    //Step 1: get the object of our odata entities
    const { PackSpec, PS_Header } = this.entities;

    //Step 2: define generic handler for validation
    this.before('INSERT', PackSpec, async (req, res) => {
        try {
            const tx = cds.transaction(req);
            const Highest_PSID = await tx.read(PackSpec).orderBy({
                ps_id: 'desc'
            }).limit(1);

            if (Highest_PSID[0].ps_id === undefined) {
                req.data.ps_id = 300000000;
            } else {
                req.data.ps_id = Highest_PSID[0].ps_id;
                req.data.ps_id++;
            }

        } catch (error) {
            req.data.ps_id = 300000000;
        }

        console.log("New PS_ID " + req.data.ps_id);
    });
});

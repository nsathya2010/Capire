module.exports = cds.service.impl(async function () { // Step 1: get the object of our odata entities
    const {PackSpec, PS_Header} = this.entities;

    // Step 2: define generic handler for validation
    this.before('INSERT', PackSpec, async (req, res) => {
        try {
            const tx = cds.transaction(req);
            const Highest_PSID = await tx.read(PackSpec).orderBy({ps_id: 'desc'}).limit(1);
            req.data.ps_id = null;

            if (Highest_PSID[0].ps_id === undefined) {
                req.data.ps_id = 300000001;
            } else {
                req.data.ps_id = await generateUniquePsId(tx, Highest_PSID[0].ps_id + 1);
            }
        } catch (error) {
            req.data.ps_id = 300000001;
        }
        console.log("New PS_ID " + req.data.ps_id);
    });

    async function generateUniquePsId(tx, ps_id) {
        try {
            const existingPackSpec = await tx.read(PackSpec).where({ps_id: ps_id});
            if (existingPackSpec.length === 0) {
                return ps_id;
            } else {
                return generateUniquePsId(tx, ps_id + 1);
            }
        } catch (error) {
            throw error;
        }
    }
});

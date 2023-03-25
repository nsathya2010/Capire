const NewService = function(srv){
    srv.on('helloCap', (req,res) => {
        return "Hello " + capitalizeFirstLetter(req.data.name);
    });
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  

module.exports = NewService;    
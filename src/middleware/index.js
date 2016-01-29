// Usually this is a big no no but passport requires the 
// request object to inspect req.body and req.query so we
// need to miss behave a bit. Don't do this in your own code!
export let passRequestObject = function(req, res, next) {
  req.feathers.req = req;
  next();
}
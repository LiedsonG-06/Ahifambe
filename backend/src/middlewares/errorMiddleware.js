const errorMiddleware = (error, req, res, _next) => {
  const operational=Boolean(error.isOperational)&&Number.isInteger(error.statusCode);
  const statusCode=operational?error.statusCode:500;
  if(!operational) console.error('Unexpected server error:', error.stack || error.message);
  res.status(statusCode).json({message:operational?(error.message||'Request failed.'):'Internal server error.'});
};
module.exports=errorMiddleware;
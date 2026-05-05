const check = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Ahifambe API',
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  check,
};

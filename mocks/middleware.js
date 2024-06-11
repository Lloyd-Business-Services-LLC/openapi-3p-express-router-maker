'use strict';

const healthMiddleware = (req, res, next) => {
  //req.body.hmSuccess = 'success';
  req.body ='success';

  next();
};

const updateUserMiddleware = (req, res, next) => {
  req.body = 'success!';
  next();
};

exports.mockMiddleware = {
  healthMiddleware,
  updateUserMiddleware
};

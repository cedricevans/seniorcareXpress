import logger from '../utils/logger.js';
import { NodeEnv } from '../constants/common.js';

export default (err, req, res, next) => {
	logger.error(err.message, err.stack);

	if (res.headersSent) {
		return next(err);
	}

	res.status(500).json({
		message: 'Something went wrong!',
		error: err.message,
		...(process.env.NODE_ENV !== NodeEnv.Production && {
			errorDetail: {
				name: err.name,
				message: err.message,
				stack: err.stack,
			},
		}),
	});
};

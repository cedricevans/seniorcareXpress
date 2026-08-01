import logger from '../utils/logger.js';
import { NodeEnv } from '../constants/common.js';

export default (err, req, res, next) => {
	logger.error(err.message, err.stack);

	if (res.headersSent) {
		return next(err);
	}

	// PocketBase SDK errors carry their real HTTP status on err.status; forward
	// it instead of flattening everything to 500, otherwise an auth/permission
	// failure looks identical to an unrelated server crash in the client/logs.
	const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;

	res.status(status).json({
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

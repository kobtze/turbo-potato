import { STATUS_CODES } from './config';
import { CompanyWithUsers } from './types';
import { Request, Response } from 'express';
import companyDataService from './app.service';

export default async (req: Request, res: Response) => {
	try {
		let response: { companies: CompanyWithUsers[] };
		const companySearchStr = req.query.company;
		if (typeof companySearchStr === 'string') {
			response = await companyDataService(companySearchStr);
		} else {
			response = await companyDataService();
		}

		return res
			.status(STATUS_CODES.OK)
			.json(response);
	} catch (e) {
		console.error('GET /get_data Error: ' + e.message);

		return res
			.status(STATUS_CODES.INTERNAL_SERVER_ERROR)
			.send(e);
	}
};
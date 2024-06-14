import { Request, Response } from 'express';
import companyDataService from './app.service';

export default async (req: Request, res: Response) => {

	try {
		let response;

		const companySearchStr = req.query.company;

		if (typeof companySearchStr === 'string') {
			response = await companyDataService(companySearchStr);
		} else {
			response = await companyDataService();
		}

		return res.json(response);
	} catch (e) {
		console.log('GET /get_data Error: ' + e.message);

		return res.status(500).send(e);
	}
};
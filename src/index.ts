import express from 'express';
import appController from './app.controller';

const app = express();
const port = 3000;

app.get('/get_data', appController);

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
});
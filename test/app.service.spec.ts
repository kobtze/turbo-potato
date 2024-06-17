import {
	filterPostMap,
	filterCompanies,
	getUserPostCountMap
} from '../src/app.service';

import { Post } from '../src/types';

describe('app.service', () => {
	describe('getUserPostCountMap', () => {
		it('should return correct map', () => {
			const posts: Post[] = [
				{ id: 1, userId: 1, title: 'Good morning', body: '' },
				{ id: 2, userId: 1, title: 'Happy birthday', body: '' },
				{ id: 3, userId: 2, title: 'I will never forget', body: '' },
				{ id: 4, userId: 3, title: 'Good times in Paris', body: '' },
			];
			let expected = new Map();
			expected.set(1, 2);
			expected.set(2, 1);
			expected.set(3, 1);

			expect(getUserPostCountMap(posts)).toStrictEqual(expected)
		})
	});

	describe('filterPostMap', () => {
		it('should only include values above threshold', () => {
			const postMap = new Map([[1, 2], [2, 3], [3, 2], [4, 4]]);
			const threshold = 2;
			const expected = new Map([[2, 3],[4, 4]]);

			expect(filterPostMap(postMap, threshold)).toStrictEqual(expected);
		})
	})

	describe('filterCompanies', () => {
		it('should filter correctly case insensitive', () => {
			const companyNames = ['Sunsky', 'Sunstar'];
			const companySearchStr = 'SKY';
			const expected = ['Sunsky'];
			const res = filterCompanies(companyNames, companySearchStr);

			expect(res).toStrictEqual(expected);
		});

		it('should return all company names if search string is empty', () => {
			const companyNames = ['Sunsky', 'Sunstar'];
			const companySearchStr = '';
			const expected = ['Sunsky', 'Sunstar'];
			const res = filterCompanies(companyNames, companySearchStr);
			expect(res).toStrictEqual(expected);
		});
	});
});
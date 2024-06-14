import { dataProvider } from './config';
import axios, { AxiosResponse } from 'axios';
import { Todo, User, Post, Comment } from './types';
import { LRUCache } from 'lru-cache'

const options = {
	max: 500,
	maxSize: 5000,
	sizeCalculation: (value, key) => {
		return 1
	},
	ttl: 1000 * 60 * 5
}

const cache = new LRUCache(options)

const hostname: string = dataProvider.hostname;
const users: string = dataProvider.paths.users;
const todos: string = dataProvider.paths.todos;
const posts: string = dataProvider.paths.posts;
const comments: string = dataProvider.paths.comments;

export async function getData(url: string): Promise<any> {
	let data: any;
	const encodedUrl: string = encodeURI(url);

	if (cache.has(encodedUrl)) {
		data = cache.get(encodedUrl);

		return Promise.resolve(data);
	} else {
		const start: number = Date.now();
		const res: AxiosResponse = await axios.get(encodedUrl);
		const finish: number = Date.now();
		const timeInMs: number = finish - start;

		data = res.data;
		const status: number = res.status;
		const statusText: string = res.statusText;

		console.log(`Status: ${status} ${statusText} \t\tTime: ${timeInMs}ms \t\tURL: ${encodedUrl}`);
		cache.set(encodedUrl, data);
	}

	return data;
}

export async function getCompletedTodos(): Promise<Todo[]> {
	return await getData(`${hostname}${todos}?completed=true`);
}

export function getCompanyUsersRequests(companyNames: string[]): Array<Promise<User[]>> {
	return companyNames
		.map(companyName => `${hostname}${users}?company.name=${companyName}`)
		.map(url => getData(url));
}

export function getUserPostsRequests(userIds: number[]): Array<Promise<Post[]>> {
	return userIds
		.map(userId => `${hostname}${users}/${userId}${posts}`)
		.map(url => getData(url));
}

export function getUserRequests(userIds: number[]): Array<Promise<User>> {
	return userIds
		.map(userId => `${hostname}${users}/${userId}`)
		.map(url => getData(url));
}

export function getPostCommentsRequests(postIds: number[]): Array<Promise<Comment[]>> {
	return postIds
		.map(postId => `${hostname}${posts}/${postId}${comments}`)
		.map(url => getData(url));
}

export function getUserTodosRequests(userIds: number[]): Array<Promise<Todo[]>> {
	return userIds
		.map(userIds => `${hostname}${users}/${userIds}${todos}`)
		.map(url => getData(url));
}
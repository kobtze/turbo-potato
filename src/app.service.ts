import {
	Todo,
	User,
	Post,
	Comment,
	CompanyWithUsers,
	ITodoUserSummary,
	IUserWithTodoCount,
} from './types';

import {
	getUserRequests,
	getCompletedTodos,
	getUserTodosRequests,
	getUserPostsRequests,
	getCompanyUsersRequests,
	getPostCommentsRequests,
} from './typicode.connector';

import { filterMap } from './helpers';
import { COMPANY_NAMES } from './config';

export default async function (companySearchStr?: string): Promise<{ companies: CompanyWithUsers[] }> {
	// Get Data
	const companyNames: string[] = await getCompanyNames(companySearchStr);
	const users: User[] = await getUsers(companyNames);
	const posts: Post[] = await getPosts(users);
	const comments: Comment[] = await getComments(posts);
	const activeUsers: User[] = filterActiveUsers(users, posts, comments);
	const todos: Todo[] = await getTodos(activeUsers);

	// Build Response
	return mapResponse(companyNames, activeUsers, todos);
}

async function getCompanyNames (companySearchStr?: string): Promise<string[]> {
	const todos = await getCompletedTodos();
	const todosByUser = getTodosByUserMap(todos);
	let companyNames = await getCompaniesSet(todosByUser);

	if (companySearchStr) {
		companyNames = filterCompanies(companyNames, companySearchStr);
	}

	return companyNames;
}

async function getCompaniesSet (todosByUserMap: Map<number, TodoUserSummary>): Promise<string[]> {
	let companies: Set<string> = new Set();

	function predicate(userId: number, summary: ITodoUserSummary): boolean {
		return summary.distinctCount >= COMPANY_NAMES.MIN_COMPLETED_TASKS
	}

	const filteredUserTodoCountMap: Map<number, ITodoUserSummary> = filterMap(todosByUserMap, predicate);
	const userIds: number[] = [...filteredUserTodoCountMap.keys()];
	const userRequests = getUserRequests(userIds);

	await Promise.all(userRequests)
		.then(users => users.forEach(user =>
			user.company?.name && companies.add(user.company.name))
		)

	return [...companies.values()];
}

async function getUsers (companyNames: string[]): Promise<User[]> {
	const companyUsersRequests: Promise<User[]>[] = getCompanyUsersRequests(companyNames);
	const users: User[] = [];
	await Promise.all(companyUsersRequests)
		.then(responses => {
			responses.forEach(response => {
				response.forEach(user => {
					users.push(user)
				})
			})
		});
	return users;
}

async function getPosts (users: User[]): Promise<Post[]> {
	const userIds: number[] = users
		.filter(user => user.address?.geo?.lat && user.address?.geo?.lng)
		.map(user => user.id)
	const userPostsRequests: Promise<Post[]>[] = getUserPostsRequests(userIds);
	let posts: Post[] = [];
	await Promise.all(userPostsRequests)
		.then(responses => {
			responses.forEach(response => {
				response.forEach(post => {
					posts.push(post)
				})
			})
		});
	return posts;
}

async function getComments (posts: Post[]): Promise<Comment[]> {
	// create countMap (key = user, value = postCount)
	const postCount = getUserPostCountMap(posts);
	// filter posts of active users (users that have more than 2 posts)
	const activeUserPostsMap = filterPostMap(postCount, 2);
	const activeUserPosts: Post[] = posts.filter(post => activeUserPostsMap.has(post.userId))
	// Get comments
	const postIds: number[] = activeUserPosts.map(post => post.id)
	let comments: Comment[] = [];
	const commentsRequests: Promise<Comment[]>[] = getPostCommentsRequests(postIds);
	await Promise.all(commentsRequests)
		.then(responses => {
			responses.forEach(response => {
				response.forEach(comment => {
					comments.push(comment)
				})
			})
		})

	return comments;
}

async function getTodos (users: User[]): Promise<Todo[]> {
	const userIds = users.map(user => user.id);
	const todosRequests = getUserTodosRequests(userIds);
	let todos: Todo[] = [];
	await Promise.all(todosRequests)
		.then(responses => {
			responses.forEach(response => {
				response.forEach(todo => {
					todos.push(todo)
				})
			})
		})
	return todos;
}

export function getUserPostCountMap (posts: Post[]): Map<number, number> {
	let map = new Map();
	posts.forEach(p => {
		const userId = p.userId;
		const currentCount = map.get(userId) || 0;
		map.set(userId, currentCount + 1);
	});

	return map;
}

export function filterPostMap (postMap: Map<number, number>, threshold: number): Map<number, number> {
	let newMap = new Map();
	for (let [key, value] of postMap.entries()) {
		value > threshold && newMap.set(key, value);
	}
	return newMap;
}

class TodoUserSummary implements ITodoUserSummary {
	distinctCount: number;
	titlesSet: Set<string>;

	constructor() {
		this.distinctCount = 0;
		this.titlesSet = new Set();
	}
}

function getTodosByUserMap (todos: Todo[]): Map<number, ITodoUserSummary> {
	let map: Map<number, ITodoUserSummary> = new Map();

	todos.forEach(({ userId, title}) => {
		if (!map.has(userId)) {
			map.set(userId, new TodoUserSummary());
		}
		const summary: ITodoUserSummary = map.get(userId);
		if (!summary.titlesSet.has(title)) {
			summary.titlesSet.add(title);
			summary.distinctCount++
		}
	})

	return map;
}

export function filterCompanies (companyNames: string[], companySearchStr: string): string[] {
	return companyNames.filter(companyName =>
		companyName.toLowerCase().includes(companySearchStr.toLowerCase()));
}

function filterActiveUsers (users: User[], posts: Post[], comments: Comment[]): User[] {
	let activeUserIds: Set<number> = new Set();
	let usersIDsWithPosts: number[] = users.map(user => user.id);
	let postCommentCountMap: Map<number, number> = getPostCommentCountMap(comments);

	usersIDsWithPosts.forEach(userId => {
		let popularUserPosts = posts
			.filter(post => post.userId === userId)
			.filter(post => postCommentCountMap.get(post.id) > 3)

		if (popularUserPosts.length > 2) {
			activeUserIds.add(userId)
		}
	})

	return users.filter(user => activeUserIds.has(user.id));
}

function mapResponse (companyNames: string[], activeUsers: User[], todos: Todo[]): {companies: CompanyWithUsers[]} {
	let companies = getCompanies(companyNames);

	companies.forEach(company => {
		let companyActiveUsers = activeUsers.filter(user => user.company.name === company.name);
		companyActiveUsers.forEach(user => {
			const todoCount: number = getTodoCountForUser(user.id, todos);
			company.users.push(new UserWithTodoCount(user.name, user.email, todoCount))
		})
	});

	return { companies };
}

class Company implements CompanyWithUsers {
	name: string;
	users: UserWithTodoCount[];

	constructor(name: string) {
		this.name = name;
		this.users = [];
	}
}

class UserWithTodoCount implements IUserWithTodoCount {
	name: string;
	email: string;
	todoCount: number;

	constructor(name: string, email: string, todoCount?: number) {
		this.name = name;
		this.email = email;
		this.todoCount = todoCount || undefined;
	}
}

function getCompanies (companyNames: string[]): CompanyWithUsers[] {
	let companies: CompanyWithUsers[] = [];

	for (let name of companyNames) {
		companies.push(new Company(name))
	}

	return companies
}

function getPostCommentCountMap (comments: Comment[]): Map<number, number> {
	let map = new Map();
	comments.forEach(c => {
		const postId = c.postId;
		const currentCount = map.get(postId) || 0;
		map.set(postId, currentCount + 1)
	});

	return map;
}

function getTodoCountForUser (userId: number, todos: Todo[]): number {
	return todos
		.filter(todo => todo.userId === userId)
		.reduce(acc => acc + 1, 0)
}
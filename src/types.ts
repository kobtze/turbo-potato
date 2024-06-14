export interface User {
	id: number,
	name: string,
	email: string,
	address?: {
		geo?: {
			lat?: string,
			lng?: string
		}
	}
	company?: {
		name?: string
	}
}

export interface Todo {
	userId: number,
	id: number,
	title: string,
	completed: boolean
}

export interface ITodoUserSummary {
	distinctCount: number,
	titlesSet: Set<string>
}

export interface CompanyWithUsers {
	name: string
	users: IUserWithTodoCount[]
}

export interface IUserWithTodoCount {
	name: string,
	email: string,
	todoCount?: number;
}

export interface Post {
	id: number,
	userId: number,
	title: string,
	body?: string
}

export interface Comment {
	postId: number,
	id: number,
	name: string,
	email: string,
	body?: string
}
export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DomainError';
    }
}

export class ValidationError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class DuplicateError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = 'DuplicateError';
    }
}

export class AuthorizationError extends DomainError {
    constructor(message = "Unauthorized") {
        super(message);
        this.name = 'AuthorizationError';
    }
}

export class RateLimitError extends DomainError {
    constructor(message = "Rate limit exceeded. Try again later.") {
        super(message);
        this.name = 'RateLimitError';
    }
}

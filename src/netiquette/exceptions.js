export class NetiquetteError extends Error {
    constructor(rule, number, message) {
        super(message);
        this.rule = rule;
        this.number = number;
    }

    getOutput() {
        return `${this.rule}: ${this.message} (${this.number})`;
    }
}

// TODO: Add warnings (2.2.2.3, 2.2.2.4, ...)

export class SubjectError extends NetiquetteError {
    constructor(number, message) {
        super("Subject", number, message);
    }
}

export class HeaderError extends NetiquetteError {
    constructor(number, message) {
        super("Header", number, message);
    }
}

export class FormattingError extends NetiquetteError {
    constructor(number, message) {
        super("Formatting", number, message);
    }
}

export class QuotingError extends NetiquetteError {
    constructor(number, message) {
        super("Quoting", number, message);
    }
}

export class SignatureError extends NetiquetteError {
    constructor(message) {
        super("Signature", "2.3", message);
    }
}


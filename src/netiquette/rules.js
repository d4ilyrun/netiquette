import { SubjectError, HeaderError, SignatureError, FormattingError, QuotingError } from "./exceptions.js";

const REGEX_RULES = {
    SUBJECT: new RegExp("^(?:Re: ?)?(?:\\[[A-Z0-9-_+/]{1,10}\\]){2} .*$"),
    LOGIN: new RegExp("[a-z\\-]*[\\d]?\\.[a-z\\-]*"),
    EMAIL: new RegExp("[a-z\\-]*[\\d]?\\.[a-z\\-]*@epita\\.fr"),
    SENDER_NAME: new RegExp("[a-zA-Z ]* [a-zA-Z]*"),
    QUOTED_LINK: new RegExp("^(?:>+ )?\\[[0-9]{1,3}\\] \\w{2,5}://.*$"),
    TRAILING_WHITESPACE: new RegExp("^(?!>|(-- )).*\\s$"),
    QUOTING_FORMAT: new RegExp("^>+(?: .*)?$")
};

export function checkSubject(subject) {
    if (subject.length === 0)
        throw new SubjectError("2.1.1", "Empty");
    else if (subject.length > 80)
        throw new SubjectError("2.1.1.2", "Length > 80 characters");
    if (!REGEX_RULES.SUBJECT.test(subject))
        throw new SubjectError("2.1.1", "Must be [TAG1][TAG2] Summary");
}

export function checkSender(fromHeader) {
    if (!REGEX_RULES.LOGIN.test(fromHeader)
        && !REGEX_RULES.EMAIL.test(fromHeader)
        && !REGEX_RULES.SENDER_NAME.test(fromHeader))
        throw new HeaderError("2.1.3", "From: must contain at least " +
                                               "the expeditor's login, email (@epita.fr) or name");
}

export function checkMimeType(plainText) {
    if (!plainText)
        throw new FormattingError("2.2.2.2", "MIME Type mus be 'plain/text'");

    // TODO: Check for multi-part/mixed and application/pgp-signature
}

export function checkBody(body) {
    let fails = [];

    if (body.length === 0)
        return [new FormattingError("2.2.1", "Empty body")];

    if (body.length < 8)
        return [new FormattingError("2.2.1", "Body must contain at least 7 lines " +
                                                     "(greetings, body, salutations and signature)")];

    if (body[0] === "" || body[1] !== "")
        fails.push(new FormattingError("2.2.1.1", "No greeting line. Please note that an empty line must be inserted after the greeting line"));

    for (const [index, line] of body.entries()) {
        if (REGEX_RULES.TRAILING_WHITESPACE.test(line))
            fails.push(new FormattingError("2.2.2.5", `l.${index + 1} has a trailing whitespace`));

        if (REGEX_RULES.QUOTED_LINK.test(line))
            continue;

        // TODO: warning if less than 60 characters

        if (line.length > 80) {
            console.log(line, line.length, index);
            fails.push(new FormattingError("2.2.2.1", `l.${index + 1} has more than 80 characters`));
        }
        else if (line.length > 72 && line[0] !== '>')
            fails.push(new FormattingError("2.2.2.1", `l.${index + 1} has more than 72 characters without quoting`));
    }

    return fails;
}

export function checkSignature(body) {
    let signatureDelimiter = body.findIndex(line => { return line === "-- "; });

    if (signatureDelimiter < 0)
        return [new SignatureError("No signature found")];

    let fails = [];

    // The end of the message must be formatted as follows:
    // <body_content>
    // <empty_line>
    // <salutation>
    // <empty_line>
    // --
    // <signature>
    if (signatureDelimiter < 3 || body[signatureDelimiter - 1] !== ""  || body[signatureDelimiter - 2] === "" || body[signatureDelimiter - 3] !== "")
        fails.push(new FormattingError("2.2.1.1", "No salutation line. Please note that empty lines must be inserted before and after the salutation line"))

    // Check uniqueness of the signature
    let signature = body.slice(signatureDelimiter + 1);
    if (signature.find(line => { return line === "-- ";}))
        fails.push(new SignatureError("Signature must be unique"));

    // Enforce rules
    if (signature.length === 0) {
        fails.push(new SignatureError("Empty signature"));
    }else if (signature.length > 4) {
        fails.push(new SignatureError("Signature too long (maximum 4 lines)"));
    } else if (signature[0] === "") {
        fails.push(new SignatureError("Signature must not start with an empty line"));
    }

    return fails;
}

export function checkQuoting(body) {
    let fails = [];
    let quote_section = false;
    let section_length = 0;

    for (const [index, line] of body.entries()) {
        // Signature
        if (line === "-- ")
            break;

        // empty line => new section
        if (line === "")
            section_length = 0;
        else
            section_length += 1;

        // current line is a quote
        if (line.startsWith(">")) {
            // Quote section must be preceded by an empty line or an attribution quote.
            // Unique line before the quote section: attribution line
            if (!quote_section && section_length > 2)
                fails.push(new QuotingError("2.2.3.2", `The quote at line ${index + 1} must be preceded by an empty line or an attribution line`));
            if (!REGEX_RULES.QUOTING_FORMAT.test(line))
                fails.push(new QuotingError("2.2.3.2", `l.${index + 1}: The quote must start with one or more adjacent '>' followed by a space character`));
            quote_section = true;
        } else if (quote_section && line.length > 0) {
            fails.push(new QuotingError("2.2.3.2", `The quote at line ${index + 1} must be followed by an empty line`));
        } else {
            quote_section = false;
        }
    }

    return fails;
}

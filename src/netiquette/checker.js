import { NetiquetteError } from "./exceptions.js";
import * as rules from "./rules.js";

export class News {
    constructor(details) {
        this.plainText = details.isPlainText;
        this.subject = details.subject;
        this.sender = details.from;
        this.lines = details.plainTextBody.split("\n");
    }

    checkNetiquette() {
        let fails = [];

        const check = (foo, ... args) => {
            try {
                foo(...args);
            } catch (e) {
                if (!e instanceof NetiquetteError)
                    throw e;
                fails.push(e);
            }
        };

        check(rules.checkSubject, this.subject);
        check(rules.checkSender, this.sender);
        check(rules.checkMimeType, this.plainText);

        fails = fails.concat(
            rules.checkSignature(this.lines),
            rules.checkBody(this.lines),
            rules.checkQuoting(this.lines)
        );

        return fails;
    }
}

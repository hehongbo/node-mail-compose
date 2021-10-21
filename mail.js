const fs = require("fs");
const path = require("path");
const MailMessage = require("./mail-message");
const File = require("./file");
const Multipart = require("./multipart");

const errors = {
    invalidParam: new Error("INVALID_PARAM"),
    recipientNotProvided: new Error("RECIPIENT_NOT_PROVIDED"),
    attachmentFileNotExisted: new Error("ATTACHMENT_NOT_EXISTED")
};

const parseRecipient = (
    {
        name = "",
        address = ""
    }
) => `"${name}" <${address}>`;

const parseFiles = (files = [], inline = false) => {
    let parsedFiles = [];
    files.forEach(file => {
        switch (typeof file) {
            case "string":
                if (fs.existsSync(file)) {
                    parsedFiles.push(new File({
                        filename: path.basename(file),
                        content: fs.readFileSync(file),
                        inline: inline
                    }));
                } else {
                    throw errors.attachmentFileNotExisted;
                }
                break;
            case "object":
                if (
                    typeof file.filename === "string"
                    && file.filename !== ""
                    && file.hasOwnProperty("content")
                    && Buffer.isBuffer(file.content)
                ) {
                    parsedFiles.push(new File({
                        filename: file.filename,
                        content: file.content,
                        inline: inline
                    }));
                } else throw errors.invalidParam;
                break;
            default:
                throw errors.invalidParam;
        }
    });
    return parsedFiles;
};

module.exports = class {
    constructor(
        {
            from,
            to,
            subject,
            message,
            attachments
        }
    ) {
        switch (typeof from) {
            case "string":
                if (from !== "") {
                    this.from = from;
                }
                break;
            case "object":
                if (typeof from.name === "string" && from.name !== ""
                    && typeof from.address === "string" && from.address !== ""
                ) {
                    this.from = parseRecipient(from);
                } else throw errors.invalidParam;
                break;
            case "undefined":
                break;
            default:
                throw errors.invalidParam;
        }
        switch (typeof to) {
            case "string":
                if (to !== "") {
                    this.to = to;
                } else throw errors.recipientNotProvided;
                break;
            case "object":
                if (typeof to.name === "string" && to.name !== ""
                    && typeof to.address === "string" && to.address !== ""
                ) {
                    this.to = parseRecipient(to);
                } else {
                    throw errors.invalidParam;
                }
                break;
            case "undefined":
                throw errors.recipientNotProvided;
            default:
                throw errors.invalidParam;
        }
        if (subject) {
            if (typeof subject === "string") {
                if (subject !== "") {
                    this.subject = subject;
                }
            } else throw errors.invalidParam;
        }
        let body;
        switch (typeof message) {
            case "string":
                if (message !== "") {
                    body = new MailMessage({content: message});
                }
                break;
            case "object":
                let messageBodyParts = [];
                let inlineAssets;
                if (message.hasOwnProperty("plainText")) {
                    if (typeof message.plainText === "string") {
                        if (message.plainText !== "") {
                            messageBodyParts.push(new MailMessage({content: message.plainText}));
                        }
                    } else throw errors.invalidParam;
                }
                if (message.hasOwnProperty("htmlText")) {
                    if (typeof message.htmlText === "string") {
                        if (message.htmlText !== "") {
                            messageBodyParts.push(new MailMessage({content: message.htmlText, type: "text/html"}));
                            if (message.hasOwnProperty("assets")) {
                                if (Array.isArray(message.assets)) {
                                    inlineAssets = parseFiles(message.assets);
                                } else throw errors.invalidParam;
                            }
                        }
                    } else throw errors.invalidParam;
                }
                if (messageBodyParts.length === 1) {
                    body = messageBodyParts[0];
                } else {
                    body = new Multipart({type: "multipart/alternative", components: messageBodyParts});
                }
                if (inlineAssets.length > 0) {
                    let relatedComponents = [body].concat(inlineAssets);
                    body = new Multipart({type: "multipart/related", components: relatedComponents});
                }
                break;
            case "undefined":
                break;
        }
        if (attachments) {
            if (Array.isArray(attachments)) {
                let files = parseFiles(attachments);
                if (files.length > 0) {
                    if (files.length === 1 && !body) {
                        body = files[0];
                    } else {
                        let mixedComponents = [body].concat(files);
                        body = new Multipart({type: "multipart/mixed", components: mixedComponents});
                    }
                }
            } else throw errors.invalidParam;
        }
        if (body) {
            this.body = body;
        }
    }

    getMailHeader() {
        let header = "";
        if (this.from) {
            header += `From: ${this.from}\r\n`;
        }
        header += `To: ${this.to}\r\n`;
        if (this.subject) {
            header += `Subject: ${this.subject}\r\n`;
        }
        header += "MIME-Version: 1.0\r\n";
        if (this.body) {
            header += this.body.mimeHeader();
        }
        return header;
    }

    getMailBody() {
        if (this.body) {
            return this.body.encode();
        }
    }

    getMail() {
        return this.getMailHeader() + "\r\n" + this.getMailBody();
    }
};
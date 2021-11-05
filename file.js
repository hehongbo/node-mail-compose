const mime = require("mime");
const path = require("path");

module.exports = class {
    constructor({filename = "", content, inline = false}) {
        this.filename = filename;
        if (Buffer.isBuffer(content)) {
            /** @type Buffer */
            this.content = content;
        } else {
            throw new Error("CONTENT_NOT_STREAM");
        }
        this.mime = mime.getType(path.extname(filename)) || "application/octet-stream";
        this.inline = inline;
    }

    mimeHeader() {
        return (
            `Content-Type: ${this.mime}\r\n` +
            "Content-Transfer-Encoding: base64\r\n" +
            (this.inline ? `Content-ID: ${this.filename}\r\n` : "") +
            `Content-Disposition: ${this.inline ? "inline" : "attachment"}; filename="${
                /^[\x00-\x7F]*$/.test(this.filename) ?
                    this.filename
                    : `=?UTF-8?B?${Buffer.from(this.filename, "utf-8").toString("base64")}?=`
            }"\r\n`
        );
    }

    encode() {
        return this.content.toString("base64").match(/.{1,75}/g).join("\r\n") + "\r\n";
    }
};

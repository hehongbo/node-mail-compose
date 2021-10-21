module.exports = class {
    constructor({
        content = "",
        type = "text/plain",
    }) {
        this.content = content;
        this.type = type;
    }

    mimeHeader() {
        return (
            `Content-Type: ${this.type}; charset=utf-8\r\n` +
            "Content-Transfer-Encoding: base64\r\n"
        );
    }

    encode() {
        return Buffer.from(this.content, "utf-8").toString("base64").match(/.{1,75}/g).join("\r\n") + "\r\n";
    }
}

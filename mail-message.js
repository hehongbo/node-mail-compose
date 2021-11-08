class MailMessage {
    constructor({
        content = "",
        type = "text/plain",
        cidIndex = {}
    }) {
        this.content = content;
        this.type = type;
        if (type === "text/html") {
            this.alterContentID(cidIndex);
        }
    }

    alterContentID(cidIndex = {}) {
        for (const cidIndexKey in cidIndex) {
            this.content = this.content.replaceAll(
                new RegExp(`src=["']${cidIndexKey}["']`, "g"),
                found => found.replace(cidIndexKey, `cid:${cidIndex[cidIndexKey]}`)
            );
        }
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

module.exports = MailMessage;

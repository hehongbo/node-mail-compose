const generateBoundary = () => {
    let identifier = [...Array(32)].map(
        () => Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return `boundary-${identifier}`;
};

const types = [
    "multipart/mixed",
    "multipart/related",
    "multipart/alternative"
];

class Multipart {
    constructor({type = "", components = []}) {
        if (!types.some(t => type === t)) {
            throw new Error("TYPE_NOT_VALID");
        } else {
            this.type = type;
        }
        this.components = components;
        this.boundary = generateBoundary();
    }

    mimeHeader() {
        return (`Content-Type: ${this.type}; boundary="${this.boundary}"\r\n`);
    }

    encode() {
        let buf = Buffer.from("");
        this.components.forEach(component => {
            buf = Buffer.concat([
                buf,
                Buffer.from("--" + this.boundary + "\r\n"),
                Buffer.from(component.mimeHeader()),
                Buffer.from("\r\n"),
                Buffer.from(component.encode())
            ]);
        });
        buf = Buffer.concat([
            buf,
            Buffer.from("--" + this.boundary + "--\r\n"),
        ]);
        return buf.toString();
    }
}

module.exports = Multipart;

# mail-compose

![npm version](https://img.shields.io/npm/v/mail-compose)

A simple library that composes MIME-encoded emails from human-friendly contents (like text, files, images), which can be fed into MTA/MSAs like sendmail, msmtp, ssmtp.

## ⚠️ Experimental Disclaimer

This library is still considered experimental and needs a lot of tweaks potentially. It's okay to play around but keep in mind that the mail composed out of this library may not be understood correctly by all MUAs, including desktop and web clients, and everything is subject to change.

> From version `0.2.0`, this library will assign a Content-ID for each embedded asset, and insert the `cid` into where they're used in `message.htmlText`. \
> Using the filename as a `cid` will no longer work.

## Basic Usage

Install the package:
```shell
npm install mail-compose
```

Create a mail object:
```javascript
const Mail = require("mail-compose");
const fs = require("fs");

let mail = new Mail({
    from: {
        name: "Alice",
        address: "alice@example.com"
    },
    to: {
        name: "Bob",
        address: "bob@example.com"
    },
    subject: "Photo",
    message: "My new haircut!",
    attachments: [
        {
            filename: "new_look.jpg",
            content: fs.readFileSync("/home/alice/Desktop/new_look.jpg")
        }
    ]
});
```

Once the mail is created, you can call `getMail()` to get the composed mail, or `getMailHeader()`, `getMailBody()` if you want them come to separately.

## Parameters

The `Mail` class requires an object parameter:
```
{
    from: string|{name: string, address: string},
    to: string|{name: string, address: string},
    subject: string,
    message: string|{plainText: string, htmlText: string, assets: [string|{filename: string, content: Buffer}]}
    attachments: [string|{filename: string, content: Buffer}]
}
```

While UTF-8 is the de facto standard of modern days coding, this library accepts and only accepts UTF-8 parameters, whether it's the mail's subject or the name of sender/recipient. 

### `from`, `to`

These 2 parameters require either a string of mail address, or an object that includes a name, and an address.

```javascript
let mail = new Mail({
    from: {
        name: "Alice", 
        address: "alice@example.com"
    },
    to: "bob@example.com"
    /* other properties ... */
});
```

The address format defined by RFC 2822 should also work without issues.

```javascript
let mail = new Mail({
    from: "Alice <alice@example.com>",
    to: "Bob <bob@example.com>",
    /* other properties ... */
});
```

### `message`

To get started quickly, drop a string here, as it will be parsed as `text/plain` content. 

```javascript
let mail = new Mail({
    /* sender and recipient ... */
    message: "Hello!",
    /* other properties ... */
});
```

Formatted HTML is also supported.

```javascript
let mail = new Mail({
    /* sender and recipient ... */
    message: {
        htmlText: "<p>Hello!</p>",
        plainText: "Hello!"
    },
    /* other properties ... */
});
```

While using `htmlText` alone is possible, it's recommended to provide both plain texts along with HTML text, as it will be composed into a `multipart/alternative`, thus improving compatibilities/readabilities on some clients.

It's also possible to embed image assets into the mail's body. 

```javascript
let mail = new Mail({
    /* sender and recipient ... */
    message: {
        htmlText: "<p>My new haircut!</p><img src=\"new_look.jpg\">",
        plainText: "My new haircut!",
        assets: [
            {
                filename: "new_look.jpg",
                content: fs.readFileSync("/home/alice/Desktop/new_look.jpg")
            }
        ]
    },
    /* other properties ... */
});
```

The `message.assets` array receives a list of file that shares the same format with `attachments`, which we'll cover later.

### `attachments`

To compose mails with attachments, use:

```javascript
let mail = new Mail({
    /* sender, recipient, subject, message content ... */
    attachments: [
        {
            filename: "transcations_q1.xlsx",
            content: fs.readFileSync("/path/transcations_q1.xlsx")
        },
        {
            filename: "transcations_q2.xlsx",
            content: fs.readFileSync("/path/transcations_q2.xlsx")
        }
    ]
});
```

To attach existing files more simply, you can also put their path directly into the array.

```javascript
let mail = new Mail({
    /* sender, recipient, subject, message content ... */
    attachments: [
        "/path/transcations_q1.xlsx",
        "/path/transcations_q2.xlsx"
    ]
});
```

The name of these files will keep as is, however.

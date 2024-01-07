class FileType {
    constructor(extension, mimeType) {
        this.extension = extension;
        this.mimeType = mimeType;
    }
}

const mimeTypes = {
    text: {
        value: "text/"
    },
    app: {
        value: "application/",
        ms: "vnd.ms-",
        open: "vnd.oasis.opendocument.",
        office: "vnd.openxmlformats-officedocument."
    },
    audio: {
        value: "audio/"
    },
    video: {
        value: "video/"
    },
    image: {
        value: "image/"
    },
};

// More info about MIME types here:
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
// Or go to the following URL for all MIME types:
// https://www.iana.org/assignments/media-types/media-types.xhtml
// This array contains the MIME types this rich text editor supports
const fileExtensions = [
    // text/
    new FileType("txt", mimeTypes.text.value + "plain"),
    new FileType("csv", mimeTypes.text.value + "csv"),
    // application/
    new FileType("json", mimeTypes.app.value + "json"),
    new FileType("pdf", mimeTypes.app.value + "pdf"),
    new FileType("rtf", mimeTypes.app.value + "rtf"),
    new FileType("doc", mimeTypes.app.value + "msword"),
    new FileType("odp", mimeTypes.app.value + mimeTypes.app.open + "presentation"),
    new FileType("ods", mimeTypes.app.value + mimeTypes.app.open + "spreadsheet"),
    new FileType("odt", mimeTypes.app.value + mimeTypes.app.open + "text"),
    new FileType("docx", mimeTypes.app.value + mimeTypes.app.office + "wordprocessingml.document"),
    new FileType("dotx", mimeTypes.app.value + mimeTypes.app.office + "wordprocessingml.template"),
    new FileType("pptx", mimeTypes.app.value + mimeTypes.app.office + "presentationml.presentation"),
    new FileType("xlsx", mimeTypes.app.value + mimeTypes.app.office + "spreadsheetml.sheet"),
    new FileType("ppt", mimeTypes.app.value + mimeTypes.app.ms + "powerpoint"),
    new FileType("xls", mimeTypes.app.value + mimeTypes.app.ms + "excel"),
    // archive formats
    new FileType("rar", mimeTypes.app.value + "vnd.rar"),
    new FileType("gz", mimeTypes.app.value + "gzip"),
    new FileType("tar", mimeTypes.app.value + "x-tar"),
    new FileType("zip", mimeTypes.app.value + "zip"),
    new FileType("7z", mimeTypes.app.value + "x-7z-compressed"),
    // audio/
    new FileType("wav", mimeTypes.audio.value + "wav"),
    new FileType("webm", mimeTypes.audio.value + "webm"),
    new FileType("mp3", mimeTypes.audio.value + "mpeg"),
    // video/
    new FileType("avi", mimeTypes.video.value + "x-msvideo"),
    new FileType("mp4", mimeTypes.video.value + "mp4"),
    new FileType("webm", mimeTypes.video.value + "webm"),
    // image/
    new FileType("gif", mimeTypes.image.value + "gif"),
    new FileType("ico", mimeTypes.image.value + "vnd.microsoft.icon"),
    new FileType("jpeg", mimeTypes.image.value + "jpeg"),
    new FileType("jpg", mimeTypes.image.value + "jpeg"),
    new FileType("png", mimeTypes.image.value + "png"),
    new FileType("svg", mimeTypes.image.value + "svg+xml"),
    new FileType("webp", mimeTypes.image.value + "webp"),
];

function dropHandler(event) {
    // Prevent default behavior (Prevent file from being opened)
    event.preventDefault();

    let file;
    if (event.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (let i = 0; i < event.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (event.dataTransfer.items[i].kind === 'file') {
                file = event.dataTransfer.items[i].getAsFile();
                setFile(file);
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (let i = 0; i < event.dataTransfer.files.length; i++) {
            file = event.dataTransfer.files[i];
            setFile(file);
        }
    }
}

function dragOverHandler(event) {
    // Prevent default behavior (Prevent file from being opened)
    event.preventDefault();
}

async function setFile(file) {
    console.log("File: ", file);
    // Get base64 URL 
    const src = await getBase64(file);
    // Get MIME type from url
    const mimeType = src.substring(0, src.indexOf(';')).substring(5);
    // Check if MIME type is supported
    const result = fileExtensions[fileExtensions.findIndex(x => x.mimeType === mimeType)];
    if (result === undefined) {
        showToast("The file you tried uploading has a MIME type of: " + mimeType +
            "\nThis MIME type isn't supported");
    }
    else {
        let element = document.createElement("div");
        element.classList.add("file-element");

        let fileInfo = createFileInfoElement(file);
        let fileContent = document.createElement("div");
        let fileContentChild;

        // Add content to DOM based on MIME type
        if (mimeType.includes(mimeTypes.text.value)) {
            // Plain text
            fileContentChild = document.createElement("p");
            fileContentChild.innerText = await readFile(file);
        } else if (mimeType.includes(mimeTypes.audio.value)) {
            // Audio files
            fileContentChild = createAudioOrVideoElement("audio", src);
        } else if (mimeType.includes(mimeTypes.video.value)) {
            // Video files
            fileContentChild = createAudioOrVideoElement("video", src);
        } else if (mimeType.includes(mimeTypes.image.value)) {
            // Image files
            fileContentChild = document.createElement("img");
            fileContentChild.src = src;
            fileContentChild.alt = file.name;
            // Below ones aren't important for this test
        } else if (mimeType.includes(mimeTypes.app.value + mimeTypes.app.ms)) {
            // application/vnd.ms-
            console.log("MS files");
            return;
        } else if (mimeType.includes(mimeTypes.app.value + mimeTypes.app.open)) {
            // application/vnd.oasis.opendocument.
            console.log("open");
            return;
        } else if (mimeType.includes(mimeTypes.app.value + mimeTypes.app.office)) {
            // application/vnd.openxmlformats-officedocument.
            console.log("office");
            return;
        } else if (mimeType.includes(mimeTypes.app.value)) {
            // application/
            console.log("app");
            return;
        }

        fileContent.appendChild(fileContentChild);
        fileContent.classList.add("file-content")
        element.append(fileInfo, fileContent);
        document.querySelector(".content").appendChild(element);
    }
}

// Get Base64 URL from File
function getBase64(file) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () { resolve(reader.result); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function createAudioOrVideoElement(type, src) {
    let element = document.createElement(type);
    element.controls = true;

    const source = document.createElement("source");
    source.src = src;
    element.appendChild(source);
    return element;
}

function createFileInfoElement(file) {
    const parent = document.createElement("div");
    parent.classList.add("file-info");

    const list = document.createElement("ul");

    const filename = document.createElement("li");
    filename.classList = "filename";
    filename.appendChild(createFileInfoHeader("Filename", file.name));

    const type = document.createElement("li");
    type.classList = "type";
    type.appendChild(createFileInfoHeader("Type", file.type));

    const size = document.createElement("li");
    size.classList = "size";
    size.appendChild(createFileInfoHeader("Size", formatBytes(file.size)));

    list.append(filename, type, size);
    parent.append(list);
    return parent;
}

function createFileInfoHeader(header, value) {
    const span = document.createElement("span");
    const headerElement = document.createElement("b");
    headerElement.innerText = header + ":";
    const valueElement = document.createElement("span");
    valueElement.innerText = value;
    span.append(headerElement, valueElement);
    return span;
}

// Read content of files with plain MIME type
function readFile(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = reject;
        reader.readAsText(file);
    })
}

// Format size of file
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Show toast if unsupported file is uplaoded
function showToast(content) {
    const element = document.getElementById("toast");
    element.className = "show";
    element.childNodes[0].innerText = content;
    setTimeout(function () { element.className = element.className.replace("show", ""); }, 5000);
}
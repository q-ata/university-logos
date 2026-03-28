import { createWriteStream } from "fs";
import { finished } from "stream/promises";
import { Readable } from "stream"; // Import Readable to convert the stream

const downloadImage = async (url, destinationPath) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const fileStream = createWriteStream(destinationPath);
    
    // Convert the Web ReadableStream to a Node.js Readable stream
    const body = Readable.fromWeb(response.body);

    // Now you can use .pipe() or the more modern pipeline/finished
    body.pipe(fileStream);

    await finished(fileStream);
    console.log(`Image downloaded successfully to ${destinationPath}`);
  } catch (error) {
    console.error(`Error: ${error.message} for URL ${url}`);
  }
}

import schools from "./allLogos.json" with {type: "json"};
import fs from "fs";

(async () => {
for (const school in schools) {
    const logoUrl = schools[school];
    const ext = logoUrl.slice(logoUrl.lastIndexOf("."));
    const path = `./logos/${school}${ext}`;
    if (!fs.existsSync(path)) {
        await downloadImage(logoUrl, path);
    }
}
})();


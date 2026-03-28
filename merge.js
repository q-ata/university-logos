const fs = require("fs");

const files = fs.readdirSync("./mappings").filter((f) => f.endsWith(".json"));
let logoMap = {};
for (const file of files) {
    const logos = require(`./mappings/${file}`);
    logoMap = {...logoMap, ...logos};
}

fs.writeFileSync("./allLogos.json", JSON.stringify(logoMap, null, 2));
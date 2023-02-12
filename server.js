const express = require("express");
const multer = require("multer");
const yaml = require("js-yaml");
const fs = require("fs");
const readline = require("readline");

const app = express();
const port = 7777;

function isBalanced(str) {
	let stack = [];
	let map = {
		"(": ")",
		"[": "]",
		"{": "}",
	};
	let lines = str.split(",");
	console.log(lines);

	for(let i = 0; i < lines.length; i++) {
	for (let j = 0; j < lines[i].length; j++) {
		let char = lines[i][j];

		if (char in map) {
			stack.push(char);
		} else if (char === ")" || char === "]" || char === "}") {
			let last = stack.pop();

			if (char !== map[last]) {
				return {
					flag: -1,
					line : i + 1,
				};
			}
		}
	}
	}

	if(stack.length  === 0){
		return {
			flag: 0,
			line : null
		}
	}
	else{
		return {
			flag: 1,
			line : lines.length
		}
	}
}

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, __dirname + "/uploaded");
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	},
});

async function readJavaFile(filePath) {
	const set = new Set();
	const rl = readline.createInterface({
	  input: fs.createReadStream(filePath),
	  crlfDelay: Infinity
	});
  
	for await (const line of rl) {
	  if (!line.trim().startsWith("//")  && !line.trim().startsWith("*")) {
		line
		  .split(/\W+/)
		  .filter(word => word.length > 0)
		  .forEach(word => set.add(word));
	  }
	}
	return set;
}

async function readYamlFile(filePath){
  const set = new Set();
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    // Split the line into words and add each word to the set
    line
      .split(/\W+/)
      .filter(word => word.length > 0)
      .forEach(word => set.add(word));
  }

  return set;
}


const uploaded = multer({ storage: storage });

app.post("/", uploaded.array("files"), async function (req, res) {
	try {
		const file = req.files[1];
		const data = fs.readFileSync(
			__dirname + "/uploaded/" + file.originalname,
			"utf8"
		);
		const ruleList = yaml.load(data).ruleList;
		let results = [];
		ruleList.forEach((individualElement) => {
			if (individualElement !== null) {
				let resultObject = isBalanced(JSON.stringify(individualElement));
				if (resultObject.flag == 0) {
					results.push({
						ruleCode: individualElement.ruleCode,
						status: "Valid Parenthesis",
					});
				} else if(resultObject.flag < 0) {
					results.push({
						ruleCode: individualElement.ruleCode,
						status: "Expected Opening Parenthesis before line " + resultObject.line,
					});
				}
				else{
					results.push({
						ruleCode: individualElement.ruleCode,
						status: "Expected Closing Parenthesis in line " + resultObject.line,
					});
				}
			}
		});
		
		const JavaFileWords = await readJavaFile(__dirname + "/uploaded/" + req.files[0].originalname);

		const YamlFileWords = await readYamlFile(__dirname + "/uploaded/" + req.files[1].originalname);
		
		let foundWords = [];
		let notFoundWords = [];

		for (const element of JavaFileWords) {
			if (YamlFileWords.has(element)) {
				foundWords.push(element);
			}
			else{
				notFoundWords.push(element);
			}
		}

		res.status(200).json({ 
			results : results,
			foundWords : foundWords,
			notFoundWords : notFoundWords
		 });
	} catch (error) {
		res.status(500).json("Problem occurred while uploading");
	}
});


app.listen(port, () => {
	console.log("listening on port " + port);
});

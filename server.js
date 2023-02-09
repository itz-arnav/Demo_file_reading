const express = require("express");
const multer = require("multer");
const yaml = require("js-yaml");
const fs = require("fs");

const app = express();

// Valid parenthesis checker
function isBalanced(str) {
	let stack = [];
	let map = {
		"(": ")",
		"[": "]",
		"{": "}",
	};

	for (let i = 0; i < str.length; i++) {
		let char = str[i];

		if (char in map) {
			stack.push(char);
		} else if (char === ")" || char === "]" || char === "}") {
			let last = stack.pop();

			if (char !== map[last]) {
				return false;
			}
		}
	}

	return stack.length === 0;
}

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, __dirname + "/uploaded");
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	},
});

const uploaded = multer({ storage: storage });

app.post("/", uploaded.array("files"), function (req, res) {
	try {
		const file = req.files[0];
		const data = fs.readFileSync(
			__dirname + "/uploaded/" + file.originalname,
			"utf8"
		);

		const ruleList = yaml.load(data).ruleList;

		let results = [];

		ruleList.forEach((individualElement) => {
			if (individualElement !== null) {
				if (isBalanced(individualElement.condition)) {
					results.push({
						ruleCode: individualElement.ruleCode,
						status: "Valid Parenthesis",
					});
				} else {
					results.push({
						ruleCode: individualElement.ruleCode,
						status: "Invalid Parenthesis",
					});
				}
			}
		});

		res.status(200).json({ results });
	} catch (error) {
		res.status(500).json("Problem occurred while uploading");
	}
});

const port = 7777;

app.listen(port, () => {
	console.log("listening on port " + port);
});

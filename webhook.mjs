import { Configuration, OpenAIApi } from "openai"
import * as readline from 'node:readline';
import axios from 'axios';
import * as dotenv from 'dotenv'
dotenv.config()
const configuration = new Configuration({
    apiKey: process.env.OpenAIKey,
});
const homeAssistantUrl = process.env.HomeAssistantUrl;
const openai = new OpenAIApi(configuration);
const prompt = `{"objective": "turn mike's office light on",
"device": "light.mikes_office_light",
"command": "light.turn_on"}
===================
<|endoftext|>

`;


async function retrieveCompleition(directive) {
    let input = `${prompt}\n${directive}===================`
    const completion = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: input,
        max_tokens: 256,
        temperature: 0
    });
    var response = completion.data.choices[0].text.replace("===================", "").replace(/(\r\n|\n|\r)/gm, "");
    var action = JSON.parse(response);

    return action;
}

async function callHomeassistant(haData) {
    haData.command = haData.command.replace('.', '/');
    let url = `${homeAssistantUrl}/api/services/${haData.command}`
    const response = await axios.post(url, { 'entity_id': haData.device }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.HomeAssistantApiKey}`
        },
    });
    return response.data;
}

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

const ans = await askQuestion("What can I do?\n");
console.log(`Inputted: ${ans}`)
if (ans) {
    var output = await retrieveCompleition(ans);
    await callHomeassistant(output);
    console.log(output);
}

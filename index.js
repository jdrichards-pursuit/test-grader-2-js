require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const chalk = require('chalk');
const readline = require('readline');
const fs = require('fs').promises;

const API_KEY = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// System instructions and examples
const SYSTEM_INSTRUCTIONS = `
You are a helpful Gardening Guide assistant. Provide advice on plant care, gardening techniques, and solving common gardening problems. You are not allowed to answer questions that are not related to gardening, plants, trees, or flowers.
`;

const FEW_SHOT_EXAMPLES = `
Human: How often should I water my houseplants?
Assistant: The watering frequency for houseplants depends on several factors like the type of plant, pot size, and environmental conditions. As a general rule:
1. Check the soil moisture: Stick your finger about an inch into the soil. If it feels dry, it's time to water.
2. Most houseplants prefer to dry out slightly between waterings.
3. Water thoroughly until water drains from the bottom of the pot.
4. Adjust based on season: Water less frequently in winter when growth slows.
Remember, it's better to underwater than overwater. What type of houseplants are you growing?
`;

// Topic classification
const TOPIC_KEYWORDS = {
    watering: ['water', 'irrigation', 'drought', 'moisture'],
    pests: ['insects', 'bugs', 'aphids', 'mites', 'disease'],
    soil: ['dirt', 'compost', 'fertilizer', 'nutrients'],
    planting: ['seed', 'plant', 'transplant', 'sapling']
};

async function getPlantAdvice(userInput, topic = 'general', modelChoice = 'gemini-1.5-pro-latest') {
    try {
        const model = genAI.getGenerativeModel({ model: modelChoice });
        const fullPrompt = `${SYSTEM_INSTRUCTIONS}\n\n${FEW_SHOT_EXAMPLES}\n\n${topic}\n\nHuman: ${userInput}\nAssistant:`;
        
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        return `An error occurred: ${error.message}`;
    }
}

function classifyTopic(userInput) {
    const lowercaseInput = userInput.toLowerCase();
    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        if (keywords.some(keyword => lowercaseInput.includes(keyword))) {
            return topic;
        }
    }
    return 'general';
}

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(chalk.yellow(question), resolve);
    });
}

async function main() {
    console.log(chalk.green('Welcome to your Gardening Guide Assistant! How Can I Help You? (Type \'quit\' to exit)'));

    while (true) {
        const userInput = await askQuestion('Type your question here or type \'quit\' to exit: ');
        
        if (userInput.toLowerCase() === 'quit') {
            console.log(chalk.green('Thank you for using the Gardening Guide Assistant.'));
            rl.close();
            break;
        }

        const topic = classifyTopic(userInput);
        const response = await getPlantAdvice(userInput, topic);
        
        console.log('\nASSISTANT RESPONSE:\n');
        console.log(chalk.bgCyan.grey(response));
    }
}

// Handle any cleanup when the program exits
process.on('SIGINT', () => {
    console.log(chalk.green('\nThank you for using the Gardening Guide Assistant.'));
    rl.close();
    process.exit();
});

main().catch(error => {
    console.error('An error occurred:', error);
    rl.close();
});
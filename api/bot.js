const fetch = require('node-fetch');

const accessToken = "WAAVgV0sTckWIRedvZBR1V72a8Y1rBxZCkwu27mtSG2zorg2CJzOaeKazdhqbW5U8TSQZAxVeAbHBBCIUwZAoK98KchgoEcdhj3VrNwbZAlyoVDVCn84cRJU3WdZCjdQF8gBWJS5NDHJHz6RgdnsoG5NjeZBDUobZBPtMGMdqPT8ULfburT9EZD";
const baseUrl = "https://api.whatsapp.com/agent/v1";
const apinexKey = "sk-apx7f8f802ac74f725821e2962f3aba8a7010e524e4870e192";

export default async function handler(req, res) {
    try {
        // 1. Fetch updates from WhatsApp Agent API
        const updateRes = await fetch(`${baseUrl}/updates?limit=10&timeout=5`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await updateRes.json();

        if (data.entry && data.entry[0].changes[0].value.messages) {
            const messages = data.entry[0].changes[0].value.messages;

            for (const msg of messages) {
                const recipientId = msg.from; // user:<id> format
                const userText = msg.text?.body;

                if (recipientId && userText) {
                    // 2. Get AI Response from APInex
                    const aiReply = await getAIResponse(userText);

                    // 3. Send Reply to WhatsApp
                    await sendReply(recipientId, aiReply);
                }
            }
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function getAIResponse(message) {
    try {
        const response = await fetch("https://api.apinex.bond/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apinexKey}`
            },
            body: JSON.stringify({
                model: "free/gpt-6-luna",
                messages: [
                    { role: "system", content: "You are ZaidTechbot, a helpful AI assistant on WhatsApp." },
                    { role: "user", content: message }
                ]
            })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "Maaf kijiye, main abhi jawab nahi de pa raha.";
    } catch (e) {
        return "Error generating AI response.";
    }
}

async function sendReply(to, text) {
    await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: to,
            type: "text",
            text: { body: text }
        })
    });
}
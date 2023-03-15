import puppeteer from 'puppeteer';
import amqp from "amqplib";

const MQURL = process.env.AMQP_URL || 'amqp://guest:guest@localhost:5673';
const QUEUE = 'test.url';

const main = async (QUEUE, MQURL, callback) => {
    const connection = await amqp.connect(MQURL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE);

    setInterval(() => {
        try {
            channel.consume(QUEUE, message => {
                if (message) {
                    callback(null, message.content.toString());
                    channel.ack(message);
                }
            });
        } catch (err) {
            callback(err, null);
        }}, 3000) 
};

const getDataAboutUrl = async (message) => {
    try{
        //create browser
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome',
            args: ['--no-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(`${message}`);
        const cookies = await page.cookies();
        const size = page.viewport();

        displayData(cookies, size);
    } catch(error) {
        console.log(error.stack)
    }
}

const displayData = (cookies, size) => {
    let obj = {
        cookies: {},
        size: {}
    }
    obj.cookies = cookies;
    obj.size = size;
    console.log(obj);
}

await main(QUEUE, MQURL, (error, message) => {
    if(error) return console.log(error);
    getDataAboutUrl(message);
});
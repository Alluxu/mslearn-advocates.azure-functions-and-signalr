import './style.css';
// Assuming you still want to use environment variables, remove BACKEND_URL if not needed
import { BACKEND_URL } from './env';

const app = new Vue({
    el: '#app',
    data() {
        return {
            stocks: []
        }
    },
    methods: {
        async getStocks() {
            try {
                const url = `https://api-alvar.azurewebsites.net/api/getStocks`;
                console.log('Fetching stocks from ', url);

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
                }
                // Instead of app.stocks, use this.stocks for Vue's reactivity
                this.stocks = await response.json();
            } catch (ex) {
                console.error('Error fetching stocks:', ex);
            }
        }
    },
    created() {
        this.getStocks();
    }
});

const connect = () => {
    const signalR_URL = `https://api-alvar.azurewebsites.net/api/negotiate`;  // Append /negotiate
    console.log(`Connecting to SignalR... ${signalR_URL}`);

    const connection = new signalR.HubConnectionBuilder()
        .withUrl(signalR_URL)   // Set the correct SignalR negotiate URL
        .configureLogging(signalR.LogLevel.Information)
        .build();

    connection.onclose(() => {
        console.log('SignalR connection disconnected. Attempting to reconnect...');
        setTimeout(() => connect(), 2000);  // Reconnect after 2 seconds
    });

    connection.on('updated', (updatedStock) => {
        console.log('Stock updated message received', updatedStock);
        const index = app.stocks.findIndex(s => s.id === updatedStock.id);
        if (index !== -1) {
            console.log(`${updatedStock.symbol} Old price: ${app.stocks[index].price}, New price: ${updatedStock.price}`);
            // Update stock in Vue's reactive array
            app.stocks.splice(index, 1, updatedStock);
        }
    });

    connection.start()
        .then(() => {
            console.log("SignalR connection established");
        })
        .catch(error => {
            console.error("Error establishing SignalR connection:", error);
        });
};

connect();

class MEAPPlugin extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.bleDevice = null;
        this.bleService = null;
        this.characteristics = {};
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                .container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 20px;
                }
                .knobs {
                    display: flex;
                    justify-content: space-around;
                    width: 100%;
                }
                button {
                    margin: 20px;
                    padding: 10px 20px;
                }
            </style>
            <div class="container">
                <button id="connect">Connect MEAP</button>
                <div class="knobs">
                    <meap-knob knob-id="1" label="Pot 1"></meap-knob>
                    <meap-knob knob-id="2" label="Pot 2"></meap-knob>
                    <meap-knob knob-id="3" label="Pot 3"></meap-knob>
                </div>
            </div>
        `;

        this.setupEvents();
    }

    async setupEvents() {
        const connectButton = this.shadowRoot.querySelector('#connect');
        connectButton.addEventListener('click', () => this.connectBLE());

        this.shadowRoot.querySelectorAll('meap-knob').forEach(knob => {
            knob.addEventListener('knob-change', (e) => this.handleKnobChange(e));
        });
    }

    async connectBLE() {
        try {
            this.bleDevice = await navigator.bluetooth.requestDevice({
                filters: [{ name: 'MEAP' }],
                optionalServices: ['19B10000-E8F2-537E-4F6C-D104768A1214']
            });

            const server = await this.bleDevice.gatt.connect();
            this.bleService = await server.getPrimaryService('19B10000-E8F2-537E-4F6C-D104768A1214');

            // Get characteristics for each pot
            this.characteristics = {
                pot1: await this.bleService.getCharacteristic('19B10001-E8F2-537E-4F6C-D104768A1214'),
                pot2: await this.bleService.getCharacteristic('19B10002-E8F2-537E-4F6C-D104768A1214'),
                pot3: await this.bleService.getCharacteristic('19B10003-E8F2-537E-4F6C-D104768A1214')
            };

            console.log('Connected to MEAP!');
        } catch (error) {
            console.error('BLE Connection failed:', error);
        }
    }

    async handleKnobChange(event) {
        if (!this.bleService) return;

        const { value, id } = event.detail;
        const characteristic = this.characteristics[`pot${id}`];
        
        if (characteristic) {
            try {
                // Convert value to string and send to device
                await characteristic.writeValue(new TextEncoder().encode(value.toString()));
            } catch (error) {
                console.error(`Failed to send pot${id} value:`, error);
            }
        }
    }
}

customElements.define('meap-plugin', MEAPPlugin);

export class LupaColors {
    static #colors = {
        LOOPA_WAVEFORM_BACKGROUND: 'rgb(0,0,0)',
        LOOPA_WAVEFORM_COLOR: 'rgb(0,255,0)',
        LOOPA_POINTER: 'rgb(255,0,0)',
        SHOP_WAVEFORM_BACKGROUND: 'rgb(0,0,0)',
        SHOP_WAVEFORM_COLOR: 'rgb(0,255,255)',
    }

    static get(key, backup='rgb(12,123,234)') {
        const result = this.#colors[key];
        return result ? result : backup;
    }
}
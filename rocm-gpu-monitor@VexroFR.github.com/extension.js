import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

const GpuIndicator = GObject.registerClass(
class GpuIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'GPU Indicator');

        this.label = new St.Label({
            text: 'GPU: --% | VRAM: --GB',
            y_align: Clutter.ActorAlign.CENTER
        });
        this.add_child(this.label);

        this._timeoutId = 0;
        this._update();
        this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
            this._update();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _update() {
        try {
            let proc = new Gio.Subprocess({
                argv: ['rocm-smi', '--showuse', '--showmeminfo', 'vram', '--json'],
                flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_SILENCE
            });

            proc.init(null);
            proc.communicate_utf8_async(null, null, (proc, res) => {
                try {
                    let [ok, stdout, stderr] = proc.communicate_utf8_finish(res);
                    if (ok && stdout) {
                        let data = JSON.parse(stdout);
                        let cardKey = Object.keys(data).find(k => k.startsWith('card'));
                        
                        if (cardKey) {
                            let info = data[cardKey];
                            let gpuUsage = info["GPU use (%)"] || "0";
                            
                            // Conversion des Bytes en Go (1024^3)
                            let vramTotalB = parseInt(info["VRAM Total Memory (B)"]) || 0;
                            let vramUsedB = parseInt(info["VRAM Total Used Memory (B)"]) || 0;
                            
                            let vramTotalGB = (vramTotalB / 1073741824).toFixed(1);
                            let vramUsedGB = (vramUsedB / 1073741824).toFixed(1);

                            this.label.set_text(`GPU: ${gpuUsage}% | VRAM: ${vramUsedGB}/${vramTotalGB}Go`);
                        }
                    }
                } catch (e) {
                    console.error("ROCm Monitor - Error:", e);
                }
            });
        } catch (e) {
            this.label.set_text("GPU: Err");
        }
    }

    destroy() {
        if (this._timeoutId) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
        super.destroy();
    }
});

export default class RocmGpuExtension extends Extension {
    enable() {
        this._indicator = new GpuIndicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator, 0, 'right');
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}

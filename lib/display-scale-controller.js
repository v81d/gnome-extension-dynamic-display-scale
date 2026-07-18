/* display-scale-controller.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
import Gio from "gi://Gio";

/** Reference: https://gitlab.gnome.org/GNOME/mutter/-/blob/main/data/dbus-interfaces/org.gnome.Mutter.DisplayConfig.xml */
const DisplayConfigProxy = Gio.DBusProxy.makeProxyWrapper(`
<node>
  <interface name="org.gnome.Mutter.DisplayConfig">
    <method name="GetCurrentState">
      <arg name="serial" direction="out" type="u" />
      <arg name="monitors" direction="out" type="a((ssss)a(siiddada{sv})a{sv})" />
      <arg name="logical_monitors" direction="out" type="a(iiduba(ssss)a{sv})" />
      <arg name="properties" direction="out" type="a{sv}" />
    </method>
    <method name="ApplyMonitorsConfig">
      <arg name="serial" direction="in" type="u" />
      <arg name="method" direction="in" type="u" />
      <arg name="logical_monitors" direction="in" type="a(iiduba(ssa{sv}))" />
      <arg name="properties" direction="in" type="a{sv}" />
    </method>
  </interface>
</node>
`);

/** Reference: https://gitlab.gnome.org/GNOME/mutter/-/blob/main/src/backends/meta-monitor-manager-private.h */
const MetaMonitorConfigMethod = Object.freeze({
  VERIFY: 0,
  TEMPORARY: 1,
  PERSISTENT: 2,
});

export class DisplayScaleController {
  constructor() {
    this._proxy = new DisplayConfigProxy(
      Gio.DBus.session,
      "org.gnome.Mutter.DisplayConfig",
      "/org/gnome/Mutter/DisplayConfig",
    );
  }

  /**
   * See the GetCurrentState method in the DisplayConfig DBus interface.
   * @returns {Promise<{serial: number, monitors: Array, logicalMonitors: Array}>}
   */
  getCurrentState() {
    return new Promise((resolve, reject) => {
      this._proxy.GetCurrentStateRemote((result, error) => {
        if (error) {
          reject(error);
          return;
        }

        const [serial, monitors, logicalMonitors] = result;
        resolve({ serial, monitors, logicalMonitors });
      });
    });
  }

  /**
   * @param {number} serial
   * @param {number} [method] - MetaMonitorConfigMethod.TEMPORARY or MetaMonitorConfigMethod.PERSISTENT
   * @param {Array} logicalMonitors - a(iiduba(ssa{sv})) array
   * @returns {Promise<void>}
   */
  applyMonitorsConfig(
    serial,
    method = MetaMonitorConfigMethod.TEMPORARY,
    logicalMonitors,
  ) {
    return new Promise((resolve, reject) => {
      this._proxy.ApplyMonitorsConfigRemote(
        serial,
        method,
        logicalMonitors,
        {}, // no parameters
        (_result, error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        },
      );
    });
  }

  /**
   * Get current display scales for each monitor connector.
   *
   * @returns {Promise<Array<{connector: string, scale: number}>>}
   */
  async getCurrentScales() {
    const { logicalMonitors } = await this.getCurrentState();
    const scales = [];

    for (const logicalMonitor of logicalMonitors) {
      const [_x, _y, scale, _transform, _primary, monitorSpecs] =
        logicalMonitor;

      for (const monitorSpec of monitorSpecs) {
        const [connector] = monitorSpec;
        scales.push({ connector, scale });
      }
    }

    return scales;
  }

  /**
   * Rebuild the ApplyMonitorsConfig payload with a new scale applied across all monitors.
   * This is done by first reading the current state and finding each logical monitor's current mode ID per connector.
   *
   * @param {number} scale
   * @param {object} [opts]
   * @param {boolean} [opts.persistent=false]
   * @returns {Promise<void>}
   */
  async setScale(scale, { persistent = false } = {}) {
    // setScale, a.k.a. the brain damage function 😔
    if (typeof scale !== "number" || !Number.isFinite(scale) || scale <= 0)
      throw new RangeError(`The given scale ${scale} is invalid.`);

    const { serial, monitors, logicalMonitors } = await this.getCurrentState();

    const newLogicalMonitors = logicalMonitors.map((logicalMonitor) => {
      const [x, y, _scale, transform, primary, monitorSpecs] = logicalMonitor;

      const newSpecs = monitorSpecs.map((monitorSpec) => {
        const [connector] = monitorSpec;
        const monitorInfo = monitors.find((m) => m[0][0] === connector); // m[0][0] is the monitor's connector

        let modeId = ""; // for some reason, the API needs this to be a string
        if (monitorInfo) {
          const currentMode = monitorInfo[1].find(
            (mode) => mode[6]["is-current"]?.unpack(), // mode[6] is the properties GVariant dictionary
            // .unpack() takes the boolean out of the boxed GVariant
          ); // monitorInfo[1] contains an array of available modes and their properties
          if (currentMode) modeId = currentMode[0];
        }

        return [connector, modeId, {}];
      });

      return [x, y, scale, transform, primary, newSpecs]; // for logicalMonitors param
    });

    const method = persistent
      ? MetaMonitorConfigMethod.PERSISTENT
      : MetaMonitorConfigMethod.TEMPORARY;
    await this.applyMonitorsConfig(serial, method, newLogicalMonitors);
  }
}

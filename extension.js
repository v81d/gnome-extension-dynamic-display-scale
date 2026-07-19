/* extension.js
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
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { DisplayScaleController } from "./lib/display-scale-controller.js";
import { TabletModeWatcher } from "./lib/tablet-mode-watcher.js";

export default class DynamicDisplayScaleExtension extends Extension {
  enable() {
    this._settings = this.getSettings();
    this._displayScaleController = new DisplayScaleController(
      this._settings,
      this.gettext.bind(this),
    );
    this._tabletModeWatcher = new TabletModeWatcher();

    // change scale when mode changes
    this._tabletModeWatcher.connect("changed", () =>
      this._applyForCurrentMode(),
    );
  }

  _applyForCurrentMode() {
    const scale = this._tabletModeWatcher.isTabletMode
      ? this._settings.get_double("tablet-mode-scale")
      : this._settings.get_double("desktop-mode-scale");

    this._displayScaleController.setScale(scale).catch((e) => {
      Main.notifyError("Error Changing Display Scale", e.message);
    });
  }

  disable() {
    this._tabletModeWatcher?.destroy();
    this._tabletModeWatcher = null;
    this._displayScaleController = null;
  }
}

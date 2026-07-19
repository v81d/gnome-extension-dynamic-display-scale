/* tablet-mode-watcher.js
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
import Clutter from "gi://Clutter";
import GObject from "gi://GObject";

export const TabletModeWatcher = GObject.registerClass(
  {
    Signals: { changed: {} },
  },
  class TabletModeWatcher extends GObject.Object {
    _init() {
      super._init();
      this._seat = Clutter.get_default_backend().get_default_seat();
      this._seat.connectObject(
        "notify::touch-mode",
        () => this.emit("changed"),
        this,
      );
    }

    /** @returns {boolean} */
    get isTabletMode() {
      return this._seat?.touchMode ?? false;
    }

    destroy() {
      this._seat?.disconnectObject(this);
      this._seat = null;
    }
  },
);

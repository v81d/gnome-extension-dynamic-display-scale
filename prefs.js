/* prefs.js
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
import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import Gio from "gi://Gio";

export default class DynamicDisplayScalePreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    const generalPage = new Adw.PreferencesPage({
      title: _("General"),
      icon_name: "dialog-information-symbolic",
    });
    window.add(generalPage);

    const scaleSettingsGroup = new Adw.PreferencesGroup({
      title: _("Scale Settings"),
      description: _(
        "Configure display scale preferences for desktop and tablet modes.",
      ),
    });
    generalPage.add(scaleSettingsGroup);

    const desktopModeScaleRow = new Adw.SpinRow({
      title: _("Desktop Mode Display Scale"),
      subtitle: _(
        "Display scale factor when in desktop mode (not in tablet mode).",
      ),
      adjustment: new Gtk.Adjustment({
        lower: 0.5,
        upper: 4.0,
        step_increment: 0.05,
        page_increment: 0.25,
      }),
      digits: 2,
    });
    scaleSettingsGroup.add(desktopModeScaleRow);

    const tabletModeScaleRow = new Adw.SpinRow({
      title: _("Tablet Mode Display Scale"),
      subtitle: _("Display scale when in tablet (touchscreen) mode."),
      adjustment: new Gtk.Adjustment({
        lower: 0.5,
        upper: 4.0,
        step_increment: 0.05,
        page_increment: 0.25,
      }),
      digits: 2,
    });
    scaleSettingsGroup.add(tabletModeScaleRow);

    settings.bind(
      "desktop-mode-scale",
      desktopModeScaleRow,
      "value",
      Gio.SettingsBindFlags.DEFAULT,
    );
    settings.bind(
      "tablet-mode-scale",
      tabletModeScaleRow,
      "value",
      Gio.SettingsBindFlags.DEFAULT,
    );
  }
}
